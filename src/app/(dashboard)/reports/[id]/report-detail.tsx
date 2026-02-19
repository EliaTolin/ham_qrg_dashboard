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
import { formatFrequency } from "@/lib/format";
import type { RepeaterReport, Repeater, Profile, ReportStatus } from "@/lib/types";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  reviewed: "secondary",
  resolved: "default",
  rejected: "destructive",
};

interface ReportDetailProps {
  report: RepeaterReport;
  repeater: Pick<Repeater, "id" | "callsign" | "name" | "frequency_hz" | "locality" | "external_id"> | null;
  reporter: Pick<Profile, "first_name" | "last_name" | "callsign"> | null;
  canManage: boolean;
}

export function ReportDetail({
  report,
  repeater,
  reporter,
  canManage,
}: ReportDetailProps) {
  const router = useRouter();

  const reporterName =
    reporter?.callsign ??
    ([reporter?.first_name, reporter?.last_name].filter(Boolean).join(" ") ||
    "Unknown");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Report #{report.id.slice(0, 8)}</h1>
          <Badge variant={STATUS_VARIANT[report.status] ?? "outline"}>
            {report.status}
          </Badge>
        </div>
      </div>

      {/* Repeater card in alto */}
      {repeater && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Radio className="h-4 w-4" />
                Ponte di riferimento
              </CardTitle>
              <Button asChild variant="outline" size="sm">
                <Link href={`/repeaters/${repeater.id}`}>
                  Vai al repeater
                  <ExternalLink className="ml-2 h-3 w-3" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-x-8 gap-y-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Callsign</p>
                <p className="font-mono text-lg font-bold">
                  {repeater.callsign ?? repeater.name ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Frequenza</p>
                <p className="text-lg">{formatFrequency(repeater.frequency_hz)}</p>
              </div>
              {repeater.locality && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Localita</p>
                  <p className="text-lg">{repeater.locality}</p>
                </div>
              )}
              {repeater.external_id && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">External ID</p>
                  <p className="font-mono text-lg">{repeater.external_id}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report espanso sotto */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Segnalazione</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Descrizione report - ampia e leggibile */}
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
              <p className="mt-0.5">{new Date(report.created_at).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Aggiornato il</p>
              <p className="mt-0.5">{new Date(report.updated_at).toLocaleString()}</p>
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
    </div>
  );
}
