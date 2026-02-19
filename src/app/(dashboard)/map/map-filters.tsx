"use client";

import { useQueryState } from "nuqs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
] as const;

export function MapFilters() {
  const [mode, setMode] = useQueryState("mode", { defaultValue: "all" });

  return (
    <div className="flex items-center gap-2">
      <Select value={mode} onValueChange={setMode}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Tutti i modi" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tutti i modi</SelectItem>
          {ACCESS_MODES.map((m) => (
            <SelectItem key={m} value={m}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
