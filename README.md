# 게임 뉴스 애그리게이터 (Game News Aggregator)

게임 업계 전문가를 위한 미니멀리스트 뉴스 피드입니다.

## 기술 스택

- **프레임워크**: Next.js 14 (App Router)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS
- **UI 컴포넌트**: shadcn/ui
- **백엔드/데이터베이스**: Supabase (PostgreSQL, Auth, Realtime)
- **배포**: Vercel

## 주요 기능

- ✅ 뉴스 피드 (최신순 정렬)
- ✅ 업보트 기능 (인증 필요)
- ✅ 카테고리 배지 (Dev, Business, Tech, Release, Esports)
- ✅ 외부 링크 (새 탭에서 열기)
- ✅ 다크 모드 지원
- ✅ 반응형 디자인

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Supabase 프로젝트의 **Settings > API**에서 URL과 anon key를 확인할 수 있습니다.

### 3. Supabase 데이터베이스 설정

1. [Supabase](https://supabase.com)에서 새 프로젝트를 생성합니다
2. SQL Editor를 열고 `supabase/schema.sql` 파일의 내용을 복사하여 실행합니다
3. 테이블과 RLS 정책이 생성되었는지 확인합니다

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 프로젝트 구조

```
gameNews/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # 루트 레이아웃 (다크 모드)
│   ├── page.tsx           # 홈 페이지
│   └── globals.css        # 전역 스타일
├── components/            # React 컴포넌트
│   ├── ui/               # shadcn/ui 컴포넌트
│   ├── news-feed.tsx     # 뉴스 피드 컴포넌트
│   ├── post-card.tsx     # 포스트 카드 컴포넌트
│   └── upvote-button.tsx # 업보트 버튼 컴포넌트
├── lib/                   # 유틸리티 및 설정
│   ├── supabase/         # Supabase 클라이언트
│   ├── types/            # TypeScript 타입 정의
│   └── utils.ts          # 유틸리티 함수
└── supabase/             # Supabase 관련 파일
    └── schema.sql        # 데이터베이스 스키마
```

## 데이터베이스 스키마

### Posts 테이블

| 컬럼          | 타입        | 설명      |
| ------------- | ----------- | --------- |
| id            | UUID        | 기본 키   |
| title         | TEXT        | 뉴스 제목 |
| summary       | TEXT        | 3줄 요약  |
| original_link | TEXT        | 원본 링크 |
| category      | TEXT        | 카테고리  |
| view_count    | INTEGER     | 조회수    |
| created_at    | TIMESTAMPTZ | 생성 시간 |

### Upvotes 테이블

| 컬럼       | 타입        | 설명           |
| ---------- | ----------- | -------------- |
| user_id    | UUID        | 사용자 ID (FK) |
| post_id    | UUID        | 포스트 ID (FK) |
| created_at | TIMESTAMPTZ | 생성 시간      |

## 배포

### Vercel에 배포

1. GitHub에 프로젝트를 푸시합니다
2. [Vercel](https://vercel.com)에 로그인하고 프로젝트를 임포트합니다
3. 환경 변수를 설정합니다:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. 배포를 시작합니다

## 향후 개발 계획

- [ ] 댓글 기능
- [ ] 사용자 프로필
- [ ] 검색 및 필터링
- [ ] 페이지네이션
- [ ] 실시간 업데이트 (Supabase Realtime)
- [ ] 소셜 로그인 (Google, GitHub)

## 라이선스

MIT
