"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";

const TYPE_OPTIONS = [
  { value: "all", label: "Tutti i tipi" },
  { value: "new", label: "Nuovo" },
  { value: "update", label: "Aggiornamento" },
  { value: "deactivate", label: "Disattivazione" },
  { value: "reactivate", label: "Riattivazione" },
] as const;

const STATUS_OPTIONS = [
  { value: "pending", label: "In attesa" },
  { value: "approved", label: "Approvati" },
  { value: "rejected", label: "Rifiutati" },
] as const;

export function PendingChangesFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentType = searchParams.get("type") ?? "all";
  const currentStatus = searchParams.get("status") ?? "pending";

  function setParam(key: string, value: string, defaults: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === defaults) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.delete("page");
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground mr-1">Stato:</span>
        {STATUS_OPTIONS.map((opt) => (
          <Badge
            key={opt.value}
            variant={currentStatus === opt.value ? "default" : "outline"}
            className="cursor-pointer select-none px-3 py-1.5 text-sm"
            onClick={() => setParam("status", opt.value, "pending")}
          >
            {opt.label}
          </Badge>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground mr-1">Tipo:</span>
        {TYPE_OPTIONS.map((opt) => (
          <Badge
            key={opt.value}
            variant={currentType === opt.value ? "default" : "outline"}
            className="cursor-pointer select-none px-3 py-1.5 text-sm"
            onClick={() => setParam("type", opt.value, "all")}
          >
            {opt.label}
          </Badge>
        ))}
      </div>
    </div>
  );
}
