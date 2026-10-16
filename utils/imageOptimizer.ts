import { OptimizationResult, OptimizationSettings, OptimizationStep } from '../types';

// --- Helper Functions ---

const loadImage = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
};

const compressToBlob = (
  img: HTMLImageElement,
  width: number,
  height: number,
  quality: number,
  mimeType: string
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(width);
    canvas.height = Math.floor(height);
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Canvas context unavailable'));
      return;
    }

    // High quality scaling settings
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Compression failed'));
      },
      mimeType,
      quality
    );
  });
};

// --- Main Optimization Logic ---

export const optimizeImage = async (file: File, settings: OptimizationSettings): Promise<OptimizationResult> => {
  let mimeType = 'image/webp';
  let extension = 'webp';
  
  if (settings.outputFormat === 'jpeg') {
    mimeType = 'image/jpeg';
    extension = 'jpg';
  } else if (settings.outputFormat === 'png') {
    mimeType = 'image/png';
    extension = 'png';
  }

  const isPng = settings.outputFormat === 'png';
  const img = await loadImage(file);
  const originalW = img.width;
  const originalH = img.height;
  const aspectRatio = originalW / originalH;
  const history: OptimizationStep[] = [];

  if (settings.mode === 'basic') {
      history.push({ label: 'Original Input', width: originalW, height: originalH, quality: 1.0, size: file.size });
      const targetQuality = settings.targetQuality / 100;
      let targetW = originalW;
      let targetH = originalH;

      if (settings.resizeWidth && settings.resizeHeight) {
          targetW = settings.resizeWidth;
          targetH = settings.resizeHeight;
      } else if (settings.resizeWidth) {
          targetW = settings.resizeWidth;
          targetH = Math.round(targetW / aspectRatio);
      } else if (settings.resizeHeight) {
          targetH = settings.resizeHeight;
          targetW = Math.round(targetH * aspectRatio);
      }

      const blob = await compressToBlob(img, targetW, targetH, targetQuality, mimeType);
      history.push({ label: 'Basic Processing', width: targetW, height: targetH, quality: targetQuality, size: blob.size });

      return {
        blob, width: targetW, height: targetH, quality: targetQuality, originalSize: file.size, compressedSize: blob.size,
        originalUrl: img.src, compressedUrl: URL.createObjectURL(blob), originalName: file.name, originalWidth: originalW,
        originalHeight: originalH, extension, iterations: 1, steps: history
      };
  }

  const TARGET_BYTES = settings.targetSizeKB * 1024;
  const MIN_Q = settings.minQuality / 100;
  let effectiveMinW = 0;

  if (settings.useSmartDimension) {
      const MIN_DIM = settings.minDimension;
      effectiveMinW = Math.ceil(Math.max(MIN_DIM, MIN_DIM * aspectRatio));
  } else {
      const minW = settings.minWidth || 0;
      const minH = settings.minHeight || 0;
      effectiveMinW = Math.ceil(Math.max(minW, minH * aspectRatio));
      if (effectiveMinW === 0) effectiveMinW = 50;
  }

  const inputExtension = file.name.split('.').pop()?.toLowerCase();
  const isSameFormat = (inputExtension === 'jpg' || inputExtension === 'jpeg') && extension === 'jpg' ||
                       inputExtension === 'png' && extension === 'png' ||
                       inputExtension === 'webp' && extension === 'webp';

  if (file.size <= TARGET_BYTES && isSameFormat) {
    history.push({ label: 'Original (Target Met)', width: originalW, height: originalH, quality: 1.0, size: file.size });
    return {
      blob: file, width: originalW, height: originalH, quality: 1.0, originalSize: file.size, compressedSize: file.size,
      originalUrl: img.src, compressedUrl: img.src, originalName: file.name, originalWidth: originalW, originalHeight: originalH,
      infoMessage: "Original < Target Size", extension, iterations: 0, steps: history
    };
  }

  history.push({ label: 'Original Input', width: originalW, height: originalH, quality: 1.0, size: file.size });

  let strategy: 'photo' | 'graphic' = 'photo'; 
  let currentW = originalW;
  let currentH = originalH;
  let currentQ = 1.0;
  let loopCount = 0;
  const scaleDivisor = Math.floor((originalW - 0.5) / effectiveMinW);
  let scaledStrategyInfo = "";
  let initialStep = undefined;
  let blob: Blob;

  if (scaleDivisor >= 2) {
      currentW = Math.floor(originalW / scaleDivisor);
      currentH = Math.floor(originalH / scaleDivisor);
      const checkQuality = isPng ? 1.0 : 0.99; 
      const blobScaled = await compressToBlob(img, currentW, currentH, checkQuality, mimeType);
      history.push({ label: `Scaled 1/${scaleDivisor} (${Math.round(checkQuality * 100)}% Quality)`, width: currentW, height: currentH, quality: checkQuality, size: blobScaled.size });

      if (blobScaled.size <= TARGET_BYTES) {
          return {
            blob: blobScaled, width: currentW, height: currentH, quality: checkQuality, originalSize: file.size, compressedSize: blobScaled.size,
            originalUrl: img.src, compressedUrl: URL.createObjectURL(blobScaled), originalName: file.name, originalWidth: originalW,
            originalHeight: originalH, infoMessage: undefined, strategyLabel: `Scaled 1/${scaleDivisor} (Target Met)`, extension, iterations: 0, steps: history
          };
      }
      currentQ = checkQuality;
      blob = blobScaled;
      scaledStrategyInfo = `Scaled 1/${scaleDivisor}`;
      initialStep = { label: `Step 1 (Scaled 1/${scaleDivisor})`, width: currentW, height: currentH, quality: currentQ, size: blob.size };
  } else {
      blob = await compressToBlob(img, currentW, currentH, currentQ, mimeType);
      history.push({ label: `Initial (Full Res)`, width: currentW, height: currentH, quality: currentQ, size: blob.size });
  }
  
  const MAX_LOOPS = 25; 
  while (blob.size > TARGET_BYTES && loopCount < MAX_LOOPS) {
    loopCount++;
    const canReduceW = currentW > effectiveMinW;
    const canReduceQ = !isPng && currentQ > MIN_Q;
    if (!canReduceW && !canReduceQ) break;

    let action: 'reduce_q' | 'reduce_w' = 'reduce_w'; 
    if (strategy === 'photo' && !isPng) {
        if (currentQ > 0.80 && canReduceQ) action = 'reduce_q';
        else if (canReduceW) action = 'reduce_w';
        else if (canReduceQ) action = 'reduce_q';
    } else {
        if (canReduceQ) action = 'reduce_q';
        else if (canReduceW) action = 'reduce_w';
    }

    if (action === 'reduce_q') {
        currentQ = Math.max(MIN_Q, currentQ - 0.05);
        currentQ = Math.round(currentQ * 100) / 100;
    } else {
        currentW = Math.max(effectiveMinW, Math.floor(currentW * 0.9));
        currentH = Math.floor(currentW / aspectRatio);
    }

    if (blob.size > TARGET_BYTES * 5 && loopCount < 5 && action === 'reduce_w') {
        currentW = Math.max(effectiveMinW, Math.floor(currentW * 0.8));
        currentH = Math.floor(currentW / aspectRatio);
    }

    blob = await compressToBlob(img, currentW, currentH, currentQ, mimeType);
    history.push({ label: action === 'reduce_q' ? 'Reduced Quality' : 'Reduced Dimensions', width: currentW, height: currentH, quality: currentQ, size: blob.size });
  }

  let strategyLabel = scaledStrategyInfo ? (loopCount === 0 ? `${scaledStrategyInfo} (Target Met)` : `${scaledStrategyInfo} + Optimized`) : undefined;

  return {
    blob, width: currentW, height: currentH, quality: currentQ, originalSize: file.size, compressedSize: blob.size,
    originalUrl: img.src, compressedUrl: URL.createObjectURL(blob), originalName: file.name, originalWidth: originalW,
    originalHeight: originalH, strategyLabel, extension, iterations: loopCount, initialStep, steps: history
  };
};