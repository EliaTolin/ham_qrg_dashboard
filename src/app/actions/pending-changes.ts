"use server";

import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/rbac";
import type { SyncPendingChange } from "@/lib/types";

const TABLE = "sync_pending_changes" as never;

export async function getPendingChanges(status?: string) {
  const canReview = await hasPermission("sync.review");
  if (!canReview) return { error: "Non autorizzato" };

  const supabase = await createClient();
  let query = supabase
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) return { error: error.message };

  return { data: (data ?? []) as unknown as SyncPendingChange[] };
}

async function invokeApply(
  changeId: string | undefined,
  changeIds: string[] | undefined,
  action: "approve" | "reject",
) {
  const canReview = await hasPermission("sync.review");
  if (!canReview) return { error: "Non autorizzato" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase.functions.invoke(
    "apply_pending_change",
    {
      method: "POST",
      body: JSON.stringify({
        change_id: changeId,
        change_ids: changeIds,
        action,
        user_id: user?.id,
      }),
      headers: { "Content-Type": "application/json" },
    }
  );

  if (error) return { error: error.message };
  if (data?.error) return { error: data.error };
  return { success: true, count: data?.count };
}

export async function approvePendingChange(changeId: string) {
  return invokeApply(changeId, undefined, "approve");
}

export async function rejectPendingChange(changeId: string) {
  return invokeApply(changeId, undefined, "reject");
}

export async function bulkApprovePendingChanges(changeIds: string[]) {
  return invokeApply(undefined, changeIds, "approve");
}

export async function bulkRejectPendingChanges(changeIds: string[]) {
  return invokeApply(undefined, changeIds, "reject");
}

export async function approveAllPendingChanges() {
  const canReview = await hasPermission("sync.review");
  if (!canReview) return { error: "Non autorizzato" };

  const supabase = await createClient();

  // Fetch all pending IDs (paginated)
  const allIds: string[] = [];
  let from = 0;
  const PAGE = 500;

  while (true) {
    const { data } = await supabase
      .from(TABLE)
      .select("id")
      .eq("status", "pending")
      .range(from, from + PAGE - 1);

    if (!data || data.length === 0) break;
    for (const row of data as unknown as { id: string }[]) {
      allIds.push(row.id);
    }
    if (data.length < PAGE) break;
    from += PAGE;
  }

  if (allIds.length === 0) return { success: true, count: 0 };

  // Send all IDs in one call to the edge function
  return invokeApply(undefined, allIds, "approve");
}

export async function deleteAllPendingChanges() {
  const canReview = await hasPermission("sync.review");
  if (!canReview) return { error: "Non autorizzato" };

  const supabase = await createClient();
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq("status", "pending");

  if (error) return { error: error.message };
  return { success: true };
}
