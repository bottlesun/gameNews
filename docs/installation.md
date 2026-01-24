# 설치 가이드

이 가이드는 로컬 개발 환경에서 게임 뉴스 애그리게이터를 설정하는 방법을 안내합니다.

## 사전 요구사항

### 필수 소프트웨어

- **Node.js**: v18.0.0 이상
- **npm**: v9.0.0 이상 (또는 yarn, pnpm)
- **Python**: v3.8 이상 (크롤러 사용시)
- **Git**: 버전 관리

### 필수 계정

- **Supabase**: 데이터베이스 및 인증
- **Notion**: 블로그 CMS (선택사항)
- **GitHub**: 코드 저장소 및 자동화 (선택사항)

## 1단계: 프로젝트 클론

```bash
# GitHub에서 클론
git clone https://github.com/yourusername/gameNews.git
cd gameNews

# 또는 ZIP 파일 다운로드 후 압축 해제
```

## 2단계: 의존성 설치

### Node.js 의존성

```bash
npm install
```

설치되는 주요 패키지:

- `next`: Next.js 프레임워크
- `react`, `react-dom`: React 라이브러리
- `@supabase/supabase-js`: Supabase 클라이언트
- `@notionhq/client`: Notion API 클라이언트
- `tailwindcss`: CSS 프레임워크
- `lucide-react`: 아이콘 라이브러리

### Python 의존성 (크롤러 사용시)

```bash
# 가상환경 생성 (권장)
python -m venv venv

# 가상환경 활성화
# macOS/Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt
```

## 3단계: Supabase 설정

### 3.1 프로젝트 생성

1. [Supabase](https://supabase.com)에 로그인
2. **New Project** 클릭
3. 프로젝트 이름, 데이터베이스 비밀번호 설정
4. 리전 선택 (가까운 지역 권장)
5. **Create new project** 클릭

### 3.2 데이터베이스 스키마 생성

1. Supabase 대시보드에서 **SQL Editor** 열기
2. `supabase/schema.sql` 파일 내용 복사
3. SQL Editor에 붙여넣기
4. **Run** 클릭

또는 명령줄에서:

```bash
# Supabase CLI 설치
npm install -g supabase

# 프로젝트 연결
supabase link --project-ref your-project-ref

# 마이그레이션 실행
supabase db push
```

### 3.3 API 키 확인

1. Supabase 대시보드 → **Settings** → **API**
2. 다음 값 복사:
   - **Project URL**: `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role**: `SUPABASE_KEY` (크롤러용)

## 4단계: Notion 설정 (선택사항)

블로그 기능을 사용하려면 Notion 설정이 필요합니다.

### 4.1 Notion Integration 생성

1. [Notion Integrations](https://www.notion.so/my-integrations) 접속
2. **+ New integration** 클릭
3. 이름 입력 (예: "Game News Blog")
4. 워크스페이스 선택
5. **Submit** 클릭
6. **Internal Integration Token** 복사 → `NOTION_API_KEY`

### 4.2 Notion 데이터베이스 생성

1. Notion에서 새 페이지 생성
2. `/database` 입력 → **Table** 선택
3. 다음 속성 추가:

| 속성 이름   | 타입      | 설명             |
| ----------- | --------- | ---------------- |
| `title`     | Title     | 포스트 제목      |
| `info`      | Rich Text | Markdown 설명    |
| `status`    | Select    | Draft, Published |
| `createdat` | Date      | 생성일           |
| `updatedat` | Date      | 수정일           |

4. 데이터베이스 공유:
   - 우측 상단 **Share** 클릭
   - Integration 이름 검색
   - **Invite** 클릭

### 4.3 Database ID 확인

Notion 데이터베이스 URL에서 ID 복사:

```
https://www.notion.so/{workspace}/{database_id}?v={view_id}
                                  ↑ 이 부분 복사
```

## 5단계: 환경 변수 설정

프로젝트 루트에 `.env.local` 파일 생성:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Notion Configuration (블로그 사용시)
NOTION_API_KEY=secret_your-integration-token
NOTION_DATABASE_ID=your-database-id

# Crawler Configuration (크롤러 사용시)
SUPABASE_KEY=your-service-role-key
```

> ⚠️ **주의**: `.env.local` 파일은 절대 Git에 커밋하지 마세요!

## 6단계: 개발 서버 실행

```bash
npm run dev
```

브라우저에서 확인:

- **메인 페이지**: http://localhost:3000
- **블로그**: http://localhost:3000/blog

## 7단계: 크롤러 테스트 (선택사항)

```bash
# Python 가상환경 활성화
source venv/bin/activate  # macOS/Linux
# 또는
venv\Scripts\activate     # Windows

# 크롤러 실행
python crawler.py
```

성공하면 Supabase 데이터베이스에 뉴스가 추가됩니다.

## 문제 해결

### Node.js 버전 오류

```bash
# Node.js 버전 확인
node --version

# nvm으로 버전 변경 (nvm 설치 필요)
nvm install 18
nvm use 18
```

### Supabase 연결 오류

- `.env.local` 파일이 프로젝트 루트에 있는지 확인
- 환경 변수 이름이 정확한지 확인
- 개발 서버 재시작: `Ctrl+C` 후 `npm run dev`

### Notion API 오류

- Integration이 데이터베이스에 연결되었는지 확인
- Database ID가 정확한지 확인
- 속성 이름이 정확히 일치하는지 확인 (대소문자 구분 없음)

### Python 크롤러 오류

```bash
# 의존성 재설치
pip install --upgrade -r requirements.txt

# 환경 변수 확인
python -c "import os; print(os.getenv('SUPABASE_URL'))"
```

## 다음 단계

- [프로젝트 구조](./architecture.md) 이해하기
- [블로그 시스템](./blog.md) 설정하기
- [크롤러](./crawler.md) 커스터마이징하기
- [배포 가이드](./deployment.md) 확인하기
