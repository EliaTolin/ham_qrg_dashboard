import { createClient } from "@/lib/supabase/server";
import { MapFilters } from "./map-filters";
import { MapWrapper } from "./map-wrapper";
import type { Repeater, RepeaterAccessWithNetwork } from "@/lib/types";

interface RepeaterMapItem {
  repeater: Repeater;
  accesses: RepeaterAccessWithNetwork[];
}

// Italy bounding box
const ITALY_BOUNDS = {
  p_lat1: 35.5,
  p_lon1: 6.5,
  p_lat2: 47.5,
  p_lon2: 19.0,
};

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const rpcParams: Record<string, unknown> = { ...ITALY_BOUNDS };
  const activeMode = params.mode && params.mode !== "all" ? params.mode : null;
  if (activeMode) {
    rpcParams.p_access_modes = [activeMode];
  }

  const { data } = await supabase.rpc(
    "repeaters_in_bounds",
    rpcParams as never
  );

  const repeaters: RepeaterMapItem[] = (data ?? []).map(
    (item: { repeater: Repeater; accesses: unknown }) => ({
      repeater: item.repeater,
      accesses:
        (item.accesses as unknown as RepeaterAccessWithNetwork[]) ?? [],
    })
  );

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col gap-4">
      <MapFilters />
      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border">
        <MapWrapper
          initialRepeaters={repeaters}
          accessModes={activeMode ? [activeMode] : undefined}
        />
      </div>
    </div>
  );
}
