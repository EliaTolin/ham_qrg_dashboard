"use server";

import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/rbac";

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
