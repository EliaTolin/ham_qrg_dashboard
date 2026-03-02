"use server";

import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/rbac";
import type { ReportStatus } from "@/lib/types";

export async function updateReportStatus(
  reportId: string,
  status: ReportStatus,
  coordinatorResponse?: string | null
) {
  const canManage = await hasPermission("reports.manage");
  if (!canManage) {
    return { error: "Unauthorized" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("repeater_reports")
    .update({
      status,
      coordinator_response: coordinatorResponse ?? null,
    })
    .eq("id", reportId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function deleteReport(reportId: string) {
  const canManage = await hasPermission("reports.manage");
  if (!canManage) {
    return { error: "Unauthorized" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("repeater_reports")
    .delete()
    .eq("id", reportId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
