-- 기존 뉴스 데이터에 태그 자동 추출 및 업데이트
-- Supabase SQL Editor에서 실행하세요

-- 1. posts 테이블의 기존 뉴스에 태그 추출
UPDATE posts
SET tags = (
  SELECT jsonb_agg(DISTINCT keyword)
  FROM (
    -- 회사명
    SELECT '넥슨' as keyword WHERE LOWER(title || ' ' || summary) LIKE '%넥슨%'
    UNION SELECT '엔씨소프트' WHERE LOWER(title || ' ' || summary) LIKE '%엔씨소프트%'
    UNION SELECT 'NC소프트' WHERE LOWER(title || ' ' || summary) LIKE '%nc소프트%'
    UNION SELECT '크래프톤' WHERE LOWER(title || ' ' || summary) LIKE '%크래프톤%'
    UNION SELECT '펄어비스' WHERE LOWER(title || ' ' || summary) LIKE '%펄어비스%'
    UNION SELECT '넷마블' WHERE LOWER(title || ' ' || summary) LIKE '%넷마블%'
    UNION SELECT '컴투스' WHERE LOWER(title || ' ' || summary) LIKE '%컴투스%'
    UNION SELECT '스마일게이트' WHERE LOWER(title || ' ' || summary) LIKE '%스마일게이트%'
    UNION SELECT '카카오게임즈' WHERE LOWER(title || ' ' || summary) LIKE '%카카오게임즈%'
    UNION SELECT '위메이드' WHERE LOWER(title || ' ' || summary) LIKE '%위메이드%'
    UNION SELECT '블리자드' WHERE LOWER(title || ' ' || summary) LIKE '%블리자드%'
    UNION SELECT '라이엇게임즈' WHERE LOWER(title || ' ' || summary) LIKE '%라이엇게임즈%'
    UNION SELECT '밸브' WHERE LOWER(title || ' ' || summary) LIKE '%밸브%'
    UNION SELECT '에픽게임즈' WHERE LOWER(title || ' ' || summary) LIKE '%에픽게임즈%'
    -- 게임명
    UNION SELECT '리니지' WHERE LOWER(title || ' ' || summary) LIKE '%리니지%'
    UNION SELECT '메이플스토리' WHERE LOWER(title || ' ' || summary) LIKE '%메이플스토리%'
    UNION SELECT '던전앤파이터' WHERE LOWER(title || ' ' || summary) LIKE '%던전앤파이터%'
    UNION SELECT '배틀그라운드' WHERE LOWER(title || ' ' || summary) LIKE '%배틀그라운드%'
    UNION SELECT 'PUBG' WHERE LOWER(title || ' ' || summary) LIKE '%pubg%'
    UNION SELECT '검은사막' WHERE LOWER(title || ' ' || summary) LIKE '%검은사막%'
    UNION SELECT '로스트아크' WHERE LOWER(title || ' ' || summary) LIKE '%로스트아크%'
    UNION SELECT '오버워치' WHERE LOWER(title || ' ' || summary) LIKE '%오버워치%'
    UNION SELECT '리그오브레전드' WHERE LOWER(title || ' ' || summary) LIKE '%리그오브레전드%'
    UNION SELECT 'LOL' WHERE LOWER(title || ' ' || summary) LIKE '%lol%'
    UNION SELECT '카트라이더' WHERE LOWER(title || ' ' || summary) LIKE '%카트라이더%'
    UNION SELECT '서든어택' WHERE LOWER(title || ' ' || summary) LIKE '%서든어택%'
    UNION SELECT '피파온라인' WHERE LOWER(title || ' ' || summary) LIKE '%피파온라인%'
    -- 기술/엔진
    UNION SELECT '언리얼엔진' WHERE LOWER(title || ' ' || summary) LIKE '%언리얼엔진%'
    UNION SELECT 'Unreal Engine' WHERE LOWER(title || ' ' || summary) LIKE '%unreal engine%'
    UNION SELECT 'Unity' WHERE LOWER(title || ' ' || summary) LIKE '%unity%'
    UNION SELECT '유니티' WHERE LOWER(title || ' ' || summary) LIKE '%유니티%'
    UNION SELECT 'AI' WHERE LOWER(title || ' ' || summary) LIKE '%ai%'
    UNION SELECT '인공지능' WHERE LOWER(title || ' ' || summary) LIKE '%인공지능%'
    UNION SELECT '메타버스' WHERE LOWER(title || ' ' || summary) LIKE '%메타버스%'
    UNION SELECT 'VR' WHERE LOWER(title || ' ' || summary) LIKE '%vr%'
    UNION SELECT 'AR' WHERE LOWER(title || ' ' || summary) LIKE '%ar%'
    UNION SELECT 'NFT' WHERE LOWER(title || ' ' || summary) LIKE '%nft%'
    UNION SELECT '블록체인' WHERE LOWER(title || ' ' || summary) LIKE '%블록체인%'
    -- 장르
    UNION SELECT 'MMORPG' WHERE LOWER(title || ' ' || summary) LIKE '%mmorpg%'
    UNION SELECT 'RPG' WHERE LOWER(title || ' ' || summary) LIKE '%rpg%'
    UNION SELECT 'FPS' WHERE LOWER(title || ' ' || summary) LIKE '%fps%'
    UNION SELECT 'AOS' WHERE LOWER(title || ' ' || summary) LIKE '%aos%'
    UNION SELECT 'MOBA' WHERE LOWER(title || ' ' || summary) LIKE '%moba%'
    UNION SELECT '배틀로얄' WHERE LOWER(title || ' ' || summary) LIKE '%배틀로얄%'
    UNION SELECT '시뮬레이션' WHERE LOWER(title || ' ' || summary) LIKE '%시뮬레이션%'
    UNION SELECT '전략' WHERE LOWER(title || ' ' || summary) LIKE '%전략%'
    UNION SELECT '액션' WHERE LOWER(title || ' ' || summary) LIKE '%액션%'
    UNION SELECT '어드벤처' WHERE LOWER(title || ' ' || summary) LIKE '%어드벤처%'
  ) keywords
)
WHERE tags IS NULL OR tags = '[]'::jsonb;

-- 2. posts_pending 테이블의 기존 뉴스에 태그 추출
UPDATE posts_pending
SET tags = (
  SELECT jsonb_agg(DISTINCT keyword)
  FROM (
    -- 회사명
    SELECT '넥슨' as keyword WHERE LOWER(title || ' ' || summary) LIKE '%넥슨%'
    UNION SELECT '엔씨소프트' WHERE LOWER(title || ' ' || summary) LIKE '%엔씨소프트%'
    UNION SELECT 'NC소프트' WHERE LOWER(title || ' ' || summary) LIKE '%nc소프트%'
    UNION SELECT '크래프톤' WHERE LOWER(title || ' ' || summary) LIKE '%크래프톤%'
    UNION SELECT '펄어비스' WHERE LOWER(title || ' ' || summary) LIKE '%펄어비스%'
    UNION SELECT '넷마블' WHERE LOWER(title || ' ' || summary) LIKE '%넷마블%'
    UNION SELECT '컴투스' WHERE LOWER(title || ' ' || summary) LIKE '%컴투스%'
    UNION SELECT '스마일게이트' WHERE LOWER(title || ' ' || summary) LIKE '%스마일게이트%'
    UNION SELECT '카카오게임즈' WHERE LOWER(title || ' ' || summary) LIKE '%카카오게임즈%'
    UNION SELECT '위메이드' WHERE LOWER(title || ' ' || summary) LIKE '%위메이드%'
    UNION SELECT '블리자드' WHERE LOWER(title || ' ' || summary) LIKE '%블리자드%'
    UNION SELECT '라이엇게임즈' WHERE LOWER(title || ' ' || summary) LIKE '%라이엇게임즈%'
    UNION SELECT '밸브' WHERE LOWER(title || ' ' || summary) LIKE '%밸브%'
    UNION SELECT '에픽게임즈' WHERE LOWER(title || ' ' || summary) LIKE '%에픽게임즈%'
    -- 게임명
    UNION SELECT '리니지' WHERE LOWER(title || ' ' || summary) LIKE '%리니지%'
    UNION SELECT '메이플스토리' WHERE LOWER(title || ' ' || summary) LIKE '%메이플스토리%'
    UNION SELECT '던전앤파이터' WHERE LOWER(title || ' ' || summary) LIKE '%던전앤파이터%'
    UNION SELECT '배틀그라운드' WHERE LOWER(title || ' ' || summary) LIKE '%배틀그라운드%'
    UNION SELECT 'PUBG' WHERE LOWER(title || ' ' || summary) LIKE '%pubg%'
    UNION SELECT '검은사막' WHERE LOWER(title || ' ' || summary) LIKE '%검은사막%'
    UNION SELECT '로스트아크' WHERE LOWER(title || ' ' || summary) LIKE '%로스트아크%'
    UNION SELECT '오버워치' WHERE LOWER(title || ' ' || summary) LIKE '%오버워치%'
    UNION SELECT '리그오브레전드' WHERE LOWER(title || ' ' || summary) LIKE '%리그오브레전드%'
    UNION SELECT 'LOL' WHERE LOWER(title || ' ' || summary) LIKE '%lol%'
    UNION SELECT '카트라이더' WHERE LOWER(title || ' ' || summary) LIKE '%카트라이더%'
    UNION SELECT '서든어택' WHERE LOWER(title || ' ' || summary) LIKE '%서든어택%'
    UNION SELECT '피파온라인' WHERE LOWER(title || ' ' || summary) LIKE '%피파온라인%'
    -- 기술/엔진
    UNION SELECT '언리얼엔진' WHERE LOWER(title || ' ' || summary) LIKE '%언리얼엔진%'
    UNION SELECT 'Unreal Engine' WHERE LOWER(title || ' ' || summary) LIKE '%unreal engine%'
    UNION SELECT 'Unity' WHERE LOWER(title || ' ' || summary) LIKE '%unity%'
    UNION SELECT '유니티' WHERE LOWER(title || ' ' || summary) LIKE '%유니티%'
    UNION SELECT 'AI' WHERE LOWER(title || ' ' || summary) LIKE '%ai%'
    UNION SELECT '인공지능' WHERE LOWER(title || ' ' || summary) LIKE '%인공지능%'
    UNION SELECT '메타버스' WHERE LOWER(title || ' ' || summary) LIKE '%메타버스%'
    UNION SELECT 'VR' WHERE LOWER(title || ' ' || summary) LIKE '%vr%'
    UNION SELECT 'AR' WHERE LOWER(title || ' ' || summary) LIKE '%ar%'
    UNION SELECT 'NFT' WHERE LOWER(title || ' ' || summary) LIKE '%nft%'
    UNION SELECT '블록체인' WHERE LOWER(title || ' ' || summary) LIKE '%블록체인%'
    -- 장르
    UNION SELECT 'MMORPG' WHERE LOWER(title || ' ' || summary) LIKE '%mmorpg%'
    UNION SELECT 'RPG' WHERE LOWER(title || ' ' || summary) LIKE '%rpg%'
    UNION SELECT 'FPS' WHERE LOWER(title || ' ' || summary) LIKE '%fps%'
    UNION SELECT 'AOS' WHERE LOWER(title || ' ' || summary) LIKE '%aos%'
    UNION SELECT 'MOBA' WHERE LOWER(title || ' ' || summary) LIKE '%moba%'
    UNION SELECT '배틀로얄' WHERE LOWER(title || ' ' || summary) LIKE '%배틀로얄%'
    UNION SELECT '시뮬레이션' WHERE LOWER(title || ' ' || summary) LIKE '%시뮬레이션%'
    UNION SELECT '전략' WHERE LOWER(title || ' ' || summary) LIKE '%전략%'
    UNION SELECT '액션' WHERE LOWER(title || ' ' || summary) LIKE '%액션%'
    UNION SELECT '어드벤처' WHERE LOWER(title || ' ' || summary) LIKE '%어드벤처%'
  ) keywords
)
WHERE tags IS NULL OR tags = '[]'::jsonb;

-- 업데이트된 행 수 확인
SELECT 
  (SELECT COUNT(*) FROM posts WHERE tags IS NOT NULL AND tags != '[]'::jsonb) as posts_with_tags,
  (SELECT COUNT(*) FROM posts_pending WHERE tags IS NOT NULL AND tags != '[]'::jsonb) as pending_with_tags;
