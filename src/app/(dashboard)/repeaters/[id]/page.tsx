import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RepeaterDetail } from "./repeater-detail";
import type { RepeaterAccessWithNetwork } from "@/lib/types";

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
    { data: reports },
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
      .from("repeater_reports")
      .select("*")
      .eq("repeater_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!repeater) notFound();

  const accesses: RepeaterAccessWithNetwork[] = (accessRows ?? []).map(
    (a) => {
      const { networks, ...access } = a;
      return { ...access, network: networks ?? null } as unknown as RepeaterAccessWithNetwork;
    }
  );

  return (
    <RepeaterDetail
      repeater={repeater}
      accesses={accesses}
      feedbackStats={feedbackStats}
      reports={reports ?? []}
    />
  );
}
