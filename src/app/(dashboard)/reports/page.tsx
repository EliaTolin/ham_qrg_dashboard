import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserRole, hasPermission } from "@/lib/rbac";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReportStatusSelect } from "./report-status-select";
import type { ReportStatus } from "@/lib/types";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  reviewed: "bg-blue-100 text-blue-800",
  resolved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const role = await getUserRole();
  if (role !== "admin" && role !== "report_manager") {
    redirect("/");
  }

  const params = await searchParams;
  const canManage = await hasPermission("reports.manage");
  const supabase = await createClient();

  let query = supabase
    .from("repeater_reports")
    .select("*, repeaters(callsign, name)")
    .order("created_at", { ascending: false });

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status as ReportStatus);
  }

  const { data: reports } = await query;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <form>
          <Select name="status" defaultValue={params.status ?? "all"}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </form>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Repeater</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              {canManage && <TableHead>Action</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports?.map((report) => {
              const rep = report.repeaters as unknown as {
                callsign: string | null;
                name: string | null;
              } | null;
              return (
                <TableRow key={report.id}>
                  <TableCell className="font-mono">
                    {rep?.callsign ?? rep?.name ?? "—"}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {report.description}
                  </TableCell>
                  <TableCell>
                    <Badge className={STATUS_COLORS[report.status]}>
                      {report.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(report.created_at).toLocaleDateString()}
                  </TableCell>
                  {canManage && (
                    <TableCell>
                      <ReportStatusSelect
                        reportId={report.id}
                        currentStatus={report.status}
                      />
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
            {(!reports || reports.length === 0) && (
              <TableRow>
                <TableCell
                  colSpan={canManage ? 5 : 4}
                  className="h-24 text-center"
                >
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
