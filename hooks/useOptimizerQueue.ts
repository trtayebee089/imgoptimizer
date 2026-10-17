import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { optimizeImage } from '../utils/imageOptimizer';
import { QueueItem, QueueStatus, OptimizationSettings, OptimizationResult } from '../types';
import { apiRequest, ApiError } from '../lib/auth';
import {
  validateFileHead, validateDimensions, safeFileName, withExtension, uniqueNames,
  MAX_FILES_PER_ADD, MAX_QUEUE_SIZE,
} from '../lib/fileValidation';

// Queue state and actions for the optimizer workspace. Processing behaviour is
// unchanged from the original workspace: one image at a time, with the current
// settings, through utils/imageOptimizer (Smart or Basic mode). Items already
// within the Smart-mode target are held for review ("needs_confirmation").

const newId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);
const newBatchId = () => (crypto.randomUUID ? crypto.randomUUID().replace(/-/g, '') : newId() + newId()).slice(0, 32);

const loadDimensions = (url: string) => new Promise<{ width: number; height: number }>((resolve, reject) => {
  const img = new Image();
  img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
  img.onerror = () => reject(new Error('decode'));
  img.src = url;
});

const friendlyError = (err: unknown) => {
  const msg = err instanceof Error ? err.message : '';
  if (msg === 'Failed to load image') return "Your browser couldn't decode this image. Check that the file isn't damaged.";
  if (msg === 'Compression failed') return "Your browser couldn't encode this output format. Try WebP or JPEG.";
  if (msg === 'Canvas context unavailable') return 'Your browser ran out of memory for this image. Close other tabs and retry.';
  return 'This image could not be processed. Retry, or check that the file is a valid image.';
};

const skippedResult = (item: QueueItem, width: number, height: number): OptimizationResult => ({
  blob: item.file,
  width,
  height,
  quality: 1.0,
  originalSize: item.file.size,
  compressedSize: item.file.size,
  originalUrl: item.previewUrl,
  compressedUrl: item.previewUrl,
  originalName: item.file.name,
  originalWidth: width,
  originalHeight: height,
  infoMessage: 'Original Kept',
  strategyLabel: 'Skipped',
  extension: item.file.name.split('.').pop() || 'jpg',
  iterations: 0,
  steps: [],
});

export const isSkipped = (item: QueueItem) => item.result?.strategyLabel === 'Skipped';

export const downloadNameFor = (item: QueueItem) =>
  safeFileName(item.result ? withExtension(item.name, item.result.extension) : item.name);

const triggerDownload = (href: string, filename: string) => {
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

export interface Toast { id: number; message: string; tone: 'success' | 'error' | 'info' }

export const useOptimizerQueue = (initialSettings: OptimizationSettings) => {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [settings, setSettings] = useState<OptimizationSettings>(initialSettings);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<Toast | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const batchRef = useRef<string | null>(null);
  const queueRef = useRef(queue);
  queueRef.current = queue;

  const showToast = useCallback((message: string, tone: Toast['tone'] = 'success') => {
    const id = Date.now();
    setToast({ id, message, tone });
    setTimeout(() => setToast(t => (t?.id === id ? null : t)), 3200);
  }, []);

  const patchItem = useCallback((id: string, patch: Partial<QueueItem>) => {
    setQueue(prev => prev.map(item => (item.id === id ? { ...item, ...patch } : item)));
  }, []);

  // --- History (sizes and formats only; never image data or names) ---
  const recordHistory = useCallback((item: QueueItem, status: 'optimized' | 'failed', result: OptimizationResult | undefined, used: OptimizationSettings) => {
    if (!batchRef.current) batchRef.current = newBatchId();
    const record = {
      status,
      originalBytes: item.file.size,
      outputBytes: status === 'optimized' && result ? result.compressedSize : 0,
      inputFormat: item.format || (item.file.name.split('.').pop() || 'unknown').toLowerCase(),
      outputFormat: used.outputFormat,
      mode: used.mode,
    };
    apiRequest('/api/history', { method: 'POST', body: { batchId: batchRef.current, records: [record] } })
      .then(() => setHistoryError(null))
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) setHistoryError('Your session has ended, so new results are not being saved to your history.');
        else setHistoryError("Some results couldn't be saved to your history. Your optimized images are unaffected.");
      });
  }, []);

  // --- Adding files ---
  const addFiles = useCallback((files: File[]) => {
    if (files.length === 0) return;
    const room = Math.max(0, MAX_QUEUE_SIZE - queueRef.current.length);
    const accepted = files.slice(0, Math.min(MAX_FILES_PER_ADD, room));
    if (accepted.length < files.length) {
      showToast(room === 0
        ? `The queue is full (${MAX_QUEUE_SIZE} images). Clear finished images to add more.`
        : `Added ${accepted.length} of ${files.length} files. You can add up to ${MAX_FILES_PER_ADD} at a time.`, 'info');
    }
    const items: QueueItem[] = accepted.map(file => ({
      id: newId(), file, name: file.name, status: 'validating' as QueueStatus, previewUrl: URL.createObjectURL(file),
    }));
    setQueue(prev => [...prev, ...items]);

    const targetBytes = settings.targetSizeKB * 1024;
    const smart = settings.mode === 'smart';
    items.forEach(async (item) => {
      try {
        const head = new Uint8Array(await item.file.slice(0, 1024).arrayBuffer());
        const check = validateFileHead(item.file, head);
        if ('reason' in check) return patchItem(item.id, { status: 'invalid', error: check.reason });
        let dims: { width: number; height: number };
        try { dims = await loadDimensions(item.previewUrl); } catch {
          return patchItem(item.id, { status: 'invalid', format: check.format, error: "Your browser can't open this image. Convert it to JPEG or PNG first." });
        }
        const dimErr = validateDimensions(dims.width, dims.height);
        if (dimErr) return patchItem(item.id, { status: 'invalid', format: check.format, ...dims, error: dimErr });
        const isAlreadySmall = smart && item.file.size <= targetBytes;
        patchItem(item.id, { status: isAlreadySmall ? 'needs_confirmation' : 'pending', format: check.format, ...dims });
      } catch {
        patchItem(item.id, { status: 'invalid', error: "This file couldn't be read." });
      }
    });
  }, [settings.targetSizeKB, settings.mode, showToast, patchItem]);

  // --- Processing loop (one at a time, as before) ---
  useEffect(() => {
    const processNext = async () => {
      if (isProcessingQueue) return;
      const nextItem = queue.find(item => item.status === 'pending');
      if (!nextItem) return;

      setIsProcessingQueue(true);
      patchItem(nextItem.id, { status: 'processing', result: undefined, error: undefined });
      const used = settings;
      try {
        await new Promise(resolve => setTimeout(resolve, 50));
        const result = await optimizeImage(nextItem.file, used);
        patchItem(nextItem.id, { status: 'completed', result });
        recordHistory(nextItem, 'optimized', result, used);
      } catch (err) {
        console.error(err);
        patchItem(nextItem.id, { status: 'error', result: undefined, error: friendlyError(err) });
        recordHistory(nextItem, 'failed', undefined, used);
      } finally {
        setIsProcessingQueue(false);
      }
    };
    processNext();
  }, [queue, isProcessingQueue, settings, patchItem, recordHistory]);

  // A batch ends when nothing is waiting or running; the next image starts a new one.
  useEffect(() => {
    if (!queue.some(i => i.status === 'pending' || i.status === 'processing' || i.status === 'validating')) batchRef.current = null;
  }, [queue]);

  // --- Item actions ---
  const revoke = (item: QueueItem) => {
    URL.revokeObjectURL(item.previewUrl);
    if (item.result && item.result.compressedUrl !== item.previewUrl) URL.revokeObjectURL(item.result.compressedUrl);
  };

  const removeItems = useCallback((ids: string[]) => {
    const set = new Set(ids);
    setQueue(prev => {
      prev.filter(i => set.has(i.id)).forEach(revoke);
      return prev.filter(i => !set.has(i.id));
    });
    setSelected(prev => new Set([...prev].filter(id => !set.has(id))));
  }, []);

  const removeFromQueue = useCallback((id: string) => removeItems([id]), [removeItems]);

  const resetItems = useCallback((predicate: (item: QueueItem) => boolean) => {
    setQueue(prev => prev.map(item => {
      if (!predicate(item) || item.status === 'invalid' || item.status === 'validating') return item;
      if (item.result && item.result.compressedUrl !== item.previewUrl) URL.revokeObjectURL(item.result.compressedUrl);
      return { ...item, status: 'pending', result: undefined, error: undefined };
    }));
  }, []);

  const redoItem = useCallback((id: string) => resetItems(i => i.id === id), [resetItems]);

  const reprocess = useCallback((ids?: string[]) => {
    const set = ids ? new Set(ids) : null;
    resetItems(i => (set ? set.has(i.id) : true));
    showToast(set ? `Reprocessing ${set.size} ${set.size === 1 ? 'image' : 'images'}…` : 'Reprocessing all images…', 'info');
  }, [resetItems, showToast]);

  const renameItem = useCallback((id: string, newName: string) => {
    patchItem(id, { name: safeFileName(newName) });
  }, [patchItem]);

  const confirmItem = useCallback((id: string) => patchItem(id, { status: 'pending' }), [patchItem]);

  const skipItems = useCallback(async (ids: string[]) => {
    const items = queueRef.current.filter(i => ids.includes(i.id) && i.status === 'needs_confirmation');
    if (!items.length) return;
    const updates = await Promise.all(items.map(async (item) => {
      const dims = item.width && item.height ? { width: item.width, height: item.height } : await loadDimensions(item.previewUrl).catch(() => ({ width: 0, height: 0 }));
      return { id: item.id, result: skippedResult(item, dims.width, dims.height) };
    }));
    setQueue(prev => prev.map(item => {
      const u = updates.find(x => x.id === item.id);
      return u ? { ...item, status: 'completed', result: u.result } : item;
    }));
  }, []);

  const skipItem = useCallback((id: string) => skipItems([id]), [skipItems]);

  const confirmAllPending = useCallback(() => {
    setQueue(prev => prev.map(item => (item.status === 'needs_confirmation' ? { ...item, status: 'pending' } : item)));
    showToast('Optimizing the images under your target…', 'info');
  }, [showToast]);

  const skipAllPending = useCallback(() => {
    const ids = queueRef.current.filter(i => i.status === 'needs_confirmation').map(i => i.id);
    if (ids.length) { skipItems(ids); showToast(`Kept ${ids.length} original ${ids.length === 1 ? 'file' : 'files'}`, 'info'); }
  }, [skipItems, showToast]);

  const bulkRename = useCallback((base: string, ids?: string[]) => {
    const clean = safeFileName(base.trim(), '');
    if (!clean) return;
    const set = ids ? new Set(ids) : null;
    let n = 0;
    setQueue(prev => prev.map(item => {
      if (set && !set.has(item.id)) return item;
      n++;
      const extension = item.name.split('.').pop();
      return { ...item, name: `${clean}_${n}.${extension}` };
    }));
    showToast(`Renamed ${set ? set.size : queueRef.current.length} files`);
  }, [showToast]);

  const clearQueue = useCallback(() => {
    if (!queueRef.current.length) return;
    queueRef.current.forEach(revoke);
    setQueue([]);
    setSelected(new Set());
    showToast('Queue cleared', 'info');
  }, [showToast]);

  // --- Selection ---
  const toggleSelected = useCallback((id: string) => {
    setSelected(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }, []);
  const setAllSelected = useCallback((on: boolean) => {
    setSelected(on ? new Set(queueRef.current.map(i => i.id)) : new Set());
  }, []);

  // --- Downloads ---
  const completedOf = (ids?: string[]) => queueRef.current.filter(i => i.status === 'completed' && i.result && (!ids || ids.includes(i.id)));

  const downloadZip = useCallback(async (ids?: string[]) => {
    const items = completedOf(ids);
    if (!items.length) return showToast('No finished images to download', 'info');
    showToast('Preparing ZIP archive…', 'info');
    try {
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();
      const names = uniqueNames(items.map(downloadNameFor));
      // Images are already compressed, so STORE avoids wasting time and memory on deflate.
      items.forEach((item, idx) => zip.file(names[idx], item.result!.blob, { compression: 'STORE' }));
      setDownloadProgress(0);
      const content = await zip.generateAsync({ type: 'blob', streamFiles: true }, (meta) => setDownloadProgress(Math.round(meta.percent)));
      const url = URL.createObjectURL(content);
      triggerDownload(url, 'optimized_images.zip');
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      showToast('Download started');
    } catch (error) {
      console.error('ZIP download failed:', error);
      showToast("The ZIP couldn't be created. Try downloading files individually.", 'error');
    } finally {
      setTimeout(() => setDownloadProgress(null), 600);
    }
  }, [showToast]);

  const downloadIndividually = useCallback(async (ids?: string[]) => {
    const items = completedOf(ids);
    if (!items.length) return showToast('No finished images to download', 'info');
    setDownloadProgress(0);
    try {
      const names = uniqueNames(items.map(downloadNameFor));
      for (let i = 0; i < items.length; i++) {
        triggerDownload(items[i].result!.compressedUrl, names[i]);
        await new Promise(resolve => setTimeout(resolve, 300));
        setDownloadProgress(Math.round(((i + 1) / items.length) * 100));
      }
      showToast(items.length === 1 ? 'Download started' : `Started ${items.length} downloads`);
    } catch (error) {
      console.error('Download failed:', error);
      showToast('Download failed. Try again.', 'error');
    } finally {
      setTimeout(() => setDownloadProgress(null), 1000);
    }
  }, [showToast]);

  // --- Derived ---
  const counts = useMemo(() => {
    const c = { total: queue.length, validating: 0, invalid: 0, pending: 0, processing: 0, completed: 0, error: 0, needs_confirmation: 0 } as Record<QueueStatus | 'total', number>;
    queue.forEach(i => { c[i.status]++; });
    return c;
  }, [queue]);

  const totals = useMemo(() => {
    const done = queue.filter(i => i.status === 'completed' && i.result && !isSkipped(i));
    const originalBytes = done.reduce((s, i) => s + i.result!.originalSize, 0);
    const outputBytes = done.reduce((s, i) => s + i.result!.compressedSize, 0);
    return { count: done.length, originalBytes, outputBytes, savedBytes: originalBytes - outputBytes };
  }, [queue]);

  return {
    queue, settings, setSettings, isProcessingQueue, counts, totals,
    selected, toggleSelected, setAllSelected,
    toast, showToast, downloadProgress, historyError,
    addFiles, removeFromQueue, removeItems, redoItem, reprocess, renameItem,
    confirmItem, skipItem, confirmAllPending, skipAllPending, bulkRename, clearQueue,
    downloadZip, downloadIndividually,
  };
};

export type OptimizerQueue = ReturnType<typeof useOptimizerQueue>;
