# 자주 묻는 질문 (FAQ)

## 일반

### Q: 이 프로젝트는 무엇인가요?

게임 뉴스 애그리게이터는 여러 게임 관련 뉴스 소스에서 자동으로 뉴스를 수집하고, Notion을 활용한 블로그 기능을 제공하는 웹 애플리케이션입니다.

### Q: 어떤 기술 스택을 사용하나요?

- **Frontend**: Next.js 16, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL), Notion API
- **Deployment**: Vercel, GitHub Actions

### Q: 무료로 사용할 수 있나요?

네, 오픈소스 프로젝트이며 MIT 라이선스로 배포됩니다. 다만 사용하는 서비스들의 무료 티어 제한이 있습니다:

- Supabase: 무료 티어 (500MB 데이터베이스)
- Notion: 무료 플랜
- Vercel: 무료 티어 (취미 프로젝트)

## 설치 및 설정

### Q: Node.js 버전이 중요한가요?

네, Node.js 18 이상이 필요합니다. 낮은 버전에서는 일부 기능이 작동하지 않을 수 있습니다.

```bash
node --version  # v18.0.0 이상 확인
```

### Q: Python이 꼭 필요한가요?

크롤러 기능을 사용하려면 Python 3.8 이상이 필요합니다. 크롤러를 사용하지 않는다면 Python 없이도 프로젝트를 실행할 수 있습니다.

### Q: 환경 변수는 어디에 설정하나요?

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NOTION_API_KEY=your-notion-token
NOTION_DATABASE_ID=your-database-id
```

## Supabase

### Q: Supabase 무료 티어로 충분한가요?

개인 프로젝트나 소규모 사용에는 충분합니다. 무료 티어 제한:

- 500MB 데이터베이스
- 1GB 파일 저장소
- 50,000 월간 활성 사용자

### Q: RLS(Row Level Security)가 무엇인가요?

데이터베이스 행 단위로 접근 권한을 제어하는 Supabase의 보안 기능입니다. 이 프로젝트에서는:

- 읽기: 모든 사용자 허용
- 쓰기: service_role 키만 허용

### Q: 데이터베이스 백업은 어떻게 하나요?

```bash
# Supabase CLI 사용
supabase db dump -f backup.sql

# 또는 Supabase 대시보드에서 자동 백업 설정
```

## Notion

### Q: Notion 블로그 기능은 필수인가요?

아니요, 선택사항입니다. 뉴스 피드만 사용하고 싶다면 Notion 설정을 건너뛸 수 있습니다.

### Q: Notion 데이터베이스 속성 이름을 변경할 수 있나요?

코드를 수정하면 가능합니다. `lib/notion.ts` 파일에서 속성 이름을 변경하세요.

### Q: 여러 개의 Notion 데이터베이스를 사용할 수 있나요?

현재는 하나의 데이터베이스만 지원합니다. 여러 데이터베이스를 사용하려면 코드 수정이 필요합니다.

### Q: Notion 페이지 콘텐츠가 업데이트되지 않아요

ISR(Incremental Static Regeneration)은 60초마다 재생성됩니다. 즉시 반영하려면:

1. 60초 대기
2. 또는 Vercel에서 수동 재배포

## 크롤러

### Q: 크롤러는 얼마나 자주 실행되나요?

기본적으로 수동 실행입니다. GitHub Actions 워크플로우를 수정하여 자동 스케줄링을 설정할 수 있습니다:

```yaml
on:
  schedule:
    - cron: "0 */6 * * *" # 6시간마다
```

### Q: 새로운 RSS 피드를 추가하려면?

`crawler.py` 파일의 `RSS_FEEDS` 리스트에 추가하세요:

```python
RSS_FEEDS = [
    {
        "url": "https://example.com/feed.xml",
        "category": "Tech",
        "name": "Example Site"
    },
    # 기존 피드들...
]
```

### Q: 크롤러가 중복 뉴스를 추가하나요?

아니요, `original_link`를 기준으로 중복을 자동으로 확인하고 건너뜁니다.

### Q: 카테고리는 어떻게 결정되나요?

키워드 기반으로 자동 분류됩니다:

- **Esports**: esports, tournament, championship
- **Release**: release, launch, announced
- **Tech**: unity, unreal, engine, tool
- **Business**: business, revenue, sales
- 기본값: 피드의 기본 카테고리

## 배포

### Q: Vercel 외에 다른 플랫폼에 배포할 수 있나요?

네, Next.js를 지원하는 모든 플랫폼에 배포 가능합니다:

- Netlify
- AWS Amplify
- Docker
- 자체 서버

### Q: 배포 후 환경 변수를 변경하려면?

1. Vercel 대시보드 → Settings → Environment Variables
2. 변수 수정
3. Redeploy 필요 (자동으로 재배포되지 않음)

### Q: 커스텀 도메인을 사용할 수 있나요?

네, Vercel에서 쉽게 설정할 수 있습니다:

1. Settings → Domains
2. 도메인 입력
3. DNS 레코드 추가

## 성능

### Q: ISR 재생성 시간을 변경할 수 있나요?

네, 각 페이지에서 `revalidate` 값을 변경하세요:

```typescript
// app/blog/page.tsx
export const revalidate = 60; // 초 단위
```

### Q: 페이지 로딩이 느려요

다음을 확인하세요:

1. 이미지 최적화 (Next.js Image 컴포넌트 사용)
2. 데이터베이스 쿼리 최적화 (필요한 컬럼만 선택)
3. 인덱스 추가
4. Vercel Analytics로 병목 지점 확인

### Q: 데이터베이스 쿼리를 최적화하려면?

```typescript
// ❌ 비효율적
const { data } = await supabase.from("posts").select("*");

// ✅ 효율적
const { data } = await supabase
  .from("posts")
  .select("id, title, category, created_at")
  .limit(10);
```

## 커스터마이징

### Q: 다크 모드를 비활성화할 수 있나요?

`app/layout.tsx`에서 테마 설정을 변경하세요:

```typescript
<html lang="ko" className="dark">  // 항상 다크 모드
<html lang="ko" className="light"> // 항상 라이트 모드
```

### Q: 카테고리를 추가하거나 변경하려면?

1. 데이터베이스 스키마 수정 (필요시)
2. `crawler.py`의 카테고리 로직 수정
3. UI 컴포넌트에서 카테고리 배지 색상 추가

### Q: UI 디자인을 변경하려면?

- **색상**: `app/globals.css`에서 CSS 변수 수정
- **컴포넌트**: `components/` 폴더의 파일 수정
- **레이아웃**: `app/layout.tsx` 수정

## 보안

### Q: API 키가 노출되지 않나요?

- `NEXT_PUBLIC_*` 접두사가 있는 변수는 클라이언트에 노출됩니다 (anon key)
- 접두사가 없는 변수는 서버에서만 사용됩니다 (service_role key)
- `.env.local` 파일은 Git에 커밋되지 않습니다

### Q: RLS 정책을 수정해야 하나요?

기본 설정으로 충분합니다:

- 읽기: 모든 사용자
- 쓰기: 서비스 역할만

추가 보안이 필요하면 Supabase 대시보드에서 정책을 수정하세요.

## 문제 해결

### Q: 뉴스가 표시되지 않아요

1. Supabase 연결 확인
2. 데이터베이스에 데이터가 있는지 확인
3. 브라우저 콘솔에서 에러 확인

### Q: 블로그 포스트가 보이지 않아요

1. Notion 데이터베이스에 포스트가 있는지 확인
2. `status`가 "Published"인지 확인
3. Integration이 데이터베이스에 연결되어 있는지 확인

### Q: 크롤러가 작동하지 않아요

1. Python 의존성 설치 확인
2. 환경 변수 설정 확인 (`SUPABASE_KEY` 사용)
3. RSS 피드 URL이 유효한지 확인

## 기여

### Q: 프로젝트에 기여하고 싶어요

1. GitHub에서 Fork
2. 새 브랜치 생성
3. 변경사항 커밋
4. Pull Request 생성

### Q: 버그를 발견했어요

GitHub Issues에 버그 리포트를 작성해주세요:

- 에러 메시지
- 재현 방법
- 환경 정보 (OS, Node.js 버전 등)

## 라이선스

### Q: 상업적으로 사용할 수 있나요?

네, MIT 라이선스로 배포되어 자유롭게 사용, 수정, 배포할 수 있습니다.

### Q: 크레딧을 표시해야 하나요?

MIT 라이선스에서는 필수는 아니지만, 원작자를 표시해주시면 감사하겠습니다.

## 추가 질문

더 궁금한 사항이 있으시면:

- [GitHub Discussions](https://github.com/yourusername/gameNews/discussions)
- [문제 해결 가이드](./troubleshooting.md)
- [설치 가이드](./installation.md)
