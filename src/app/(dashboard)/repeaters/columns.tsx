"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { formatFrequency } from "@/lib/format";
import { getModeColor } from "@/lib/mode-colors";
import type { Repeater, RepeaterAccessWithNetwork } from "@/lib/types";

export type RepeaterRow = {
  repeater: Repeater;
  accesses: RepeaterAccessWithNetwork[];
};

export const columns: ColumnDef<RepeaterRow>[] = [
  {
    accessorKey: "repeater.callsign",
    header: "Callsign",
    cell: ({ row }) => (
      <span className="font-mono font-medium">
        {row.original.repeater.callsign ?? "—"}
      </span>
    ),
  },
  {
    accessorKey: "repeater.frequency_hz",
    header: "Frequency",
    cell: ({ row }) => formatFrequency(row.original.repeater.frequency_hz),
  },
  {
    accessorKey: "repeater.name",
    header: "Name",
    cell: ({ row }) => row.original.repeater.name ?? "—",
  },
  {
    accessorKey: "repeater.locality",
    header: "Locality",
    cell: ({ row }) => row.original.repeater.locality ?? "—",
  },
  {
    accessorKey: "repeater.region",
    header: "Region",
    cell: ({ row }) => row.original.repeater.region ?? "—",
  },
  {
    accessorKey: "repeater.province_code",
    header: "Province",
    cell: ({ row }) => row.original.repeater.province_code ?? "—",
  },
  {
    id: "modes",
    header: "Modes",
    cell: ({ row }) => {
      const modes = [
        ...new Set(row.original.accesses.map((a) => a.mode)),
      ];
      return (
        <div className="flex flex-wrap gap-1">
          {modes.map((mode) => (
            <Badge key={mode} variant="outline" className={getModeColor(mode)}>
              {mode}
            </Badge>
          ))}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <Button variant="ghost" size="icon" asChild>
        <Link href={`/repeaters/${row.original.repeater.id}`}>
          <Eye className="h-4 w-4" />
          <span className="sr-only">View</span>
        </Link>
      </Button>
    ),
  },
];
