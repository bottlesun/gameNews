"use client";

import { useState } from "react";
import { approvePost, rejectPost } from "@/lib/actions/review-actions";
import { ExternalLink, Check, X } from "lucide-react";

interface PendingPost {
  id: string;
  title: string;
  summary: string;
  original_link: string;
  category: string;
  created_at: string;
  status: string;
}

interface PendingPostCardProps {
  post: PendingPost;
  onUpdate: () => void;
}

export function PendingPostCard({ post, onUpdate }: PendingPostCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApprove = async () => {
    setIsProcessing(true);
    const result = await approvePost(post.id);
    if (result.success) {
      onUpdate();
    } else {
      alert("승인 실패: " + result.error);
    }
    setIsProcessing(false);
  };

  const handleReject = async () => {
    setIsProcessing(true);
    const result = await rejectPost(post.id);
    if (result.success) {
      onUpdate();
    } else {
      alert("거부 실패: " + result.error);
    }
    setIsProcessing(false);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Industry: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      Dev: "bg-green-500/10 text-green-500 border-green-500/20",
      "Game Developer": "bg-purple-500/10 text-purple-500 border-purple-500/20",
      "GamesIndustry.biz":
        "bg-orange-500/10 text-orange-500 border-orange-500/20",
      Polygon: "bg-pink-500/10 text-pink-500 border-pink-500/20",
    };
    return (
      colors[category] || "bg-gray-500/10 text-gray-500 border-gray-500/20"
    );
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      pending: { label: "대기중", color: "bg-yellow-500/10 text-yellow-500" },
      approved: { label: "승인됨", color: "bg-green-500/10 text-green-500" },
      rejected: { label: "거부됨", color: "bg-red-500/10 text-red-500" },
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`px-2 py-1 rounded text-xs font-medium border ${getCategoryColor(
              post.category
            )}`}
          >
            {post.category}
          </span>
          {getStatusBadge(post.status)}
        </div>
        <a
          href={post.original_link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-primary transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      <h3 className="font-semibold text-lg mb-2 line-clamp-2">{post.title}</h3>
      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
        {post.summary}
      </p>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {new Date(post.created_at).toLocaleDateString("ko-KR", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>

        {post.status === "pending" && (
          <div className="flex gap-2">
            <button
              onClick={handleApprove}
              disabled={isProcessing}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="h-4 w-4" />
              승인
            </button>
            <button
              onClick={handleReject}
              disabled={isProcessing}
              className="flex items-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="h-4 w-4" />
              거부
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
