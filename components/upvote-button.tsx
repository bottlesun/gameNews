"use client";

import { useState } from "react";
import { ArrowBigUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface UpvoteButtonProps {
  postId: string;
  initialCount: number;
  initialUpvoted: boolean;
}

export function UpvoteButton({
  postId,
  initialCount,
  initialUpvoted,
}: UpvoteButtonProps) {
  const [count, setCount] = useState(initialCount);
  const [upvoted, setUpvoted] = useState(initialUpvoted);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handleUpvote = async () => {
    setIsLoading(true);

    try {
      // 사용자 인증 확인
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("업보트하려면 로그인이 필요합니다.");
        setIsLoading(false);
        return;
      }

      if (upvoted) {
        // 업보트 취소
        const { error } = await supabase
          .from("upvotes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);

        if (error) throw error;

        setCount(count - 1);
        setUpvoted(false);
      } else {
        // 업보트 추가
        const { error } = await supabase
          .from("upvotes")
          .insert({ post_id: postId, user_id: user.id });

        if (error) throw error;

        setCount(count + 1);
        setUpvoted(true);
      }
    } catch (error) {
      console.error("업보트 오류:", error);
      alert("업보트 처리 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={upvoted ? "default" : "outline"}
      size="sm"
      onClick={handleUpvote}
      disabled={isLoading}
      className={cn(
        "gap-1",
        upvoted && "bg-orange-500 hover:bg-orange-600 text-white"
      )}
    >
      <ArrowBigUp className={cn("h-4 w-4", upvoted && "fill-current")} />
      <span className="font-semibold">{count}</span>
    </Button>
  );
}
