"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

type SyncResult = {
  run_id: string;
  total_stations: number;
  dry_run: boolean;
};

export function SyncIz8wnhDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);

  async function handleSync() {
    setLoading(true);
    setResult(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke(
        "sync_repeater_iz8wnh",
        {
          method: "POST",
          body: JSON.stringify({ dry_run: false }),
          headers: { "Content-Type": "application/json" },
        }
      );

      if (error) {
        toast.error(`Sync failed: ${error.message}`);
        return;
      }

      setResult(data as SyncResult);
      toast.success("Sync completed successfully");
    } catch (err) {
      toast.error(
        `Unexpected error: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      setLoading(false);
    }
  }

  function handleOpenChange(value: boolean) {
    setOpen(value);
    if (!value) {
      setResult(null);
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Sync IZ8WNH
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sync Repeaters IZ8WNH</DialogTitle>
          <DialogDescription>
            Synchronize repeater data from the IZ8WNH source.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-2 rounded-md border p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Run ID</span>
              <span className="font-mono">{result.run_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Stations</span>
              <span className="font-mono">{result.total_stations}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dry Run</span>
              <span className="font-mono">
                {result.dry_run ? "Yes" : "No"}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            This will fetch the latest repeater data from IZ8WNH and update the
            database.
          </p>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            {result ? "Close" : "Cancel"}
          </Button>
          {!result && (
            <Button onClick={handleSync} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                "Start Sync"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
