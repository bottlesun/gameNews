import { NewsFeed } from "@/components/news-feed";
import { Gamepad2 } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
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
        </header>

        {/* News Feed */}
        <NewsFeed />
      </div>
    </div>
  );
}
