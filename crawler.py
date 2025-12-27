#!/usr/bin/env python3
"""
게임 뉴스 크롤러 (검수 시스템 적용)
RSS 피드에서 게임 관련 뉴스를 가져와 Supabase의 posts_pending 테이블에 저장합니다.
검수 후 승인되면 posts 테이블로 이동됩니다.
"""

import os
import re
import feedparser
import requests
from difflib import SequenceMatcher
from supabase import create_client, Client
from datetime import datetime
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()

# Supabase 클라이언트 초기화
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
DISCORD_WEBHOOK_URL = os.getenv("DISCORD_WEBHOOK_URL")  # Optional

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment variables")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# RSS 피드 목록 (한국 게임 뉴스만)
RSS_FEEDS = [
    # 한국 게임 뉴스 (Google News)
    {
        "url": "https://news.google.com/rss/search?q=게임산업+OR+넥슨+OR+엔씨소프트+OR+크래프톤+when:1d&hl=ko&gl=KR&ceid=KR:ko",
        "category": "Industry",
        "name": "게임 산업 (Industry)"
    },
    {
        "url": "https://news.google.com/rss/search?q=게임개발+OR+언리얼엔진+OR+인디게임+when:1d&hl=ko&gl=KR&ceid=KR:ko",
        "category": "Dev",
        "name": "게임 개발 (Dev)"
    },
]

def clean_title(title: str) -> str:
    """
    Google News 제목에서 출처(Publisher) 부분을 제거합니다.
    예: "기사 제목 - 언론사명" -> "기사 제목"
    """
    if not title:
        return ""
    
    # " - 언론사명" 패턴 제거
    if " - " in title:
        parts = title.rsplit(" - ", 1)
        title = parts[0].strip()
    
    return title

def clean_summary(text: str, max_length: int = 200) -> str:
    """요약 텍스트를 정리하고 길이를 제한합니다."""
    if not text:
        return ""
    
    # HTML 태그 제거
    text = re.sub(r'<[^>]+>', '', text)
    
    # 공백 정리
    text = ' '.join(text.split())
    
    # 길이 제한
    if len(text) > max_length:
        text = text[:max_length] + "..."
    
    return text

def calculate_similarity(text1: str, text2: str) -> float:
    """
    두 텍스트의 유사도를 계산합니다 (0.0 ~ 1.0).
    0.8 이상이면 매우 유사한 것으로 판단합니다.
    """
    if not text1 or not text2:
        return 0.0
    
    # 소문자로 변환하고 공백 정리
    text1 = ' '.join(text1.lower().split())
    text2 = ' '.join(text2.lower().split())
    
    # SequenceMatcher로 유사도 계산
    return SequenceMatcher(None, text1, text2).ratio()

def extract_tags(text: str) -> list:
    """
    텍스트에서 주요 키워드(태그)를 추출합니다.
    회사명, 게임명, 기술 키워드 등을 자동으로 감지합니다.
    """
    if not text:
        return []
    
    tags = []
    text_lower = text.lower()
    
    # 회사명 키워드
    companies = [
        '넥슨', '엔씨소프트', 'NC소프트', '크래프톤', '펄어비스', 
        '넷마블', '컴투스', '스마일게이트', '카카오게임즈', '위메이드',
        '블리자드', '라이엇게임즈', '밸브', '에픽게임즈'
    ]
    
    # 게임명 키워드
    games = [
        '리니지', '메이플스토리', '던전앤파이터', '배틀그라운드', 'PUBG',
        '검은사막', '로스트아크', '오버워치', '리그오브레전드', 'LOL',
        '카트라이더', '서든어택', '피파온라인'
    ]
    
    # 기술/엔진 키워드
    tech = [
        '언리얼엔진', 'Unreal Engine', 'Unity', '유니티',
        'AI', '인공지능', '메타버스', 'VR', 'AR', 'NFT', '블록체인'
    ]
    
    # 장르 키워드
    genres = [
        'MMORPG', 'RPG', 'FPS', 'AOS', 'MOBA', 
        '배틀로얄', '시뮬레이션', '전략', '액션', '어드벤처'
    ]
    
    # 모든 키워드 리스트 합치기
    all_keywords = companies + games + tech + genres
    
    # 텍스트에서 키워드 찾기
    for keyword in all_keywords:
        if keyword.lower() in text_lower:
            # 중복 방지
            if keyword not in tags:
                tags.append(keyword)
    
    return tags

def is_spam(text: str) -> bool:
    """
    스팸/저품질 뉴스인지 판단합니다.
    블랙리스트 키워드가 포함되어 있으면 True를 반환합니다.
    """
    if not text:
        return False
    
    text_lower = text.lower()
    
    # 스팸 키워드 블랙리스트
    spam_keywords = [
        # 광고성
        '할인', '쿠폰', '이벤트 참여', '경품', '프로모션',
        # 클릭베이트
        '충격', '놀라운', '반전', '대박', '실화',
        # 관련 없는 내용
        '날씨', '주식', '부동산', '정치',
        # 성인/도박
        '카지노', '도박', '성인',
        # 불법 코인/캄보디아 관련
        '캄보디아', '코인', '가상화폐', '암호화폐', '비트코인',
        '불법', '사기', '먹튀', '환전', '온라인카지노',
        '베팅', '토토', '슬롯', '바카라', '포커',
        '투자사기', '다단계', 'P2E', '리니지W코인',
    ]
    
    # 블랙리스트 키워드 체크
    for keyword in spam_keywords:
        if keyword in text_lower:
            return True
    
    return False

def send_discord_notification(stats: dict, error: str = None):
    """
    Discord 웹훅으로 크롤링 결과를 전송합니다.
    
    Args:
        stats: 크롤링 통계 정보 딕셔너리
        error: 에러 메시지 (선택적)
    """
    if not DISCORD_WEBHOOK_URL:
        return  # 웹훅 URL이 없으면 조용히 스킵
    
    try:
        # 성공/실패에 따라 색상 결정
        color = 0xFF0000 if error else 0x00FF00  # 빨강(에러) 또는 초록(성공)
        
        # 임베드 메시지 구성
        embed = {
            "title": "🎮 게임 뉴스 크롤러 실행 완료" if not error else "❌ 크롤러 실행 실패",
            "color": color,
            "timestamp": datetime.utcnow().isoformat(),
            "fields": []
        }
        
        if error:
            # 에러 발생 시
            embed["fields"].append({
                "name": "❌ 에러",
                "value": f"```{error[:1000]}```",
                "inline": False
            })
        else:
            # 정상 실행 시 통계 정보
            embed["fields"] = [
                {
                    "name": "✅ 새 기사",
                    "value": f"**{stats.get('added', 0)}개**",
                    "inline": True
                },
                {
                    "name": "⏭️ 중복 스킵",
                    "value": f"{stats.get('skipped', 0)}개",
                    "inline": True
                },
                {
                    "name": "🚫 스팸 차단",
                    "value": f"{stats.get('spam', 0)}개",
                    "inline": True
                },
                {
                    "name": "📊 총 처리",
                    "value": f"{stats.get('total_processed', 0)}개",
                    "inline": True
                },
                {
                    "name": "🏷️ 태그 생성",
                    "value": f"{stats.get('total_tags', 0)}개",
                    "inline": True
                },
                {
                    "name": "⏱️ 소요 시간",
                    "value": f"{stats.get('duration', 0):.1f}초",
                    "inline": True
                }
            ]
            
            # 상위 태그 정보 추가 (있는 경우)
            if stats.get('top_tags'):
                top_tags_str = ", ".join([f"`{tag}`" for tag in stats['top_tags'][:10]])
                embed["fields"].append({
                    "name": "🔥 주요 태그",
                    "value": top_tags_str,
                    "inline": False
                })
        
        # 푸터 추가
        embed["footer"] = {
            "text": f"실행 시간: {stats.get('timestamp', datetime.now().strftime('%Y-%m-%d %H:%M:%S'))}"
        }
        
        # Discord 웹훅으로 전송
        payload = {
            "embeds": [embed]
        }
        
        response = requests.post(DISCORD_WEBHOOK_URL, json=payload, timeout=10)
        response.raise_for_status()
        
        print("\n📨 Discord 알림 전송 완료!")
        
    except Exception as e:
        print(f"\n⚠️  Discord 알림 전송 실패: {str(e)}")
        # 알림 실패는 크롤러 전체 실패로 이어지지 않도록 조용히 처리

def fetch_and_store_news():
    """RSS 피드에서 뉴스를 가져와 Supabase의 posts_pending 테이블에 저장합니다."""
    start_time = datetime.now()
    total_added = 0
    total_skipped = 0
    total_spam = 0
    total_tags_count = 0
    all_tags = []
    
    print(f"🚀 Starting news crawler at {start_time}")
    
    for feed_info in RSS_FEEDS:
        print(f"\n📰 Fetching from {feed_info['name']}...")
        
        try:
            feed = feedparser.parse(feed_info['url'])
            
            if feed.bozo:
                print(f"⚠️  Warning: Feed parsing error for {feed_info['name']}")
            
            for entry in feed.entries[:10]:  # 최근 10개만 가져오기
                try:
                    # 원본 데이터 추출
                    raw_title = entry.get('title', 'No Title')
                    link = entry.get('link', '')
                    raw_summary = entry.get('summary', entry.get('description', ''))
                    
                    if not link:
                        print(f"  ⏭️  Skipping entry without link: {raw_title}")
                        continue
                    
                    # 제목 정리 (Google News의 경우 출처 제거)
                    title = clean_title(raw_title)
                    
                    # 요약 정리
                    summary = clean_summary(raw_summary)
                    
                    # 태그 추출 (제목 + 요약에서)
                    tags = extract_tags(f"{title} {summary}")
                    
                    # 스팸 필터링 체크
                    spam_check_text = f"{title} {summary}"
                    is_spam_content = is_spam(spam_check_text)
                    
                    # 스팸 카운트
                    if is_spam_content:
                        total_spam += 1
                    
                    # 카테고리 설정
                    category = feed_info['category']
                    
                    # 중복 확인 (정확한 일치 + 유사도 체크)
                    # 1. 정확한 일치 확인 (제목 + 링크)
                    existing_pending = supabase.table('posts_pending').select('id')\
                        .eq('title', title)\
                        .eq('original_link', link)\
                        .execute()
                    
                    existing_published = supabase.table('posts').select('id')\
                        .eq('title', title)\
                        .eq('original_link', link)\
                        .execute()
                    
                    if existing_pending.data or existing_published.data:
                        print(f"  ⏭️  Already exists (exact match): {title[:50]}...")
                        total_skipped += 1
                        continue
                    
                    # 2. 유사도 체크 (제목만 비교, 80% 이상 유사하면 중복으로 간주)
                    # 최근 100개 뉴스와 비교
                    recent_pending = supabase.table('posts_pending').select('title')\
                        .order('created_at', desc=True)\
                        .limit(100)\
                        .execute()
                    
                    recent_published = supabase.table('posts').select('title')\
                        .order('created_at', desc=True)\
                        .limit(100)\
                        .execute()
                    
                    is_similar = False
                    similarity_threshold = 0.8  # 80% 이상 유사하면 중복
                    
                    # pending 뉴스와 비교
                    for existing in recent_pending.data:
                        similarity = calculate_similarity(title, existing['title'])
                        if similarity >= similarity_threshold:
                            print(f"  ⏭️  Similar to existing ({similarity:.0%}): {title[:50]}...")
                            print(f"      Existing: {existing['title'][:50]}...")
                            is_similar = True
                            break
                    
                    # published 뉴스와 비교
                    if not is_similar:
                        for existing in recent_published.data:
                            similarity = calculate_similarity(title, existing['title'])
                            if similarity >= similarity_threshold:
                                print(f"  ⏭️  Similar to published ({similarity:.0%}): {title[:50]}...")
                                print(f"      Existing: {existing['title'][:50]}...")
                                is_similar = True
                                break
                    
                    if is_similar:
                        total_skipped += 1
                        continue
                    
                    # posts_pending 테이블에 저장
                    # 스팸이면 자동으로 rejected 상태로 저장
                    data = {
                        'title': title,
                        'summary': summary or '요약 정보가 없습니다.',
                        'original_link': link,
                        'category': category,
                        'tags': tags,  # 자동 추출된 태그
                        'status': 'rejected' if is_spam_content else 'pending',
                        'review_note': '스팸 필터링: 블랙리스트 키워드 감지' if is_spam_content else None
                    }
                    
                    result = supabase.table('posts_pending').insert(data).execute()
                    
                    if result.data:
                        tags_str = f" [Tags: {', '.join(tags)}]" if tags else ""
                        status_str = " [🚫 SPAM - Auto-rejected]" if is_spam_content else ""
                        print(f"  ✅ Added to pending: {title[:50]}... [{category}]{tags_str}{status_str}")
                        total_added += 1
                        
                        # 태그 통계 수집
                        if tags:
                            total_tags_count += len(tags)
                            all_tags.extend(tags)
                    else:
                        print(f"  ❌ Failed to add: {title[:50]}...")
                        
                except Exception as e:
                    print(f"  ❌ Error processing entry: {str(e)}")
                    continue
                    
        except Exception as e:
            print(f"❌ Error fetching feed {feed_info['name']}: {str(e)}")
            continue
    
    # 실행 시간 계산
    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()
    
    print(f"\n✨ Crawler finished!")
    print(f"📊 Summary: {total_added} added, {total_skipped} skipped, {total_spam} spam blocked")
    
    # 상위 태그 추출 (빈도순)
    from collections import Counter
    tag_counter = Counter(all_tags)
    top_tags = [tag for tag, count in tag_counter.most_common(10)]
    
    # 통계 정보 구성
    stats = {
        'added': total_added,
        'skipped': total_skipped,
        'spam': total_spam,
        'total_processed': total_added + total_skipped,
        'total_tags': total_tags_count,
        'top_tags': top_tags,
        'duration': duration,
        'timestamp': start_time.strftime('%Y-%m-%d %H:%M:%S')
    }
    
    return stats

if __name__ == "__main__":
    try:
        stats = fetch_and_store_news()
        
        # Discord 알림 전송
        send_discord_notification(stats)
        
        print(f"\n🎉 Success! Added {stats['added']} new posts.")
    except Exception as e:
        error_msg = str(e)
        print(f"\n💥 Fatal error: {error_msg}")
        
        # 에러 발생 시에도 Discord 알림 전송
        send_discord_notification(
            {'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')},
            error=error_msg
        )
        
        exit(1)
