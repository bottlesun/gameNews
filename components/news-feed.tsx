"use client";

import { useEffect, useState } from "react";
import { PostCard } from "@/components/post-card";
import { PostWithUpvotes, Post } from "@/lib/types/database";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export function NewsFeed() {
  const [posts, setPosts] = useState<PostWithUpvotes[]>([]);
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
        // 현재 사용자 확인
        const {
          data: { user },
        } = await supabase.auth.getUser();

        // 포스트 가져오기
        const { data: postsData, error: postsError } = await supabase
          .from("posts")
          .select("*")
          .order("created_at", { ascending: false });

        if (postsError) throw postsError;

        // 각 포스트의 업보트 수 가져오기
        const postsWithUpvotes: PostWithUpvotes[] = await Promise.all(
          (postsData || []).map(async (post: Post) => {
            // 업보트 수 계산
            const { count } = await supabase
              .from("upvotes")
              .select("*", { count: "exact", head: true })
              .eq("post_id", post.id);

            // 사용자가 업보트했는지 확인
            let userHasUpvoted = false;
            if (user) {
              const { data: upvoteData } = await supabase
                .from("upvotes")
                .select("*")
                .eq("post_id", post.id)
                .eq("user_id", user.id)
                .single();

              userHasUpvoted = !!upvoteData;
            }

            return {
              ...post,
              upvote_count: count || 0,
              user_has_upvoted: userHasUpvoted,
            };
          })
        );

        setPosts(postsWithUpvotes);
      } catch (err) {
        console.error("포스트 로딩 오류:", err);
        setError("포스트를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, []);

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
