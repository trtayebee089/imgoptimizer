import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { DropZone } from '../components/DropZone';
import { QueueItem } from '../components/QueueItem';
import { SettingsPanel, summarizeSettings } from '../components/SettingsPanel';
import { CompareModal } from '../components/CompareModal';
import { Changelog } from '../components/Changelog';
import { UserGuide } from '../components/UserGuide';
import { Dashboard } from '../components/Dashboard';
import { AccountMenu } from '../components/AccountMenu';
import { AccountPage } from './AccountPage';
import { Logo, formatBytes } from '../components/ui';
import { optimizeImage } from '../utils/imageOptimizer';
import { StatsManager, GlobalStats } from '../utils/statsManager';
import { QueueItem as QueueItemType, QueueStatus, OptimizationSettings, OptimizationResult } from '../types';
import { Trash2, Download, Plus, Layers, CheckCircle2, SlidersHorizontal, RefreshCw, BarChart3, BookOpen, FastForward, RefreshCcw, ChevronDown, UploadCloud, Loader2, Play, FolderDown } from 'lucide-react';
import { Link, navigate } from '../lib/router';
import { AppTab, TAB_PATHS } from '../lib/routes';

import JSZip from 'jszip';

const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return matches;
};

const NAV: { id: AppTab; label: string; icon: React.ElementType }[] = [
  { id: 'workspace', label: 'Workspace', icon: Layers },
  { id: 'statistics', label: 'Statistics', icon: BarChart3 },
  { id: 'guide', label: 'Guide', icon: BookOpen },
];

const toolbarBtn = 'h-9 px-3 inline-flex items-center gap-1.5 rounded-lg text-[13px] font-medium text-muted hover:text-ink hover:bg-canvas disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap';

export const AppWorkspace: React.FC<{ activeTab: AppTab }> = ({ activeTab }) => {
  const [queue, setQueue] = useState<QueueItemType[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [viewingItem, setViewingItem] = useState<QueueItemType | null>(null);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });
  const [isMobileSettingsOpen, setIsMobileSettingsOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const pendingConfirmationCount = queue.filter(item => item.status === 'needs_confirmation').length;

  const [stats, setStats] = useState<GlobalStats>({ filesProcessed: 0, totalProcessedBytes: 0, savedBytes: 0 });

  useEffect(() => {
    StatsManager.getStats().then(setStats);
  }, []);
  
  const [settings, setSettings] = useState<OptimizationSettings>({
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
    resizeHeight: undefined
  });

  const dragCounter = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const showToast = useCallback((message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  }, []);

  const addToQueue = useCallback((files: File[]) => {
    if (window.location.pathname !== '/app') navigate('/app');
    const targetBytes = settings.targetSizeKB * 1024;
    
    const newItems: QueueItemType[] = files.map(file => {
      const isAlreadySmall = settings.mode === 'smart' && file.size <= targetBytes;
      return {
        id: Math.random().toString(36).substring(2) + Date.now().toString(36),
        file,
        name: file.name,
        status: isAlreadySmall ? 'needs_confirmation' : 'pending',
        previewUrl: URL.createObjectURL(file)
      };
    });
    
    setQueue(prev => [...prev, ...newItems]);
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      }
    }, 100);
  }, [settings.targetSizeKB, settings.mode]);

  const removeFromQueue = useCallback((id: string) => {
    setQueue(prev => {
        const item = prev.find(i => id === i.id);
        if (item) {
            URL.revokeObjectURL(item.previewUrl);
            if (item.result) URL.revokeObjectURL(item.result.compressedUrl);
        }
        return prev.filter(i => i.id !== id);
    });
  }, []);

  const redoItem = useCallback((id: string) => {
    setQueue(prev => prev.map(item => {
        if (item.id === id) {
            if (item.result) URL.revokeObjectURL(item.result.compressedUrl);
            return { ...item, status: 'pending', result: undefined, error: undefined };
        }
        return item;
    }));
  }, []);

  const redoAll = useCallback(() => {
    setQueue(prev => prev.map(item => {
        if (item.result) URL.revokeObjectURL(item.result.compressedUrl);
        return { ...item, status: 'pending', result: undefined, error: undefined };
    }));
    showToast("Re-processing all files...");
  }, [setQueue, showToast]);

  const renameItem = useCallback((id: string, newName: string) => {
    setQueue(prev => prev.map(item => 
        item.id === id ? { ...item, name: newName } : item
    ));
  }, []);

  const confirmItem = useCallback((id: string) => {
    setQueue(prev => prev.map(item => 
      item.id === id ? { ...item, status: 'pending' } : item
    ));
  }, []);

  const skipItem = useCallback(async (id: string) => {
    const item = queue.find(i => i.id === id);
    if (!item) return;

    const img = new Image();
    img.src = item.previewUrl;
    await new Promise(r => img.onload = r);

    const result: OptimizationResult = {
      blob: item.file,
      width: img.width,
      height: img.height,
      quality: 1.0,
      originalSize: item.file.size,
      compressedSize: item.file.size,
      originalUrl: item.previewUrl,
      compressedUrl: item.previewUrl,
      originalName: item.file.name,
      originalWidth: img.width,
      originalHeight: img.height,
      infoMessage: "Original Kept",
      strategyLabel: "Skipped",
      extension: item.file.name.split('.').pop() || 'jpg',
      iterations: 0,
      steps: []
    };

    setQueue(prev => prev.map(i => 
      i.id === id ? { ...i, status: 'completed', result } : i
    ));
  }, [queue]);

  const confirmAllPending = useCallback(() => {
    setQueue(prev => prev.map(item => 
      item.status === 'needs_confirmation' ? { ...item, status: 'pending' } : item
    ));
    showToast("Processing all files...");
  }, [showToast]);

  const skipAllPending = useCallback(async () => {
    const itemsToSkip = queue.filter(item => item.status === 'needs_confirmation');
    if (itemsToSkip.length === 0) return;

    showToast(`Skipping ${itemsToSkip.length} files...`);

    const updates = await Promise.all(itemsToSkip.map(async (item) => {
        const img = new Image();
        img.src = item.previewUrl;
        await new Promise(r => img.onload = r);
        
        const result: OptimizationResult = {
            blob: item.file,
            width: item.result?.width || img.width,
            height: item.result?.height || img.height,
            quality: 1.0,
            originalSize: item.file.size,
            compressedSize: item.file.size,
            originalUrl: item.previewUrl,
            compressedUrl: item.previewUrl,
            originalName: item.file.name,
            originalWidth: img.width,
            originalHeight: img.height,
            infoMessage: "Original Kept",
            strategyLabel: "Skipped",
            extension: item.file.name.split('.').pop() || 'jpg',
            iterations: 0,
            steps: []
        };
        return { id: item.id, result };
    }));

    setQueue(prev => prev.map(item => {
        const update = updates.find(u => u.id === item.id);
        if (update) {
            return { ...item, status: 'completed', result: update.result };
        }
        return item;
    }));
  }, [queue, showToast]);

  const handleRedoAll = useCallback(() => {
    const itemsToRedo = queue.filter(i => i.status === 'completed' || i.status === 'error');
    if (itemsToRedo.length === 0) return;

    setQueue(prev => prev.map(item => {
        if (item.status === 'completed' || item.status === 'error') {
            if (item.result) URL.revokeObjectURL(item.result.compressedUrl);
            return { ...item, status: 'pending', result: undefined, error: undefined };
        }
        return item;
    }));
    showToast("Reprocessing all images...");
  }, [queue, showToast]);

  const downloadAll = useCallback(async () => {
    const completedItems = queue.filter(i => i.status === 'completed' && i.result);
    if (completedItems.length === 0) return;

    showToast("Preparing ZIP archive...");
    
    try {
        const zip = new JSZip();
        let count = 0;
        
        for (const item of completedItems) {
            if (item.result) {
                const blob = item.result.blob;
                
                const nameParts = item.file.name.split('.');
                nameParts.pop();
                nameParts.push(item.result.extension);
                const newName = nameParts.join('.');
                
                zip.file(newName, blob);
                count++;
            }
        }
        
        if (count === 0) {
            showToast("No completed items to download");
            return;
        }

        const content = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(content);
        const a = document.createElement("a");
        a.href = url;
        a.download = "optimized_images.zip";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast("Download started");
    } catch (error) {
        console.error("Download failed:", error);
        showToast("Download failed");
    }
  }, [queue, showToast]);

  const [isBulkRenameOpen, setIsBulkRenameOpen] = useState(false);
  const [bulkRenameBase, setBulkRenameBase] = useState('');
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);

  const bulkRename = useCallback(() => {
    if (!bulkRenameBase.trim()) return;
    
    setQueue(prev => prev.map((item, index) => {
        const extension = item.name.split('.').pop();
        const newName = `${bulkRenameBase}_${index + 1}.${extension}`;
        return { ...item, name: newName };
    }));
    
    setIsBulkRenameOpen(false);
    setBulkRenameBase('');
    showToast(`Renamed ${queue.length} files`);
  }, [queue, bulkRenameBase, showToast]);

  const downloadIndividually = useCallback(async () => {
    const completedItems = queue.filter(i => i.status === 'completed' && i.result);
    if (completedItems.length === 0) return;

    setDownloadProgress(0);
    
    try {
        for (let i = 0; i < completedItems.length; i++) {
            const item = completedItems[i];
            
            if (item.result) {
                const a = document.createElement("a");
                a.href = item.result.compressedUrl;
                
                const nameParts = item.name.split('.');
                nameParts.pop();
                nameParts.push(item.result.extension);
                a.download = nameParts.join('.');
                
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                
                await new Promise(resolve => setTimeout(resolve, 300));
            }
            setDownloadProgress(Math.round(((i + 1) / completedItems.length) * 100));
        }
        showToast("All files downloaded");
    } catch (error) {
        console.error("Download failed:", error);
        showToast("Download failed");
    } finally {
        setTimeout(() => setDownloadProgress(null), 1000);
    }
  }, [queue, showToast]);

  const clearQueue = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (queue.length === 0) return;
    queue.forEach(item => {
        URL.revokeObjectURL(item.previewUrl);
        if (item.result) URL.revokeObjectURL(item.result.compressedUrl);
    });
    setQueue([]);
    showToast("Queue cleared");
  }, [queue, showToast]);

  const updateItemStatus = (id: string, status: QueueStatus, result?: any, error?: string) => {
    setQueue(prev => prev.map(item => 
        item.id === id ? { ...item, status, result, error } : item
    ));
  };

  useEffect(() => {
    const processNext = async () => {
        if (isProcessingQueue) return;
        const nextItem = queue.find(item => item.status === 'pending');
        if (!nextItem) return;

        setIsProcessingQueue(true);
        updateItemStatus(nextItem.id, 'processing');

        try {
            await new Promise(resolve => setTimeout(resolve, 50));
            const result = await optimizeImage(nextItem.file, settings);
            updateItemStatus(nextItem.id, 'completed', result);
            
            const savedAmount = (result.originalSize > result.compressedSize) 
              ? result.originalSize - result.compressedSize 
              : 0;
            await StatsManager.updateStats(result.originalSize, savedAmount);

        } catch (err) {
            console.error(err);
            updateItemStatus(nextItem.id, 'error', undefined, "Failed");
        } finally {
            setIsProcessingQueue(false);
        }
    };
    processNext();
  }, [queue, isProcessingQueue, settings]);

  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current += 1;
      if (e.dataTransfer && e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        setIsDragging(true);
      }
    };
    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current -= 1;
      if (dragCounter.current === 0) setIsDragging(false);
    };
    const handleDragOver = (e: DragEvent) => e.preventDefault();
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      dragCounter.current = 0;
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
         const imageFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
         if (imageFiles.length > 0) addToQueue(imageFiles);
         const rejected = e.dataTransfer.files.length - imageFiles.length;
         if (rejected > 0) showToast(`Skipped ${rejected} non-image ${rejected === 1 ? 'file' : 'files'}`);
      }
    };
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (items) {
        const files: File[] = [];
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            if (file) files.push(file);
          }
        }
        if (files.length > 0) addToQueue(files);
      }
    };
    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);
    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
      window.removeEventListener('paste', handlePaste);
    };
  }, [addToQueue, showToast]);

  // Refresh the shared statistics whenever the Statistics page is opened.
  useEffect(() => {
    if (activeTab === 'statistics') StatsManager.getStats().then(setStats);
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
  }, [activeTab]);

  const completedItems = useMemo(() => queue.filter(i => i.status === 'completed' && i.result), [queue]);
  const sessionOriginal = completedItems.reduce((sum, i) => sum + (i.result?.originalSize || 0), 0);
  const sessionOutput = completedItems.reduce((sum, i) => sum + (i.result?.compressedSize || 0), 0);
  const sessionSaved = sessionOriginal - sessionOutput;
  const remainingCount = queue.filter(i => i.status === 'pending' || i.status === 'processing').length;
  const failedCount = queue.filter(i => i.status === 'error').length;

  const renderWorkspace = () => (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      <header className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl md:text-[28px] font-bold tracking-tight text-ink">Workspace</h1>
          <p className="text-sm text-muted mt-1">Images are processed locally in your browser.</p>
        </div>
        {queue.length > 0 && (
          <button type="button" onClick={() => fileInputRef.current?.click()} className="h-10 px-4 inline-flex items-center gap-2 rounded-lg bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 shadow-card">
            <Plus size={17} aria-hidden="true" /> Add images
          </button>
        )}
      </header>

      {!isDesktop && (
        <div className="mb-5 bg-white border border-line rounded-xl shadow-card">
          <button
            type="button"
            onClick={() => setIsMobileSettingsOpen(o => !o)}
            aria-expanded={isMobileSettingsOpen}
            aria-controls="mobile-settings"
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left rounded-xl"
          >
            <span className="w-9 h-9 rounded-lg bg-brand-50 text-brand-500 flex items-center justify-center shrink-0" aria-hidden="true"><SlidersHorizontal size={18} /></span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-semibold text-ink">Optimization settings</span>
              <span className="block text-xs text-muted truncate">{summarizeSettings(settings)}</span>
            </span>
            <ChevronDown size={18} className={`text-muted shrink-0 transition-transform ${isMobileSettingsOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
          {isMobileSettingsOpen && (
            <div id="mobile-settings" className="px-4 pt-5 pb-2 border-t border-line">
              <SettingsPanel settings={settings} onChange={setSettings} />
            </div>
          )}
        </div>
      )}

      {queue.length === 0 ? (
        <DropZone onFilesSelect={addToQueue} isDragging={isDragging} />
      ) : (
        <>
          {/* Queue toolbar */}
          <div className="bg-white border border-line rounded-xl shadow-card mb-4 relative overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div role="status" aria-live="polite" className="flex items-center gap-2.5 text-sm min-w-0">
                {isProcessingQueue || remainingCount > 0
                  ? <Loader2 size={18} className="animate-spin text-brand-500 shrink-0" aria-hidden="true" />
                  : <CheckCircle2 size={18} className="text-success-500 shrink-0" aria-hidden="true" />}
                <span className="text-ink">
                  <span className="font-semibold tabular-nums">{completedItems.length}</span> of <span className="tabular-nums">{queue.length}</span> {queue.length === 1 ? 'image' : 'images'} done
                  {failedCount > 0 && <span className="text-danger-600"> · {failedCount} failed</span>}
                </span>
                {sessionSaved > 0 && (
                  <span className="text-muted hidden sm:inline tabular-nums">· saved {formatBytes(sessionSaved)} ({Math.round((sessionSaved / sessionOriginal) * 100)}%)</span>
                )}
              </div>
              <button
                type="button"
                onClick={downloadAll}
                disabled={completedItems.length === 0}
                className="h-9 px-3.5 inline-flex items-center gap-2 rounded-lg bg-brand-500 text-white text-[13px] font-semibold hover:bg-brand-600 disabled:bg-brand-300 disabled:cursor-not-allowed shadow-card"
              >
                <FolderDown size={16} aria-hidden="true" /> Download ZIP
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-t border-line bg-canvas/50">
              <button type="button" onClick={downloadIndividually} disabled={completedItems.length === 0} className={toolbarBtn} title="Download each completed image separately">
                <Download size={15} aria-hidden="true" /> Download files
              </button>
              <button type="button" onClick={() => setIsBulkRenameOpen(true)} className={toolbarBtn} title="Rename all files with a common base name">
                <RefreshCw size={15} aria-hidden="true" /> Rename all
              </button>
              <button type="button" onClick={redoAll} className={toolbarBtn} title="Process every image again with the current settings">
                <RefreshCcw size={15} aria-hidden="true" /> Reprocess all
              </button>
              <button type="button" onClick={clearQueue} className={toolbarBtn + ' ml-auto hover:!text-danger-600 hover:!bg-danger-50'} title="Remove all images from the queue">
                <Trash2 size={15} aria-hidden="true" /> Clear
              </button>
            </div>
            {downloadProgress !== null && (
              <div className="absolute bottom-0 left-0 h-1 bg-brand-500 transition-all duration-300" style={{ width: `${downloadProgress}%` }} role="progressbar" aria-valuenow={downloadProgress} aria-valuemin={0} aria-valuemax={100} aria-label="Download progress"></div>
            )}
          </div>

          {pendingConfirmationCount > 0 && (
            <div className="mb-4 rounded-xl border border-warning-500/30 bg-warning-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
              <p className="text-sm text-warning-700 flex-1">
                <span className="font-semibold">{pendingConfirmationCount} {pendingConfirmationCount === 1 ? 'image is' : 'images are'}</span> already within your target size. Optimize anyway, or keep the originals?
              </p>
              <div className="flex gap-2 shrink-0">
                <button type="button" onClick={skipAllPending} className="h-8 px-3 inline-flex items-center gap-1.5 rounded-lg border border-line-strong bg-white text-[13px] font-semibold text-ink hover:bg-canvas">
                  <FastForward size={14} aria-hidden="true" /> Keep originals
                </button>
                <button type="button" onClick={confirmAllPending} className="h-8 px-3 inline-flex items-center gap-1.5 rounded-lg bg-brand-500 text-white text-[13px] font-semibold hover:bg-brand-600">
                  <Play size={14} aria-hidden="true" /> Optimize all
                </button>
              </div>
            </div>
          )}

          <ul className="space-y-3" aria-label="Image queue">
            {queue.map(item => (
              <QueueItem key={item.id} item={item} onRemove={removeFromQueue} onRedo={redoItem} onConfirm={confirmItem} onSkip={skipItem} onCompare={() => setViewingItem(item)} onToast={showToast} onRename={renameItem} />
            ))}
          </ul>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 w-full py-6 rounded-xl border-2 border-dashed border-line-strong bg-white/60 text-muted hover:text-brand-600 hover:border-brand-400 hover:bg-brand-50/40 flex items-center justify-center gap-2 text-sm font-semibold transition-colors"
          >
            <Plus size={18} aria-hidden="true" /> Add more images
          </button>
        </>
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'statistics':
        return <Dashboard stats={stats} />;
      case 'guide':
        return <UserGuide />;
      case 'updates':
        return <div className="py-6 md:py-10"><Changelog /></div>;
      case 'account':
        return <AccountPage />;
      case 'workspace':
      default:
        return renderWorkspace();
    }
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-canvas text-ink overflow-hidden">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[300] focus:bg-white focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-raised">Skip to content</a>

      {/* App header */}
      <header className="h-16 shrink-0 bg-white border-b border-line flex items-center gap-3 px-4 sm:px-6 relative z-40">
        <Logo to="/app" />
        <nav aria-label="Primary" className="hidden md:flex items-center gap-1 ml-6">
          {NAV.map(n => {
            const active = activeTab === n.id;
            return (
              <Link
                key={n.id}
                to={TAB_PATHS[n.id]}
                aria-current={active ? 'page' : undefined}
                className={`h-9 px-3 inline-flex items-center gap-2 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-brand-50 text-brand-700' : 'text-muted hover:text-ink hover:bg-canvas'}`}
              >
                <n.icon size={16} aria-hidden="true" />{n.label}
                {n.id === 'workspace' && queue.length > 0 && <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-brand-500 text-white text-[11px] font-semibold flex items-center justify-center tabular-nums" aria-label={`${queue.length} in queue`}>{queue.length}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          {isProcessingQueue && activeTab !== 'workspace' && (
            <Link to="/app" className="hidden sm:inline-flex items-center gap-2 text-[13px] text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full">
              <Loader2 size={13} className="animate-spin" aria-hidden="true" /> Optimizing…
            </Link>
          )}
          <AccountMenu />
        </div>
      </header>

      {/* Mobile tab bar */}
      <nav aria-label="Primary" className="md:hidden shrink-0 bg-white border-b border-line grid grid-cols-3">
        {NAV.map(n => {
          const active = activeTab === n.id;
          return (
            <Link
              key={n.id}
              to={TAB_PATHS[n.id]}
              aria-current={active ? 'page' : undefined}
              className={`h-11 inline-flex items-center justify-center gap-1.5 text-[13px] font-medium border-b-2 ${active ? 'border-brand-500 text-brand-700' : 'border-transparent text-muted'}`}
            >
              <n.icon size={15} aria-hidden="true" />{n.label}
              {n.id === 'workspace' && queue.length > 0 && <span className="text-[11px] text-brand-600 tabular-nums">({queue.length})</span>}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1 flex min-h-0">
        <main id="main" ref={scrollContainerRef} className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
          {renderContent()}
        </main>

        {activeTab === 'workspace' && isDesktop && (
          <aside aria-labelledby="settings-heading" className="w-[340px] shrink-0 bg-white border-l border-line overflow-y-auto">
            <div className="px-5 h-14 flex items-center border-b border-line sticky top-0 bg-white z-10">
              <h2 id="settings-heading" className="text-sm font-semibold text-ink font-sans flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-brand-500" aria-hidden="true" /> Optimization settings
              </h2>
            </div>
            <SettingsPanel settings={settings} onChange={setSettings} className="px-5 py-5" />
          </aside>
        )}
      </div>

      {/* Drag overlay */}
      <div className={`fixed inset-0 z-[100] bg-brand-500/10 backdrop-blur-[2px] flex items-center justify-center p-6 transition-opacity duration-200 pointer-events-none`} style={{ opacity: isDragging ? 1 : 0 }} aria-hidden="true">
        <div className="absolute inset-3 rounded-2xl border-2 border-dashed border-brand-500"></div>
        <div className="relative bg-white rounded-2xl shadow-overlay px-8 py-7 text-center">
          <div className="w-12 h-12 rounded-xl bg-brand-500 text-white flex items-center justify-center mx-auto mb-3"><UploadCloud size={24} /></div>
          <p className="text-lg font-semibold text-ink">Drop images to add them</p>
          <p className="text-sm text-muted mt-1">They will be optimized with your current settings.</p>
        </div>
      </div>

      <input type="file" multiple accept="image/*" ref={fileInputRef} className="hidden" aria-label="Add image files" onChange={(e) => { if (e.target.files && e.target.files.length > 0) { addToQueue(Array.from(e.target.files)); e.target.value = ''; } }} />
      {viewingItem && viewingItem.result && <CompareModal originalUrl={viewingItem.previewUrl} compressedUrl={viewingItem.result.compressedUrl} filename={viewingItem.file.name} onClose={() => setViewingItem(null)} />}

      {/* Bulk rename dialog */}
      {isBulkRenameOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="bulk-rename-title" onKeyDown={(e) => { if (e.key === 'Escape') setIsBulkRenameOpen(false); }}>
              <div className="absolute inset-0 bg-ink/50" onClick={() => setIsBulkRenameOpen(false)} aria-hidden="true"></div>
              <form
                className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-overlay"
                onSubmit={(e) => { e.preventDefault(); bulkRename(); }}
              >
                  <h2 id="bulk-rename-title" className="text-lg font-semibold text-ink font-sans">Rename all files</h2>
                  <p className="text-sm text-muted mt-1 mb-4">Files will be named <span className="font-medium text-ink">{(bulkRenameBase.trim() || 'name')}_1</span>, <span className="font-medium text-ink">{(bulkRenameBase.trim() || 'name')}_2</span>, and so on.</p>
                  <label htmlFor="bulk-rename-input" className="block text-sm font-medium text-ink mb-1.5">Base name</label>
                  <input
                      id="bulk-rename-input"
                      type="text"
                      autoFocus
                      value={bulkRenameBase}
                      onChange={(e) => setBulkRenameBase(e.target.value)}
                      placeholder="e.g. photo"
                      className="w-full h-11 px-3.5 rounded-lg border border-line-strong text-[15px] focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 mb-5"
                  />
                  <div className="flex gap-2 justify-end">
                      <button type="button" onClick={() => setIsBulkRenameOpen(false)} className="h-10 px-4 rounded-lg text-sm font-semibold text-muted hover:text-ink hover:bg-canvas">Cancel</button>
                      <button type="submit" disabled={!bulkRenameBase.trim()} className="h-10 px-4 rounded-lg text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300">Rename all</button>
                  </div>
              </form>
          </div>
      )}

      {/* Toast */}
      <div role="status" aria-live="polite" className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[250] transition-all duration-300 ${toast.visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'}`}>
        {toast.visible && (
          <div className="flex items-center gap-2.5 bg-ink text-white pl-3 pr-4 py-2.5 rounded-xl shadow-overlay text-sm font-medium max-w-[calc(100vw-2rem)]">
            <CheckCircle2 size={17} className="text-success-500 shrink-0" aria-hidden="true" />
            <span className="truncate">{toast.message}</span>
          </div>
        )}
      </div>
      <style>{`@keyframes op-indeterminate { 0% { transform: translateX(-100%); } 100% { transform: translateX(300%); } }`}</style>
    </div>
  );
};
