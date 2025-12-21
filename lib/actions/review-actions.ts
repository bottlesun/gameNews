"use server";

import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

/**
 * Service Role 클라이언트 생성 (RLS 우회)
 */
function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  // 크롤러와 같은 키 사용 (Service Role Key)
  const supabaseServiceKey = process.env.SUPABASE_KEY!;

  if (!supabaseServiceKey) {
    throw new Error("SUPABASE_KEY is required in .env.local");
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

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
    // Service Role 클라이언트 사용 (RLS 우회)
    const supabase = createServiceClient();

    // 1. posts_pending에서 데이터 가져오기
    const { data: pending, error: fetchError } = await supabase
      .from("posts_pending")
      .select("*")
      .eq("id", pendingId)
      .single();

    if (fetchError) {
      console.error("Fetch error:", fetchError);
      return {
        success: false,
        error: `Failed to fetch: ${fetchError.message}`,
      };
    }

    if (!pending) {
      return { success: false, error: "Pending post not found" };
    }

    console.log("Pending post data:", pending);

    // 2. posts 테이블에 삽입 (Service Role로 RLS 우회)
    const insertData = {
      title: pending.title,
      summary: pending.summary,
      original_link: pending.original_link,
      category: pending.category,
    };

    console.log("Attempting to insert:", insertData);

    const { data: insertedData, error: insertError } = await supabase
      .from("posts")
      .insert(insertData);

    if (insertError) {
      console.error("Insert error details:", {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code,
      });
      return {
        success: false,
        error: `Insert failed: ${insertError.message} (${insertError.code})${
          insertError.hint ? ` - Hint: ${insertError.hint}` : ""
        }`,
      };
    }

    console.log("Successfully inserted:", insertedData);

    // 3. posts_pending 상태 업데이트
    const { error: updateError } = await supabase
      .from("posts_pending")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", pendingId);

    if (updateError) {
      console.error("Update error:", updateError);
      return {
        success: false,
        error: `Failed to update status: ${updateError.message}`,
      };
    }

    revalidatePath("/");
    revalidatePath("/admin/review");

    return { success: true };
  } catch (error) {
    console.error("Unexpected error approving post:", error);
    return { success: false, error: `Unexpected error: ${String(error)}` };
  }
}

/**
 * 대기 중인 포스트를 거부
 */
export async function rejectPost(pendingId: string, note?: string) {
  try {
    const supabase = createServiceClient();

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
 * 여러 포스트를 일괄 승인 (최적화된 버전 - 한 번의 트랜잭션)
 */
export async function bulkApprove(pendingIds: string[]) {
  try {
    if (pendingIds.length === 0) {
      return { success: false, error: "No posts selected" };
    }

    const supabase = createServiceClient();

    // 1. 모든 pending 포스트 가져오기
    const { data: pendingPosts, error: fetchError } = await supabase
      .from("posts_pending")
      .select("*")
      .in("id", pendingIds)
      .eq("status", "pending");

    if (fetchError) {
      console.error("Bulk fetch error:", fetchError);
      return {
        success: false,
        error: `Failed to fetch posts: ${fetchError.message}`,
      };
    }

    if (!pendingPosts || pendingPosts.length === 0) {
      return { success: false, error: "No pending posts found" };
    }

    console.log(`Bulk approving ${pendingPosts.length} posts`);

    // 2. posts 테이블에 일괄 삽입
    const postsToInsert = pendingPosts.map((pending) => ({
      title: pending.title,
      summary: pending.summary,
      original_link: pending.original_link,
      category: pending.category,
    }));

    const { error: insertError } = await supabase
      .from("posts")
      .insert(postsToInsert);

    if (insertError) {
      console.error("Bulk insert error:", insertError);
      return {
        success: false,
        error: `Bulk insert failed: ${insertError.message} (${insertError.code})`,
      };
    }

    // 3. posts_pending 상태 일괄 업데이트
    const { error: updateError } = await supabase
      .from("posts_pending")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
      })
      .in("id", pendingIds);

    if (updateError) {
      console.error("Bulk update error:", updateError);
      return {
        success: false,
        error: `Failed to update status: ${updateError.message}`,
      };
    }

    console.log(`Successfully approved ${pendingPosts.length} posts`);

    revalidatePath("/");
    revalidatePath("/admin/review");

    return {
      success: true,
      count: pendingPosts.length,
    };
  } catch (error) {
    console.error("Unexpected error in bulk approve:", error);
    return { success: false, error: `Unexpected error: ${String(error)}` };
  }
}
