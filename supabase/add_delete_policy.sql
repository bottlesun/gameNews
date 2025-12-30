-- posts 테이블에 DELETE 정책 추가
-- Supabase SQL Editor에서 실행하세요

-- 기존 DELETE 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Authenticated users can delete posts" ON posts;
DROP POLICY IF EXISTS "Anyone can delete posts" ON posts;

-- Posts 정책: 누구나 삭제 가능 (리뷰 페이지와 동일한 권한)
CREATE POLICY "Anyone can delete posts"
  ON posts FOR DELETE
  USING (true);
