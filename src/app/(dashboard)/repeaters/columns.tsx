"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { formatFrequency, formatShift } from "@/lib/format";
import { getModeColor } from "@/lib/mode-colors";
import type { Repeater, RepeaterAccessWithNetwork } from "@/lib/types";

export type RepeaterRow = {
  repeater: Repeater;
  accesses: RepeaterAccessWithNetwork[];
  href: string;
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
    accessorKey: "repeater.shift_hz",
    header: "Shift",
    cell: ({ row }) => formatShift(row.original.repeater.shift_hz),
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
];
