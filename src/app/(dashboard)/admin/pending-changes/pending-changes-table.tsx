"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { Check, X, ChevronDown, ChevronRight, Plus, Minus, ArrowRight } from "lucide-react";

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

const WINNER_VARIANT: Record<
  string,
  "default" | "secondary" | "outline"
> = {
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
  Ripetitore: "Nome",
  Identificativo: "Nominativo",
  Frequenza: "Frequenza",
  Shift: "Shift",
  Tono: "Tono CTCSS",
  ColorCode: "Color Code",
  Stanza: "Stanza/Node",
  Rete: "Rete",
  Lat: "Latitudine",
  Long: "Longitudine",
  Localita: "Località",
  Locator: "Locator",
  Tipologia: "Tipologia",
  Ultima_Modifica: "Ultima Modifica",
};

function fieldLabel(field: string): string {
  return FIELD_LABELS[field] ?? field;
}

function formatValue(field: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (field === "frequency_hz" || field === "shift_hz") {
    const mhz = (value as number) / 1_000_000;
    return `${mhz.toFixed(4)} MHz`;
  }
  if (typeof value === "boolean") return value ? "Sì" : "No";
  if (typeof value === "number") return value.toString();
  return String(value);
}

// Fields to show for new repeaters (from remote_data)
const NEW_REPEATER_FIELDS = [
  "Ripetitore",
  "Identificativo",
  "Frequenza",
  "Shift",
  "Tipologia",
  "Tono",
  "ColorCode",
  "Stanza",
  "Rete",
  "Localita",
  "Locator",
  "Lat",
  "Long",
  "Ultima_Modifica",
] as const;

/** Git-style diff for update changes */
function UpdateDiff({
  diff,
}: {
  diff: Record<string, { local: unknown; remote: unknown }>;
}) {
  const keys = Object.keys(diff);
  if (keys.length === 0) return null;

  return (
    <div className="space-y-1 font-mono text-sm">
      {keys.map((field) => {
        const d = diff[field];
        return (
          <div key={field} className="space-y-0.5">
            <div className="text-xs font-semibold text-muted-foreground">
              {fieldLabel(field)}
            </div>
            <div className="flex items-start gap-2 rounded bg-red-500/10 px-3 py-1 text-red-700 dark:text-red-400">
              <Minus className="mt-0.5 h-3 w-3 shrink-0" />
              <span>{formatValue(field, d.local)}</span>
            </div>
            <div className="flex items-start gap-2 rounded bg-green-500/10 px-3 py-1 text-green-700 dark:text-green-400">
              <Plus className="mt-0.5 h-3 w-3 shrink-0" />
              <span>{formatValue(field, d.remote)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Shows all fields for a new repeater */
function NewRepeaterDetail({
  remoteData,
}: {
  remoteData: Record<string, unknown>;
}) {
  return (
    <div className="space-y-1 font-mono text-sm">
      {NEW_REPEATER_FIELDS.map((field) => {
        const value = remoteData[field];
        if (value === null || value === undefined || value === "") return null;
        return (
          <div
            key={field}
            className="flex items-start gap-2 rounded bg-green-500/10 px-3 py-1 text-green-700 dark:text-green-400"
          >
            <Plus className="mt-0.5 h-3 w-3 shrink-0" />
            <span className="font-semibold text-muted-foreground min-w-[120px]">
              {fieldLabel(field)}
            </span>
            <span>{String(value)}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Shows activation/deactivation detail */
function ActivationDiff({
  change,
}: {
  change: SyncPendingChange;
}) {
  const isDeactivate = change.change_type === "deactivate";
  const scope = change.diff.scope?.remote as string | undefined;
  const tipologia = change.remote_data.Tipologia as string | undefined;
  const isAccessLevel = scope === "access";

  const label = isDeactivate
    ? isAccessLevel
      ? `Disattivare accesso ${tipologia ?? "?"}`
      : "Disattivare ripetitore"
    : "Riattivare ripetitore";

  return (
    <div className="space-y-1 font-mono text-sm">
      <div className={`flex items-center gap-2 rounded px-3 py-2 ${
        isDeactivate
          ? "bg-red-500/10 text-red-700 dark:text-red-400"
          : "bg-green-500/10 text-green-700 dark:text-green-400"
      }`}>
        <ArrowRight className="h-3 w-3 shrink-0" />
        <span className="font-semibold">{label}</span>
      </div>
      {tipologia && (
        <div className="flex items-center gap-2 rounded bg-muted px-3 py-1">
          <span className="text-muted-foreground min-w-[120px]">Tipologia</span>
          <span>{tipologia}</span>
        </div>
      )}
      {change.remote_data.Frequenza && (
        <div className="flex items-center gap-2 rounded bg-muted px-3 py-1">
          <span className="text-muted-foreground min-w-[120px]">Frequenza</span>
          <span>{String(change.remote_data.Frequenza)} MHz</span>
        </div>
      )}
      {change.diff.AutoON && (
        <div className="flex items-center gap-2 rounded bg-muted px-3 py-1">
          <span className="text-muted-foreground min-w-[120px]">AutoON</span>
          <span>{String(change.diff.AutoON.remote)}</span>
        </div>
      )}
      {change.diff.ManualON && (
        <div className="flex items-center gap-2 rounded bg-muted px-3 py-1">
          <span className="text-muted-foreground min-w-[120px]">ManualON</span>
          <span>{String(change.diff.ManualON.remote)}</span>
        </div>
      )}
    </div>
  );
}

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

function formatFrequency(hz: number): string {
  return (hz / 1_000_000).toFixed(4) + " MHz";
}

/** Card showing local repeater info */
function RepeaterInfoCard({ repeater }: { repeater: RepeaterSummary }) {
  return (
    <div className="rounded-md border bg-background p-3 space-y-1 text-sm mb-3">
      <div className="font-semibold text-base">
        {repeater.callsign ?? "—"}{" "}
        {repeater.name && (
          <span className="font-normal text-muted-foreground">
            — {repeater.name}
          </span>
        )}
        {!repeater.is_active && (
          <span className="ml-2 rounded bg-destructive/10 px-1.5 py-0.5 text-xs text-destructive">
            INATTIVO
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
        <span>
          {formatFrequency(repeater.frequency_hz)}
          {repeater.shift_hz != null && (
            <span className="ml-1">
              (shift {repeater.shift_hz > 0 ? "+" : ""}
              {(repeater.shift_hz / 1_000_000).toFixed(1)})
            </span>
          )}
        </span>
        {repeater.locality && <span>{repeater.locality}</span>}
        {repeater.locator && (
          <span className="font-mono">{repeater.locator}</span>
        )}
      </div>
      {repeater.repeater_access.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1">
          {repeater.repeater_access.map((a, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs"
            >
              <span className="font-semibold">{a.mode}</span>
              {a.network?.name && (
                <span className="text-muted-foreground">{a.network.name}</span>
              )}
              {a.ctcss_tx_hz != null && (
                <span className="text-muted-foreground">
                  CTCSS {a.ctcss_tx_hz}
                </span>
              )}
              {a.color_code != null && (
                <span className="text-muted-foreground">
                  CC{a.color_code}
                </span>
              )}
              {a.node_id != null && (
                <span className="text-muted-foreground">
                  #{a.node_id}
                </span>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function PendingChangesTable({
  changes,
  repeaterMap,
}: {
  changes: SyncPendingChange[];
  repeaterMap: Record<string, RepeaterSummary>;
}) {
  const router = useRouter();
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

  if (changes.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center text-muted-foreground">
        Nessuna modifica in attesa di revisione.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {selected.size} selezionati
          </span>
          <Button
            size="sm"
            onClick={handleBulkApprove}
            disabled={isPending}
          >
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
              <TableHead>Campi</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {changes.map((change) => {
              const isExpanded = expandedRows.has(change.id);
              const diffKeys = Object.keys(change.diff);
              const localRepeater = change.repeater_id
                ? repeaterMap[change.repeater_id]
                : undefined;

              // Build repeater display name from local data or remote data
              const repeaterName = localRepeater
                ? `${localRepeater.callsign ?? ""} ${localRepeater.name ?? ""}`.trim() || change.external_id
                : (change.remote_data.Ripetitore as string) ||
                  (change.remote_data.Identificativo as string) ||
                  change.external_id;

              const freqDisplay = localRepeater
                ? formatFrequency(localRepeater.frequency_hz)
                : change.remote_data.Frequenza
                  ? `${String(change.remote_data.Frequenza)} MHz`
                  : null;

              // Summary for the "Campi" column
              let fieldsSummary: string;
              if (change.change_type === "new") {
                fieldsSummary = "Nuovo repeater";
              } else if (
                change.change_type === "deactivate" ||
                change.change_type === "reactivate"
              ) {
                fieldsSummary = change.change_type === "deactivate"
                  ? "Disattivazione"
                  : "Riattivazione";
              } else {
                fieldsSummary = diffKeys.length > 0
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
                            <span className="ml-2">{localRepeater.locality}</span>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={CHANGE_TYPE_VARIANT[change.change_type]}>
                        {CHANGE_TYPE_LABEL[change.change_type]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={WINNER_VARIANT[change.suggested_winner] ?? "outline"}>
                        {change.suggested_winner}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {fieldsSummary}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {new Date(change.created_at).toLocaleString()}
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
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableCell colSpan={8} className="p-4">
                        {/* Local repeater info card */}
                        {localRepeater && (
                          <RepeaterInfoCard repeater={localRepeater} />
                        )}

                        {/* Git-style diff based on change type */}
                        {change.change_type === "new" && (
                          <NewRepeaterDetail remoteData={change.remote_data} />
                        )}

                        {change.change_type === "update" && (
                          <UpdateDiff diff={change.diff} />
                        )}

                        {(change.change_type === "deactivate" ||
                          change.change_type === "reactivate") && (
                          <ActivationDiff change={change} />
                        )}

                        {/* Timestamps */}
                        <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                          {change.remote_updated_at && (
                            <span>
                              Remoto:{" "}
                              {new Date(change.remote_updated_at).toLocaleString()}
                            </span>
                          )}
                          {change.local_updated_at && (
                            <span>
                              Locale:{" "}
                              {new Date(change.local_updated_at).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
