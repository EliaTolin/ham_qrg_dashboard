import type { AccessMode } from "./types";

export const modeColors: Record<AccessMode, string> = {
  ANALOG: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  DMR: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  C4FM: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  DSTAR: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  ECHOLINK: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  SVX: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  APRS: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  BEACON: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  ATV: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  NXDN: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  ALLSTAR: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  WINLINK: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200",
};

export function getModeColor(mode: AccessMode): string {
  return modeColors[mode] ?? "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
}
