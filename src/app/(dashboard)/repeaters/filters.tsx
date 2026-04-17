"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback, useTransition } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Search, X } from "lucide-react";

const ACCESS_MODES = [
  "ANALOG",
  "DMR",
  "C4FM",
  "DSTAR",
  "ECHOLINK",
  "SVX",
  "APRS",
  "BEACON",
  "ATV",
  "NXDN",
  "ALLSTAR",
  "WINLINK",
];

export function Filters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [isPending, startTransition] = useTransition();

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "" || value === "all") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      params.delete("page");
      startTransition(() => {
        router.push(`?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateParams({ q: query || null });
  }

  function clearFilters() {
    setQuery("");
    startTransition(() => {
      router.push("/repeaters");
    });
  }

  const hasFilters =
    searchParams.has("q") ||
    searchParams.has("mode");

  return (
    <div className="flex flex-wrap items-center gap-3">
      <form onSubmit={handleSearch} className="flex items-center gap-2">
        <div className="relative">
          {isPending ? (
            <Loader2 className="absolute left-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          )}
          <Input
            placeholder="Cerca per callsign, nome, frequenza, localita'..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-80 pl-9"
          />
        </div>
        <Button type="submit" variant="secondary" size="sm" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              Ricerca...
            </>
          ) : (
            "Cerca"
          )}
        </Button>
      </form>

      <Select
        value={searchParams.get("mode") ?? "all"}
        onValueChange={(value) => updateParams({ mode: value })}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Access Mode" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tutti i modi</SelectItem>
          {ACCESS_MODES.map((mode) => (
            <SelectItem key={mode} value={mode}>
              {mode}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="mr-1 h-4 w-4" />
          Pulisci
        </Button>
      )}
    </div>
  );
}
