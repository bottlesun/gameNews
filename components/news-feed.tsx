"use client";

import { useEffect, useState } from "react";
import { PostCard } from "@/components/post-card";
import { Post } from "@/lib/types/database";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

interface NewsFeedProps {
  category?: string | null;
}

export function NewsFeed({ category }: NewsFeedProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
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
        setLoading(true);

        // Build query
        let query = supabase
          .from("posts")
          .select("*")
          .order("created_at", { ascending: false });

        // Apply category filter if provided
        if (category && category !== "all") {
          query = query.eq("category", category);
        }

        const { data: postsData, error: postsError } = await query;

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
  }, [hasSupabaseConfig, category]);

  // Reset to page 1 when category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [category]);

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
    <>
      <div className="space-y-4">
        {posts
          .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
          .map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
      </div>

      {/* Pagination */}
      {posts.length > itemsPerPage && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            이전
          </button>

          <div className="flex items-center gap-1">
            {Array.from(
              { length: Math.ceil(posts.length / itemsPerPage) },
              (_, i) => i + 1
            )
              .filter((page) => {
                const totalPages = Math.ceil(posts.length / itemsPerPage);
                return (
                  page === 1 ||
                  page === totalPages ||
                  Math.abs(page - currentPage) <= 1
                );
              })
              .map((page, index, array) => (
                <div key={page} className="flex items-center">
                  {index > 0 && array[index - 1] !== page - 1 && (
                    <span className="px-2 text-muted-foreground">...</span>
                  )}
                  <button
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      currentPage === page
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    {page}
                  </button>
                </div>
              ))}
          </div>

          <button
            onClick={() =>
              setCurrentPage((prev) =>
                Math.min(Math.ceil(posts.length / itemsPerPage), prev + 1)
              )
            }
            disabled={currentPage === Math.ceil(posts.length / itemsPerPage)}
            className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            다음
          </button>
        </div>
      )}
    </>
  );
}
