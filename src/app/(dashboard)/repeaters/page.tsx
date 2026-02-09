import { createClient } from "@/lib/supabase/server";
import { DataTable } from "./data-table";
import { columns } from "./columns";
import { Filters } from "./filters";
import type { Repeater, RepeaterAccessWithNetwork } from "@/lib/types";

type RepeaterRow = {
  repeater: Repeater;
  accesses: RepeaterAccessWithNetwork[];
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
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let data: RepeaterRow[] = [];
  let count = 0;

  if (params.q) {
    const { data: searchResults } = await supabase.rpc("search_repeaters", {
      p_query: params.q,
      p_limit: pageSize,
      p_access_modes: params.mode ? [params.mode] : undefined,
    });

    if (searchResults) {
      data = searchResults.map((r) => ({
        repeater: r.repeater as unknown as Repeater,
        accesses: (r.accesses as unknown as RepeaterAccessWithNetwork[]) ?? [],
      }));
      count = searchResults.length;
    }
  } else {
    let query = supabase
      .from("repeaters")
      .select("*, repeater_access(*, networks(*))", { count: "exact" })
      .order("callsign", { ascending: true })
      .range(from, to);

    if (params.region) {
      query = query.eq("region", params.region);
    }

    if (params.mode) {
      query = query.filter("repeater_access.mode", "eq", params.mode);
    }

    const { data: rows, count: totalCount } = await query;

    if (rows) {
      data = rows.map((r) => {
        const { repeater_access, ...repeater } = r;
        return {
          repeater: repeater as unknown as Repeater,
          accesses: (repeater_access ?? []).map((a) => {
            const { networks, ...access } = a;
            return {
              ...access,
              network: networks ?? null,
            } as unknown as RepeaterAccessWithNetwork;
          }),
        };
      });
    }
    count = totalCount ?? 0;
  }

  const totalPages = Math.ceil(count / pageSize);

  return (
    <div className="space-y-4">
      <Filters />
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
