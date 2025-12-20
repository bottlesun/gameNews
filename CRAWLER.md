# 게임 뉴스 크롤러 사용 가이드

## 개요

`crawler.py`는 게임 관련 RSS 피드에서 뉴스를 자동으로 수집하여 Supabase 데이터베이스에 저장하는 Python 스크립트입니다.

## 크롤링 소스

현재 다음 RSS 피드에서 뉴스를 수집합니다:

- **Game Developer** - 게임 개발 관련 뉴스
- **GamesIndustry.biz** - 게임 비즈니스 뉴스
- **Polygon** - 게임 기술 및 일반 뉴스

## 로컬에서 실행

### 1. Python 의존성 설치

```bash
pip install -r requirements.txt
```

### 2. 환경 변수 설정

`.env` 파일을 생성하고 다음 내용을 추가:

```env
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-service-role-key
```

⚠️ **주의**: 크롤러는 `SUPABASE_KEY`로 **service_role** 키를 사용해야 합니다 (anon 키가 아님).

### 3. 크롤러 실행

```bash
python crawler.py
```

## GitHub Actions에서 실행

### Repository Secrets 설정

1. GitHub 저장소 → **Settings** → **Secrets and variables** → **Actions**
2. 다음 Secrets 추가:
   - `SUPABASE_URL`: Supabase 프로젝트 URL
   - `SUPABASE_KEY`: Supabase service_role 키

### 수동 실행

1. GitHub 저장소 → **Actions** 탭
2. 왼쪽에서 **"Manual News Crawler"** 선택
3. **"Run workflow"** 버튼 클릭
4. 브랜치 선택 후 **"Run workflow"** 클릭

## 크롤러 동작 방식

1. **RSS 피드 파싱**: 각 피드에서 최근 10개 항목 가져오기
2. **중복 확인**: 이미 데이터베이스에 있는 링크는 건너뛰기
3. **카테고리 분류**: 키워드 기반으로 자동 카테고리 할당
   - `Esports`: esports, tournament, championship 등
   - `Release`: release, launch, announced 등
   - `Tech`: unity, unreal, engine, tool 등
   - `Business`: business, revenue, sales 등
   - 기본값: 피드의 기본 카테고리
4. **요약 정리**: HTML 태그 제거 및 길이 제한 (300자)
5. **데이터베이스 저장**: Supabase posts 테이블에 삽입

## 출력 예시

```
🚀 Starting news crawler at 2024-12-20 10:30:00

📰 Fetching from Game Developer...
  ✅ Added: Unity 6 brings major performance improvements... [Tech]
  ⏭️  Already exists: GDC 2024 announces keynote speakers...
  ✅ Added: New AI tools for game development... [Dev]

📰 Fetching from GamesIndustry.biz...
  ✅ Added: Mobile gaming revenue hits record high... [Business]
  ⏭️  Skipping entry without link: Weekly roundup

✨ Crawler finished!
📊 Summary: 3 added, 2 skipped

🎉 Success! Added 3 new posts.
```

## 커스터마이징

### RSS 피드 추가

`crawler.py`의 `RSS_FEEDS` 리스트에 새 피드 추가:

```python
RSS_FEEDS = [
    {
        "url": "https://example.com/feed.xml",
        "category": "Tech",
        "name": "Example Site"
    },
    # ... 기존 피드들
]
```

### 카테고리 규칙 수정

`categorize_entry()` 함수에서 키워드 규칙 수정:

```python
if any(word in content for word in ['your', 'keywords']):
    return 'YourCategory'
```

## 문제 해결

### "SUPABASE_URL and SUPABASE_KEY must be set" 오류

- 환경 변수가 제대로 설정되었는지 확인
- GitHub Actions의 경우 Repository Secrets 확인

### "Feed parsing error" 경고

- RSS 피드 URL이 유효한지 확인
- 일부 피드는 접근 제한이 있을 수 있음

### 중복 항목이 계속 추가됨

- `original_link` 필드가 정확히 일치하는지 확인
- 일부 피드는 URL에 추적 파라미터를 추가할 수 있음

## 라이선스

MIT
