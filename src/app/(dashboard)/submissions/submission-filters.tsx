"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SubmissionFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get("status") ?? "all";

  return (
    <div className="flex items-center gap-3">
      <Select
        value={currentStatus}
        onValueChange={(value) => {
          const params = new URLSearchParams(searchParams.toString());
          if (value === "all") {
            params.delete("status");
          } else {
            params.set("status", value);
          }
          router.push(`/submissions?${params.toString()}`);
        }}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Filtra per stato" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tutti</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="approved">Approved</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
