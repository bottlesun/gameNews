#!/usr/bin/env python3
"""
오래된 포스트를 CSV로 아카이빙하는 스크립트

사용법:
    python scripts/archive_old_posts.py

환경 변수:
    SUPABASE_URL: Supabase 프로젝트 URL
    SUPABASE_KEY: Supabase service_role 키
"""
import os
import csv
from datetime import datetime, timedelta
from supabase import create_client

# 설정
ARCHIVE_MONTHS = int(os.getenv("ARCHIVE_MONTHS", "6"))  # 6개월 이상 된 데이터 아카이빙
ARCHIVE_DIR = "archives"

def archive_old_posts():
    """오래된 포스트를 CSV로 저장"""
    
    # Supabase 클라이언트
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ 환경 변수를 설정해주세요: SUPABASE_URL, SUPABASE_KEY")
        return 0
    
    supabase = create_client(supabase_url, supabase_key)
    
    # 아카이브 디렉토리 생성
    os.makedirs(ARCHIVE_DIR, exist_ok=True)
    
    # 아카이빙 기준 날짜
    cutoff_date = (datetime.now() - timedelta(days=ARCHIVE_MONTHS * 30)).isoformat()
    
    print(f"📦 아카이빙 시작...")
    print(f"📅 기준 날짜: {cutoff_date} ({ARCHIVE_MONTHS}개월 전)")
    
    # 오래된 포스트 조회
    result = supabase.table('posts')\
        .select('*')\
        .lt('created_at', cutoff_date)\
        .order('created_at', desc=True)\
        .execute()
    
    posts = result.data
    
    if not posts:
        print("📭 아카이빙할 포스트가 없습니다.")
        return 0
    
    # CSV 파일명
    filename = f"{ARCHIVE_DIR}/posts_archive_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    
    # CSV로 저장
    with open(filename, 'w', newline='', encoding='utf-8') as f:
        if posts:
            writer = csv.DictWriter(f, fieldnames=posts[0].keys())
            writer.writeheader()
            writer.writerows(posts)
    
    file_size_kb = os.path.getsize(filename) / 1024
    
    print(f"✅ {len(posts)}개 포스트를 아카이빙했습니다")
    print(f"📄 파일: {filename}")
    print(f"📊 크기: {file_size_kb:.2f} KB")
    
    return len(posts)

if __name__ == "__main__":
    try:
        count = archive_old_posts()
        print(f"\n🎉 아카이빙 완료: {count}개 포스트")
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        exit(1)
