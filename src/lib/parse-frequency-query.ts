export type FrequencyRange = {
  minHz: number;
  maxHz: number;
};

// ±1 kHz tolerance around the parsed frequency.
const TOLERANCE_HZ = 1000;

// Values below this threshold are treated as MHz, above as raw Hz.
const MHZ_THRESHOLD = 10_000;

export function parseFrequencyQuery(query: string): FrequencyRange | null {
  const trimmed = query.trim().replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return null;

  const n = parseFloat(trimmed);
  if (Number.isNaN(n)) return null;

  const hz = n < MHZ_THRESHOLD ? Math.round(n * 1_000_000) : Math.round(n);
  return {
    minHz: hz - TOLERANCE_HZ,
    maxHz: hz + TOLERANCE_HZ,
  };
}
