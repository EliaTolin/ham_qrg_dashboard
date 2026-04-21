"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Check,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  approvePendingChange,
  rejectPendingChange,
} from "@/app/actions/pending-changes";
import {
  ChangeDetail,
  CHANGE_TYPE_LABEL,
  CHANGE_TYPE_VARIANT,
  STATUS_LABEL,
  STATUS_VARIANT,
  WINNER_VARIANT,
  fieldLabel,
} from "@/components/pending-changes/change-detail";
import type { SyncPendingChange } from "@/lib/types";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function summarizeChange(change: SyncPendingChange): string {
  if (change.change_type === "new") {
    const tip = change.remote_data.Tipologia;
    return `Nuovo ${tip ? String(tip) : "ripetitore"}`;
  }
  if (change.change_type === "deactivate") {
    const scope = change.diff.scope?.remote;
    const tip = change.remote_data.Tipologia;
    return scope === "access"
      ? `Rimuovi accesso ${tip ? String(tip) : ""}`
      : "Disattiva ripetitore";
  }
  if (change.change_type === "reactivate") {
    return "Riattiva ripetitore";
  }
  const diffKeys = Object.keys(change.diff).filter((k) => k !== "scope");
  return diffKeys.length > 0
    ? diffKeys.map((k) => fieldLabel(k)).join(", ")
    : "—";
}

export function RepeaterPendingChanges({
  changes,
}: {
  changes: SyncPendingChange[];
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(changes.filter((c) => c.status === "pending").map((c) => c.id))
  );
  const [isPending, startTransition] = useTransition();

  if (changes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nessuna modifica da iz8wnh registrata per questo ripetitore.
      </p>
    );
  }

  const toggle = (id: string) => {
    setExpanded((prev) => {
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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {changes.length} modifiche da iz8wnh per questo ripetitore
        </p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/pending-changes">
            <ExternalLink className="mr-2 h-3.5 w-3.5" />
            Vai a Pending Changes
          </Link>
        </Button>
      </div>

      {changes.map((change) => {
        const isExpanded = expanded.has(change.id);
        const isPendingStatus = change.status === "pending";

        return (
          <Card key={change.id}>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                  onClick={() => toggle(change.id)}
                  aria-label={isExpanded ? "Comprimi" : "Espandi"}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                <Badge variant={CHANGE_TYPE_VARIANT[change.change_type]}>
                  {CHANGE_TYPE_LABEL[change.change_type]}
                </Badge>
                <Badge variant={STATUS_VARIANT[change.status]}>
                  {STATUS_LABEL[change.status]}
                </Badge>
                <Badge
                  variant={WINNER_VARIANT[change.suggested_winner] ?? "outline"}
                >
                  Winner: {change.suggested_winner}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {summarizeChange(change)}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {formatDate(change.created_at)}
                </span>
                {isPendingStatus && (
                  <div className="flex items-center gap-1">
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
                )}
              </div>
              {change.reviewed_at && (
                <div className="pt-1 text-xs text-muted-foreground">
                  Revisionato: {formatDate(change.reviewed_at)}
                </div>
              )}
            </CardHeader>
            {isExpanded && (
              <CardContent>
                <ChangeDetail change={change} showLocalContext={false} />
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
