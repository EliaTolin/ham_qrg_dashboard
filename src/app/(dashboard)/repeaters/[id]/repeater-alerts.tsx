"use client";

import { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ReportStatusSelect } from "../../reports/report-status-select";
import type { RepeaterReportWithProfile } from "@/lib/types";

const STATUS_CLASSES: Record<string, string> = {
  pending:
    "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700",
  reviewed:
    "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700",
  resolved:
    "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700",
  rejected:
    "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatUserName(
  profile: {
    first_name: string | null;
    last_name: string | null;
    callsign: string | null;
  } | null
): string {
  if (!profile) return "Sconosciuto";
  if (profile.callsign) return profile.callsign;
  const name = [profile.first_name, profile.last_name]
    .filter(Boolean)
    .join(" ");
  return name || "Sconosciuto";
}

interface RepeaterAlertsProps {
  reports: RepeaterReportWithProfile[];
  canManage: boolean;
}

export function RepeaterAlerts({ reports, canManage }: RepeaterAlertsProps) {
  const [open, setOpen] = useState(true);

  const pendingReports = reports.filter(
    (r) => r.status === "pending" || r.status === "reviewed"
  );

  if (pendingReports.length === 0) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30">
        <CollapsibleTrigger asChild>
          <button className="flex w-full items-center gap-3 px-4 py-3 text-left">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <span className="flex-1 text-sm font-medium text-amber-800 dark:text-amber-300">
              {pendingReports.length === 1
                ? "1 segnalazione da risolvere"
                : `${pendingReports.length} segnalazioni da risolvere`}
            </span>
            {open ? (
              <ChevronUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            )}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-3 px-4 pb-4">
            {pendingReports.map((report) => (
              <div
                key={report.id}
                className="rounded-md border bg-background p-3 shadow-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className={STATUS_CLASSES[report.status]}
                  >
                    {report.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    di {formatUserName(report.profiles)}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {formatDate(report.created_at)}
                  </span>
                </div>
                <p className="mt-2 text-sm">{report.description}</p>
                {canManage && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      Stato:
                    </span>
                    <ReportStatusSelect
                      reportId={report.id}
                      currentStatus={report.status}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
