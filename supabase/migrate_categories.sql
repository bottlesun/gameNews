-- 기존 데이터의 카테고리를 출처 이름으로 업데이트
-- Supabase SQL Editor에서 실행하세요

-- 기존 카테고리를 새 카테고리로 매핑
-- 이 스크립트는 기존 데이터가 있을 때만 실행하세요

-- Dev -> Game Developer
UPDATE posts 
SET category = 'Game Developer' 
WHERE category = 'Dev';

-- Business -> GamesIndustry.biz
UPDATE posts 
SET category = 'GamesIndustry.biz' 
WHERE category = 'Business';

-- Tech -> Polygon
UPDATE posts 
SET category = 'Polygon' 
WHERE category = 'Tech';

-- Esports, Release 등 기타 카테고리는 Game Developer로 변경
UPDATE posts 
SET category = 'Game Developer' 
WHERE category NOT IN ('Game Developer', 'GamesIndustry.biz', 'Polygon');

-- 결과 확인
SELECT category, COUNT(*) as count 
FROM posts 
GROUP BY category 
ORDER BY count DESC;
