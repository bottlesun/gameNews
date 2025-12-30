"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * 게시물 삭제
 * RLS 정책: USING (true) - 누구나 삭제 가능
 */
export async function deletePost(postId: string) {
  try {
    const supabase = await createClient();

    const { error } = await supabase.from("posts").delete().eq("id", postId);

    if (error) {
      console.error("Error deleting post:", error);
      return { success: false, error: error.message };
    }

    // 캐시 무효화
    revalidatePath("/");
    revalidatePath("/admin");

    return { success: true };
  } catch (error) {
    console.error("Error in deletePost:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
