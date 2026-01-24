#!/usr/bin/env python3
"""
아카이브된 CSV 파일에서 데이터를 복원하는 스크립트

사용법:
    python scripts/restore_archive.py <csv_file>

예시:
    python scripts/restore_archive.py archives/posts_archive_20240124.csv

환경 변수:
    SUPABASE_URL: Supabase 프로젝트 URL
    SUPABASE_KEY: Supabase service_role 키
"""
import csv
import os
import sys
from supabase import create_client

def restore_from_archive(csv_file):
    """CSV 파일에서 데이터 복원"""
    
    # 파일 존재 확인
    if not os.path.exists(csv_file):
        print(f"❌ 파일을 찾을 수 없습니다: {csv_file}")
        return 0
    
    # Supabase 클라이언트
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ 환경 변수를 설정해주세요: SUPABASE_URL, SUPABASE_KEY")
        return 0
    
    supabase = create_client(supabase_url, supabase_key)
    
    print(f"📂 파일 읽기: {csv_file}")
    
    # CSV 파일 읽기
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        posts = list(reader)
    
    if not posts:
        print("📭 복원할 데이터가 없습니다.")
        return 0
    
    print(f"📊 총 {len(posts)}개 포스트 복원 시작...")
    
    # 배치로 삽입 (1000개씩)
    batch_size = 1000
    restored_count = 0
    
    for i in range(0, len(posts), batch_size):
        batch = posts[i:i + batch_size]
        
        try:
            # upsert로 중복 방지
            supabase.table('posts').upsert(batch, on_conflict='original_link').execute()
            restored_count += len(batch)
            print(f"✅ {restored_count}/{len(posts)} 복원 완료")
        except Exception as e:
            print(f"⚠️  배치 {i//batch_size + 1} 복원 실패: {e}")
            continue
    
    print(f"\n🎉 총 {restored_count}개 포스트 복원 완료")
    return restored_count

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("사용법: python scripts/restore_archive.py <csv_file>")
        print("\n예시:")
        print("  python scripts/restore_archive.py archives/posts_archive_20240124.csv")
        sys.exit(1)
    
    csv_file = sys.argv[1]
    
    try:
        count = restore_from_archive(csv_file)
        if count > 0:
            print(f"\n💡 팁: 데이터베이스 용량을 확인하세요:")
            print(f"   python scripts/check_db_capacity.py")
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        exit(1)
