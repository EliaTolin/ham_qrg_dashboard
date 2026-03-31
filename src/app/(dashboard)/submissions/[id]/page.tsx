import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserRole, hasPermission } from "@/lib/rbac";
import { SubmissionDetail } from "./submission-detail";

export default async function SubmissionPage({
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: submission } = await (supabase as any)
    .from("repeater_submissions")
    .select(
      "*, profiles!repeater_submissions_user_id_profile_fk(first_name, last_name, callsign)"
    )
    .eq("id", id)
    .single();

  if (!submission) {
    notFound();
  }

  const canManage = await hasPermission("reports.manage");
  const canWrite = await hasPermission("repeaters.write");

  const { data: networks } = await supabase
    .from("networks")
    .select("*")
    .order("name");

  return (
    <SubmissionDetail
      submission={submission}
      reporter={
        submission.profiles as {
          first_name: string | null;
          last_name: string | null;
          callsign: string | null;
        } | null
      }
      canManage={canManage}
      canWrite={canWrite}
      networks={networks ?? []}
    />
  );
}
