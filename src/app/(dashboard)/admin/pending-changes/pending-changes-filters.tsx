"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";

const FILTER_OPTIONS = [
  { value: "all", label: "Tutti" },
  { value: "new", label: "Nuovo" },
  { value: "update", label: "Aggiornamento" },
  { value: "deactivate", label: "Disattivazione" },
  { value: "reactivate", label: "Riattivazione" },
] as const;

export function PendingChangesFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("type") ?? "all";

  function handleClick(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("type");
    } else {
      params.set("type", value);
    }
    params.delete("page");
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {FILTER_OPTIONS.map((opt) => (
        <Badge
          key={opt.value}
          variant={current === opt.value ? "default" : "outline"}
          className="cursor-pointer select-none px-3 py-1.5 text-sm"
          onClick={() => handleClick(opt.value)}
        >
          {opt.label}
        </Badge>
      ))}
    </div>
  );
}
