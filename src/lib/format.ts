export function formatFrequency(hz: number): string {
  const mhz = hz / 1_000_000;
  return `${mhz.toFixed(4)} MHz`;
}

export function formatShift(shiftHz: number | null): string {
  if (shiftHz == null) return "—";
  const mhz = shiftHz / 1_000_000;
  const sign = mhz >= 0 ? "+" : "";
  return `${sign}${mhz.toFixed(1)} MHz`;
}

export function formatCtcss(hz: number | null): string {
  if (hz == null) return "—";
  return `${(hz / 10).toFixed(1)} Hz`;
}
