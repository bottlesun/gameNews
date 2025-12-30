-- posts 테이블에 DELETE 정책 추가
-- Supabase SQL Editor에서 실행하세요

-- 기존 DELETE 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Authenticated users can delete posts" ON posts;

-- Posts 정책: 인증된 사용자만 삭제 가능
CREATE POLICY "Authenticated users can delete posts"
  ON posts FOR DELETE
  USING (auth.role() = 'authenticated');
