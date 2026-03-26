"use server";

import { createClient } from "@/lib/supabase/server";
import { hasPermission, getUserRole } from "@/lib/rbac";
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

export async function approvePendingChange(changeId: string) {
  const canReview = await hasPermission("sync.review");
  if (!canReview) return { error: "Non autorizzato" };

  const supabase = await createClient();

  // 1) Fetch the pending change
  const { data: change, error: fetchErr } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", changeId)
    .single();

  if (fetchErr || !change) {
    return { error: fetchErr?.message ?? "Modifica non trovata" };
  }

  const pc = change as unknown as SyncPendingChange;
  if (pc.status !== "pending") {
    return { error: "Questa modifica è già stata gestita" };
  }

  // 2) Apply the change based on type
  const applyResult = await applyChange(supabase, pc);
  if (applyResult.error) return applyResult;

  // 3) Mark as approved
  const { data: { user } } = await supabase.auth.getUser();
  const { error: updateErr } = await supabase
    .from(TABLE)
    .update({
      status: "approved",
      reviewed_by: user?.id,
      reviewed_at: new Date().toISOString(),
    } as never)
    .eq("id", changeId);

  if (updateErr) return { error: updateErr.message };

  return { success: true };
}

export async function rejectPendingChange(changeId: string) {
  const canReview = await hasPermission("sync.review");
  if (!canReview) return { error: "Non autorizzato" };

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase
    .from(TABLE)
    .update({
      status: "rejected",
      reviewed_by: user?.id,
      reviewed_at: new Date().toISOString(),
    } as never)
    .eq("id", changeId)
    .eq("status", "pending");

  if (error) return { error: error.message };

  return { success: true };
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

// --- Private helpers ---

// deno-lint-ignore no-explicit-any
async function applyChange(supabase: any, pc: SyncPendingChange) {
  const remoteData = pc.remote_data;

  switch (pc.change_type) {
    case "deactivate": {
      if (!pc.repeater_id) return { error: "repeater_id mancante per deactivate" };
      const { error } = await supabase
        .from("repeaters")
        .update({ is_active: false })
        .eq("id", pc.repeater_id);
      if (error) return { error: error.message };
      return { success: true };
    }

    case "reactivate": {
      if (!pc.repeater_id) return { error: "repeater_id mancante per reactivate" };
      const { error } = await supabase
        .from("repeaters")
        .update({ is_active: true })
        .eq("id", pc.repeater_id);
      if (error) return { error: error.message };
      return { success: true };
    }

    case "update": {
      if (!pc.repeater_id) return { error: "repeater_id mancante per update" };
      // Apply only the changed fields from the diff
      const updates: Record<string, unknown> = {};
      for (const [field, values] of Object.entries(pc.diff)) {
        updates[field] = values.remote;
      }
      if (Object.keys(updates).length === 0) return { success: true };

      const { error } = await supabase
        .from("repeaters")
        .update(updates)
        .eq("id", pc.repeater_id);
      if (error) return { error: error.message };
      return { success: true };
    }

    case "new": {
      // For new repeaters, build the insert from remote_data mapped fields
      const freqHz = Math.round(parseFloat(remoteData.Frequenza as string) * 1_000_000);
      const lat = parseFloat(remoteData.Lat as string);
      const lon = parseFloat(remoteData.Long as string);
      const shiftHz = Math.round(parseFloat(remoteData.Shift as string) * 1_000_000);

      const { error } = await supabase.from("repeaters").insert({
        external_id: pc.external_id,
        name: remoteData.Ripetitore || null,
        callsign: remoteData.Identificativo || null,
        frequency_hz: freqHz,
        shift_hz: shiftHz,
        shift_raw: remoteData.Shift,
        locality: (remoteData.Localita as string)?.replace(/\n/g, " ").trim() || null,
        locator: remoteData.Locator,
        lat: isNaN(lat) ? null : lat,
        lon: isNaN(lon) ? null : lon,
        source: "iz8wnh",
        is_active: true,
        last_seen_at: new Date().toISOString(),
      });

      if (error) return { error: error.message };
      return { success: true };
    }

    default:
      return { error: `Tipo di modifica sconosciuto: ${pc.change_type}` };
  }
}
