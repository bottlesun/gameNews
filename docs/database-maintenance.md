# 데이터베이스 유지보수 가이드

이 문서는 Supabase 무료 티어(500MB)를 효율적으로 관리하기 위한 데이터베이스 유지보수 전략을 설명합니다.

## 목차

1. [용량 관리 전략](#용량-관리-전략)
2. [아카이빙](#아카이빙)
3. [점진적 삭제](#점진적-삭제)
4. [용량 알림 설정](#용량-알림-설정)
5. [자동화 구현](#자동화-구현)

## 용량 관리 전략

### 데이터 보관 정책

| 일일 크롤링 수 | 권장 보관 기간 | 정리 주기 |
| -------------- | -------------- | --------- |
| 50개 이하      | 1년            | 1년마다   |
| 50-100개       | 6개월          | 6개월마다 |
| 100-200개      | 3-6개월        | 3개월마다 |
| 200개 이상     | 3개월          | 매월      |

### 현재 용량 확인

```sql
-- 테이블 크기 확인
SELECT
  pg_size_pretty(pg_total_relation_size('posts')) as total_size,
  pg_size_pretty(pg_relation_size('posts')) as table_size,
  pg_size_pretty(pg_indexes_size('posts')) as indexes_size;

-- 포스트 수 확인
SELECT COUNT(*) as total_posts FROM posts;

-- 월별 포스트 수 통계
SELECT
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as posts_count,
  pg_size_pretty(SUM(octet_length(title) + octet_length(COALESCE(summary, '')) + octet_length(original_link))) as estimated_size
FROM posts
GROUP BY month
ORDER BY month DESC;
```

## 아카이빙

### 1. 수동 아카이빙

#### 전체 데이터 백업

```bash
# Supabase CLI 사용
supabase db dump -f backup_$(date +%Y%m%d).sql

# 또는 특정 테이블만
supabase db dump -f posts_backup_$(date +%Y%m%d).sql --table posts
```

#### CSV로 내보내기

```sql
-- Supabase SQL Editor에서 실행
COPY (
  SELECT
    id,
    title,
    summary,
    original_link,
    category,
    created_at,
    updated_at
  FROM posts
  WHERE created_at < NOW() - INTERVAL '6 months'
  ORDER BY created_at DESC
) TO '/tmp/posts_archive.csv' WITH CSV HEADER;
```

또는 Supabase Dashboard에서:

1. **Database** → **Tables** → `posts`
2. 필터 적용 (예: created_at < 6 months ago)
3. **Export** → **CSV**

### 2. 자동 아카이빙 스크립트

`scripts/archive_old_posts.py`:

```python
#!/usr/bin/env python3
"""
오래된 포스트를 CSV로 아카이빙하는 스크립트
"""
import os
import csv
from datetime import datetime, timedelta
from supabase import create_client

# 설정
ARCHIVE_MONTHS = 6  # 6개월 이상 된 데이터 아카이빙
ARCHIVE_DIR = "archives"

# Supabase 클라이언트
supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

def archive_old_posts():
    """오래된 포스트를 CSV로 저장"""

    # 아카이브 디렉토리 생성
    os.makedirs(ARCHIVE_DIR, exist_ok=True)

    # 아카이빙 기준 날짜
    cutoff_date = (datetime.now() - timedelta(days=ARCHIVE_MONTHS * 30)).isoformat()

    # 오래된 포스트 조회
    result = supabase.table('posts')\
        .select('*')\
        .lt('created_at', cutoff_date)\
        .order('created_at', desc=True)\
        .execute()

    posts = result.data

    if not posts:
        print("📭 아카이빙할 포스트가 없습니다.")
        return 0

    # CSV 파일명
    filename = f"{ARCHIVE_DIR}/posts_archive_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

    # CSV로 저장
    with open(filename, 'w', newline='', encoding='utf-8') as f:
        if posts:
            writer = csv.DictWriter(f, fieldnames=posts[0].keys())
            writer.writeheader()
            writer.writerows(posts)

    print(f"✅ {len(posts)}개 포스트를 아카이빙했습니다: {filename}")
    print(f"📊 파일 크기: {os.path.getsize(filename) / 1024:.2f} KB")

    return len(posts)

if __name__ == "__main__":
    count = archive_old_posts()
    print(f"\n🎉 아카이빙 완료: {count}개 포스트")
```

### 3. 아카이브 복원

```python
#!/usr/bin/env python3
"""
아카이브된 데이터를 복원하는 스크립트
"""
import csv
from supabase import create_client
import os

def restore_from_archive(csv_file):
    """CSV 파일에서 데이터 복원"""

    supabase = create_client(
        os.getenv("SUPABASE_URL"),
        os.getenv("SUPABASE_KEY")
    )

    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        posts = list(reader)

    # 배치로 삽입 (1000개씩)
    batch_size = 1000
    for i in range(0, len(posts), batch_size):
        batch = posts[i:i + batch_size]
        supabase.table('posts').upsert(batch).execute()
        print(f"✅ {i + len(batch)}/{len(posts)} 복원 완료")

    print(f"🎉 총 {len(posts)}개 포스트 복원 완료")

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("사용법: python restore_archive.py <csv_file>")
        sys.exit(1)

    restore_from_archive(sys.argv[1])
```

## 점진적 삭제

### 1. 배치 삭제 함수

```sql
-- Supabase SQL Editor에서 실행
CREATE OR REPLACE FUNCTION delete_old_posts_batch(
  months_old INTEGER DEFAULT 6,
  batch_size INTEGER DEFAULT 1000
)
RETURNS TABLE(deleted_count INTEGER) AS $$
DECLARE
  total_deleted INTEGER := 0;
  rows_deleted INTEGER;
BEGIN
  LOOP
    -- 배치 단위로 삭제
    DELETE FROM posts
    WHERE id IN (
      SELECT id FROM posts
      WHERE created_at < NOW() - (months_old || ' months')::INTERVAL
      LIMIT batch_size
    );

    GET DIAGNOSTICS rows_deleted = ROW_COUNT;
    total_deleted := total_deleted + rows_deleted;

    -- 더 이상 삭제할 행이 없으면 종료
    EXIT WHEN rows_deleted = 0;

    -- 잠시 대기 (데이터베이스 부하 감소)
    PERFORM pg_sleep(0.1);
  END LOOP;

  RETURN QUERY SELECT total_deleted;
END;
$$ LANGUAGE plpgsql;
```

### 2. 사용 방법

```sql
-- 6개월 이상 된 포스트를 1000개씩 삭제
SELECT delete_old_posts_batch(6, 1000);

-- 3개월 이상 된 포스트를 500개씩 삭제
SELECT delete_old_posts_batch(3, 500);
```

### 3. Python 스크립트로 점진적 삭제

`scripts/cleanup_old_posts.py`:

```python
#!/usr/bin/env python3
"""
오래된 포스트를 점진적으로 삭제하는 스크립트
"""
import os
import time
from datetime import datetime, timedelta
from supabase import create_client

# 설정
CLEANUP_MONTHS = 6  # 6개월 이상 된 데이터 삭제
BATCH_SIZE = 1000   # 한 번에 삭제할 개수
SLEEP_SECONDS = 1   # 배치 간 대기 시간

# Supabase 클라이언트
supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

def cleanup_old_posts():
    """오래된 포스트를 점진적으로 삭제"""

    cutoff_date = (datetime.now() - timedelta(days=CLEANUP_MONTHS * 30)).isoformat()
    total_deleted = 0

    print(f"🗑️  {CLEANUP_MONTHS}개월 이상 된 포스트 삭제 시작...")
    print(f"📅 기준 날짜: {cutoff_date}")

    while True:
        # 배치 단위로 조회
        result = supabase.table('posts')\
            .select('id')\
            .lt('created_at', cutoff_date)\
            .limit(BATCH_SIZE)\
            .execute()

        posts = result.data

        if not posts:
            break

        # 배치 삭제
        ids = [post['id'] for post in posts]
        supabase.table('posts').delete().in_('id', ids).execute()

        total_deleted += len(posts)
        print(f"✅ {total_deleted}개 삭제 완료...")

        # 대기
        if len(posts) == BATCH_SIZE:
            time.sleep(SLEEP_SECONDS)
        else:
            break

    print(f"\n🎉 정리 완료: 총 {total_deleted}개 포스트 삭제")
    return total_deleted

if __name__ == "__main__":
    cleanup_old_posts()
```

## 용량 알림 설정

### 1. 용량 모니터링 함수

```sql
-- 데이터베이스 용량 확인 함수
CREATE OR REPLACE FUNCTION check_database_size()
RETURNS TABLE(
  total_size_mb NUMERIC,
  posts_size_mb NUMERIC,
  usage_percent NUMERIC,
  alert_level TEXT
) AS $$
DECLARE
  max_size_mb CONSTANT NUMERIC := 500;  -- 무료 티어 제한
  total_bytes BIGINT;
  posts_bytes BIGINT;
BEGIN
  -- 전체 데이터베이스 크기
  SELECT pg_database_size(current_database()) INTO total_bytes;

  -- posts 테이블 크기
  SELECT pg_total_relation_size('posts') INTO posts_bytes;

  RETURN QUERY
  SELECT
    ROUND(total_bytes / 1024.0 / 1024.0, 2) as total_size_mb,
    ROUND(posts_bytes / 1024.0 / 1024.0, 2) as posts_size_mb,
    ROUND((total_bytes / 1024.0 / 1024.0 / max_size_mb) * 100, 2) as usage_percent,
    CASE
      WHEN (total_bytes / 1024.0 / 1024.0) >= max_size_mb * 0.9 THEN '🔴 CRITICAL'
      WHEN (total_bytes / 1024.0 / 1024.0) >= max_size_mb * 0.8 THEN '🟠 WARNING'
      WHEN (total_bytes / 1024.0 / 1024.0) >= max_size_mb * 0.6 THEN '🟡 CAUTION'
      ELSE '🟢 OK'
    END as alert_level;
END;
$$ LANGUAGE plpgsql;
```

### 2. 용량 체크 스크립트

`scripts/check_db_capacity.py`:

```python
#!/usr/bin/env python3
"""
데이터베이스 용량을 확인하고 알림을 보내는 스크립트
"""
import os
from supabase import create_client

# 설정
WARNING_THRESHOLD = 80  # 80% 이상이면 경고
CRITICAL_THRESHOLD = 90  # 90% 이상이면 위험

# Supabase 클라이언트
supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

def check_capacity():
    """데이터베이스 용량 확인"""

    # SQL 함수 호출
    result = supabase.rpc('check_database_size').execute()

    if not result.data:
        print("❌ 용량 정보를 가져올 수 없습니다.")
        return

    data = result.data[0]

    print("\n" + "="*50)
    print("📊 데이터베이스 용량 리포트")
    print("="*50)
    print(f"전체 크기: {data['total_size_mb']} MB")
    print(f"Posts 테이블: {data['posts_size_mb']} MB")
    print(f"사용률: {data['usage_percent']}%")
    print(f"상태: {data['alert_level']}")
    print("="*50 + "\n")

    # 알림 레벨에 따른 액션
    usage = float(data['usage_percent'])

    if usage >= CRITICAL_THRESHOLD:
        print("🔴 위험: 즉시 데이터 정리가 필요합니다!")
        print("   다음 명령어를 실행하세요:")
        print("   python scripts/archive_old_posts.py")
        print("   python scripts/cleanup_old_posts.py")
        return "CRITICAL"

    elif usage >= WARNING_THRESHOLD:
        print("🟠 경고: 곧 데이터 정리가 필요합니다.")
        print("   1-2주 내에 정리를 계획하세요.")
        return "WARNING"

    elif usage >= 60:
        print("🟡 주의: 용량을 모니터링하세요.")
        return "CAUTION"

    else:
        print("🟢 정상: 용량이 충분합니다.")
        return "OK"

if __name__ == "__main__":
    status = check_capacity()

    # 포스트 통계
    result = supabase.table('posts').select('id', count='exact').execute()
    print(f"📝 총 포스트 수: {result.count}개\n")
```

### 3. GitHub Actions로 자동 알림

`.github/workflows/db_capacity_check.yml`:

```yaml
name: Database Capacity Check

on:
  schedule:
    - cron: "0 0 * * 0" # 매주 일요일 자정
  workflow_dispatch: # 수동 실행

jobs:
  check-capacity:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: "3.10"

      - name: Install dependencies
        run: |
          pip install supabase

      - name: Check database capacity
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_KEY: ${{ secrets.SUPABASE_KEY }}
        run: |
          python scripts/check_db_capacity.py

      - name: Create Issue if Critical
        if: failure()
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: '🔴 데이터베이스 용량 위험',
              body: '데이터베이스 용량이 위험 수준에 도달했습니다. 즉시 정리가 필요합니다.',
              labels: ['database', 'urgent']
            })
```

## 자동화 구현

### 통합 유지보수 워크플로우

`.github/workflows/db_maintenance.yml`:

```yaml
name: Database Maintenance

on:
  schedule:
    - cron: "0 2 1 * *" # 매월 1일 오전 2시
  workflow_dispatch: # 수동 실행
    inputs:
      archive_months:
        description: "아카이빙할 개월 수"
        required: false
        default: "6"
      cleanup_months:
        description: "삭제할 개월 수"
        required: false
        default: "6"

jobs:
  maintenance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: "3.10"

      - name: Install dependencies
        run: |
          pip install supabase

      - name: Check capacity
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_KEY: ${{ secrets.SUPABASE_KEY }}
        run: |
          python scripts/check_db_capacity.py

      - name: Archive old posts
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_KEY: ${{ secrets.SUPABASE_KEY }}
        run: |
          python scripts/archive_old_posts.py

      - name: Upload archives
        uses: actions/upload-artifact@v3
        with:
          name: database-archives
          path: archives/*.csv
          retention-days: 90

      - name: Cleanup old posts
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_KEY: ${{ secrets.SUPABASE_KEY }}
        run: |
          python scripts/cleanup_old_posts.py

      - name: Final capacity check
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_KEY: ${{ secrets.SUPABASE_KEY }}
        run: |
          python scripts/check_db_capacity.py
```

## 실행 계획

### 초기 설정 (1회)

1. **SQL 함수 생성**

   ```bash
   # Supabase SQL Editor에서 실행
   # - delete_old_posts_batch()
   # - check_database_size()
   ```

2. **스크립트 디렉토리 생성**

   ```bash
   mkdir -p scripts archives
   ```

3. **Python 스크립트 생성**
   - `scripts/archive_old_posts.py`
   - `scripts/cleanup_old_posts.py`
   - `scripts/check_db_capacity.py`
   - `scripts/restore_archive.py`

4. **GitHub Actions 워크플로우 설정**
   - `.github/workflows/db_capacity_check.yml`
   - `.github/workflows/db_maintenance.yml`

5. **실행 권한 부여**
   ```bash
   chmod +x scripts/*.py
   ```

### 정기 실행 (자동)

- **매주**: 용량 체크 (일요일 자정)
- **매월**: 아카이빙 + 정리 (1일 오전 2시)

### 수동 실행 (필요시)

```bash
# 1. 용량 확인
python scripts/check_db_capacity.py

# 2. 아카이빙
python scripts/archive_old_posts.py

# 3. 정리
python scripts/cleanup_old_posts.py

# 4. 복원 (필요시)
python scripts/restore_archive.py archives/posts_archive_20240124.csv
```

## 모니터링 대시보드

### 간단한 통계 쿼리

```sql
-- 전체 현황
SELECT
  COUNT(*) as total_posts,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 month') as last_month,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 week') as last_week,
  pg_size_pretty(pg_total_relation_size('posts')) as table_size
FROM posts;

-- 카테고리별 통계
SELECT
  category,
  COUNT(*) as count,
  pg_size_pretty(SUM(octet_length(title) + octet_length(COALESCE(summary, '')))) as size
FROM posts
GROUP BY category
ORDER BY count DESC;

-- 오래된 데이터 확인
SELECT
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as posts,
  MIN(created_at) as oldest,
  MAX(created_at) as newest
FROM posts
WHERE created_at < NOW() - INTERVAL '6 months'
GROUP BY month
ORDER BY month;
```

## 체크리스트

### 월간 유지보수

- [ ] 데이터베이스 용량 확인
- [ ] 6개월 이상 된 데이터 아카이빙
- [ ] 아카이빙된 데이터 삭제
- [ ] 최종 용량 확인
- [ ] 아카이브 파일 백업 (외부 저장소)

### 분기별 검토

- [ ] 보관 정책 재검토
- [ ] 크롤링 빈도 확인
- [ ] 용량 추세 분석
- [ ] 필요시 정책 조정

## 문제 해결

### 용량이 급격히 증가하는 경우

1. 크롤러 중복 체크 확인
2. summary 필드 길이 확인
3. 비정상적인 데이터 확인

### 아카이빙 실패

1. 디스크 공간 확인
2. 권한 확인
3. Supabase 연결 확인

### 삭제가 느린 경우

1. 배치 크기 줄이기 (1000 → 500)
2. 대기 시간 늘리기 (1초 → 2초)
3. 인덱스 확인

## 참고 자료

- [Supabase Database Documentation](https://supabase.com/docs/guides/database)
- [PostgreSQL Maintenance](https://www.postgresql.org/docs/current/maintenance.html)
- [데이터베이스 가이드](./database.md)
