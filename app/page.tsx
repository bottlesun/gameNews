import { NewsFeed } from "@/components/news-feed";
import { CategorySidebar } from "@/components/category-sidebar";
import { Gamepad2 } from "lucide-react";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const category = params.category;

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <CategorySidebar />

        {/* Main Content */}
        <div className="flex-1">
          <div className="container max-w-4xl mx-auto px-4 py-8">
            {/* Header */}
            <header className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <Gamepad2 className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold">게임 뉴스</h1>
              </div>
              <p className="text-muted-foreground">
                게임 업계 전문가를 위한 뉴스 애그리게이터
              </p>
              {category && (
                <p className="text-sm text-primary mt-2">필터: {category}</p>
              )}
            </header>

            {/* News Feed */}
            <NewsFeed category={category} />
          </div>
        </div>
      </div>
    </div>
  );
}
