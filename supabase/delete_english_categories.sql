-- ============================================
-- 영문 사이트 카테고리 데이터 삭제
-- ============================================
-- GamesIndustry.biz, Polygon, Game Developer 카테고리의
-- posts와 posts_pending 데이터를 삭제합니다.

-- posts 테이블에서 삭제
DELETE FROM posts 
WHERE category IN ('GamesIndustry.biz', 'Polygon', 'Game Developer');

-- posts_pending 테이블에서 삭제
DELETE FROM posts_pending 
WHERE category IN ('GamesIndustry.biz', 'Polygon', 'Game Developer');

-- 삭제된 행 수 확인
SELECT 
  'posts' as table_name,
  COUNT(*) as remaining_count 
FROM posts
UNION ALL
SELECT 
  'posts_pending' as table_name,
  COUNT(*) as remaining_count 
FROM posts_pending;
