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

async function invokeApply(changeId: string, action: "approve" | "reject") {
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
        action,
        user_id: user?.id,
      }),
      headers: { "Content-Type": "application/json" },
    }
  );

  if (error) return { error: error.message };
  if (data?.error) return { error: data.error };
  return { success: true };
}

export async function approvePendingChange(changeId: string) {
  return invokeApply(changeId, "approve");
}

export async function rejectPendingChange(changeId: string) {
  return invokeApply(changeId, "reject");
}

export async function bulkApprovePendingChanges(changeIds: string[]) {
  const results = await Promise.all(
    changeIds.map((id) => approvePendingChange(id))
  );
  const errors = results.filter((r) => r.error);
  if (errors.length > 0) {
    return {
      error: `${errors.length}/${changeIds.length} errori durante l'approvazione`,
      details: errors,
    };
  }
  return { success: true, count: changeIds.length };
}

export async function bulkRejectPendingChanges(changeIds: string[]) {
  const results = await Promise.all(
    changeIds.map((id) => rejectPendingChange(id))
  );
  const errors = results.filter((r) => r.error);
  if (errors.length > 0) {
    return {
      error: `${errors.length}/${changeIds.length} errori durante il rifiuto`,
      details: errors,
    };
  }
  return { success: true, count: changeIds.length };
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
