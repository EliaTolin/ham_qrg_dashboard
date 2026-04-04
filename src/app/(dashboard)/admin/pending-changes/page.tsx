import { Suspense } from "react";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardCheck } from "lucide-react";
import type { SyncPendingChange, PendingChangeType } from "@/lib/types";
import { PendingChangesTable, type RepeaterSummary } from "./pending-changes-table";
import { FetchUpdatesButton } from "./fetch-updates-button";
import { DeleteAllButton } from "./delete-all-button";
import { ApproveAllButton } from "./approve-all-button";
import { PendingChangesFilters } from "./pending-changes-filters";

const VALID_TYPES = new Set<string>(["new", "update", "deactivate", "reactivate"]);

export default async function PendingChangesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; page?: string }>;
}) {
  const canReview = await hasPermission("sync.review");
  if (!canReview) redirect("/");

  const params = await searchParams;
  const supabase = await createClient();

  const PAGE_SIZE = 30;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const from = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from("sync_pending_changes" as never)
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  let countQuery = supabase
    .from("sync_pending_changes" as never)
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  if (params.type && VALID_TYPES.has(params.type)) {
    query = query.eq("change_type", params.type as PendingChangeType);
    countQuery = countQuery.eq("change_type", params.type as PendingChangeType);
  }

  const [{ data, error }, { count }] = await Promise.all([query, countQuery]);

  const totalCount = count ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
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
            {totalCount > 0 && (
              <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                {totalCount}
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <ApproveAllButton />
            <DeleteAllButton />
            <FetchUpdatesButton />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Suspense>
          <PendingChangesFilters />
        </Suspense>
        {error && (
          <p className="text-sm text-destructive">
            Errore: {error.message}
          </p>
        )}
        <PendingChangesTable
          changes={changes}
          repeaterMap={repeaterMap}
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
        />
      </CardContent>
    </Card>
  );
}
