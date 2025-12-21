"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PendingPostCard } from "@/components/admin/pending-post-card";
import { Loader2, Lock } from "lucide-react";

interface PendingPost {
  id: string;
  title: string;
  summary: string;
  original_link: string;
  category: string;
  created_at: string;
  status: string;
}

export default function AdminReviewPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [posts, setPosts] = useState<PendingPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("pending");

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
  }, [isAuthenticated, filter]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Simple password check (you should add NEXT_PUBLIC_ADMIN_PASSWORD to .env.local)
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
      let query = supabase
        .from("posts_pending")
        .select("*")
        .order("created_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data, error } = await query;

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

  // Admin review page
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">뉴스 검수</h1>
            <p className="text-muted-foreground">
              크롤링된 뉴스를 검토하고 승인/거부하세요
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-md text-sm font-medium transition-colors"
          >
            로그아웃
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 border-b border-border">
          {[
            { value: "pending", label: "대기중" },
            { value: "all", label: "전체" },
            { value: "approved", label: "승인됨" },
            { value: "rejected", label: "거부됨" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value as typeof filter)}
              className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                filter === tab.value
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {tab.value === "pending" &&
                posts.filter((p) => p.status === "pending").length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-primary text-primary-foreground rounded-full text-xs">
                    {posts.filter((p) => p.status === "pending").length}
                  </span>
                )}
            </button>
          ))}
        </div>

        {/* Posts list */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">검수할 뉴스가 없습니다</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {posts.map((post) => (
              <PendingPostCard
                key={post.id}
                post={post}
                onUpdate={fetchPosts}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
