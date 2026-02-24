"use server";

import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/rbac";
import type { AccessMode } from "@/lib/types";

export interface UpdateRepeaterFields {
  callsign?: string | null;
  name?: string | null;
  manager?: string | null;
  frequency_hz?: number;
  shift_hz?: number | null;
  locality?: string | null;
  region?: string | null;
  province_code?: string | null;
  locator?: string | null;
}

export async function updateRepeater(
  repeaterId: string,
  fields: UpdateRepeaterFields
) {
  const canWrite = await hasPermission("repeaters.write");
  if (!canWrite) {
    return { error: "Non autorizzato" };
  }

  if (fields.frequency_hz != null && fields.frequency_hz <= 0) {
    return { error: "La frequenza deve essere maggiore di 0" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("repeaters")
    .update(fields)
    .eq("id", repeaterId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

// --- Repeater Access CRUD ---

export interface AccessFields {
  mode: string;
  network_id?: string | null;
  color_code?: number | null;
  ctcss_rx_hz?: number | null;
  ctcss_tx_hz?: number | null;
  dcs_code?: number | null;
  dg_id?: number | null;
  node_id?: number | null;
  talkgroup?: number | null;
  notes?: string | null;
}

export async function createAccess(repeaterId: string, fields: AccessFields) {
  const canWrite = await hasPermission("repeaters.write");
  if (!canWrite) return { error: "Non autorizzato" };

  const supabase = await createClient();
  const { error } = await supabase.from("repeater_access").insert({
    repeater_id: repeaterId,
    mode: fields.mode as AccessMode,
    network_id: fields.network_id ?? null,
    color_code: fields.color_code ?? null,
    ctcss_rx_hz: fields.ctcss_rx_hz ?? null,
    ctcss_tx_hz: fields.ctcss_tx_hz ?? null,
    dcs_code: fields.dcs_code ?? null,
    dg_id: fields.dg_id ?? null,
    node_id: fields.node_id ?? null,
    talkgroup: fields.talkgroup ?? null,
    notes: fields.notes ?? null,
    source: "dashboard",
  });

  if (error) return { error: error.message };
  return { success: true };
}

export async function updateAccess(accessId: string, fields: AccessFields) {
  const canWrite = await hasPermission("repeaters.write");
  if (!canWrite) return { error: "Non autorizzato" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("repeater_access")
    .update({
      mode: fields.mode as AccessMode,
      network_id: fields.network_id ?? null,
      color_code: fields.color_code ?? null,
      ctcss_rx_hz: fields.ctcss_rx_hz ?? null,
      ctcss_tx_hz: fields.ctcss_tx_hz ?? null,
      dcs_code: fields.dcs_code ?? null,
      dg_id: fields.dg_id ?? null,
      node_id: fields.node_id ?? null,
      talkgroup: fields.talkgroup ?? null,
      notes: fields.notes ?? null,
    })
    .eq("id", accessId);

  if (error) return { error: error.message };
  return { success: true };
}

export async function deleteAccess(accessId: string) {
  const canDelete = await hasPermission("repeaters.write");
  if (!canDelete) return { error: "Non autorizzato" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("repeater_access")
    .delete()
    .eq("id", accessId);

  if (error) return { error: error.message };
  return { success: true };
}
