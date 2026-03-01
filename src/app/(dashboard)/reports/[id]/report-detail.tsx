"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Radio, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ReportStatusSelect } from "../report-status-select";
import { RepeaterEditForm } from "../../repeaters/[id]/repeater-edit-form";
import type { RepeaterReport, Repeater, Profile, ReportStatus } from "@/lib/types";

const STATUS_CLASSES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700",
  reviewed: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700",
  resolved: "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700",
  rejected: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700",
};

interface ReportDetailProps {
  report: RepeaterReport;
  repeater: Repeater | null;
  reporter: Pick<Profile, "first_name" | "last_name" | "callsign"> | null;
  canManage: boolean;
  canEdit: boolean;
}

export function ReportDetail({
  report,
  repeater,
  reporter,
  canManage,
  canEdit,
}: ReportDetailProps) {
  const reporterName =
    reporter?.callsign ??
    ([reporter?.first_name, reporter?.last_name].filter(Boolean).join(" ") ||
    "Unknown");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/reports">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Report #{report.id.slice(0, 8)}</h1>
          <Badge variant="outline" className={STATUS_CLASSES[report.status]}>
            {report.status}
          </Badge>
        </div>
      </div>

      {/* Report card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Segnalazione</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Descrizione report */}
          <div className="rounded-md bg-muted/50 p-4">
            <p className="whitespace-pre-wrap leading-relaxed">{report.description}</p>
          </div>

          <Separator />

          {/* Metadata */}
          <div className="flex flex-wrap gap-x-8 gap-y-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Segnalato da</p>
              <p className="mt-0.5">{reporterName}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Creato il</p>
              <p className="mt-0.5">{new Date(report.created_at).toLocaleString("it-IT")}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Aggiornato il</p>
              <p className="mt-0.5">{new Date(report.updated_at).toLocaleString("it-IT")}</p>
            </div>
          </div>

          {/* Gestione stato */}
          {canManage && (
            <>
              <Separator />
              <div>
                <p className="mb-2 text-sm font-medium text-muted-foreground">
                  Cambia stato
                </p>
                <ReportStatusSelect
                  reportId={report.id}
                  currentStatus={report.status as ReportStatus}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Repeater edit form */}
      {repeater && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Radio className="h-4 w-4" />
              Ponte di riferimento
            </h2>
            <Button asChild variant="outline" size="sm">
              <Link href={`/repeaters/${repeater.id}`}>
                Vai al repeater
                <ExternalLink className="ml-2 h-3 w-3" />
              </Link>
            </Button>
          </div>
          <RepeaterEditForm repeater={repeater} canEdit={canEdit} />
        </div>
      )}
    </div>
  );
}