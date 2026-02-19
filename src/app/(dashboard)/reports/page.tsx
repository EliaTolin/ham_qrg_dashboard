import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/rbac";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ReportFilters } from "./report-filters";
import type { ReportStatus } from "@/lib/types";

const STATUS_CLASSES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700",
  reviewed: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700",
  resolved: "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700",
  rejected: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700",
};

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const role = await getUserRole();
  if (role !== "admin" && role !== "bridge_manager") {
    redirect("/");
  }

  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("repeater_reports")
    .select(
      "*, repeaters(id, callsign, name, frequency_hz, locality), profiles!repeater_reports_profile_fk(first_name, last_name, callsign)"
    )
    .order("created_at", { ascending: false });

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status as ReportStatus);
  }

  const { data: rawReports, error } = await query;
  console.log("[DEBUG reports]", { count: rawReports?.length, error });

  const STATUS_ORDER: Record<string, number> = {
    pending: 0,
    reviewed: 1,
    resolved: 2,
    rejected: 3,
  };

  const reports = rawReports?.slice().sort((a, b) => {
    const sa = STATUS_ORDER[a.status] ?? 9;
    const sb = STATUS_ORDER[b.status] ?? 9;
    if (sa !== sb) return sa - sb;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="space-y-4">
      <ReportFilters />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Repeater</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Reported by</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports?.map((report) => {
              const rep = report.repeaters as unknown as {
                id: string;
                callsign: string | null;
                name: string | null;
                frequency_hz: number;
                locality: string | null;
              } | null;
              const reporter = report.profiles as unknown as {
                first_name: string | null;
                last_name: string | null;
                callsign: string | null;
              } | null;
              return (
                <TableRow key={report.id} className="group relative cursor-pointer">
                  <TableCell className="font-mono font-medium">
                    <Link
                      href={rep ? `/repeaters/${rep.id}` : `/reports/${report.id}`}
                      className="absolute inset-0"
                    >
                      <span className="sr-only">Vai al ripetitore</span>
                    </Link>
                    {rep?.callsign ?? rep?.name ?? "—"}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {report.description}
                  </TableCell>
                  <TableCell>
                    {reporter?.callsign ??
                      ([reporter?.first_name, reporter?.last_name]
                        .filter(Boolean)
                        .join(" ") || "—")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={STATUS_CLASSES[report.status]}>
                      {report.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(report.created_at).toLocaleDateString("it-IT")}
                  </TableCell>
                </TableRow>
              );
            })}
            {(!reports || reports.length === 0) && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No reports found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
