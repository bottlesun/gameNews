# 문제 해결 가이드

이 문서는 게임 뉴스 애그리게이터 사용 중 발생할 수 있는 일반적인 문제와 해결 방법을 안내합니다.

## 설치 및 설정 문제

### Node.js 버전 오류

**증상**

```
Error: The engine "node" is incompatible with this module
```

**해결 방법**

```bash
# Node.js 버전 확인
node --version

# nvm으로 올바른 버전 설치
nvm install 18
nvm use 18

# 또는 공식 사이트에서 다운로드
# https://nodejs.org
```

### 의존성 설치 실패

**증상**

```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

**해결 방법**

```bash
# 캐시 삭제
npm cache clean --force

# node_modules 및 lock 파일 삭제
rm -rf node_modules package-lock.json

# 재설치
npm install

# 또는 legacy peer deps 사용
npm install --legacy-peer-deps
```

### 환경 변수 인식 안됨

**증상**

- Supabase 연결 실패
- Notion API 오류

**해결 방법**

1. `.env.local` 파일이 프로젝트 루트에 있는지 확인
2. 파일명이 정확한지 확인 (`.env.local`, `.env`가 아님)
3. 환경 변수 이름 확인:

   ```env
   # ✅ 올바른 형식
   NEXT_PUBLIC_SUPABASE_URL=https://...

   # ❌ 잘못된 형식
   SUPABASE_URL=https://...  # NEXT_PUBLIC_ 접두사 누락
   ```

4. 개발 서버 재시작:
   ```bash
   # Ctrl+C로 중지 후
   npm run dev
   ```

## Supabase 관련 문제

### 데이터베이스 연결 실패

**증상**

```
Error: Failed to fetch posts
```

**해결 방법**

1. **환경 변수 확인**

   ```bash
   # .env.local 파일 확인
   cat .env.local
   ```

2. **Supabase 프로젝트 상태 확인**
   - Supabase 대시보드에서 프로젝트가 활성화되어 있는지 확인

3. **API 키 재생성**
   - Settings → API → Reset anon key

4. **연결 테스트**

   ```typescript
   const { data, error } = await supabase.from("posts").select("count");

   console.log("Connection test:", { data, error });
   ```

### RLS 정책 오류

**증상**

```
Error: new row violates row-level security policy
```

**해결 방법**

1. **RLS 정책 확인**

   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'posts';
   ```

2. **크롤러용 service_role 키 사용**

   ```env
   # 크롤러는 service_role 키 필요
   SUPABASE_KEY=your-service-role-key
   ```

3. **개발 환경에서 RLS 비활성화 (임시)**
   ```sql
   ALTER TABLE posts DISABLE ROW LEVEL SECURITY;
   ```

### 중복 키 오류

**증상**

```
Error: duplicate key value violates unique constraint "posts_original_link_key"
```

**해결 방법**

크롤러가 이미 존재하는 링크를 추가하려고 시도한 것입니다. 이는 정상적인 동작이며, 크롤러가 자동으로 건너뜁니다.

## Notion 관련 문제

### Notion API 연결 실패

**증상**

```
Error: Notion API request failed
```

**해결 방법**

1. **Integration 토큰 확인**
   - [Notion Integrations](https://www.notion.so/my-integrations)에서 토큰 재생성

2. **데이터베이스 공유 확인**
   - Notion 데이터베이스 → Share → Integration 초대 확인

3. **Database ID 확인**
   ```
   https://www.notion.so/{workspace}/{database_id}?v={view_id}
                                     ↑ 이 부분이 맞는지 확인
   ```

### 블로그 포스트가 표시되지 않음

**증상**

- `/blog` 페이지가 비어있음

**해결 방법**

1. **status 속성 확인**
   - Notion에서 포스트의 `status`가 "Published"인지 확인

2. **속성 이름 확인**
   - 속성 이름이 정확한지 확인 (대소문자 구분 없음):
     - `title` (Title 타입)
     - `info` (Rich Text 타입)
     - `status` (Select 타입)
     - `createdat` (Date 타입)

3. **캐시 무효화**

   ```bash
   # 개발 서버 재시작
   npm run dev

   # 또는 프로덕션에서 재배포
   ```

### Markdown 렌더링 안됨

**증상**

- Markdown이 일반 텍스트로 표시됨

**해결 방법**

1. **info 속성 타입 확인**
   - Notion에서 `info` 속성이 "Rich Text" 타입인지 확인

2. **Markdown 문법 확인**

   ```markdown
   # ✅ 올바른 Markdown

   **굵게**, _기울임_, `코드`

   # ❌ 잘못된 Markdown

   <b>굵게</b> # HTML 태그는 지원 안됨
   ```

## 크롤러 관련 문제

### Python 의존성 오류

**증상**

```
ModuleNotFoundError: No module named 'feedparser'
```

**해결 방법**

```bash
# 가상환경 활성화
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows

# 의존성 재설치
pip install -r requirements.txt

# 또는 개별 설치
pip install feedparser supabase
```

### RSS 피드 파싱 실패

**증상**

```
⚠️  Feed parsing error: ...
```

**해결 방법**

1. **RSS 피드 URL 확인**
   - 브라우저에서 직접 접속해보기

2. **네트워크 연결 확인**

   ```bash
   curl https://www.gamedeveloper.com/rss.xml
   ```

3. **타임아웃 증가**
   ```python
   # crawler.py
   response = requests.get(url, timeout=30)  # 기본 10초에서 30초로
   ```

### GitHub Actions 크롤러 실패

**증상**

- Actions 탭에서 워크플로우 실패

**해결 방법**

1. **Secrets 확인**
   - Settings → Secrets → Actions
   - `SUPABASE_URL`, `SUPABASE_KEY` 확인

2. **워크플로우 로그 확인**
   - Actions → 실패한 워크플로우 → 로그 확인

3. **수동 실행 테스트**
   ```bash
   # 로컬에서 테스트
   python crawler.py
   ```

## 빌드 및 배포 문제

### Next.js 빌드 실패

**증상**

```
Error: Build failed
```

**해결 방법**

1. **로컬에서 빌드 테스트**

   ```bash
   npm run build
   ```

2. **TypeScript 오류 확인**

   ```bash
   npx tsc --noEmit
   ```

3. **캐시 삭제**
   ```bash
   rm -rf .next
   npm run build
   ```

### Vercel 배포 실패

**증상**

- Vercel 대시보드에서 배포 실패

**해결 방법**

1. **빌드 로그 확인**
   - Vercel 대시보드 → Deployments → 실패한 배포 → Logs

2. **환경 변수 확인**
   - Settings → Environment Variables
   - 모든 필수 변수가 설정되어 있는지 확인

3. **Node.js 버전 지정**
   ```json
   // package.json
   {
     "engines": {
       "node": ">=18.0.0"
     }
   }
   ```

### ISR 업데이트 안됨

**증상**

- Notion에서 수정했는데 사이트에 반영 안됨

**해결 방법**

1. **60초 대기**
   - ISR은 60초마다 재생성됩니다

2. **수동 재배포**
   - Vercel 대시보드 → Deployments → Redeploy

3. **revalidate 시간 확인**
   ```typescript
   // app/blog/page.tsx
   export const revalidate = 60; // 60초
   ```

## 성능 문제

### 페이지 로딩 느림

**해결 방법**

1. **이미지 최적화**

   ```tsx
   import Image from "next/image";

   <Image
     src="/image.jpg"
     alt="Description"
     width={800}
     height={600}
     loading="lazy"
   />;
   ```

2. **데이터베이스 쿼리 최적화**

   ```typescript
   // ❌ 모든 데이터 가져오기
   const { data } = await supabase.from("posts").select("*");

   // ✅ 필요한 컬럼만 선택
   const { data } = await supabase
     .from("posts")
     .select("id, title, category")
     .limit(10);
   ```

3. **인덱스 추가**
   ```sql
   CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
   ```

### 메모리 부족

**증상**

```
JavaScript heap out of memory
```

**해결 방법**

```bash
# Node.js 메모리 증가
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

## 디버깅 팁

### 개발자 도구 활용

```typescript
// 콘솔 로그 추가
console.log("Posts:", posts);
console.error("Error:", error);

// 네트워크 탭에서 API 요청 확인
// Application 탭에서 환경 변수 확인
```

### Supabase 로그 확인

1. Supabase 대시보드 → Logs
2. API, Database, Auth 로그 확인

### Next.js 디버깅

```bash
# 디버그 모드로 실행
DEBUG=* npm run dev

# 또는 특정 모듈만
DEBUG=next:* npm run dev
```

## 추가 도움말

문제가 해결되지 않으면:

1. **GitHub Issues 확인**
   - 비슷한 문제가 보고되었는지 확인

2. **로그 수집**
   - 에러 메시지 전체 복사
   - 브라우저 콘솔 로그 확인
   - 서버 로그 확인

3. **최소 재현 예제 작성**
   - 문제를 재현할 수 있는 최소한의 코드

4. **커뮤니티 도움 요청**
   - GitHub Discussions
   - Stack Overflow
   - Discord/Slack 커뮤니티
