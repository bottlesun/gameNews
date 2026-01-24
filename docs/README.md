# 게임 뉴스 애그리게이터 문서

게임 뉴스 애그리게이터 프로젝트의 공식 문서입니다.

## 📚 문서 목록

### 시작하기

- [프로젝트 개요](./overview.md) - 프로젝트 소개 및 주요 기능
- [설치 가이드](./installation.md) - 로컬 개발 환경 설정
- [배포 가이드](./deployment.md) - 프로덕션 배포 방법

### 기능별 가이드

- [뉴스 크롤러](./crawler.md) - RSS 피드 크롤링 및 자동화
- [블로그 시스템](./blog.md) - Notion 기반 블로그 설정
- [데이터베이스](./database.md) - Supabase 스키마 및 설정
- [데이터베이스 유지보수](./database-maintenance.md) - 용량 관리 및 자동화

### 개발 가이드

- [프로젝트 구조](./architecture.md) - 폴더 구조 및 아키텍처
- [API 레퍼런스](./api-reference.md) - API 엔드포인트 문서
- [컴포넌트 가이드](./components.md) - UI 컴포넌트 사용법

### 운영 가이드

- [문제 해결](./troubleshooting.md) - 일반적인 문제 및 해결 방법
- [FAQ](./faq.md) - 자주 묻는 질문

## 🚀 빠른 시작

1. **설치**

   ```bash
   npm install
   ```

2. **환경 변수 설정**

   ```bash
   cp .env.example .env.local
   # .env.local 파일을 편집하여 필요한 값 입력
   ```

3. **개발 서버 실행**

   ```bash
   npm run dev
   ```

4. **브라우저에서 확인**
   - http://localhost:3000

## 🔗 관련 링크

- [GitHub Repository](https://github.com/yourusername/gameNews)
- [Supabase Dashboard](https://supabase.com)
- [Notion API Documentation](https://developers.notion.com)

## 📝 라이선스

MIT License
