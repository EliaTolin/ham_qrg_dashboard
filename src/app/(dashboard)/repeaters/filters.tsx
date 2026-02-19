"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

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

const REGIONS = [
  "ABRUZZO",
  "BASILICATA",
  "CALABRIA",
  "CAMPANIA",
  "EMILIA-ROMAGNA",
  "FRIULI-VENEZIA GIULIA",
  "LAZIO",
  "LIGURIA",
  "LOMBARDIA",
  "MARCHE",
  "MOLISE",
  "PIEMONTE",
  "PUGLIA",
  "SARDEGNA",
  "SICILIA",
  "TOSCANA",
  "TRENTINO-ALTO ADIGE",
  "UMBRIA",
  "VALLE D'AOSTA",
  "VENETO",
];

export function Filters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

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
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateParams({ q: query || null });
  }

  function clearFilters() {
    setQuery("");
    router.push("/repeaters");
  }

  const hasFilters =
    searchParams.has("q") ||
    searchParams.has("mode") ||
    searchParams.has("region");

  return (
    <div className="flex flex-wrap items-center gap-3">
      <form onSubmit={handleSearch} className="flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search repeaters..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-64 pl-9"
          />
        </div>
        <Button type="submit" variant="secondary" size="sm">
          Search
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
          <SelectItem value="all">All Modes</SelectItem>
          {ACCESS_MODES.map((mode) => (
            <SelectItem key={mode} value={mode}>
              {mode}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("region") ?? "all"}
        onValueChange={(value) => updateParams({ region: value })}
      >
        <SelectTrigger className="w-52">
          <SelectValue placeholder="Region" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Regions</SelectItem>
          {REGIONS.map((region) => (
            <SelectItem key={region} value={region}>
              {region}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="mr-1 h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  );
}
