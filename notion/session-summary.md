# Notion API 통합 작업 세션 요약

## 최종 목표

Notion MCP를 통해 블로그 DB와 연동하고, API 호환성을 검증 및 개선

---

## 1. MCP 연결 확인

### 설정 파일

**위치**: `~/.gemini/antigravity/mcp_config.json`

```json
{
  "mcpServers": {
    "notion-mcp-server": {
      "command": "npx",
      "args": ["-y", "@notionhq/notion-mcp-server"],
      "env": {
        "OPENAPI_MCP_HEADERS": "{\"Authorization\": \"Bearer ntn_[YOUR_NOTION_API_KEY]\", \"Notion-Version\": \"2025-09-03\"}"
      }
    }
  }
}
```

### 연결 테스트

```bash
# MCP 봇 정보 조회
✅ 성공: blog api (BottleSun의 Notion)
```

---

## 2. 데이터베이스 스키마 분석

### 초기 DB 구조 (문제 있음)

| 속성명      | 타입             | 용도                     |
| ----------- | ---------------- | ------------------------ |
| `info`      | title            | 텍스트 내용 (혼란스러움) |
| `title`     | rich_text        | 페이지 제목              |
| `status`    | status           | 상태                     |
| `createdat` | created_time     | 생성일                   |
| `updatedat` | last_edited_time | 수정일                   |

### 문제점 발견

- `info`와 `title` 두 속성이 혼재
- MCP에서 title 타입 속성 수정 시 JSON 파싱 오류
- 코드 속성 매핑이 복잡

---

## 3. API 버전 업데이트

### 변경 내역

```diff
- "Notion-Version": "2022-06-28"  // 구버전
+ "Notion-Version": "2025-09-03"  // 최신 Data Source API 지원
```

### 효과

- Data Source API 정상 작동
- `dataSources.query()` 사용 가능
- Data Source ID와 Database ID 구분 명확

---

## 4. 코드 검증 및 수정

### lib/notion.ts 분석

**파일**: `/Users/kimbyungsun/project/gemini/gameNews/lib/notion.ts`

#### 초기 문제

```typescript
// ❌ 잘못된 속성 매핑
const infoProp = properties.info; // title 타입을 rich_text로 읽으려 함
```

#### 1차 수정 (잘못됨)

```typescript
// 사용자 피드백: title=페이지제목, info=텍스트내용
const infoProp = properties.title; // 수정했으나 여전히 혼란
```

#### 최종 해결책: DB 구조 단순화

---

## 5. DB 구조 단순화

### 목표

`info` (title 타입)만 사용하여 구조 단순화

### 실행 단계

#### Step 1: title 속성 삭제 (MCP)

```bash
# MCP API 호출
✅ 성공: title (rich_text) 속성 제거
```

#### Step 2: 최종 DB 스키마

| 속성명      | 타입             | 용도           |
| ----------- | ---------------- | -------------- |
| `info`      | title            | 페이지 제목 ✅ |
| `status`    | status           | 상태           |
| `createdat` | created_time     | 생성일         |
| `updatedat` | last_edited_time | 수정일         |
| `id`        | unique_id        | 고유 ID        |

#### Step 3: 코드 최종 수정

```typescript
// ✅ 올바른 매핑
let title = "Untitled";
for (const key of Object.keys(properties)) {
  const prop = properties[key];
  if (prop.type === "title" && prop.title && prop.title.length > 0) {
    title = prop.title[0].plain_text || "Untitled";
    break;
  }
}

// info는 더 이상 사용하지 않음 (본문은 blocks에)
const info = "";
```

---

## 6. MCP 기능 테스트

### 데이터 조회 (Query)

```bash
✅ 성공: 3개 페이지 조회
- #1: 테스트
- #2: 테스트
- #4: 한번에 허싈?
```

### 데이터 수정 (Patch)

```bash
✅ 성공: 상태 변경 (완료 → 시작 전)
✅ 성공: 제목 변경 ("ㅁㄴㅇ" → "테스트")
```

### DB 스키마 수정 (Update Data Source)

```bash
✅ 성공: title 속성 삭제
```

### 페이지 생성 (Create)

```bash
❌ 실패: MCP JSON 파싱 문제 (알려진 버그)
```

---

## 7. 환경 변수

### .env.local

```bash
# Notion API
NOTION_API_KEY=ntn_[YOUR_API_KEY]
NOTION_DATABASE_ID=[YOUR_DATA_SOURCE_ID]

# Supabase
NEXT_PUBLIC_SUPABASE_URL=[YOUR_SUPABASE_URL]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_ANON_KEY]
SUPABASE_KEY=[YOUR_SERVICE_ROLE_KEY]

# Discord Webhook
DISCORD_WEBHOOK_URL=[YOUR_WEBHOOK_URL]

# 웹사이트
WEB_SITE_URL=[YOUR_SITE_URL]
```

---

## 8. 최종 성과

### ✅ 달성

1. MCP Notion 연결 확인
2. API 버전 최신화 (2025-09-03)
3. DB 구조 단순화 (title 속성 제거)
4. 코드 속성 매핑 최적화
5. MCP 조회/수정 기능 검증

### ⚠️ 알려진 제약

- MCP로 페이지 생성은 JSON 파싱 버그로 불가
- 대안: `@notionhq/client` 라이브러리 직접 사용

### 📊 개선 효과

- 코드 복잡도 감소
- 속성 매핑 명확화
- MCP 호환성 개선
- 유지보수 용이성 증가

---

## 9. 참고 링크

- [Notion API 문서](https://developers.notion.com)
- [MCP 프로토콜](https://modelcontextprotocol.io)
- [@notionhq/client](https://github.com/makenotion/notion-sdk-js)

---

## 마무리

Notion API 2025-09-03 버전과 완벽히 호환되는 구조로 개선 완료. MCP를 통한 데이터 조회 및 수정이 정상 작동하며, DB 스키마가 단순화되어 향후 유지보수가 용이해졌습니다.
