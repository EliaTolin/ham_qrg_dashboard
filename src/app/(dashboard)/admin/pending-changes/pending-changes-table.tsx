"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import React from "react";
import { toast } from "sonner";
import {
  approvePendingChange,
  rejectPendingChange,
  bulkApprovePendingChanges,
  bulkRejectPendingChanges,
} from "@/app/actions/pending-changes";
import type { SyncPendingChange, PendingChangeType } from "@/lib/types";
import {
  Check,
  X,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

// --- Constants ---

const CHANGE_TYPE_VARIANT: Record<
  PendingChangeType,
  "default" | "secondary" | "destructive" | "outline"
> = {
  new: "default",
  update: "secondary",
  deactivate: "destructive",
  reactivate: "outline",
};

const CHANGE_TYPE_LABEL: Record<PendingChangeType, string> = {
  new: "Nuovo",
  update: "Aggiornamento",
  deactivate: "Disattivazione",
  reactivate: "Riattivazione",
};

const WINNER_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  remote: "default",
  local: "secondary",
  unknown: "outline",
};

const FIELD_LABELS: Record<string, string> = {
  name: "Nome",
  callsign: "Nominativo",
  frequency_hz: "Frequenza",
  shift_hz: "Shift",
  locality: "Località",
  locator: "Locator",
  lat: "Latitudine",
  lon: "Longitudine",
  is_active: "Attivo",
  AutoON: "AutoON",
  ManualON: "ManualON",
  scope: "Ambito",
  "access.mode": "Modo accesso",
  "access.ctcss_tx_hz": "CTCSS TX",
  "access.color_code": "Color Code",
  "access.node_id": "Node ID",
};

// --- Types ---

export interface RepeaterSummary {
  id: string;
  name: string | null;
  callsign: string | null;
  frequency_hz: number;
  shift_hz: number | null;
  locality: string | null;
  locator: string | null;
  is_active: boolean;
  repeater_access: {
    mode: string;
    ctcss_tx_hz: number | null;
    color_code: number | null;
    node_id: number | null;
    network: { name: string } | null;
  }[];
}

// --- Helpers ---

function fieldLabel(field: string): string {
  return FIELD_LABELS[field] ?? field;
}

function fmtFreq(hz: number): string {
  return (hz / 1_000_000).toFixed(4) + " MHz";
}

function fmtShift(hz: number): string {
  return (hz > 0 ? "+" : "") + (hz / 1_000_000).toFixed(1) + " MHz";
}

function fmtVal(field: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (field === "frequency_hz" || field === "shift_hz")
    return fmtFreq(value as number);
  if (typeof value === "boolean") return value ? "Sì" : "No";
  if (typeof value === "number") return value.toString();
  return String(value);
}

// --- Detail sub-components ---

/** Two-column before/after row */
function DiffRow({
  label,
  before,
  after,
  changed,
}: {
  label: string;
  before: string;
  after: string;
  changed: boolean;
}) {
  return (
    <div
      className={`grid grid-cols-[140px_1fr_1fr] gap-2 px-3 py-1.5 rounded text-sm ${
        changed ? "bg-amber-500/10" : ""
      }`}
    >
      <span className="font-medium text-muted-foreground">{label}</span>
      <span className={changed ? "line-through text-muted-foreground" : ""}>
        {before}
      </span>
      <span className={changed ? "font-semibold text-foreground" : ""}>
        {after}
      </span>
    </div>
  );
}

/** Section header for the detail panels */
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 mt-3 first:mt-0">
      {children}
    </div>
  );
}

/** Access badge */
function AccessBadge({
  access,
}: {
  access: RepeaterSummary["repeater_access"][0];
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs">
      <span className="font-semibold">{access.mode}</span>
      {access.network?.name && (
        <span className="text-muted-foreground">{access.network.name}</span>
      )}
      {access.ctcss_tx_hz != null && (
        <span className="text-muted-foreground">
          CTCSS {access.ctcss_tx_hz}
        </span>
      )}
      {access.color_code != null && (
        <span className="text-muted-foreground">CC{access.color_code}</span>
      )}
      {access.node_id != null && (
        <span className="text-muted-foreground">#{access.node_id}</span>
      )}
    </span>
  );
}

/** Full expanded detail for a pending change */
function ChangeDetail({
  change,
  localRepeater,
}: {
  change: SyncPendingChange;
  localRepeater?: RepeaterSummary;
}) {
  const rd = change.remote_data as Record<string, string | number | boolean | null | undefined>;
  const diff = change.diff;
  const diffKeys = Object.keys(diff).filter((k) => k !== "scope");

  // --- NEW REPEATER ---
  if (change.change_type === "new") {
    return (
      <div className="space-y-1">
        <SectionHeader>Nuovo ripetitore da iz8wnh</SectionHeader>
        <div className="rounded-md border bg-green-500/5 p-3 space-y-1 text-sm font-mono">
          {[
            ["Nominativo", rd.Identificativo],
            ["Nome", rd.Ripetitore],
            ["Frequenza", rd.Frequenza ? `${rd.Frequenza} MHz` : null],
            ["Shift", rd.Shift ? `${rd.Shift} MHz` : null],
            ["Tipologia", rd.Tipologia],
            ["Tono CTCSS", rd.Tono && rd.Tono !== "0" ? rd.Tono : null],
            ["Color Code", rd.ColorCode],
            ["Node/Stanza", rd.Stanza],
            ["Rete", rd.Rete],
            ["Località", rd.Localita],
            ["Locator", rd.Locator],
            ["Coordinate", rd.Lat && rd.Long ? `${rd.Lat}, ${rd.Long}` : null],
            ["Ultima modifica", rd.Ultima_Modifica],
          ].map(([label, value]) =>
            value ? (
              <div key={label as string} className="grid grid-cols-[140px_1fr] gap-2 px-3 py-0.5">
                <span className="text-muted-foreground">{label as string}</span>
                <span className="text-green-700 dark:text-green-400">
                  {String(value)}
                </span>
              </div>
            ) : null
          )}
        </div>
      </div>
    );
  }

  // --- DEACTIVATE / REACTIVATE ---
  if (
    change.change_type === "deactivate" ||
    change.change_type === "reactivate"
  ) {
    const isDeactivate = change.change_type === "deactivate";
    const scope = diff.scope?.remote as string | undefined;
    const tipologia = rd.Tipologia as string | undefined;
    const isAccessLevel = scope === "access";

    return (
      <div className="space-y-2">
        {/* Current state */}
        {localRepeater && (
          <>
            <SectionHeader>Stato attuale nel nostro DB</SectionHeader>
            <LocalRepeaterCard repeater={localRepeater} />
          </>
        )}

        {/* What changes */}
        <SectionHeader>Modifica proposta</SectionHeader>
        <div
          className={`rounded-md border p-3 text-sm ${
            isDeactivate
              ? "bg-red-500/5 border-red-500/20"
              : "bg-green-500/5 border-green-500/20"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <ArrowRight className="h-4 w-4" />
            <span className="font-semibold">
              {isDeactivate
                ? isAccessLevel
                  ? `Disattivare accesso ${tipologia ?? "?"}`
                  : "Disattivare ripetitore"
                : "Riattivare ripetitore"}
            </span>
          </div>
          <div className="space-y-1 text-muted-foreground font-mono text-xs">
            {tipologia && (
              <div>Tipologia: <span className="text-foreground">{tipologia}</span></div>
            )}
            {rd.Frequenza != null && (
              <div>Frequenza: <span className="text-foreground">{String(rd.Frequenza)} MHz</span></div>
            )}
            {diff.AutoON && (
              <div>AutoON: <span className="text-foreground">{String(diff.AutoON.remote)}</span></div>
            )}
            {diff.ManualON && (
              <div>ManualON: <span className="text-foreground">{String(diff.ManualON.remote)}</span></div>
            )}
          </div>
          {isAccessLevel && (
            <p className="mt-2 text-xs text-muted-foreground">
              Solo questo accesso verrà rimosso. Se non restano altri accessi, il ripetitore verrà nascosto.
            </p>
          )}
        </div>
      </div>
    );
  }

  // --- UPDATE ---
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="grid grid-cols-[140px_1fr_1fr] gap-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <span>Campo</span>
        <span>Stato attuale (DB)</span>
        <span>Proposta iz8wnh</span>
      </div>

      {/* Repeater fields */}
      <div className="rounded-md border divide-y">
        {diffKeys.map((field) => {
          const d = diff[field] as { local: unknown; remote: unknown };
          return (
            <DiffRow
              key={field}
              label={fieldLabel(field)}
              before={fmtVal(field, d.local)}
              after={fmtVal(field, d.remote)}
              changed={true}
            />
          );
        })}
      </div>

      {/* Unchanged context from local repeater */}
      {localRepeater && (
        <>
          <SectionHeader>Contesto ripetitore (invariato)</SectionHeader>
          <LocalRepeaterCard repeater={localRepeater} />
        </>
      )}

      {/* Remote record extra info */}
      {(rd.Tipologia || rd.Tono || rd.Rete) && (
        <>
          <SectionHeader>Info accesso da iz8wnh</SectionHeader>
          <div className="rounded-md border bg-muted/30 p-3 font-mono text-xs space-y-0.5">
            {rd.Tipologia && <div>Tipologia: {String(rd.Tipologia)}</div>}
            {rd.Tono && rd.Tono !== "0" && (
              <div>Tono CTCSS: {String(rd.Tono)}</div>
            )}
            {rd.ColorCode && <div>Color Code: {String(rd.ColorCode)}</div>}
            {rd.Stanza && <div>Node/Stanza: {String(rd.Stanza)}</div>}
            {rd.Rete && <div>Rete: {String(rd.Rete)}</div>}
          </div>
        </>
      )}

      {/* Timestamps */}
      <div className="flex gap-4 text-xs text-muted-foreground pt-1">
        {change.remote_updated_at && (
          <span>
            Aggiornato da iz8wnh:{" "}
            {new Date(change.remote_updated_at).toLocaleString()}
          </span>
        )}
        {change.local_updated_at && (
          <span>
            Aggiornato da noi:{" "}
            {new Date(change.local_updated_at).toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
}

/** Compact card showing our local repeater state */
function LocalRepeaterCard({ repeater }: { repeater: RepeaterSummary }) {
  return (
    <div className="rounded-md border bg-background p-3 space-y-1.5 text-sm">
      <div className="flex items-center gap-2">
        <span className="font-semibold">
          {repeater.callsign ?? "—"}
        </span>
        {repeater.name && (
          <span className="text-muted-foreground">— {repeater.name}</span>
        )}
        {!repeater.is_active && (
          <Badge variant="destructive" className="text-xs">
            INATTIVO
          </Badge>
        )}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground font-mono">
        <span>
          {fmtFreq(repeater.frequency_hz)}
          {repeater.shift_hz != null && (
            <span className="ml-1">({fmtShift(repeater.shift_hz)})</span>
          )}
        </span>
        {repeater.locality && <span>{repeater.locality}</span>}
        {repeater.locator && <span>{repeater.locator}</span>}
      </div>
      {repeater.repeater_access.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-0.5">
          {repeater.repeater_access.map((a, i) => (
            <AccessBadge key={i} access={a} />
          ))}
        </div>
      )}
    </div>
  );
}

// --- Main table component ---

export function PendingChangesTable({
  changes,
  repeaterMap,
  page,
  totalPages,
  totalCount,
}: {
  changes: SyncPendingChange[];
  repeaterMap: Record<string, RepeaterSummary>;
  page: number;
  totalPages: number;
  totalCount: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === changes.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(changes.map((c) => c.id)));
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleApprove = (id: string) => {
    startTransition(async () => {
      const result = await approvePendingChange(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Modifica approvata");
        router.refresh();
      }
    });
  };

  const handleReject = (id: string) => {
    startTransition(async () => {
      const result = await rejectPendingChange(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Modifica rifiutata");
        router.refresh();
      }
    });
  };

  const handleBulkApprove = () => {
    if (selected.size === 0) return;
    startTransition(async () => {
      const result = await bulkApprovePendingChanges([...selected]);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`${selected.size} modifiche approvate`);
        setSelected(new Set());
        router.refresh();
      }
    });
  };

  const handleBulkReject = () => {
    if (selected.size === 0) return;
    startTransition(async () => {
      const result = await bulkRejectPendingChanges([...selected]);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`${selected.size} modifiche rifiutate`);
        setSelected(new Set());
        router.refresh();
      }
    });
  };

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (p <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(p));
    }
    router.push(`?${params.toString()}`);
  }

  if (changes.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center text-muted-foreground">
        Nessuna modifica in attesa di revisione.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {selected.size > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {selected.size} selezionati
          </span>
          <Button size="sm" onClick={handleBulkApprove} disabled={isPending}>
            <Check className="mr-1 h-3 w-3" />
            Approva tutti
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleBulkReject}
            disabled={isPending}
          >
            <X className="mr-1 h-3 w-3" />
            Rifiuta tutti
          </Button>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  checked={selected.size === changes.length}
                  onChange={toggleSelectAll}
                  className="rounded"
                />
              </TableHead>
              <TableHead className="w-8" />
              <TableHead>Repeater</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Suggerimento</TableHead>
              <TableHead>Modifiche</TableHead>
              <TableHead>Data iz8wnh</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {changes.map((change) => {
              const isExpanded = expandedRows.has(change.id);
              const diffKeys = Object.keys(change.diff).filter(
                (k) => k !== "scope"
              );
              const localRepeater = change.repeater_id
                ? repeaterMap[change.repeater_id]
                : undefined;

              const repeaterName = localRepeater
                ? `${localRepeater.callsign ?? ""} ${localRepeater.name ?? ""}`.trim() ||
                  change.external_id
                : (change.remote_data.Identificativo as string) ||
                  (change.remote_data.Ripetitore as string) ||
                  change.external_id;

              const freqDisplay = localRepeater
                ? fmtFreq(localRepeater.frequency_hz)
                : change.remote_data.Frequenza
                  ? `${String(change.remote_data.Frequenza)} MHz`
                  : null;

              let fieldsSummary: string;
              if (change.change_type === "new") {
                const tip = change.remote_data.Tipologia;
                fieldsSummary = `Nuovo ${tip ? String(tip) : "repeater"}`;
              } else if (change.change_type === "deactivate") {
                const scope = change.diff.scope?.remote;
                const tip = change.remote_data.Tipologia;
                fieldsSummary =
                  scope === "access"
                    ? `Rimuovi accesso ${tip ? String(tip) : ""}`
                    : "Disattiva ripetitore";
              } else if (change.change_type === "reactivate") {
                fieldsSummary = "Riattiva ripetitore";
              } else {
                fieldsSummary =
                  diffKeys.length > 0
                    ? diffKeys.map((k) => fieldLabel(k)).join(", ")
                    : "—";
              }

              return (
                <React.Fragment key={change.id}>
                  <TableRow
                    className="cursor-pointer"
                    onClick={() => toggleExpanded(change.id)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.has(change.id)}
                        onChange={() => toggleSelect(change.id)}
                        className="rounded"
                      />
                    </TableCell>
                    <TableCell>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div>{repeaterName}</div>
                      {freqDisplay && (
                        <div className="text-xs text-muted-foreground">
                          {freqDisplay}
                          {localRepeater?.locality && (
                            <span className="ml-2">
                              {localRepeater.locality}
                            </span>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={CHANGE_TYPE_VARIANT[change.change_type]}
                      >
                        {CHANGE_TYPE_LABEL[change.change_type]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          WINNER_VARIANT[change.suggested_winner] ?? "outline"
                        }
                      >
                        {change.suggested_winner}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[250px] truncate">
                      {fieldsSummary}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {change.remote_updated_at
                        ? new Date(
                            change.remote_updated_at
                          ).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell
                      className="text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleApprove(change.id)}
                          disabled={isPending}
                          title="Approva"
                        >
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleReject(change.id)}
                          disabled={isPending}
                          title="Rifiuta"
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>

                  {isExpanded && (
                    <TableRow className="bg-muted/20 hover:bg-muted/20">
                      <TableCell colSpan={8} className="p-4">
                        <ChangeDetail
                          change={change}
                          localRepeater={localRepeater}
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Pagina {page} di {totalPages} ({totalCount} risultati)
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => goToPage(1)}
              disabled={page <= 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => goToPage(totalPages)}
              disabled={page >= totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
