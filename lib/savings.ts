// Size-saving calculations shared by the workspace, overview and history.
// Values are real byte counts; a larger output is reported as negative savings.

export const savedBytes = (originalBytes: number, outputBytes: number) => originalBytes - outputBytes;

/** ((original − optimized) / original) × 100, or null when there is nothing to compare (0-byte input). */
export const savedPercent = (originalBytes: number, outputBytes: number): number | null => {
  if (!Number.isFinite(originalBytes) || !Number.isFinite(outputBytes) || originalBytes <= 0) return null;
  return ((originalBytes - outputBytes) / originalBytes) * 100;
};

/** "−42%" for savings, "+12% larger" for growth, "0%" for no change, "—" when unknown. */
export const formatSavedPercent = (originalBytes: number, outputBytes: number): string => {
  const pct = savedPercent(originalBytes, outputBytes);
  if (pct === null) return '—';
  const rounded = Math.round(pct);
  if (rounded > 0) return `−${rounded}%`;
  if (rounded < 0) return `+${Math.abs(rounded)}% larger`;
  return '0%';
};

export interface SizeTotals { originalBytes: number; outputBytes: number; savedBytes: number }

/** Totals over successful results only (failed items carry no output and are excluded by the caller). */
export const sumTotals = (items: { originalBytes: number; outputBytes: number }[]): SizeTotals => {
  const originalBytes = items.reduce((s, i) => s + i.originalBytes, 0);
  const outputBytes = items.reduce((s, i) => s + i.outputBytes, 0);
  return { originalBytes, outputBytes, savedBytes: originalBytes - outputBytes };
};
