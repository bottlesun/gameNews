-- 기존 posts_pending의 승인된 데이터를 posts로 마이그레이션
-- Supabase SQL Editor에서 실행하세요

-- 1. 승인된 게시물을 posts 테이블로 복사 (중복 제외)
INSERT INTO posts (title, summary, original_link, category, tags, created_at)
SELECT 
  pp.title,
  pp.summary,
  pp.original_link,
  pp.category,
  pp.tags,
  pp.created_at
FROM posts_pending pp
WHERE pp.status = 'approved'
  -- 중복 체크: 같은 제목과 링크가 posts에 없는 경우만
  AND NOT EXISTS (
    SELECT 1 
    FROM posts p 
    WHERE p.title = pp.title 
      AND p.original_link = pp.original_link
  );

-- 2. 마이그레이션된 데이터 확인
SELECT 
  (SELECT COUNT(*) FROM posts_pending WHERE status = 'approved') as approved_count,
  (SELECT COUNT(*) FROM posts) as posts_count;

-- 3. (선택사항) posts_pending 테이블 비우기
-- 주의: 이 작업은 되돌릴 수 없습니다!
-- 마이그레이션이 성공적으로 완료된 후에만 실행하세요.
-- TRUNCATE TABLE posts_pending;

-- 4. (선택사항) posts_pending 테이블 삭제
-- 주의: 이 작업은 되돌릴 수 없습니다!
-- 더 이상 검수 시스템을 사용하지 않을 경우에만 실행하세요.
-- DROP TABLE IF EXISTS posts_pending CASCADE;
