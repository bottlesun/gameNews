# 데이터베이스 가이드

이 문서는 Supabase 데이터베이스 스키마와 설정을 설명합니다.

## 데이터베이스 스키마

### Posts 테이블

뉴스 포스트를 저장하는 메인 테이블입니다.

```sql
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT,
  original_link TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 컬럼 설명

| 컬럼            | 타입        | 제약조건         | 설명                                             |
| --------------- | ----------- | ---------------- | ------------------------------------------------ |
| `id`            | UUID        | PRIMARY KEY      | 고유 식별자                                      |
| `title`         | TEXT        | NOT NULL         | 뉴스 제목                                        |
| `summary`       | TEXT        | -                | 뉴스 요약 (최대 300자)                           |
| `original_link` | TEXT        | UNIQUE, NOT NULL | 원본 기사 링크                                   |
| `category`      | TEXT        | NOT NULL         | 카테고리 (Dev, Business, Tech, Release, Esports) |
| `created_at`    | TIMESTAMPTZ | DEFAULT NOW()    | 생성 시간                                        |
| `updated_at`    | TIMESTAMPTZ | DEFAULT NOW()    | 수정 시간                                        |

#### 인덱스

```sql
-- 생성 시간 기준 정렬 최적화
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);

-- 카테고리 필터링 최적화
CREATE INDEX idx_posts_category ON posts(category);

-- 중복 확인 최적화
CREATE UNIQUE INDEX idx_posts_original_link ON posts(original_link);
```

### Row Level Security (RLS)

데이터 보안을 위한 RLS 정책입니다.

```sql
-- RLS 활성화
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 읽기 권한: 모든 사용자
CREATE POLICY "Posts are viewable by everyone"
  ON posts FOR SELECT
  USING (true);

-- 쓰기 권한: 서비스 역할만
CREATE POLICY "Posts are insertable by service role only"
  ON posts FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- 수정 권한: 서비스 역할만
CREATE POLICY "Posts are updatable by service role only"
  ON posts FOR UPDATE
  USING (auth.role() = 'service_role');

-- 삭제 권한: 서비스 역할만
CREATE POLICY "Posts are deletable by service role only"
  ON posts FOR DELETE
  USING (auth.role() = 'service_role');
```

## 데이터베이스 설정

### 초기 설정

1. **Supabase 프로젝트 생성**
   - [Supabase](https://supabase.com)에서 새 프로젝트 생성
   - 리전 선택 (가까운 지역 권장)
   - 데이터베이스 비밀번호 설정

2. **스키마 실행**
   ```bash
   # SQL Editor에서 실행
   # 또는 Supabase CLI 사용
   supabase db push
   ```

### 환경 변수

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# 크롤러용 (.env)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
```

## 데이터 조작

### 읽기 (SELECT)

#### 모든 포스트 조회

```typescript
import { createClient } from "@/lib/supabase/server";

const supabase = createClient();
const { data, error } = await supabase
  .from("posts")
  .select("*")
  .order("created_at", { ascending: false });
```

#### 카테고리별 조회

```typescript
const { data, error } = await supabase
  .from("posts")
  .select("*")
  .eq("category", "Tech")
  .order("created_at", { ascending: false });
```

#### 페이지네이션

```typescript
const pageSize = 10;
const page = 1;

const { data, error } = await supabase
  .from("posts")
  .select("*")
  .order("created_at", { ascending: false })
  .range((page - 1) * pageSize, page * pageSize - 1);
```

### 쓰기 (INSERT)

```typescript
const { data, error } = await supabase.from("posts").insert({
  title: "새로운 뉴스",
  summary: "뉴스 요약",
  original_link: "https://example.com/news",
  category: "Tech",
});
```

### 수정 (UPDATE)

```typescript
const { data, error } = await supabase
  .from("posts")
  .update({ summary: "수정된 요약" })
  .eq("id", "post-uuid");
```

### 삭제 (DELETE)

```typescript
const { data, error } = await supabase
  .from("posts")
  .delete()
  .eq("id", "post-uuid");
```

## 고급 쿼리

### 전체 텍스트 검색

```sql
-- 검색 인덱스 생성
CREATE INDEX idx_posts_search ON posts
USING gin(to_tsvector('english', title || ' ' || summary));
```

```typescript
const { data, error } = await supabase
  .from("posts")
  .select("*")
  .textSearch("title", "unity", { type: "websearch" });
```

### 집계 쿼리

```typescript
// 카테고리별 포스트 수
const { data, error } = await supabase
  .from("posts")
  .select("category, count")
  .group("category");
```

### 날짜 범위 검색

```typescript
const { data, error } = await supabase
  .from("posts")
  .select("*")
  .gte("created_at", "2024-01-01")
  .lte("created_at", "2024-12-31");
```

## 데이터베이스 마이그레이션

### Supabase CLI 사용

```bash
# 마이그레이션 생성
supabase migration new add_views_column

# 마이그레이션 파일 편집
# supabase/migrations/20240101000000_add_views_column.sql
ALTER TABLE posts ADD COLUMN views INTEGER DEFAULT 0;

# 마이그레이션 적용
supabase db push
```

### 수동 마이그레이션

1. SQL Editor에서 직접 실행
2. 변경사항을 `supabase/schema.sql`에 반영

## 백업 및 복원

### 백업

```bash
# Supabase CLI로 백업
supabase db dump -f backup.sql

# 또는 pg_dump 사용
pg_dump -h db.your-project.supabase.co \
  -U postgres \
  -d postgres \
  -f backup.sql
```

### 복원

```bash
# Supabase CLI로 복원
supabase db reset

# 또는 psql 사용
psql -h db.your-project.supabase.co \
  -U postgres \
  -d postgres \
  -f backup.sql
```

## 성능 최적화

### 인덱스 최적화

```sql
-- 자주 사용하는 쿼리 분석
EXPLAIN ANALYZE
SELECT * FROM posts
WHERE category = 'Tech'
ORDER BY created_at DESC
LIMIT 10;

-- 필요시 인덱스 추가
CREATE INDEX idx_posts_category_created_at
ON posts(category, created_at DESC);
```

### 쿼리 최적화

```typescript
// ❌ 나쁜 예: 모든 데이터 가져오기
const { data } = await supabase.from("posts").select("*");

// ✅ 좋은 예: 필요한 컬럼만 선택
const { data } = await supabase
  .from("posts")
  .select("id, title, category, created_at")
  .limit(10);
```

### 연결 풀링

Supabase는 자동으로 연결 풀링을 제공합니다.

## 모니터링

### Supabase Dashboard

1. **Database** → **Tables** → `posts`
2. 데이터 확인 및 수정

### 쿼리 성능 모니터링

1. **Database** → **Query Performance**
2. 느린 쿼리 확인
3. 인덱스 추천 확인

## 문제 해결

### 연결 오류

```typescript
// 연결 테스트
const { data, error } = await supabase.from("posts").select("count");

if (error) {
  console.error("Database connection error:", error);
}
```

### RLS 정책 오류

```sql
-- RLS 정책 확인
SELECT * FROM pg_policies WHERE tablename = 'posts';

-- RLS 비활성화 (개발 환경에서만)
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;
```

### 중복 키 오류

```typescript
// upsert 사용
const { data, error } = await supabase.from("posts").upsert(
  {
    original_link: "https://example.com/news",
    title: "뉴스 제목",
    // ...
  },
  {
    onConflict: "original_link",
  },
);
```

## 데이터 시딩

개발 환경에서 테스트 데이터 생성:

```sql
-- supabase/seed.sql
INSERT INTO posts (title, summary, original_link, category) VALUES
  ('Unity 6 출시', 'Unity 6가 공식 출시되었습니다.', 'https://example.com/1', 'Tech'),
  ('게임 시장 성장', '2024년 게임 시장이 20% 성장했습니다.', 'https://example.com/2', 'Business'),
  ('새로운 게임 발표', 'AAA 게임이 발표되었습니다.', 'https://example.com/3', 'Release');
```

```bash
# 시드 데이터 실행
supabase db reset --seed
```

## 타입 생성

TypeScript 타입 자동 생성:

```bash
# Supabase CLI로 타입 생성
supabase gen types typescript --local > lib/types/database.ts
```

```typescript
// 사용 예시
import { Database } from "@/lib/types/database";

type Post = Database["public"]["Tables"]["posts"]["Row"];
```
