"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatFrequency, formatShift } from "@/lib/format";
import { getModeColor } from "@/lib/mode-colors";
import { Badge } from "@/components/ui/badge";
import type { Repeater, RepeaterAccessWithNetwork } from "@/lib/types";

// Fix default marker icon path for Leaflet in bundlers
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

interface RepeaterMapItem {
  repeater: Repeater;
  accesses: RepeaterAccessWithNetwork[];
}

interface MapViewProps {
  initialRepeaters: RepeaterMapItem[];
  accessModes?: string[];
}

function BoundsWatcher({
  onBoundsChange,
}: {
  onBoundsChange: (bounds: L.LatLngBounds) => void;
}) {
  const map = useMapEvents({
    moveend() {
      onBoundsChange(map.getBounds());
    },
  });
  return null;
}

export default function MapView({
  initialRepeaters,
  accessModes,
}: MapViewProps) {
  const [repeaters, setRepeaters] =
    useState<RepeaterMapItem[]>(initialRepeaters);
  const [loading, setLoading] = useState(false);
  const supabaseRef = useRef(createClient());
  const abortRef = useRef<AbortController | null>(null);

  // Update when initialRepeaters change (e.g. from filter change)
  useEffect(() => {
    setRepeaters(initialRepeaters);
  }, [initialRepeaters]);

  const fetchRepeaters = useCallback(
    async (bounds: L.LatLngBounds) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();

      const params: Record<string, unknown> = {
        p_lat1: sw.lat,
        p_lon1: sw.lng,
        p_lat2: ne.lat,
        p_lon2: ne.lng,
      };
      if (accessModes && accessModes.length > 0) {
        params.p_access_modes = accessModes;
      }

      const { data } = await supabaseRef.current.rpc(
        "repeaters_in_bounds",
        params as never
      );

      if (controller.signal.aborted) return;

      if (data) {
        setRepeaters(
          (data as unknown as RepeaterMapItem[]).map((item) => ({
            repeater: item.repeater,
            accesses: (item.accesses as unknown as RepeaterAccessWithNetwork[]) ?? [],
          }))
        );
      }
      setLoading(false);
    },
    [accessModes]
  );

  const markers = useMemo(
    () =>
      repeaters.filter(
        (r) => r.repeater.lat != null && r.repeater.lon != null
      ),
    [repeaters]
  );

  return (
    <div className="relative h-full w-full">
      {loading && (
        <div className="absolute top-3 right-3 z-[1000] rounded-md bg-background/80 px-3 py-1.5 text-sm font-medium shadow-sm backdrop-blur">
          Caricamento...
        </div>
      )}
      <MapContainer
        center={[42.5, 12.5]}
        zoom={6}
        className="h-full w-full rounded-lg"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <BoundsWatcher onBoundsChange={fetchRepeaters} />
        {markers.map((item) => (
          <Marker
            key={item.repeater.id}
            position={[item.repeater.lat!, item.repeater.lon!]}
          >
            <Popup minWidth={220} maxWidth={300}>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-sm font-bold">
                    {item.repeater.callsign ?? item.repeater.name ?? "—"}
                  </span>
                  <Link
                    href={`/repeaters/${item.repeater.id}`}
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                  >
                    Dettagli
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
                <div className="text-xs text-muted-foreground">
                  <p>{formatFrequency(item.repeater.frequency_hz)}</p>
                  {item.repeater.shift_hz != null && (
                    <p>Shift: {formatShift(item.repeater.shift_hz)}</p>
                  )}
                  {item.repeater.locality && (
                    <p>{item.repeater.locality}</p>
                  )}
                </div>
                {item.accesses.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.accesses.map((access) => (
                      <span
                        key={access.id}
                        className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ${getModeColor(access.mode)}`}
                      >
                        {access.mode}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
