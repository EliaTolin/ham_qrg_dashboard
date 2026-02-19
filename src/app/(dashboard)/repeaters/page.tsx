import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/rbac";
import { DataTable } from "./data-table";
import { columns } from "./columns";
import { Filters } from "./filters";
import { SyncIz8wnhDialog } from "./sync-iz8wnh-dialog";
import type { Repeater, RepeaterAccessWithNetwork, AccessMode } from "@/lib/types";

type RepeaterRow = {
  repeater: Repeater;
  accesses: RepeaterAccessWithNetwork[];
  href: string;
};

export default async function RepeatersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; mode?: string; region?: string; page?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const pageSize = 25;

  let data: RepeaterRow[] = [];
  let count = 0;

  if (params.q) {
    // Search mode: fetch a large batch from the RPC then paginate client-side
    const { data: searchResults } = await supabase.rpc("search_repeaters", {
      p_query: params.q,
      p_limit: 500,
      p_access_modes: params.mode ? [params.mode] : undefined,
    });

    if (searchResults) {
      let rows = searchResults.map((r) => {
        const repeater = r.repeater as unknown as Repeater;
        return {
          repeater,
          accesses: (r.accesses as unknown as RepeaterAccessWithNetwork[]) ?? [],
          href: `/repeaters/${repeater.id}`,
        };
      });

      // Apply region filter client-side (RPC doesn't support it)
      if (params.region) {
        rows = rows.filter(
          (r) => r.repeater.region?.toUpperCase() === params.region!.toUpperCase()
        );
      }

      count = rows.length;
      const from = (page - 1) * pageSize;
      data = rows.slice(from, from + pageSize);
    }
  } else {
    // Browse mode: direct query with server-side pagination
    let query = supabase
      .from("repeaters")
      .select("*, repeater_access(*, networks(*))", { count: "exact" })
      .order("callsign", { ascending: true });

    if (params.region) {
      query = query.eq("region", params.region);
    }

    if (params.mode) {
      // Filter repeaters that have at least one access with the given mode
      // Use an inner join approach: filter on the embedded relation
      query = query.not("repeater_access", "is", null);
      query = query.eq("repeater_access.mode", params.mode as AccessMode);
    }

    const from = (page - 1) * pageSize;
    query = query.range(from, from + pageSize - 1);

    const { data: rows, count: totalCount } = await query;

    if (rows) {
      data = rows.map((r) => {
        const { repeater_access, ...repeater } = r;
        const accesses = (repeater_access ?? [])
          .filter((a) => !params.mode || a.mode === params.mode)
          .map((a) => {
            const { networks, ...access } = a;
            return {
              ...access,
              network: networks ?? null,
            } as unknown as RepeaterAccessWithNetwork;
          });
        const rep = repeater as unknown as Repeater;
        return {
          repeater: rep,
          accesses,
          href: `/repeaters/${rep.id}`,
        };
      });
    }
    count = totalCount ?? 0;
  }

  const totalPages = Math.ceil(count / pageSize);
  const canSync = await hasPermission("sync.trigger");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Filters />
        {canSync && <SyncIz8wnhDialog />}
      </div>
      <DataTable
        columns={columns}
        data={data}
        page={page}
        totalPages={totalPages}
        totalCount={count}
      />
    </div>
  );
}
