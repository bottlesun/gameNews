"use client";

import { ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Post } from "@/lib/types/database";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

interface PostCardProps {
  post: Post;
}

const categoryColors: Record<string, string> = {
  Dev: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  Business: "bg-green-500/10 text-green-500 border-green-500/20",
  Tech: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  Release: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  Esports: "bg-orange-500/10 text-orange-500 border-orange-500/20",
};

export function PostCard({ post }: PostCardProps) {
  const timeAgo = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
    locale: ko,
  });

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <a
              href={post.original_link}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 hover:text-primary transition-colors"
            >
              <h3 className="text-lg font-semibold line-clamp-2 group-hover:underline">
                {post.title}
              </h3>
              <ExternalLink className="h-4 w-4 flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>
          <Badge
            variant="outline"
            className={
              categoryColors[post.category] || "bg-gray-500/10 text-gray-500"
            }
          >
            {post.category}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed mb-3">
          {post.summary}
        </p>
        <time className="text-xs text-muted-foreground">{timeAgo}</time>
      </CardContent>
    </Card>
  );
}
