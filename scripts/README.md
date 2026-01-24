# 데이터베이스 유지보수 스크립트

이 디렉토리는 Supabase 데이터베이스를 유지보수하기 위한 Python 스크립트들을 포함합니다.

## 스크립트 목록

### 1. check_db_capacity.py

데이터베이스 용량을 확인하고 알림을 제공합니다.

```bash
python scripts/check_db_capacity.py
```

### 2. archive_old_posts.py

오래된 포스트를 CSV 파일로 아카이빙합니다.

```bash
python scripts/archive_old_posts.py
```

환경 변수:

- `ARCHIVE_MONTHS`: 아카이빙할 개월 수 (기본값: 6)

### 3. cleanup_old_posts.py

오래된 포스트를 점진적으로 삭제합니다.

```bash
python scripts/cleanup_old_posts.py
```

환경 변수:

- `CLEANUP_MONTHS`: 삭제할 개월 수 (기본값: 6)
- `BATCH_SIZE`: 배치 크기 (기본값: 1000)

### 4. restore_archive.py

아카이브된 CSV 파일에서 데이터를 복원합니다.

```bash
python scripts/restore_archive.py archives/posts_archive_20240124.csv
```

## 환경 변수 설정

모든 스크립트는 다음 환경 변수가 필요합니다:

```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_KEY="your-service-role-key"
```

또는 `.env` 파일에 설정:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
```

## 사용 예시

### 정기 유지보수 (월 1회)

```bash
# 1. 용량 확인
python scripts/check_db_capacity.py

# 2. 아카이빙
python scripts/archive_old_posts.py

# 3. 정리
python scripts/cleanup_old_posts.py

# 4. 최종 확인
python scripts/check_db_capacity.py
```

### 긴급 정리 (용량 부족시)

```bash
# 3개월 이상 된 데이터 즉시 정리
CLEANUP_MONTHS=3 python scripts/cleanup_old_posts.py
```

## 자동화

GitHub Actions를 통해 자동으로 실행됩니다:

- **매주 일요일**: 용량 체크 (`.github/workflows/db_capacity_check.yml`)
- **매월 1일**: 아카이빙 + 정리 (`.github/workflows/db_maintenance.yml`)

## 참고 문서

- [데이터베이스 유지보수 가이드](../docs/database-maintenance.md)
- [데이터베이스 가이드](../docs/database.md)
