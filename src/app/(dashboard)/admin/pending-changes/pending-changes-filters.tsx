"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function PendingChangesFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleTypeChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("type");
    } else {
      params.set("type", value);
    }
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-3">
      <Select
        value={searchParams.get("type") ?? "all"}
        onValueChange={handleTypeChange}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Filtra tipologia" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tutte le tipologie</SelectItem>
          <SelectItem value="new">Nuovo</SelectItem>
          <SelectItem value="update">Aggiornamento</SelectItem>
          <SelectItem value="deactivate">Disattivazione</SelectItem>
          <SelectItem value="reactivate">Riattivazione</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
