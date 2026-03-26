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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import {
  approvePendingChange,
  rejectPendingChange,
  bulkApprovePendingChanges,
  bulkRejectPendingChanges,
} from "@/app/actions/pending-changes";
import type { SyncPendingChange, PendingChangeType } from "@/lib/types";
import { Check, X, ChevronDown, ChevronRight } from "lucide-react";

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

function FieldLabel(field: string): string {
  const labels: Record<string, string> = {
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
  };
  return labels[field] ?? field;
}

function formatValue(field: string, value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (field === "frequency_hz" || field === "shift_hz") {
    const mhz = (value as number) / 1_000_000;
    return `${mhz.toFixed(4)} MHz`;
  }
  if (typeof value === "boolean") return value ? "Sì" : "No";
  if (typeof value === "number") return value.toString();
  return String(value);
}

export function PendingChangesTable({
  changes,
}: {
  changes: SyncPendingChange[];
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
              const repeaterName =
                (change.remote_data.Ripetitore as string) ||
                (change.remote_data.Identificativo as string) ||
                change.external_id;

              return (
                <Collapsible key={change.id} asChild open={isExpanded}>
                  <>
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
                        {repeaterName}
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
                      <TableCell className="text-sm text-muted-foreground">
                        {diffKeys.length > 0
                          ? diffKeys.map((k) => FieldLabel(k)).join(", ")
                          : "—"}
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

                    <CollapsibleContent asChild>
                      <TableRow className="bg-muted/50">
                        <TableCell colSpan={8} className="p-4">
                          {diffKeys.length > 0 ? (
                            <div className="rounded-md border">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Campo</TableHead>
                                    <TableHead>Locale</TableHead>
                                    <TableHead>Remoto (iz8wnh)</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {diffKeys.map((field) => {
                                    const d = change.diff[field];
                                    return (
                                      <TableRow key={field}>
                                        <TableCell className="font-medium">
                                          {FieldLabel(field)}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                          {formatValue(field, d.local)}
                                        </TableCell>
                                        <TableCell className="font-semibold">
                                          {formatValue(field, d.remote)}
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              Nessun dettaglio diff disponibile per questo tipo di modifica.
                            </p>
                          )}
                          {change.remote_updated_at && (
                            <p className="mt-2 text-xs text-muted-foreground">
                              Ultima modifica remota:{" "}
                              {new Date(change.remote_updated_at).toLocaleString()}
                            </p>
                          )}
                          {change.local_updated_at && (
                            <p className="text-xs text-muted-foreground">
                              Ultima modifica locale:{" "}
                              {new Date(change.local_updated_at).toLocaleString()}
                            </p>
                          )}
                        </TableCell>
                      </TableRow>
                    </CollapsibleContent>
                  </>
                </Collapsible>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
