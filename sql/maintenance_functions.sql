-- ========================================
-- Supabase SQL Functions for Database Maintenance
-- ========================================
-- 이 파일의 SQL 함수들을 Supabase SQL Editor에서 실행하세요.
-- Dashboard > SQL Editor > New query 에서 실행

-- ========================================
-- 1. 배치 삭제 함수
-- ========================================
-- 오래된 포스트를 배치 단위로 점진적으로 삭제합니다.

CREATE OR REPLACE FUNCTION delete_old_posts_batch(
  months_old INTEGER DEFAULT 6,
  batch_size INTEGER DEFAULT 1000
)
RETURNS TABLE(deleted_count INTEGER) AS $$
DECLARE
  total_deleted INTEGER := 0;
  rows_deleted INTEGER;
BEGIN
  LOOP
    -- 배치 단위로 삭제
    DELETE FROM posts
    WHERE id IN (
      SELECT id FROM posts
      WHERE created_at < NOW() - (months_old || ' months')::INTERVAL
      LIMIT batch_size
    );

    GET DIAGNOSTICS rows_deleted = ROW_COUNT;
    total_deleted := total_deleted + rows_deleted;

    -- 더 이상 삭제할 행이 없으면 종료
    EXIT WHEN rows_deleted = 0;

    -- 잠시 대기 (데이터베이스 부하 감소)
    PERFORM pg_sleep(0.1);
  END LOOP;

  RETURN QUERY SELECT total_deleted;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 2. 데이터베이스 용량 확인 함수
-- ========================================
-- 데이터베이스 사용량을 확인하고 알림 레벨을 반환합니다.

CREATE OR REPLACE FUNCTION check_database_size()
RETURNS TABLE(
  total_size_mb NUMERIC,
  posts_size_mb NUMERIC,
  usage_percent NUMERIC,
  alert_level TEXT
) AS $$
DECLARE
  max_size_mb CONSTANT NUMERIC := 500;  -- 무료 티어 제한
  total_bytes BIGINT;
  posts_bytes BIGINT;
BEGIN
  -- 전체 데이터베이스 크기
  SELECT pg_database_size(current_database()) INTO total_bytes;

  -- posts 테이블 크기
  SELECT pg_total_relation_size('posts') INTO posts_bytes;

  RETURN QUERY
  SELECT
    ROUND(total_bytes / 1024.0 / 1024.0, 2) as total_size_mb,
    ROUND(posts_bytes / 1024.0 / 1024.0, 2) as posts_size_mb,
    ROUND((total_bytes / 1024.0 / 1024.0 / max_size_mb) * 100, 2) as usage_percent,
    CASE
      WHEN (total_bytes / 1024.0 / 1024.0) >= max_size_mb * 0.9 THEN '🔴 CRITICAL'
      WHEN (total_bytes / 1024.0 / 1024.0) >= max_size_mb * 0.8 THEN '🟠 WARNING'
      WHEN (total_bytes / 1024.0 / 1024.0) >= max_size_mb * 0.6 THEN '🟡 CAUTION'
      ELSE '🟢 OK'
    END as alert_level;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 사용 예시
-- ========================================

-- 용량 확인
-- SELECT * FROM check_database_size();

-- 6개월 이상 된 포스트를 1000개씩 삭제
-- SELECT delete_old_posts_batch(6, 1000);

-- 3개월 이상 된 포스트를 500개씩 삭제
-- SELECT delete_old_posts_batch(3, 500);
