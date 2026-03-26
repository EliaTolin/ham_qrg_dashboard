"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Radio, ExternalLink, Trash2, Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ReportStatusSelect } from "../report-status-select";
import { deleteReport } from "@/app/actions/reports";
import { RepeaterEditForm } from "../../repeaters/[id]/repeater-edit-form";
import { AccessDialog } from "../../repeaters/[id]/access-dialog";
import { deleteAccess } from "@/app/actions/repeaters";
import { formatCtcss } from "@/lib/format";
import { getModeColor } from "@/lib/mode-colors";
import type { RepeaterReport, Repeater, Profile, ReportStatus, RepeaterAccessWithNetwork, Network } from "@/lib/types";

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
  closedBy: Pick<Profile, "first_name" | "last_name" | "callsign"> | null;
  canManage: boolean;
  canEdit: boolean;
  accesses: RepeaterAccessWithNetwork[];
  networks: Network[];
}

export function ReportDetail({
  report,
  repeater,
  reporter,
  closedBy,
  canManage,
  canEdit,
  accesses,
  networks,
}: ReportDetailProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const reporterName =
    reporter?.callsign ??
    ([reporter?.first_name, reporter?.last_name].filter(Boolean).join(" ") ||
    "Unknown");

  const closedByName = closedBy
    ? (closedBy.callsign ??
      ([closedBy.first_name, closedBy.last_name].filter(Boolean).join(" ") ||
      "Unknown"))
    : null;

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteReport(report.id);
    setDeleting(false);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Report eliminato");
      router.push("/reports");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/reports">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex flex-1 items-center gap-3">
          <h1 className="text-2xl font-bold">Report #{report.id.slice(0, 8)}</h1>
          <Badge variant="outline" className={STATUS_CLASSES[report.status]}>
            {report.status}
          </Badge>
        </div>
        {canManage && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={deleting}>
                <Trash2 className="mr-2 h-4 w-4" />
                Elimina
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Eliminare questo report?</AlertDialogTitle>
                <AlertDialogDescription>
                  Questa azione è irreversibile. Il report verrà eliminato permanentemente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annulla</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={deleting}>
                  {deleting ? "Eliminazione..." : "Elimina"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
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
            {report.resolved_at && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Risolto il</p>
                <p className="mt-0.5">{new Date(report.resolved_at).toLocaleString("it-IT")}</p>
              </div>
            )}
            {closedByName && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Chiuso da</p>
                <p className="mt-0.5">{closedByName}</p>
              </div>
            )}
          </div>

          {/* Risposta coordinatore (read-only se non canManage) */}
          {report.coordinator_response && !canManage && (
            <>
              <Separator />
              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                  Risposta coordinatore
                </p>
                <div className="rounded-md bg-muted/50 p-3">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {report.coordinator_response}
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Gestione stato + risposta coordinatore */}
          {canManage && (
            <>
              <Separator />
              <div>
                <p className="mb-2 text-sm font-medium text-muted-foreground">
                  Gestione report
                </p>
                <ReportStatusSelect
                  reportId={report.id}
                  currentStatus={report.status as ReportStatus}
                  currentResponse={report.coordinator_response}
                  showResponseField
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

          {/* Access methods */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">
                Accessi ({accesses.length})
              </h3>
              {canEdit && (
                <AccessDialog
                  repeaterId={repeater.id}
                  networks={networks}
                  trigger={
                    <Button size="sm">
                      <Plus className="mr-2 h-3.5 w-3.5" />
                      Aggiungi accesso
                    </Button>
                  }
                />
              )}
            </div>
            {accesses.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nessun metodo di accesso registrato.
              </p>
            )}
            {accesses.map((access) => (
              <Card key={access.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Badge className={getModeColor(access.mode)}>
                      {access.mode}
                    </Badge>
                    {access.network && (
                      <span className="text-sm text-muted-foreground">
                        {access.network.name}
                        {access.network.kind && (
                          <span className="ml-1 text-xs">({access.network.kind})</span>
                        )}
                      </span>
                    )}
                    {canEdit && (
                      <div className="ml-auto flex items-center gap-1">
                        <AccessDialog
                          repeaterId={repeater.id}
                          access={access}
                          networks={networks}
                          trigger={
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          }
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={async () => {
                            if (!confirm("Eliminare questo accesso?")) return;
                            const result = await deleteAccess(access.id);
                            if (result.error) {
                              toast.error(result.error);
                            } else {
                              toast.success("Accesso eliminato");
                              router.refresh();
                            }
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                    {access.ctcss_tx_hz != null && (
                      <div>
                        <dt className="text-muted-foreground">CTCSS TX</dt>
                        <dd>{formatCtcss(access.ctcss_tx_hz)}</dd>
                      </div>
                    )}
                    {access.ctcss_rx_hz != null && (
                      <div>
                        <dt className="text-muted-foreground">CTCSS RX</dt>
                        <dd>{formatCtcss(access.ctcss_rx_hz)}</dd>
                      </div>
                    )}
                    {access.dcs_code != null && (
                      <div>
                        <dt className="text-muted-foreground">DCS</dt>
                        <dd>{access.dcs_code}</dd>
                      </div>
                    )}
                    {access.color_code != null && (
                      <div>
                        <dt className="text-muted-foreground">Color Code</dt>
                        <dd>{access.color_code}</dd>
                      </div>
                    )}
                    {access.talkgroup != null && (
                      <div>
                        <dt className="text-muted-foreground">Talkgroup</dt>
                        <dd>{access.talkgroup}</dd>
                      </div>
                    )}
                    {access.dg_id != null && (
                      <div>
                        <dt className="text-muted-foreground">DG-ID</dt>
                        <dd>{access.dg_id}</dd>
                      </div>
                    )}
                    {access.node_id != null && (
                      <div>
                        <dt className="text-muted-foreground">Node ID</dt>
                        <dd>{access.node_id}</dd>
                      </div>
                    )}
                    {access.notes && (
                      <div className="col-span-full">
                        <dt className="text-muted-foreground">Note</dt>
                        <dd>{access.notes}</dd>
                      </div>
                    )}
                  </dl>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}