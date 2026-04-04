"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { approveAllPendingChanges } from "@/app/actions/pending-changes";

export function ApproveAllButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleApproveAll = () => {
    if (!confirm("Approvare e applicare tutte le modifiche in attesa?")) return;
    startTransition(async () => {
      const result = await approveAllPendingChanges();
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`${result.count} modifiche approvate e applicate`);
        router.refresh();
      }
    });
  };

  return (
    <Button
      size="sm"
      onClick={handleApproveAll}
      disabled={isPending}
    >
      <CheckCheck className="mr-1 h-3 w-3" />
      {isPending ? "Approvando..." : "Approva tutti"}
    </Button>
  );
}
