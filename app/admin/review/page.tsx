"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { deletePost } from "@/lib/actions/delete-actions";
import { Loader2, Lock, Trash2, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

interface Post {
  id: string;
  title: string;
  summary: string;
  original_link: string;
  category: string;
  tags: string[];
  created_at: string;
}

const categoryColors: Record<string, string> = {
  Industry: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  Dev: "bg-green-500/10 text-green-500 border-green-500/20",
};

export default function AdminManagePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Check if already authenticated
  useEffect(() => {
    const auth = sessionStorage.getItem("admin_auth");
    if (auth === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  // Fetch posts when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchPosts();
    }
  }, [isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

    if (password === adminPassword) {
      setIsAuthenticated(true);
      sessionStorage.setItem("admin_auth", "true");
    } else {
      alert("비밀번호가 틀렸습니다");
      setPassword("");
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("admin_auth");
    setPassword("");
  };

  const handleDelete = async (postId: string, title: string) => {
    if (
      !confirm(
        `"${title}" 게시물을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`
      )
    ) {
      return;
    }

    setDeletingId(postId);
    const result = await deletePost(postId);

    if (result.success) {
      await fetchPosts();
    } else {
      alert(`삭제 실패: ${result.error}`);
    }

    setDeletingId(null);
  };

  // Login form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-lg p-8 w-full max-w-md">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">관리자 로그인</h1>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-2"
              >
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="w-full px-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground py-2 rounded-md font-medium hover:bg-primary/90 transition-colors"
            >
              로그인
            </button>
          </form>
          <p className="text-xs text-muted-foreground mt-4">
            환경변수 NEXT_PUBLIC_ADMIN_PASSWORD로 비밀번호를 설정하세요
          </p>
        </div>
      </div>
    );
  }

  // Admin manage page
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">게시물 관리</h1>
            <p className="text-muted-foreground">
              게시된 뉴스를 관리하고 삭제할 수 있습니다
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-md text-sm font-medium transition-colors"
          >
            로그아웃
          </button>
        </div>

        {/* Stats */}
        <div className="mb-6 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            총 <span className="font-bold text-foreground">{posts.length}</span>
            개의 게시물
          </p>
        </div>

        {/* Posts list */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">게시물이 없습니다</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {posts
                .slice(
                  (currentPage - 1) * itemsPerPage,
                  currentPage * itemsPerPage
                )
                .map((post) => {
                  const timeAgo = formatDistanceToNow(
                    new Date(post.created_at),
                    {
                      addSuffix: true,
                      locale: ko,
                    }
                  );

                  return (
                    <div
                      key={post.id}
                      className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {/* Title and Link */}
                          <div className="flex items-start gap-2 mb-2">
                            <a
                              href={post.original_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 text-base font-semibold hover:text-primary transition-colors line-clamp-2"
                            >
                              {post.title}
                            </a>
                            <a
                              href={post.original_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-shrink-0"
                            >
                              <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                            </a>
                          </div>

                          {/* Summary */}
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {post.summary}
                          </p>

                          {/* Tags and Meta */}
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              variant="outline"
                              className={
                                categoryColors[post.category] ||
                                "bg-gray-500/10 text-gray-500"
                              }
                            >
                              {post.category}
                            </Badge>
                            {post.tags && post.tags.length > 0 && (
                              <>
                                {post.tags.slice(0, 3).map((tag, index) => (
                                  <Badge
                                    key={index}
                                    variant="secondary"
                                    className="text-xs bg-primary/10 text-primary border-primary/20"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                                {post.tags.length > 3 && (
                                  <span className="text-xs text-muted-foreground">
                                    +{post.tags.length - 3}
                                  </span>
                                )}
                              </>
                            )}
                            <span className="text-xs text-muted-foreground">
                              · {timeAgo}
                            </span>
                          </div>
                        </div>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDelete(post.id, post.title)}
                          disabled={deletingId === post.id}
                          className="flex-shrink-0 p-2 text-red-500 hover:bg-red-500/10 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="삭제"
                        >
                          {deletingId === post.id ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Trash2 className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Pagination */}
            {posts.length > itemsPerPage && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
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
                          <span className="px-2 text-muted-foreground">
                            ...
                          </span>
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
                  disabled={
                    currentPage === Math.ceil(posts.length / itemsPerPage)
                  }
                  className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
