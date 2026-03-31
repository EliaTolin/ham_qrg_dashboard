"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  updateSubmissionStatus,
  type SubmissionStatus,
} from "@/app/actions/submissions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function SubmissionStatusSelect({
  submissionId,
  currentStatus,
}: {
  submissionId: string;
  currentStatus: SubmissionStatus;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<SubmissionStatus>(currentStatus);
  const [loading, setLoading] = useState(false);

  const hasChanges = status !== currentStatus;

  async function handleSave() {
    setLoading(true);
    const result = await updateSubmissionStatus(submissionId, status);
    setLoading(false);

    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Segnalazione aggiornata");
      router.refresh();
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Select
        value={status}
        onValueChange={(v) => setStatus(v as SubmissionStatus)}
      >
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="approved">Approved</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
        </SelectContent>
      </Select>
      <Button onClick={handleSave} disabled={!hasChanges || loading} size="sm">
        {loading ? "Salvataggio..." : "Salva"}
      </Button>
    </div>
  );
}
