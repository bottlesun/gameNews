"use client";

import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Post } from "@/lib/types/database";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

interface PostListItemProps {
  post: Post;
}

const categoryColors: Record<string, string> = {
  "Game Developer": "bg-blue-500/10 text-blue-500 border-blue-500/20",
  "GamesIndustry.biz": "bg-green-500/10 text-green-500 border-green-500/20",
  Polygon: "bg-purple-500/10 text-purple-500 border-purple-500/20",
};

export function PostListItem({ post }: PostListItemProps) {
  const timeAgo = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
    locale: ko,
  });

  return (
    <div className="group border-b border-border hover:bg-muted/50 transition-colors">
      <a
        href={post.original_link}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-4 py-3 px-4"
      >
        {/* Title and Category */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">
              {post.title}
            </h3>
            <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-0 group-hover:opacity-50 transition-opacity" />
          </div>

          {/* Tags (max 3) */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {post.tags.slice(0, 3).map((tag, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-xs px-1.5 py-0 bg-primary/10 text-primary border-primary/20"
                >
                  {tag}
                </Badge>
              ))}
              {post.tags.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{post.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Category and Time */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <Badge
            variant="outline"
            className={
              categoryColors[post.category] || "bg-gray-500/10 text-gray-500"
            }
          >
            {post.category}
          </Badge>
          <time className="text-xs text-muted-foreground whitespace-nowrap">
            {timeAgo}
          </time>
        </div>
      </a>
    </div>
  );
}
