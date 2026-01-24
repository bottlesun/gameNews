# API 레퍼런스

이 문서는 게임 뉴스 애그리게이터의 API 엔드포인트를 설명합니다.

## Base URL

```
개발: http://localhost:3000
프로덕션: https://your-domain.vercel.app
```

## 인증

대부분의 API는 인증이 필요하지 않습니다 (읽기 전용).
쓰기 작업은 Supabase service_role 키가 필요합니다.

## 엔드포인트

### 블로그 API

#### POST /api/blog/create

새로운 블로그 포스트를 Notion 데이터베이스에 생성합니다.

**Request**

```http
POST /api/blog/create
Content-Type: application/json

{
  "title": "포스트 제목",
  "info": "Markdown 형식의 설명",
  "status": "Published"
}
```

**Request Body**

| 필드     | 타입   | 필수 | 설명                                           |
| -------- | ------ | ---- | ---------------------------------------------- |
| `title`  | string | ✅   | 포스트 제목                                    |
| `info`   | string | ✅   | Markdown 형식의 설명                           |
| `status` | string | ❌   | 'Draft' 또는 'Published' (기본값: 'Published') |

**Response**

성공 (200):

```json
{
  "success": true,
  "pageId": "notion-page-id",
  "url": "https://notion.so/..."
}
```

오류 (400):

```json
{
  "error": "Missing required fields: title, info"
}
```

오류 (500):

```json
{
  "error": "Failed to create blog post",
  "details": "..."
}
```

**예시**

```typescript
const response = await fetch("/api/blog/create", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    title: "새로운 블로그 포스트",
    info: "이것은 **Markdown** 형식의 설명입니다.",
    status: "Published",
  }),
});

const data = await response.json();
console.log(data.pageId);
```

## Server Actions

Next.js Server Actions를 통한 서버 사이드 함수들입니다.

### Blog Actions

#### createBlogPost

```typescript
import { createBlogPost } from "@/lib/actions/blog";

const result = await createBlogPost({
  title: "포스트 제목",
  info: "Markdown 설명",
  status: "Published",
});
```

## Notion API 서비스

### getPublishedPosts

게시된 블로그 포스트 목록을 가져옵니다.

```typescript
import { getPublishedPosts } from "@/lib/notion";

const posts = await getPublishedPosts();
```

**반환값**

```typescript
type BlogPost = {
  id: string;
  title: string;
  info: string;
  status: string;
  createdat: string;
  updatedat: string;
};

const posts: BlogPost[];
```

### getPageContent

특정 페이지의 콘텐츠를 가져옵니다.

```typescript
import { getPageContent } from "@/lib/notion";

const content = await getPageContent(pageId);
```

**매개변수**

| 매개변수 | 타입   | 설명             |
| -------- | ------ | ---------------- |
| `pageId` | string | Notion 페이지 ID |

**반환값**

```typescript
type PageContent = {
  recordMap: any; // react-notion-x용 데이터
};
```

## Supabase 쿼리

### 뉴스 포스트 조회

```typescript
import { createClient } from "@/lib/supabase/server";

const supabase = createClient();

// 모든 포스트
const { data: posts } = await supabase
  .from("posts")
  .select("*")
  .order("created_at", { ascending: false });

// 카테고리별 필터링
const { data: techPosts } = await supabase
  .from("posts")
  .select("*")
  .eq("category", "Tech")
  .order("created_at", { ascending: false });

// 페이지네이션
const { data: pagedPosts } = await supabase
  .from("posts")
  .select("*")
  .order("created_at", { ascending: false })
  .range(0, 9); // 첫 10개
```

## 타입 정의

### Post (뉴스 포스트)

```typescript
type Post = {
  id: string;
  title: string;
  summary: string | null;
  original_link: string;
  category: "Dev" | "Business" | "Tech" | "Release" | "Esports";
  created_at: string;
  updated_at: string;
};
```

### BlogPost (블로그 포스트)

```typescript
type BlogPost = {
  id: string;
  title: string;
  info: string;
  status: "Draft" | "Published";
  createdat: string;
  updatedat: string;
};
```

## 에러 처리

### 에러 코드

| 코드 | 설명                            |
| ---- | ------------------------------- |
| 400  | 잘못된 요청 (필수 필드 누락 등) |
| 401  | 인증 실패                       |
| 404  | 리소스를 찾을 수 없음           |
| 500  | 서버 내부 오류                  |

### 에러 응답 형식

```typescript
type ErrorResponse = {
  error: string;
  details?: string;
  code?: string;
};
```

### 에러 처리 예시

```typescript
try {
  const response = await fetch("/api/blog/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  const result = await response.json();
  return result;
} catch (error) {
  console.error("API Error:", error);
  // 에러 처리 로직
}
```

## Rate Limiting

현재 Rate Limiting은 적용되어 있지 않습니다.
프로덕션 환경에서는 다음과 같은 제한을 권장합니다:

- API 요청: 100 req/min per IP
- 블로그 생성: 10 req/hour per IP

## CORS 설정

기본적으로 모든 오리진에서 접근 가능합니다.
프로덕션 환경에서는 특정 도메인만 허용하도록 설정하세요.

```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "https://your-domain.com",
          },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,DELETE" },
        ],
      },
    ];
  },
};
```

## Webhook (향후 계획)

### POST /api/webhooks/notion

Notion 데이터베이스 변경시 자동으로 호출됩니다.

```typescript
// 향후 구현 예정
```

## GraphQL (향후 계획)

REST API 대신 GraphQL을 사용할 수 있습니다.

```graphql
# 향후 구현 예정
query GetPosts {
  posts(orderBy: { created_at: desc }) {
    id
    title
    category
    created_at
  }
}
```

## SDK (향후 계획)

JavaScript/TypeScript SDK를 제공할 예정입니다.

```typescript
// 향후 구현 예정
import { GameNewsClient } from "@gamenews/sdk";

const client = new GameNewsClient({
  apiKey: "your-api-key",
});

const posts = await client.posts.list();
```
