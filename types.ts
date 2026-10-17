
export interface OptimizationStep {
  label: string;
  width: number;
  height: number;
  quality: number;
  size: number;
}

export interface OptimizationResult {
  blob: Blob;
  width: number;
  height: number;
  quality: number;
  originalSize: number;
  compressedSize: number;
  originalUrl: string;
  compressedUrl: string;
  originalName: string;
  originalWidth: number;
  originalHeight: number;
  infoMessage?: string;
  strategyLabel?: string;
  extension: string;
  iterations: number;
  steps?: OptimizationStep[];
  initialStep?: {
    label: string;
    width: number;
    height: number;
    quality: number;
    size: number;
  };
}

// 'validating' and 'invalid' are set before an item reaches the optimizer.
export type QueueStatus = 'validating' | 'invalid' | 'pending' | 'processing' | 'completed' | 'error' | 'needs_confirmation';

export interface QueueItem {
  id: string;
  file: File;
  name: string;
  status: QueueStatus;
  result?: OptimizationResult;
  error?: string;
  previewUrl: string;
  /** Detected from the file's bytes during validation. */
  format?: string;
  width?: number;
  height?: number;
}

export type OutputFormat = 'webp' | 'jpeg' | 'png';
export type CompressionMode = 'smart' | 'basic';

export interface OptimizationSettings {
  mode: CompressionMode;
  outputFormat: OutputFormat;

  // Smart Mode Settings
  targetSizeKB: number;
  minQuality: number;
  minDimension: number; 
  useSmartDimension: boolean;
  minWidth?: number;
  minHeight?: number;

  // Basic Mode Settings
  targetQuality: number;
  resizeWidth?: number;
  resizeHeight?: number;
}