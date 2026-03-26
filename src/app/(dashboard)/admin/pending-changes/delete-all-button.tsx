"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteAllPendingChanges } from "@/app/actions/pending-changes";

export function DeleteAllButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDeleteAll = () => {
    if (!confirm("Eliminare tutte le modifiche in attesa?")) return;
    startTransition(async () => {
      const result = await deleteAllPendingChanges();
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Tutte le modifiche eliminate");
        router.refresh();
      }
    });
  };

  return (
    <Button
      size="sm"
      variant="destructive"
      onClick={handleDeleteAll}
      disabled={isPending}
    >
      <Trash2 className="mr-1 h-3 w-3" />
      Elimina tutti
    </Button>
  );
}
