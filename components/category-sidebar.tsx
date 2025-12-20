"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Gamepad2 } from "lucide-react";

export function CategorySidebar() {
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get("category") || "all";

  useEffect(() => {
    async function fetchCategories() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.from("posts").select("category");

        if (error) throw error;

        // Get unique categories
        const uniqueCategories = Array.from(
          new Set(data?.map((post) => post.category) || [])
        ).sort();

        setCategories(uniqueCategories);
      } catch (err) {
        console.error("Error fetching categories:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  const handleCategoryClick = (category: string) => {
    if (category === "all") {
      router.push("/");
    } else {
      router.push(`/?category=${encodeURIComponent(category)}`);
    }
  };

  if (loading) {
    return (
      <aside className="w-64 border-r border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-6">
          <Gamepad2 className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-lg">카테고리</h2>
        </div>
        <div className="space-y-2">
          <div className="h-8 bg-muted animate-pulse rounded" />
          <div className="h-8 bg-muted animate-pulse rounded" />
          <div className="h-8 bg-muted animate-pulse rounded" />
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-64 border-r border-border bg-card p-6">
      <div className="flex items-center gap-2 mb-6">
        <Gamepad2 className="h-5 w-5 text-primary" />
        <h2 className="font-semibold text-lg">카테고리</h2>
      </div>

      <nav className="space-y-1">
        {/* All categories option */}
        <button
          onClick={() => handleCategoryClick("all")}
          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
            selectedCategory === "all"
              ? "bg-primary text-primary-foreground font-medium"
              : "hover:bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          전체
        </button>

        {/* Individual categories */}
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => handleCategoryClick(category)}
            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
              selectedCategory === category
                ? "bg-primary text-primary-foreground font-medium"
                : "hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {category}
          </button>
        ))}
      </nav>
    </aside>
  );
}
