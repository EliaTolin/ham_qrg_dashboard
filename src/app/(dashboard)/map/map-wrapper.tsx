"use client";

import dynamic from "next/dynamic";
import type { Repeater, RepeaterAccessWithNetwork } from "@/lib/types";

const MapView = dynamic(() => import("./map-view"), { ssr: false });

interface RepeaterMapItem {
  repeater: Repeater;
  accesses: RepeaterAccessWithNetwork[];
}

interface MapWrapperProps {
  initialRepeaters: RepeaterMapItem[];
  accessModes?: string[];
}

export function MapWrapper({ initialRepeaters, accessModes }: MapWrapperProps) {
  return (
    <MapView initialRepeaters={initialRepeaters} accessModes={accessModes} />
  );
}
