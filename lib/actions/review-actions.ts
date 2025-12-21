"use server";

import { createClient } from "@/lib/supabase/client";
import { revalidatePath } from "next/cache";

/**
 * 관리자 비밀번호 확인
 */
export async function checkAdminPassword(password: string): Promise<boolean> {
  const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
  return password === adminPassword;
}

/**
 * 대기 중인 포스트를 승인하여 posts 테이블로 이동
 */
export async function approvePost(pendingId: string) {
  try {
    const supabase = createClient();

    // 1. posts_pending에서 데이터 가져오기
    const { data: pending, error: fetchError } = await supabase
      .from("posts_pending")
      .select("*")
      .eq("id", pendingId)
      .single();

    if (fetchError || !pending) {
      throw new Error("Failed to fetch pending post");
    }

    // 2. posts 테이블에 삽입
    const { error: insertError } = await supabase.from("posts").insert({
      title: pending.title,
      summary: pending.summary,
      original_link: pending.original_link,
      category: pending.category,
    });

    if (insertError) {
      throw new Error("Failed to insert into posts table");
    }

    // 3. posts_pending 상태 업데이트
    const { error: updateError } = await supabase
      .from("posts_pending")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", pendingId);

    if (updateError) {
      throw new Error("Failed to update pending post status");
    }

    revalidatePath("/");
    revalidatePath("/admin/review");

    return { success: true };
  } catch (error) {
    console.error("Error approving post:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * 대기 중인 포스트를 거부
 */
export async function rejectPost(pendingId: string, note?: string) {
  try {
    const supabase = createClient();

    const { error } = await supabase
      .from("posts_pending")
      .update({
        status: "rejected",
        reviewed_at: new Date().toISOString(),
        review_note: note || null,
      })
      .eq("id", pendingId);

    if (error) {
      throw new Error("Failed to reject post");
    }

    revalidatePath("/admin/review");

    return { success: true };
  } catch (error) {
    console.error("Error rejecting post:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * 여러 포스트를 일괄 승인
 */
export async function bulkApprove(pendingIds: string[]) {
  const results = [];

  for (const id of pendingIds) {
    const result = await approvePost(id);
    results.push(result);
  }

  return results;
}
