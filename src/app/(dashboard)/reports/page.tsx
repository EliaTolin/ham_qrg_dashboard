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

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  reviewed: "secondary",
  resolved: "default",
  rejected: "destructive",
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

  const { data: reports, error } = await query;
  console.log("[DEBUG reports]", { count: reports?.length, error });

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
                      href={`/reports/${report.id}`}
                      className="absolute inset-0"
                    >
                      <span className="sr-only">Apri report</span>
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
                    <Badge variant={STATUS_VARIANT[report.status] ?? "outline"}>
                      {report.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(report.created_at).toLocaleDateString()}
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
