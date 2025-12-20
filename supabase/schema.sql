-- 게임 뉴스 애그리게이터 데이터베이스 스키마 (단순화 버전)
-- Supabase SQL Editor에서 실행하세요
-- 여러 번 실행해도 안전합니다 (멱등성)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON posts;
DROP POLICY IF EXISTS "Authenticated users can insert posts" ON posts;
DROP POLICY IF EXISTS "Anyone can insert posts" ON posts;

-- 기존 테이블 삭제 (있다면) - 주의: 데이터가 삭제됩니다!
-- DROP TABLE IF EXISTS posts CASCADE;

-- Posts 테이블 생성 (없을 때만)
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  original_link TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);

-- Row Level Security (RLS) 활성화
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Posts 정책: 모든 사용자가 읽을 수 있음
CREATE POLICY "Posts are viewable by everyone"
  ON posts FOR SELECT
  USING (true);

-- Posts 정책: 인증된 사용자만 삽입 가능
-- service_role 키를 사용하면 이 정책을 우회합니다
CREATE POLICY "Authenticated users can insert posts"
  ON posts FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 샘플 데이터 삽입 (테스트용)
-- 이미 데이터가 있으면 충돌이 발생하므로 주석 처리
-- 필요시 주석을 해제하고 실행하세요
/*
INSERT INTO posts (title, summary, category, original_link) VALUES
  (
    'Unity 6 정식 출시',
    'Unity Technologies가 차세대 게임 엔진인 Unity 6를 정식 출시했습니다. 새로운 렌더링 파이프라인과 성능 개선이 포함되어 있으며, 모바일 게임 개발에 최적화된 기능들이 추가되었습니다.',
    'Tech',
    'https://unity.com/releases/unity-6'
  ),
  (
    'Epic Games, 언리얼 엔진 5.4 공개',
    'Epic Games가 언리얼 엔진 5.4 버전을 공개했습니다. Nanite와 Lumen의 성능이 대폭 향상되었으며, 새로운 애니메이션 시스템과 AI 도구가 추가되었습니다.',
    'Tech',
    'https://www.unrealengine.com/en-US/blog'
  ),
  (
    '인디 게임 개발자를 위한 마케팅 전략',
    '성공적인 인디 게임 출시를 위한 마케팅 전략을 소개합니다. Steam 위시리스트 확보, 소셜 미디어 활용, 인플루언서 협업 등 실전 팁을 다룹니다.',
    'Business',
    'https://gamedeveloper.com/marketing-tips'
  ),
  (
    'GDC 2024 주요 발표 요약',
    'Game Developers Conference 2024의 주요 발표 내용을 정리했습니다. AI 기반 게임 개발 도구, 클라우드 게이밍의 미래, 그리고 차세대 콘솔 기술에 대한 논의가 있었습니다.',
    'Dev',
    'https://gdconf.com/news/gdc-2024-highlights'
  ),
  (
    'League of Legends 월드 챔피언십 결승전',
    'LoL 월드 챔피언십 결승전이 성황리에 마무리되었습니다. 전 세계 500만 명 이상의 시청자가 동시 접속하며 역대 최고 기록을 경신했습니다.',
    'Esports',
    'https://lolesports.com/worlds-2024'
  );
*/
