#!/usr/bin/env python3
"""
오래된 포스트를 점진적으로 삭제하는 스크립트

사용법:
    python scripts/cleanup_old_posts.py

환경 변수:
    SUPABASE_URL: Supabase 프로젝트 URL
    SUPABASE_KEY: Supabase service_role 키
    CLEANUP_MONTHS: 삭제할 개월 수 (기본값: 6)
    BATCH_SIZE: 배치 크기 (기본값: 1000)
"""
import os
import time
from datetime import datetime, timedelta
from supabase import create_client

# 설정
CLEANUP_MONTHS = int(os.getenv("CLEANUP_MONTHS", "6"))  # 6개월 이상 된 데이터 삭제
BATCH_SIZE = int(os.getenv("BATCH_SIZE", "1000"))       # 한 번에 삭제할 개수
SLEEP_SECONDS = 1                                        # 배치 간 대기 시간

def cleanup_old_posts():
    """오래된 포스트를 점진적으로 삭제"""
    
    # Supabase 클라이언트
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ 환경 변수를 설정해주세요: SUPABASE_URL, SUPABASE_KEY")
        return 0
    
    supabase = create_client(supabase_url, supabase_key)
    
    cutoff_date = (datetime.now() - timedelta(days=CLEANUP_MONTHS * 30)).isoformat()
    total_deleted = 0
    
    print(f"🗑️  정리 시작...")
    print(f"📅 기준 날짜: {cutoff_date} ({CLEANUP_MONTHS}개월 전)")
    print(f"📦 배치 크기: {BATCH_SIZE}개")
    
    while True:
        # 배치 단위로 조회
        result = supabase.table('posts')\
            .select('id')\
            .lt('created_at', cutoff_date)\
            .limit(BATCH_SIZE)\
            .execute()
        
        posts = result.data
        
        if not posts:
            break
        
        # 배치 삭제
        ids = [post['id'] for post in posts]
        supabase.table('posts').delete().in_('id', ids).execute()
        
        total_deleted += len(posts)
        print(f"✅ {total_deleted}개 삭제 완료...")
        
        # 대기 (데이터베이스 부하 감소)
        if len(posts) == BATCH_SIZE:
            time.sleep(SLEEP_SECONDS)
        else:
            break
    
    print(f"\n🎉 정리 완료: 총 {total_deleted}개 포스트 삭제")
    return total_deleted

if __name__ == "__main__":
    try:
        count = cleanup_old_posts()
        if count > 0:
            print(f"💡 팁: 데이터베이스 용량을 확인하세요:")
            print(f"   python scripts/check_db_capacity.py")
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        exit(1)
