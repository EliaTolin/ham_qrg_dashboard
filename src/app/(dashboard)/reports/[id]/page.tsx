import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserRole, hasPermission } from "@/lib/rbac";
import { ReportDetail } from "./report-detail";
import type { Repeater, Profile } from "@/lib/types";

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const role = await getUserRole();
  if (role !== "admin" && role !== "bridge_manager") {
    redirect("/");
  }

  const { id } = await params;
  const supabase = await createClient();

  const { data: report } = await supabase
    .from("repeater_reports")
    .select(
      "*, repeaters(*), profiles!repeater_reports_profile_fk(first_name, last_name, callsign)"
    )
    .eq("id", id)
    .single();

  if (!report) notFound();

  const [canManage, canEdit] = await Promise.all([
    hasPermission("reports.manage"),
    hasPermission("repeaters.write"),
  ]);

  const repeater = report.repeaters as unknown as Repeater | null;

  const reporter = report.profiles as unknown as Pick<
    Profile,
    "first_name" | "last_name" | "callsign"
  > | null;

  return (
    <ReportDetail
      report={report}
      repeater={repeater}
      reporter={reporter}
      canManage={canManage}
      canEdit={canEdit}
    />
  );
}
