"use server";

import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/rbac";
import type { AccessMode } from "@/lib/types";

export type SubmissionStatus = "pending" | "approved" | "rejected";

export async function updateSubmissionStatus(
  submissionId: string,
  status: SubmissionStatus
) {
  const canManage = await hasPermission("reports.manage");
  if (!canManage) {
    return { error: "Non autorizzato" };
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("repeater_submissions")
    .update({ status })
    .eq("id", submissionId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function deleteSubmission(submissionId: string) {
  const canManage = await hasPermission("reports.manage");
  if (!canManage) {
    return { error: "Non autorizzato" };
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("repeater_submissions")
    .delete()
    .eq("id", submissionId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

interface SubmissionAccess {
  mode: string;
  ctcss_tx_hz?: number | null;
  ctcss_rx_hz?: number | null;
  dcs_code?: number | null;
  color_code?: number | null;
  talkgroup?: number | null;
  dg_id?: number | null;
  node_id?: number | null;
  network_name?: string | null;
  notes?: string | null;
}

export async function approveAndCreateRepeater(
  submissionId: string,
  repeaterFields: {
    callsign?: string | null;
    name?: string | null;
    frequency_hz: number;
    shift_hz?: number | null;
    region?: string | null;
    province_code?: string | null;
    locality?: string | null;
    lat?: number | null;
    lon?: number | null;
    locator?: string | null;
  },
  accesses: SubmissionAccess[]
) {
  const canWrite = await hasPermission("repeaters.write");
  if (!canWrite) return { error: "Non autorizzato" };

  const supabase = await createClient();

  // 1. Crea il ripetitore
  const { data: repeater, error: repError } = await supabase
    .from("repeaters")
    .insert({
      callsign: repeaterFields.callsign ?? null,
      name: repeaterFields.name ?? null,
      frequency_hz: repeaterFields.frequency_hz,
      shift_hz: repeaterFields.shift_hz ?? null,
      region: repeaterFields.region ?? null,
      province_code: repeaterFields.province_code ?? null,
      locality: repeaterFields.locality ?? null,
      lat: repeaterFields.lat ?? null,
      lon: repeaterFields.lon ?? null,
      locator: repeaterFields.locator ?? null,
      source: "submission",
    })
    .select("id")
    .single();

  if (repError || !repeater) {
    return { error: repError?.message ?? "Errore creazione ripetitore" };
  }

  // 2. Risolvi network_name → network_id e crea accessi
  for (const access of accesses) {
    let networkId: string | null = null;

    if (access.network_name) {
      const { data: network } = await supabase
        .from("networks")
        .select("id")
        .eq("name", access.network_name)
        .single();
      networkId = network?.id ?? null;
    }

    await supabase.from("repeater_access").insert({
      repeater_id: repeater.id,
      mode: access.mode as AccessMode,
      ctcss_tx_hz: access.ctcss_tx_hz ?? null,
      ctcss_rx_hz: access.ctcss_rx_hz ?? null,
      dcs_code: access.dcs_code ?? null,
      color_code: access.color_code ?? null,
      talkgroup: access.talkgroup ?? null,
      dg_id: access.dg_id ?? null,
      node_id: access.node_id ?? null,
      network_id: networkId,
      notes: access.notes ?? null,
      source: "submission",
    });
  }

  // 3. Aggiorna status della submission
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from("repeater_submissions")
    .update({ status: "approved" })
    .eq("id", submissionId);

  return { success: true, repeaterId: repeater.id };
}
