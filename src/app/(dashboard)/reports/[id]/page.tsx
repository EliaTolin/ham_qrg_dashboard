import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserRole, hasPermission } from "@/lib/rbac";
import { ReportDetail } from "./report-detail";
import type { Repeater, Profile, RepeaterAccessWithNetwork, Network } from "@/lib/types";

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
      "*, repeaters(*), profiles!repeater_reports_profile_fk(first_name, last_name, callsign), closer:profiles!repeater_reports_closed_by_profile_fk(first_name, last_name, callsign)"
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

  const closedBy = (report as unknown as { closer: typeof reporter }).closer;

  let accesses: RepeaterAccessWithNetwork[] = [];
  let networks: Network[] = [];

  if (repeater) {
    const [{ data: accessRows }, { data: networkRows }] = await Promise.all([
      supabase
        .from("repeater_access")
        .select("*, networks(*)")
        .eq("repeater_id", repeater.id),
      supabase.from("networks").select("*").order("name"),
    ]);

    accesses = (accessRows ?? []).map((a) => {
      const { networks, ...access } = a;
      return { ...access, network: networks ?? null } as unknown as RepeaterAccessWithNetwork;
    });
    networks = (networkRows ?? []) as Network[];
  }

  return (
    <ReportDetail
      report={report}
      repeater={repeater}
      reporter={reporter}
      closedBy={closedBy}
      canManage={canManage}
      canEdit={canEdit}
      accesses={accesses}
      networks={networks}
    />
  );
}
