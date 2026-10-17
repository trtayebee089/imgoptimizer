import type { OptimizationSettings } from '../types';

// Defaults are the values the workspace has always started with (Balanced, WebP, Smart).
export const DEFAULT_SETTINGS: OptimizationSettings = {
  mode: 'smart',
  outputFormat: 'webp',
  targetSizeKB: 100,
  minQuality: 75,
  minDimension: 750,
  useSmartDimension: true,
  minWidth: undefined,
  minHeight: undefined,
  targetQuality: 90,
  resizeWidth: undefined,
  resizeHeight: undefined,
};

const num = (v: unknown, min: number, max: number): number | null =>
  typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max ? v : null;

const optNum = (v: unknown, min: number, max: number): number | undefined | null =>
  v === undefined || v === null ? undefined : num(v, min, max);

/** Returns a clean settings object, or null if any field is invalid. Used to validate saved preferences. */
export const sanitizeSettings = (input: unknown): OptimizationSettings | null => {
  if (!input || typeof input !== 'object') return null;
  const s = input as Record<string, unknown>;
  if (s.mode !== 'smart' && s.mode !== 'basic') return null;
  if (s.outputFormat !== 'webp' && s.outputFormat !== 'jpeg' && s.outputFormat !== 'png') return null;
  if (typeof s.useSmartDimension !== 'boolean') return null;
  const targetSizeKB = num(s.targetSizeKB, 1, 100000);
  const minQuality = num(s.minQuality, 1, 100);
  const minDimension = num(s.minDimension, 1, 20000);
  const targetQuality = num(s.targetQuality, 1, 100);
  const minWidth = optNum(s.minWidth, 0, 20000);
  const minHeight = optNum(s.minHeight, 0, 20000);
  const resizeWidth = optNum(s.resizeWidth, 1, 20000);
  const resizeHeight = optNum(s.resizeHeight, 1, 20000);
  if ([targetSizeKB, minQuality, minDimension, targetQuality, minWidth, minHeight, resizeWidth, resizeHeight].includes(null)) return null;
  return {
    mode: s.mode, outputFormat: s.outputFormat, useSmartDimension: s.useSmartDimension,
    targetSizeKB: targetSizeKB!, minQuality: minQuality!, minDimension: minDimension!, targetQuality: targetQuality!,
    minWidth: minWidth ?? undefined, minHeight: minHeight ?? undefined,
    resizeWidth: resizeWidth ?? undefined, resizeHeight: resizeHeight ?? undefined,
  };
};
