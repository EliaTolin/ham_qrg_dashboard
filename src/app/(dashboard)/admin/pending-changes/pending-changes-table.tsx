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
import type { SyncPendingChange } from "@/lib/types";
import {
  ChangeDetail,
  CHANGE_TYPE_LABEL,
  CHANGE_TYPE_VARIANT,
  WINNER_VARIANT,
  fieldLabel,
  fmtFreq,
  type RepeaterSummary,
} from "@/components/pending-changes/change-detail";
import {
  Check,
  X,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
} from "lucide-react";

export type { RepeaterSummary };

export function PendingChangesTable({
  changes,
  repeaterMap,
  page,
  totalPages,
  totalCount,
  showActions = true,
}: {
  changes: SyncPendingChange[];
  repeaterMap: Record<string, RepeaterSummary>;
  page: number;
  totalPages: number;
  totalCount: number;
  showActions?: boolean;
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

  const [isPagePending, startPageTransition] = useTransition();

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (p <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(p));
    }
    startPageTransition(() => {
      router.push(`?${params.toString()}`);
    });
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
      {showActions && selected.size > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {selected.size} selezionati
          </span>
          <Button size="sm" onClick={handleBulkApprove} disabled={isPending}>
            <Check className="mr-1 h-3 w-3" />
            Approva selezionati
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleBulkReject}
            disabled={isPending}
          >
            <X className="mr-1 h-3 w-3" />
            Rifiuta selezionati
          </Button>
        </div>
      )}

      <div className="relative rounded-md border">
        {isPagePending && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-background/60">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              {showActions && (
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    checked={selected.size === changes.length}
                    onChange={toggleSelectAll}
                    className="rounded"
                  />
                </TableHead>
              )}
              <TableHead className="w-8" />
              <TableHead>Repeater</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Suggerimento</TableHead>
              <TableHead>Modifiche</TableHead>
              <TableHead>Data iz8wnh</TableHead>
              <TableHead>Creato il</TableHead>
              {showActions && (
                <TableHead className="text-right">Azioni</TableHead>
              )}
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
                    {showActions && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.has(change.id)}
                          onChange={() => toggleSelect(change.id)}
                          className="rounded"
                        />
                      </TableCell>
                    )}
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
                        ? new Date(change.remote_updated_at).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" })
                        : "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {new Date(change.created_at).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </TableCell>
                    {showActions && (
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
                    )}
                  </TableRow>

                  {isExpanded && (
                    <TableRow className="bg-muted/20 hover:bg-muted/20">
                      <TableCell colSpan={showActions ? 9 : 7} className="p-4">
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
