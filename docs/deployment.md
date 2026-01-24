# 배포 가이드

이 가이드는 게임 뉴스 애그리게이터를 프로덕션 환경에 배포하는 방법을 설명합니다.

## Vercel 배포 (권장)

Vercel은 Next.js 프로젝트에 최적화된 호스팅 플랫폼입니다.

### 1단계: GitHub 연동

```bash
# GitHub 저장소 생성 및 푸시
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/gameNews.git
git push -u origin main
```

### 2단계: Vercel 프로젝트 생성

1. [Vercel](https://vercel.com)에 로그인
2. **Add New** → **Project** 클릭
3. GitHub 저장소 선택
4. **Import** 클릭

### 3단계: 환경 변수 설정

**Settings** → **Environment Variables**에서 추가:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Notion (블로그 사용시)
NOTION_API_KEY=secret_your-integration-token
NOTION_DATABASE_ID=your-database-id
```

### 4단계: 배포

1. **Deploy** 클릭
2. 빌드 완료 대기 (약 2-3분)
3. 배포된 URL 확인

### 자동 배포

- `main` 브랜치에 푸시하면 자동 배포
- Pull Request마다 프리뷰 배포 생성

## GitHub Actions 크롤러 설정

### 1단계: Repository Secrets 설정

1. GitHub 저장소 → **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret** 클릭
3. 다음 Secrets 추가:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
```

### 2단계: 워크플로우 확인

`.github/workflows/manual_crawl.yml` 파일이 이미 설정되어 있습니다:

```yaml
name: Manual News Crawler

on:
  workflow_dispatch: # 수동 실행

jobs:
  crawl:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: "3.10"
      - name: Install dependencies
        run: pip install -r requirements.txt
      - name: Run crawler
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_KEY: ${{ secrets.SUPABASE_KEY }}
        run: python crawler.py
```

### 3단계: 수동 실행

1. GitHub 저장소 → **Actions** 탭
2. **Manual News Crawler** 선택
3. **Run workflow** 클릭

### 자동 스케줄링 (선택사항)

매일 자동 크롤링을 원하면 워크플로우 수정:

```yaml
on:
  workflow_dispatch:
  schedule:
    - cron: "0 */6 * * *" # 6시간마다 실행
```

## 다른 플랫폼 배포

### Netlify

1. [Netlify](https://netlify.com)에 로그인
2. **Add new site** → **Import an existing project**
3. GitHub 저장소 연결
4. 빌드 설정:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
5. 환경 변수 설정
6. **Deploy site** 클릭

### AWS Amplify

```bash
# Amplify CLI 설치
npm install -g @aws-amplify/cli

# 프로젝트 초기화
amplify init

# 호스팅 추가
amplify add hosting

# 배포
amplify publish
```

### Docker 배포

`Dockerfile` 생성:

```dockerfile
FROM node:18-alpine AS base

# 의존성 설치
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# 빌드
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 프로덕션
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

빌드 및 실행:

```bash
# 이미지 빌드
docker build -t game-news .

# 컨테이너 실행
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your-url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key \
  game-news
```

## 프로덕션 최적화

### Next.js 설정

`next.config.ts`:

```typescript
const nextConfig = {
  // 이미지 최적화
  images: {
    domains: ["your-cdn-domain.com"],
    formats: ["image/webp", "image/avif"],
  },

  // 압축
  compress: true,

  // 엄격 모드
  reactStrictMode: true,

  // 번들 분석 (개발시)
  // webpack: (config) => {
  //   config.plugins.push(new BundleAnalyzerPlugin());
  //   return config;
  // },
};
```

### 환경별 설정

```bash
# 개발
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 실행
npm run start
```

## 모니터링 및 분석

### Vercel Analytics

```bash
npm install @vercel/analytics
```

`app/layout.tsx`:

```typescript
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### Sentry 에러 추적

```bash
npm install @sentry/nextjs
```

`sentry.client.config.ts`:

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

## 성능 최적화

### 이미지 최적화

```tsx
import Image from "next/image";

<Image
  src="/image.jpg"
  alt="Description"
  width={800}
  height={600}
  priority // LCP 이미지에 사용
/>;
```

### 폰트 최적화

```tsx
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }) {
  return (
    <html className={inter.className}>
      <body>{children}</body>
    </html>
  );
}
```

### 번들 크기 최적화

```bash
# 번들 분석
npm run build
npx @next/bundle-analyzer
```

## 보안 체크리스트

- [ ] 환경 변수 보안 확인
- [ ] HTTPS 강제 적용
- [ ] CSP (Content Security Policy) 설정
- [ ] Rate Limiting 적용
- [ ] CORS 설정 확인
- [ ] API 키 로테이션 계획

## 백업 전략

### 데이터베이스 백업

Supabase는 자동 백업을 제공하지만, 추가 백업 권장:

```bash
# Supabase CLI로 백업
supabase db dump -f backup.sql
```

### 코드 백업

- GitHub 저장소 (자동)
- 정기적인 릴리스 태그 생성

```bash
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

## 롤백 전략

### Vercel 롤백

1. Vercel 대시보드 → **Deployments**
2. 이전 배포 선택
3. **Promote to Production** 클릭

### Git 롤백

```bash
# 이전 커밋으로 되돌리기
git revert HEAD
git push origin main

# 또는 특정 커밋으로
git reset --hard <commit-hash>
git push -f origin main  # 주의: 강제 푸시
```

## 도메인 설정

### Vercel 커스텀 도메인

1. Vercel 프로젝트 → **Settings** → **Domains**
2. 도메인 입력 (예: `gamenews.com`)
3. DNS 레코드 추가:
   - **A 레코드**: `76.76.21.21`
   - **CNAME**: `cname.vercel-dns.com`
4. SSL 자동 설정 대기

## 문제 해결

### 빌드 실패

```bash
# 로컬에서 빌드 테스트
npm run build

# 캐시 삭제 후 재시도
rm -rf .next node_modules
npm install
npm run build
```

### 환경 변수 오류

- Vercel 대시보드에서 변수 확인
- 변수명 오타 확인
- 재배포 필요 (환경 변수 변경 후)

### 성능 문제

- Vercel Analytics로 병목 지점 확인
- Lighthouse 점수 확인
- 이미지 최적화 확인
