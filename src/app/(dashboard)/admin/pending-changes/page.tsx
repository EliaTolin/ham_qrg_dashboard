import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardCheck } from "lucide-react";
import type { SyncPendingChange } from "@/lib/types";
import { PendingChangesTable, type RepeaterSummary } from "./pending-changes-table";
import { FetchUpdatesButton } from "./fetch-updates-button";
import { DeleteAllButton } from "./delete-all-button";

export default async function PendingChangesPage() {
  const canReview = await hasPermission("sync.review");
  if (!canReview) redirect("/");

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sync_pending_changes" as never)
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(200);

  const changes = (data ?? []) as unknown as SyncPendingChange[];

  // Fetch linked repeaters with accesses for context
  const repeaterIds = changes
    .map((c) => c.repeater_id)
    .filter((id): id is string => id !== null);

  const repeaterMap: Record<string, RepeaterSummary> = {};
  if (repeaterIds.length > 0) {
    const { data: repeaters } = await supabase
      .from("repeaters")
      .select("id, name, callsign, frequency_hz, shift_hz, locality, locator, is_active, repeater_access(mode, ctcss_tx_hz, color_code, node_id, network:networks(name))")
      .in("id", [...new Set(repeaterIds)]);

    for (const r of (repeaters ?? []) as unknown as RepeaterSummary[]) {
      repeaterMap[r.id] = r;
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Pending Changes iz8wnh
            {changes.length > 0 && (
              <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                {changes.length}
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <DeleteAllButton />
            <FetchUpdatesButton />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <p className="text-sm text-destructive mb-4">
            Errore: {error.message}
          </p>
        )}
        <PendingChangesTable changes={changes} repeaterMap={repeaterMap} />
      </CardContent>
    </Card>
  );
}
