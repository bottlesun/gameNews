-- 게임 뉴스 애그리게이터 데이터베이스 스키마
-- Supabase SQL Editor에서 실행하세요

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Posts 테이블
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  original_link TEXT NOT NULL,
  category TEXT NOT NULL,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Upvotes 테이블 (사용자당 포스트당 1개의 업보트만 가능)
CREATE TABLE IF NOT EXISTS upvotes (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
CREATE INDEX IF NOT EXISTS idx_upvotes_post_id ON upvotes(post_id);
CREATE INDEX IF NOT EXISTS idx_upvotes_user_id ON upvotes(user_id);

-- Row Level Security (RLS) 활성화
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE upvotes ENABLE ROW LEVEL SECURITY;

-- Posts 정책: 모든 사용자가 읽을 수 있음
CREATE POLICY "Posts are viewable by everyone"
  ON posts FOR SELECT
  USING (true);

-- Posts 정책: 인증된 사용자만 삽입 가능 (크롤러용)
CREATE POLICY "Authenticated users can insert posts"
  ON posts FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Upvotes 정책: 인증된 사용자만 자신의 업보트를 삽입할 수 있음
CREATE POLICY "Users can insert their own upvotes"
  ON upvotes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Upvotes 정책: 인증된 사용자만 자신의 업보트를 삭제할 수 있음
CREATE POLICY "Users can delete their own upvotes"
  ON upvotes FOR DELETE
  USING (auth.uid() = user_id);

-- Upvotes 정책: 모든 사용자가 업보트를 볼 수 있음
CREATE POLICY "Upvotes are viewable by everyone"
  ON upvotes FOR SELECT
  USING (true);

-- 샘플 데이터 삽입 (테스트용)
INSERT INTO posts (title, summary, category, original_link, view_count) VALUES
  (
    'Unity 6 정식 출시',
    'Unity Technologies가 차세대 게임 엔진인 Unity 6를 정식 출시했습니다. 새로운 렌더링 파이프라인과 성능 개선이 포함되어 있으며, 모바일 게임 개발에 최적화된 기능들이 추가되었습니다.',
    'Tech',
    'https://unity.com/releases/unity-6',
    1250
  ),
  (
    'Epic Games, 언리얼 엔진 5.4 공개',
    'Epic Games가 언리얼 엔진 5.4 버전을 공개했습니다. Nanite와 Lumen의 성능이 대폭 향상되었으며, 새로운 애니메이션 시스템과 AI 도구가 추가되었습니다.',
    'Tech',
    'https://www.unrealengine.com/en-US/blog',
    2100
  ),
  (
    '인디 게임 개발자를 위한 마케팅 전략',
    '성공적인 인디 게임 출시를 위한 마케팅 전략을 소개합니다. Steam 위시리스트 확보, 소셜 미디어 활용, 인플루언서 협업 등 실전 팁을 다룹니다.',
    'Business',
    'https://gamedeveloper.com/marketing-tips',
    890
  ),
  (
    'GDC 2024 주요 발표 요약',
    'Game Developers Conference 2024의 주요 발표 내용을 정리했습니다. AI 기반 게임 개발 도구, 클라우드 게이밍의 미래, 그리고 차세대 콘솔 기술에 대한 논의가 있었습니다.',
    'Dev',
    'https://gdconf.com/news/gdc-2024-highlights',
    3400
  ),
  (
    'League of Legends 월드 챔피언십 결승전',
    'LoL 월드 챔피언십 결승전이 성황리에 마무리되었습니다. 전 세계 500만 명 이상의 시청자가 동시 접속하며 역대 최고 기록을 경신했습니다.',
    'Esports',
    'https://lolesports.com/worlds-2024',
    5600
  );
