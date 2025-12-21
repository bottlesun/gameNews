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
    'Dev',
    'https://unity.com/releases/unity-6'
  ),
  (
    'Epic Games, 언리얼 엔진 5.4 공개',
    'Epic Games가 언리얼 엔진 5.4 버전을 공개했습니다. Nanite와 Lumen의 성능이 대폭 향상되었으며, 새로운 애니메이션 시스템과 AI 도구가 추가되었습니다.',
    'Dev',
    'https://www.unrealengine.com/en-US/blog'
  ),
  (
    '넥슨, 신작 모바일 게임 공개',
    '넥슨이 새로운 모바일 RPG 게임을 공개했습니다. 언리얼 엔진 5를 기반으로 제작되었으며, 2024년 하반기 출시 예정입니다.',
    'Industry',
    'https://www.nexon.com/news'
  )
*/

-- ============================================
-- Posts Pending 테이블 (검수 대기 뉴스)
-- ============================================

-- Posts Pending 테이블 생성 (없을 때만)
CREATE TABLE IF NOT EXISTS posts_pending (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  original_link TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 검수 관련 필드
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at TIMESTAMPTZ,
  review_note TEXT
);

-- 기존 정책 삭제 (테이블이 생성된 후에 실행)
DROP POLICY IF EXISTS "Pending posts are viewable by everyone" ON posts_pending;
DROP POLICY IF EXISTS "Authenticated users can insert pending posts" ON posts_pending;
DROP POLICY IF EXISTS "Authenticated users can update pending posts" ON posts_pending;

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_posts_pending_status ON posts_pending(status);
CREATE INDEX IF NOT EXISTS idx_posts_pending_created_at ON posts_pending(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_pending_category ON posts_pending(category);

-- Row Level Security (RLS) 활성화
ALTER TABLE posts_pending ENABLE ROW LEVEL SECURITY;

-- Posts Pending 정책: 모든 사용자가 읽을 수 있음
CREATE POLICY "Pending posts are viewable by everyone"
  ON posts_pending FOR SELECT
  USING (true);

-- Posts Pending 정책: 인증된 사용자만 삽입 가능
-- service_role 키를 사용하면 이 정책을 우회합니다
CREATE POLICY "Authenticated users can insert pending posts"
  ON posts_pending FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Posts Pending 정책: 인증된 사용자만 업데이트 가능
CREATE POLICY "Authenticated users can update pending posts"
  ON posts_pending FOR UPDATE
  USING (auth.role() = 'authenticated');
