"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useEffect, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";

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
  { value: "all", label: "Tutti" },
] as const;

export function PendingChangesFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isNavigating, startTransition] = useTransition();
  const currentType = searchParams.get("type") ?? "all";
  const currentStatus = searchParams.get("status") ?? "pending";
  const currentQuery = searchParams.get("q") ?? "";
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== currentQuery) {
      inputRef.current.value = currentQuery;
    }
  }, [currentQuery]);

  function setParam(key: string, value: string, defaults: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === defaults) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.delete("page");
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  }

  function handleSearch(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setParam("q", value.trim(), "");
    }, 300);
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        {isNavigating ? (
          <Loader2 className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground animate-spin" />
        ) : (
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        )}
        <Input
          ref={inputRef}
          placeholder="Cerca per nominativo o nome..."
          defaultValue={currentQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-9 max-w-sm"
        />
      </div>
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
