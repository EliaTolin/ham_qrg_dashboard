"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateReportStatus } from "@/app/actions/reports";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { ReportStatus } from "@/lib/types";

export function ReportStatusSelect({
  reportId,
  currentStatus,
  currentResponse,
  showResponseField = false,
}: {
  reportId: string;
  currentStatus: ReportStatus;
  currentResponse?: string | null;
  showResponseField?: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<ReportStatus>(currentStatus);
  const [response, setResponse] = useState(currentResponse ?? "");
  const [loading, setLoading] = useState(false);

  const hasChanges =
    status !== currentStatus || (response ?? "") !== (currentResponse ?? "");

  async function handleSave() {
    setLoading(true);
    const result = await updateReportStatus(
      reportId,
      status,
      response.trim() || null
    );
    setLoading(false);

    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Report aggiornato");
      router.refresh();
    }
  }

  if (!showResponseField) {
    return (
      <Select
        defaultValue={currentStatus}
        onValueChange={async (value) => {
          const result = await updateReportStatus(
            reportId,
            value as ReportStatus
          );
          if (result?.error) {
            toast.error(result.error);
          } else {
            toast.success("Report aggiornato");
            router.refresh();
          }
        }}
      >
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

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Label className="text-sm text-muted-foreground">Stato</Label>
        <Select
          value={status}
          onValueChange={(v) => setStatus(v as ReportStatus)}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="coordinator-response" className="text-sm text-muted-foreground">
          Risposta coordinatore
        </Label>
        <Textarea
          id="coordinator-response"
          placeholder="Motivazione o risposta per l'utente..."
          value={response}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setResponse(e.target.value)}
          rows={3}
        />
      </div>

      <Button onClick={handleSave} disabled={!hasChanges || loading} size="sm">
        {loading ? "Salvataggio..." : "Salva modifiche"}
      </Button>
    </div>
  );
}