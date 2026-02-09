"use client";

import { useRouter } from "next/navigation";
import { updateReportStatus } from "@/app/actions/reports";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { ReportStatus } from "@/lib/types";

export function ReportStatusSelect({
  reportId,
  currentStatus,
}: {
  reportId: string;
  currentStatus: ReportStatus;
}) {
  const router = useRouter();

  async function handleChange(value: string) {
    const result = await updateReportStatus(reportId, value as ReportStatus);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Report status updated");
      router.refresh();
    }
  }

  return (
    <Select defaultValue={currentStatus} onValueChange={handleChange}>
      <SelectTrigger className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="pending">Pending</SelectItem>
        <SelectItem value="reviewed">Reviewed</SelectItem>
        <SelectItem value="resolved">Resolved</SelectItem>
        <SelectItem value="rejected">Rejected</SelectItem>
      </SelectContent>
    </Select>
  );
}
