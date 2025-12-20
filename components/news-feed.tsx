"use client";

import { useEffect, useState } from "react";
import { PostCard } from "@/components/post-card";
import { Post } from "@/lib/types/database";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export function NewsFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Supabase 환경 변수 확인
  const hasSupabaseConfig =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  useEffect(() => {
    if (!hasSupabaseConfig) {
      setError(
        "Supabase 환경 변수가 설정되지 않았습니다. README.md를 참고하여 .env.local 파일을 설정해주세요."
      );
      setLoading(false);
      return;
    }

    const supabase = createClient();

    async function fetchPosts() {
      try {
        // 포스트 가져오기
        const { data: postsData, error: postsError } = await supabase
          .from("posts")
          .select("*")
          .order("created_at", { ascending: false });

        if (postsError) throw postsError;

        setPosts(postsData || []);
      } catch (err) {
        console.error("포스트 로딩 오류:", err);
        setError("포스트를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, [hasSupabaseConfig]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">아직 포스트가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
