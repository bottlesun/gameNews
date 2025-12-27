-- 스팸 키워드가 포함된 뉴스 삭제
-- Supabase SQL Editor에서 실행하세요

-- 1. posts 테이블에서 스팸 키워드 포함 뉴스 삭제
DELETE FROM posts
WHERE 
  -- 불법 코인/캄보디아 관련
  LOWER(title) LIKE '%캄보디아%' OR LOWER(summary) LIKE '%캄보디아%' OR
  LOWER(title) LIKE '%코인%' OR LOWER(summary) LIKE '%코인%' OR
  LOWER(title) LIKE '%가상화폐%' OR LOWER(summary) LIKE '%가상화폐%' OR
  LOWER(title) LIKE '%암호화폐%' OR LOWER(summary) LIKE '%암호화폐%' OR
  LOWER(title) LIKE '%비트코인%' OR LOWER(summary) LIKE '%비트코인%' OR
  LOWER(title) LIKE '%불법%' OR LOWER(summary) LIKE '%불법%' OR
  LOWER(title) LIKE '%사기%' OR LOWER(summary) LIKE '%사기%' OR
  LOWER(title) LIKE '%먹튀%' OR LOWER(summary) LIKE '%먹튀%' OR
  LOWER(title) LIKE '%환전%' OR LOWER(summary) LIKE '%환전%' OR
  LOWER(title) LIKE '%온라인카지노%' OR LOWER(summary) LIKE '%온라인카지노%' OR
  -- 불법 도박 관련
  LOWER(title) LIKE '%베팅%' OR LOWER(summary) LIKE '%베팅%' OR
  LOWER(title) LIKE '%토토%' OR LOWER(summary) LIKE '%토토%' OR
  LOWER(title) LIKE '%슬롯%' OR LOWER(summary) LIKE '%슬롯%' OR
  LOWER(title) LIKE '%바카라%' OR LOWER(summary) LIKE '%바카라%' OR
  LOWER(title) LIKE '%포커%' OR LOWER(summary) LIKE '%포커%' OR
  LOWER(title) LIKE '%투자사기%' OR LOWER(summary) LIKE '%투자사기%' OR
  LOWER(title) LIKE '%다단계%' OR LOWER(summary) LIKE '%다단계%' OR
  LOWER(title) LIKE '%p2e%' OR LOWER(summary) LIKE '%p2e%' OR
  LOWER(title) LIKE '%리니지w코인%' OR LOWER(summary) LIKE '%리니지w코인%' OR
  -- 기존 스팸 키워드
  LOWER(title) LIKE '%카지노%' OR LOWER(summary) LIKE '%카지노%' OR
  LOWER(title) LIKE '%도박%' OR LOWER(summary) LIKE '%도박%';

-- 2. posts_pending 테이블에서 스팸 키워드 포함 뉴스 삭제
DELETE FROM posts_pending
WHERE 
  -- 불법 코인/캄보디아 관련
  LOWER(title) LIKE '%캄보디아%' OR LOWER(summary) LIKE '%캄보디아%' OR
  LOWER(title) LIKE '%코인%' OR LOWER(summary) LIKE '%코인%' OR
  LOWER(title) LIKE '%가상화폐%' OR LOWER(summary) LIKE '%가상화폐%' OR
  LOWER(title) LIKE '%암호화폐%' OR LOWER(summary) LIKE '%암호화폐%' OR
  LOWER(title) LIKE '%비트코인%' OR LOWER(summary) LIKE '%비트코인%' OR
  LOWER(title) LIKE '%불법%' OR LOWER(summary) LIKE '%불법%' OR
  LOWER(title) LIKE '%사기%' OR LOWER(summary) LIKE '%사기%' OR
  LOWER(title) LIKE '%먹튀%' OR LOWER(summary) LIKE '%먹튀%' OR
  LOWER(title) LIKE '%환전%' OR LOWER(summary) LIKE '%환전%' OR
  LOWER(title) LIKE '%온라인카지노%' OR LOWER(summary) LIKE '%온라인카지노%' OR
  -- 불법 도박 관련
  LOWER(title) LIKE '%베팅%' OR LOWER(summary) LIKE '%베팅%' OR
  LOWER(title) LIKE '%토토%' OR LOWER(summary) LIKE '%토토%' OR
  LOWER(title) LIKE '%슬롯%' OR LOWER(summary) LIKE '%슬롯%' OR
  LOWER(title) LIKE '%바카라%' OR LOWER(summary) LIKE '%바카라%' OR
  LOWER(title) LIKE '%포커%' OR LOWER(summary) LIKE '%포커%' OR
  LOWER(title) LIKE '%투자사기%' OR LOWER(summary) LIKE '%투자사기%' OR
  LOWER(title) LIKE '%다단계%' OR LOWER(summary) LIKE '%다단계%' OR
  LOWER(title) LIKE '%p2e%' OR LOWER(summary) LIKE '%p2e%' OR
  LOWER(title) LIKE '%리니지w코인%' OR LOWER(summary) LIKE '%리니지w코인%' OR
  -- 기존 스팸 키워드
  LOWER(title) LIKE '%카지노%' OR LOWER(summary) LIKE '%카지노%' OR
  LOWER(title) LIKE '%도박%' OR LOWER(summary) LIKE '%도박%';

-- 삭제된 행 수 확인
-- posts 테이블과 posts_pending 테이블에서 각각 몇 개가 삭제되었는지 확인하세요
