#!/usr/bin/env python3
"""
게임 뉴스 크롤러
RSS 피드에서 게임 관련 뉴스를 가져와 Supabase에 저장합니다.
"""

import os
import feedparser
from supabase import create_client, Client
from datetime import datetime
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()

# Supabase 클라이언트 초기화
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment variables")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# RSS 피드 목록 (한국 + 영문 게임 뉴스)
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
    # 영문 게임 뉴스
    {
        "url": "https://www.gamedeveloper.com/rss.xml",
        "category": "Game Developer",
        "name": "Game Developer"
    },
    {
        "url": "https://www.gamesindustry.biz/feed",
        "category": "GamesIndustry.biz",
        "name": "GamesIndustry.biz"
    },
    {
        "url": "https://www.polygon.com/rss/index.xml",
        "category": "Polygon",
        "name": "Polygon"
    },
]

def clean_summary(text: str, max_length: int = 300) -> str:
    """요약 텍스트를 정리하고 길이를 제한합니다."""
    if not text:
        return ""
    
    # HTML 태그 제거 (간단한 방법)
    import re
    text = re.sub(r'<[^>]+>', '', text)
    
    # 공백 정리
    text = ' '.join(text.split())
    
    # 길이 제한
    if len(text) > max_length:
        text = text[:max_length] + "..."
    
    return text

def fetch_and_store_news():
    """RSS 피드에서 뉴스를 가져와 Supabase에 저장합니다."""
    total_added = 0
    total_skipped = 0
    
    print(f"🚀 Starting news crawler at {datetime.now()}")
    
    for feed_info in RSS_FEEDS:
        print(f"\n📰 Fetching from {feed_info['name']}...")
        
        try:
            feed = feedparser.parse(feed_info['url'])
            
            if feed.bozo:
                print(f"⚠️  Warning: Feed parsing error for {feed_info['name']}")
            
            for entry in feed.entries[:10]:  # 최근 10개만 가져오기
                try:
                    title = entry.get('title', 'No Title')
                    link = entry.get('link', '')
                    summary = clean_summary(entry.get('summary', entry.get('description', '')))
                    
                    if not link:
                        print(f"  ⏭️  Skipping entry without link: {title}")
                        continue
                    
                    # 카테고리는 RSS 피드 출처 사용
                    category = feed_info['category']
                    
                    # 중복 확인 (같은 링크가 이미 있는지)
                    existing = supabase.table('posts').select('id').eq('original_link', link).execute()
                    
                    if existing.data:
                        print(f"  ⏭️  Already exists: {title[:50]}...")
                        total_skipped += 1
                        continue
                    
                    # Supabase에 저장
                    data = {
                        'title': title,
                        'summary': summary or '요약 정보가 없습니다.',
                        'original_link': link,
                        'category': category,
                    }
                    
                    result = supabase.table('posts').insert(data).execute()
                    
                    if result.data:
                        print(f"  ✅ Added: {title[:50]}... [{category}]")
                        total_added += 1
                    else:
                        print(f"  ❌ Failed to add: {title[:50]}...")
                        
                except Exception as e:
                    print(f"  ❌ Error processing entry: {str(e)}")
                    continue
                    
        except Exception as e:
            print(f"❌ Error fetching feed {feed_info['name']}: {str(e)}")
            continue
    
    print(f"\n✨ Crawler finished!")
    print(f"📊 Summary: {total_added} added, {total_skipped} skipped")
    
    return total_added, total_skipped

if __name__ == "__main__":
    try:
        added, skipped = fetch_and_store_news()
        print(f"\n🎉 Success! Added {added} new posts.")
    except Exception as e:
        print(f"\n💥 Fatal error: {str(e)}")
        exit(1)
