"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { SubmissionStatusSelect } from "../submission-status-select";
import {
  deleteSubmission,
  approveAndCreateRepeater,
  type SubmissionStatus,
} from "@/app/actions/submissions";
import { formatFrequency, formatShift, formatCtcss } from "@/lib/format";
import { getModeColor } from "@/lib/mode-colors";
import type { Network, AccessMode } from "@/lib/types";

const STATUS_CLASSES: Record<string, string> = {
  pending:
    "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700",
  approved:
    "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700",
  rejected:
    "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700",
};

interface SubmissionAccess {
  mode: string;
  ctcss_tx_hz?: number | null;
  ctcss_rx_hz?: number | null;
  dcs_code?: number | null;
  color_code?: number | null;
  talkgroup?: number | null;
  dg_id?: number | null;
  node_id?: number | null;
  network_name?: string | null;
  notes?: string | null;
}

interface SubmissionRecord {
  id: string;
  user_id: string;
  name: string | null;
  callsign: string | null;
  frequency_hz: number;
  shift_hz: number | null;
  region: string | null;
  province_code: string | null;
  locality: string | null;
  lat: number | null;
  lon: number | null;
  locator: string | null;
  accesses: SubmissionAccess[];
  notes: string | null;
  status: SubmissionStatus;
  created_at: string;
}

interface Props {
  submission: SubmissionRecord;
  reporter: {
    first_name: string | null;
    last_name: string | null;
    callsign: string | null;
  } | null;
  canManage: boolean;
  canWrite: boolean;
  networks: Network[];
}

export function SubmissionDetail({
  submission,
  reporter,
  canManage,
  canWrite,
  networks,
}: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [creating, setCreating] = useState(false);

  // Prefill form state from submission data
  const [callsign, setCallsign] = useState(submission.callsign ?? "");
  const [name, setName] = useState(submission.name ?? "");
  const [frequencyMhz, setFrequencyMhz] = useState(
    (submission.frequency_hz / 1_000_000).toFixed(4)
  );
  const [shiftMhz, setShiftMhz] = useState(
    submission.shift_hz != null
      ? (submission.shift_hz / 1_000_000).toFixed(1)
      : ""
  );
  const [locality, setLocality] = useState(submission.locality ?? "");
  const [region, setRegion] = useState(submission.region ?? "");
  const [provinceCode, setProvinceCode] = useState(
    submission.province_code ?? ""
  );
  const [locator, setLocator] = useState(submission.locator ?? "");
  const [lat, setLat] = useState(
    submission.lat != null ? String(submission.lat) : ""
  );
  const [lon, setLon] = useState(
    submission.lon != null ? String(submission.lon) : ""
  );

  const accesses: SubmissionAccess[] = Array.isArray(submission.accesses)
    ? submission.accesses
    : [];

  const reporterName =
    reporter?.callsign ??
    ([reporter?.first_name, reporter?.last_name].filter(Boolean).join(" ") ||
    "Anonimo");

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteSubmission(submission.id);
    setDeleting(false);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Segnalazione eliminata");
      router.push("/submissions");
    }
  }

  async function handleApproveAndCreate() {
    const freqHz = Math.round(parseFloat(frequencyMhz) * 1_000_000);
    if (isNaN(freqHz) || freqHz <= 0) {
      toast.error("Frequenza non valida");
      return;
    }

    const shiftHz = shiftMhz.trim()
      ? Math.round(parseFloat(shiftMhz) * 1_000_000)
      : null;

    setCreating(true);
    const result = await approveAndCreateRepeater(
      submission.id,
      {
        callsign: callsign.trim() || null,
        name: name.trim() || null,
        frequency_hz: freqHz,
        shift_hz: shiftHz,
        region: region.trim() || null,
        province_code: provinceCode.trim() || null,
        locality: locality.trim() || null,
        lat: lat.trim() ? parseFloat(lat) : null,
        lon: lon.trim() ? parseFloat(lon) : null,
        locator: locator.trim() || null,
      },
      accesses
    );
    setCreating(false);

    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Ripetitore creato e segnalazione approvata");
      router.push(`/repeaters/${result.repeaterId}`);
    }
  }

  const isPending = submission.status === "pending";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/submissions">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex flex-1 items-center gap-3">
          <h1 className="text-2xl font-bold">
            Segnalazione #{submission.id.slice(0, 8)}
          </h1>
          <Badge variant="outline" className={STATUS_CLASSES[submission.status]}>
            {submission.status}
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
                <AlertDialogTitle>
                  Eliminare questa segnalazione?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Questa azione è irreversibile. La segnalazione verrà eliminata
                  permanentemente.
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

      {/* Dati originali della segnalazione */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Dati segnalati</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Callsign
              </p>
              <p className="mt-0.5 font-mono">
                {submission.callsign ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Nome</p>
              <p className="mt-0.5">{submission.name ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Frequenza
              </p>
              <p className="mt-0.5 font-mono">
                {formatFrequency(submission.frequency_hz)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Shift</p>
              <p className="mt-0.5 font-mono">
                {formatShift(submission.shift_hz)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Località
              </p>
              <p className="mt-0.5">
                {[submission.locality, submission.province_code, submission.region]
                  .filter(Boolean)
                  .join(", ") || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Locator
              </p>
              <p className="mt-0.5 font-mono">{submission.locator ?? "—"}</p>
            </div>
            {(submission.lat != null || submission.lon != null) && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Coordinate
                </p>
                <p className="mt-0.5 font-mono">
                  {submission.lat}, {submission.lon}
                </p>
              </div>
            )}
          </div>

          {submission.notes && (
            <>
              <Separator />
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Note
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm">
                  {submission.notes}
                </p>
              </div>
            </>
          )}

          <Separator />

          <div className="flex flex-wrap gap-x-8 gap-y-4 text-sm">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Segnalato da
              </p>
              <p className="mt-0.5">{reporterName}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Data</p>
              <p className="mt-0.5">
                {new Date(submission.created_at).toLocaleString("it-IT")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accessi segnalati */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">
          Accessi segnalati ({accesses.length})
        </h2>
        {accesses.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nessun accesso segnalato.
          </p>
        )}
        {accesses.map((access, idx) => (
          <Card key={idx}>
            <CardHeader className="pb-3">
              <Badge className={getModeColor(access.mode as AccessMode)}>
                {access.mode}
              </Badge>
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
                {access.network_name && (
                  <div>
                    <dt className="text-muted-foreground">Network</dt>
                    <dd>{access.network_name}</dd>
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

      {/* Gestione stato */}
      {canManage && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Gestione</CardTitle>
          </CardHeader>
          <CardContent>
            <SubmissionStatusSelect
              submissionId={submission.id}
              currentStatus={submission.status}
            />
          </CardContent>
        </Card>
      )}

      {/* Form creazione ripetitore (prefillato) — solo se pending e ha permessi write */}
      {isPending && canWrite && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Crea ripetitore da segnalazione
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              I campi sono prefillati con i dati della segnalazione. Modifica se
              necessario e clicca &quot;Approva e crea&quot; per creare il ripetitore con
              i suoi accessi.
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="callsign">Callsign</Label>
                <Input
                  id="callsign"
                  value={callsign}
                  onChange={(e) => setCallsign(e.target.value)}
                  placeholder="IR4AB"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Monte Cimone"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="frequency">Frequenza (MHz)</Label>
                <Input
                  id="frequency"
                  value={frequencyMhz}
                  onChange={(e) => setFrequencyMhz(e.target.value)}
                  placeholder="145.0000"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="shift">Shift (MHz)</Label>
                <Input
                  id="shift"
                  value={shiftMhz}
                  onChange={(e) => setShiftMhz(e.target.value)}
                  placeholder="-0.6"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="locality">Località</Label>
                <Input
                  id="locality"
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="region">Regione</Label>
                <Input
                  id="region"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="province">Provincia</Label>
                <Input
                  id="province"
                  value={provinceCode}
                  onChange={(e) =>
                    setProvinceCode(e.target.value.toUpperCase())
                  }
                  placeholder="BO"
                  maxLength={2}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="locator">Locator</Label>
                <Input
                  id="locator"
                  value={locator}
                  onChange={(e) => setLocator(e.target.value.toUpperCase())}
                  placeholder="JN54ml"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lat">Latitudine</Label>
                <Input
                  id="lat"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="44.1234"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lon">Longitudine</Label>
                <Input
                  id="lon"
                  value={lon}
                  onChange={(e) => setLon(e.target.value)}
                  placeholder="10.5678"
                />
              </div>
            </div>

            {accesses.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Verranno creati {accesses.length} accessi:
                </p>
                <div className="flex flex-wrap gap-2">
                  {accesses.map((a, i) => (
                    <Badge
                      key={i}
                      className={getModeColor(a.mode as AccessMode)}
                    >
                      {a.mode}
                      {a.network_name ? ` — ${a.network_name}` : ""}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            <Button
              onClick={handleApproveAndCreate}
              disabled={creating}
              className="gap-2"
            >
              <Check className="h-4 w-4" />
              {creating ? "Creazione in corso..." : "Approva e crea ripetitore"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
