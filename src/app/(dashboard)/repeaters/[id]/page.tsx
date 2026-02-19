import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/rbac";
import { RepeaterDetail } from "./repeater-detail";
import type {
  RepeaterAccessWithNetwork,
  RepeaterFeedbackWithRelations,
  RepeaterReportWithProfile,
} from "@/lib/types";

export default async function RepeaterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: repeater },
    { data: accessRows },
    { data: feedbackStats },
    { data: feedbackRows },
    { data: reportRows },
  ] = await Promise.all([
    supabase.from("repeaters").select("*").eq("id", id).single(),
    supabase
      .from("repeater_access")
      .select("*, networks(*)")
      .eq("repeater_id", id),
    supabase
      .from("v_repeater_feedback_stats")
      .select("*")
      .eq("repeater_id", id)
      .maybeSingle(),
    supabase
      .from("repeater_feedback")
      .select("*, profiles(first_name, last_name, callsign), repeater_access(mode, network_id)")
      .eq("repeater_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("repeater_reports")
      .select("*, profiles!repeater_reports_profile_fk(first_name, last_name, callsign)")
      .eq("repeater_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!repeater) notFound();

  const [canEdit, canManageReports] = await Promise.all([
    hasPermission("repeaters.write"),
    hasPermission("reports.manage"),
  ]);

  const accesses: RepeaterAccessWithNetwork[] = (accessRows ?? []).map(
    (a) => {
      const { networks, ...access } = a;
      return { ...access, network: networks ?? null } as unknown as RepeaterAccessWithNetwork;
    }
  );

  const feedback = (feedbackRows ?? []) as unknown as RepeaterFeedbackWithRelations[];
  const reports = (reportRows ?? []) as unknown as RepeaterReportWithProfile[];

  return (
    <RepeaterDetail
      repeater={repeater}
      accesses={accesses}
      feedbackStats={feedbackStats}
      feedback={feedback}
      reports={reports}
      canEdit={canEdit}
      canManageReports={canManageReports}
    />
  );
}
