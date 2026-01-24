#!/usr/bin/env python3
"""
데이터베이스 용량을 확인하고 알림을 보내는 스크립트

사용법:
    python scripts/check_db_capacity.py

환경 변수:
    SUPABASE_URL: Supabase 프로젝트 URL
    SUPABASE_KEY: Supabase service_role 키
"""
import os
from supabase import create_client

# 설정
WARNING_THRESHOLD = 80  # 80% 이상이면 경고
CRITICAL_THRESHOLD = 90  # 90% 이상이면 위험

def check_capacity():
    """데이터베이스 용량 확인"""
    
    # Supabase 클라이언트
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ 환경 변수를 설정해주세요: SUPABASE_URL, SUPABASE_KEY")
        return None
    
    supabase = create_client(supabase_url, supabase_key)
    
    try:
        # SQL 함수 호출 (check_database_size 함수가 있는 경우)
        result = supabase.rpc('check_database_size').execute()
        
        if result.data:
            data = result.data[0]
            print_capacity_report(data)
            return check_alert_level(data)
    except Exception as e:
        # 함수가 없는 경우 기본 통계만 표시
        print("⚠️  check_database_size() 함수가 없습니다.")
        print("   docs/database-maintenance.md를 참고하여 SQL 함수를 생성하세요.\n")
    
    # 기본 통계 표시
    result = supabase.table('posts').select('id', count='exact').execute()
    total_posts = result.count
    
    print("\n" + "="*50)
    print("📊 데이터베이스 기본 통계")
    print("="*50)
    print(f"총 포스트 수: {total_posts:,}개")
    print(f"예상 크기: {(total_posts * 0.6 / 1024):.2f} MB")
    print("="*50 + "\n")
    
    return "OK"

def print_capacity_report(data):
    """용량 리포트 출력"""
    print("\n" + "="*50)
    print("📊 데이터베이스 용량 리포트")
    print("="*50)
    print(f"전체 크기: {data['total_size_mb']} MB")
    print(f"Posts 테이블: {data['posts_size_mb']} MB")
    print(f"사용률: {data['usage_percent']}%")
    print(f"상태: {data['alert_level']}")
    print("="*50 + "\n")

def check_alert_level(data):
    """알림 레벨 확인 및 액션 안내"""
    usage = float(data['usage_percent'])
    
    if usage >= CRITICAL_THRESHOLD:
        print("🔴 위험: 즉시 데이터 정리가 필요합니다!")
        print("   다음 명령어를 실행하세요:")
        print("   1. python scripts/archive_old_posts.py")
        print("   2. python scripts/cleanup_old_posts.py")
        return "CRITICAL"
    
    elif usage >= WARNING_THRESHOLD:
        print("🟠 경고: 곧 데이터 정리가 필요합니다.")
        print("   1-2주 내에 정리를 계획하세요.")
        print("   python scripts/archive_old_posts.py")
        return "WARNING"
    
    elif usage >= 60:
        print("🟡 주의: 용량을 모니터링하세요.")
        print("   정기적으로 용량을 확인하세요.")
        return "CAUTION"
    
    else:
        print("🟢 정상: 용량이 충분합니다.")
        return "OK"

if __name__ == "__main__":
    try:
        status = check_capacity()
        
        # 종료 코드 설정 (GitHub Actions에서 사용)
        if status == "CRITICAL":
            exit(2)
        elif status == "WARNING":
            exit(1)
        else:
            exit(0)
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        exit(1)
