"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

type FetchResult = {
  total_fetched: number;
  new_repeaters: number;
  updates: number;
  deactivations: number;
  reactivations: number;
  skipped_no_diff: number;
  skipped_local_newer: number;
  already_pending: number;
  errors: number;
};

export function FetchUpdatesButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleFetch() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke(
        "fetch_iz8wnh_updates",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (error) {
        toast.error(`Fetch fallito: ${error.message}`);
        return;
      }

      const result = data as FetchResult;
      const total =
        result.new_repeaters +
        result.updates +
        result.deactivations +
        result.reactivations;

      if (total === 0) {
        toast.info(
          `Nessuna nuova modifica (${result.total_fetched} record analizzati)`
        );
      } else {
        toast.success(
          `${total} modifiche trovate: ${result.new_repeaters} nuovi, ${result.updates} aggiornamenti, ${result.deactivations} disattivazioni, ${result.reactivations} riattivazioni`
        );
      }

      router.refresh();
    } catch (err) {
      toast.error(
        `Errore: ${err instanceof Error ? err.message : "Errore sconosciuto"}`
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleFetch}
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Fetching...
        </>
      ) : (
        <>
          <RefreshCw className="mr-2 h-4 w-4" />
          Fetch aggiornamenti
        </>
      )}
    </Button>
  );
}
