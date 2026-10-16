
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DropZone } from './components/DropZone';
import { QueueItem } from './components/QueueItem';
import { SettingsPanel } from './components/SettingsPanel';
import { CompareModal } from './components/CompareModal';
import { Changelog } from './components/Changelog';
import { UserGuide } from './components/UserGuide';
import { Dashboard } from './components/Dashboard';
import { ParticleBackground } from './components/ParticleBackground';
import { optimizeImage } from './utils/imageOptimizer';
import { StatsManager } from './utils/statsManager';
import { QueueItem as QueueItemType, QueueStatus, OptimizationSettings, OptimizationResult } from './types';
import { Trash2, Download, Plus, Zap, Layers, CheckCircle2, Settings2, RefreshCw, AlertTriangle, Moon, Sun, History, LayoutDashboard, PanelRightClose, PanelRight, Monitor, ChevronDown, BookOpen, FastForward, RefreshCcw } from 'lucide-react';

import JSZip from 'jszip';

type AppTab = 'workspace' | 'dashboard' | 'guide' | 'changelog';
type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Custom hook to enable drag-to-scroll on an element
 */
const useDraggableScroll = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const onMouseDown = (e: React.MouseEvent) => {
    if (!ref.current) return;
    setIsDown(true);
    setStartX(e.pageX - ref.current.offsetLeft);
    setScrollLeft(ref.current.scrollLeft);
  };

  const onMouseLeave = () => setIsDown(false);
  const onMouseUp = () => setIsDown(false);

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDown || !ref.current) return;
    e.preventDefault();
    const x = e.pageX - ref.current.offsetLeft;
    const walk = (x - startX) * 2;
    ref.current.scrollLeft = scrollLeft - walk;
  };

  return {
    ref,
    props: {
      onMouseDown,
      onMouseLeave,
      onMouseUp,
      onMouseMove,
      style: { cursor: isDown ? 'grabbing' : 'grab', userSelect: 'none' as any }
    }
  };
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('workspace');
  const [queue, setQueue] = useState<QueueItemType[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [viewingItem, setViewingItem] = useState<QueueItemType | null>(null);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });
  const [isSettingsOpen, setIsSettingsOpen] = useState(window.innerWidth > 1024);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  
  const navScroll = useDraggableScroll();

  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
        return (localStorage.getItem('theme-mode') as ThemeMode) || 'system';
    }
    return 'system';
  });

  const pendingConfirmationCount = queue.filter(item => item.status === 'needs_confirmation').length;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const applyTheme = useCallback((mode: ThemeMode) => {
    const root = document.documentElement;
    let effectiveTheme: 'light' | 'dark' = 'dark';
    
    if (mode === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      effectiveTheme = mode;
    }

    if (effectiveTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    applyTheme(themeMode);
    localStorage.setItem('theme-mode', themeMode);

    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [themeMode, applyTheme]);

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
    setActiveTab('workspace');
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
      aiUsed: false,
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
            aiUsed: false,
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
  }, [addToQueue]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard stats={stats} onNavigate={setActiveTab} />;
      case 'guide':
        return <UserGuide />;
      case 'changelog':
        return <Changelog />;
      case 'workspace':
      default:
        return queue.length === 0 ? (
          <div className="h-full flex flex-col justify-center items-center">
            <DropZone onFilesSelect={addToQueue} />
          </div>
        ) : (
          <div className="max-w-5xl mx-auto space-y-4 pb-24 animate-in fade-in slide-in-from-bottom-2 duration-700 px-4 md:px-0">
            {queue.map(item => (
              <QueueItem key={item.id} item={item} onRemove={removeFromQueue} onRedo={redoItem} onConfirm={confirmItem} onSkip={skipItem} onCompare={() => setViewingItem(item)} onToast={showToast} onRename={renameItem} />
            ))}
            <button onClick={() => fileInputRef.current?.click()} className="w-full py-8 md:py-12 border-2 border-dashed dark:border-white/10 border-slate-200/50 dark:bg-white/[0.02] bg-white/20 backdrop-blur-3xl rounded-[32px] md:rounded-[40px] flex flex-col items-center justify-center dark:text-white/20 text-slate-300 hover:text-slate-500 dark:hover:text-white/50 hover:border-slate-300 transition-all group duration-500">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                    <Plus size={20} className="group-hover:rotate-90 transition-transform duration-500" />
                </div>
                <span className="text-sm font-bold tracking-tight px-4 text-center">Add Visual Assets</span>
            </button>
          </div>
        );
    }
  };

  return (
    <div className="h-screen w-full dark:bg-[#000000] bg-slate-50 dark:text-white text-slate-900 overflow-hidden flex font-sans transition-colors duration-700">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] contrast-150"></div>
          <ParticleBackground />
          <div className="absolute top-[-20%] right-[-10%] w-[80%] h-[80%] dark:bg-blue-600/5 bg-blue-400/5 rounded-full blur-[160px] animate-[pulse_15s_infinite_alternate]"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[70%] h-[70%] dark:bg-indigo-600/5 bg-indigo-400/5 rounded-full blur-[140px] animate-[pulse_18s_infinite_alternate_reverse]"></div>
      </div>

      <div className="flex-1 flex flex-col relative z-10 h-full min-w-0">
        
        {/* Header */}
        <header className="relative z-50 h-20 md:h-24 px-4 md:px-8 flex items-center justify-between shrink-0 border-b dark:border-white/10 border-slate-200/40 backdrop-blur-md">
            <div className="flex items-center gap-2 md:gap-6 lg:gap-10 h-full max-w-[75%] overflow-hidden">
                <div className="flex items-center gap-3 shrink-0">
                    {/* Logo */}
                    <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-blue-600 flex items-center justify-center">
                        <Zap size={20} className="text-white" fill="currentColor" />
                    </div>
                    <div className="hidden lg:block">
                        <h1 className="text-lg font-display font-black tracking-tight dark:text-white text-slate-900 leading-none">Optimizer<span className="text-blue-500">.pro</span></h1>
                    </div>
                </div>

                    {/* Minimal Header Tabs with Draggable Scroll */}
                <div 
                  ref={navScroll.ref}
                  {...navScroll.props}
                  className="flex items-center dark:bg-[#18181b] bg-slate-200/30 p-1 rounded-[18px] md:p-1.5 md:rounded-[22px] border dark:border-white/10 border-slate-200/50 backdrop-blur-3xl shadow-sm overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap"
                >
                    {[
                        { id: 'workspace', icon: Layers, label: 'Workspace' },
                        { id: 'dashboard', icon: LayoutDashboard, label: 'Analytics' },
                        { id: 'guide', icon: BookOpen, label: 'Guide' },
                        { id: 'changelog', icon: History, label: 'Updates' }
                    ].map((tab) => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as AppTab)} 
                            className={`flex items-center gap-2 px-3 py-2 md:px-5 md:py-2.5 rounded-[12px] md:rounded-[16px] text-[10px] md:text-[11px] font-black uppercase tracking-tight transition-all duration-500 shrink-0 ${activeTab === tab.id ? 'bg-white dark:bg-white/15 text-blue-600 dark:text-white shadow-xl scale-105' : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'}`}
                        >
                            <tab.icon size={14} className="md:w-[15px] md:h-[15px]" />
                            {/* Label only on large desktop for minimalism on tablet/mobile */}
                            <span className="hidden xl:inline">{tab.label}</span>
                            {tab.id === 'workspace' && queue.length > 0 && <span className="ml-1 md:ml-2 px-1.5 py-0.5 bg-blue-500/10 rounded-lg text-[8px] md:text-[9px]">{queue.length}</span>}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4 shrink-0">
                {/* Theme Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                    className="h-10 w-10 md:h-11 md:w-auto md:px-3 gap-2 flex items-center justify-center rounded-xl dark:bg-[#18181b] bg-white border dark:border-white/10 border-slate-200/50 text-slate-400 hover:text-blue-500 transition-all shadow-sm"
                  >
                    {themeMode === 'system' ? <Monitor size={16} /> : themeMode === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                    <ChevronDown size={12} className={`hidden md:block transition-transform duration-300 ${isThemeMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isThemeMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-[90]" onClick={() => setIsThemeMenuOpen(false)} />
                      <div className="absolute right-0 top-12 md:top-14 w-32 md:w-40 dark:bg-[#1a1a1a] bg-white border dark:border-white/10 border-slate-200/60 rounded-xl md:rounded-2xl shadow-2xl p-1 md:p-1.5 animate-in slide-in-from-top-2 duration-300 z-[100] backdrop-blur-3xl">
                        {[
                          { id: 'system', label: 'System', icon: Monitor },
                          { id: 'light', label: 'Light', icon: Sun },
                          { id: 'dark', label: 'Dark', icon: Moon }
                        ].map((m) => (
                          <button 
                            key={m.id}
                            onClick={() => { setThemeMode(m.id as ThemeMode); setIsThemeMenuOpen(false); }}
                            className={`flex items-center w-full gap-2 md:gap-3 px-3 py-2 md:px-4 md:py-2.5 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-tight transition-all ${themeMode === m.id ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-white/5'}`}
                          >
                            <m.icon size={14} className="w-3.5 h-3.5 md:w-[14px] md:h-[14px]" />
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <div className="h-8 w-px dark:bg-white/10 bg-slate-200 mx-1 hidden sm:block"></div>
                
                {/* Control Center Toggle */}
                <button 
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)} 
                  className={`h-10 w-10 md:h-11 md:w-11 flex items-center justify-center rounded-xl transition-all border dark:border-white/10 border-slate-200/50 ${isSettingsOpen ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'dark:bg-[#18181b] bg-white text-slate-400 hover:text-blue-500'}`} 
                  title="Control Center"
                >
                  <Settings2 size={18} />
                </button>
            </div>
        </header>

        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto custom-scrollbar px-4 md:px-8 pb-8 scroll-smooth relative z-10">
            {renderContent()}
        </div>

        {/* Pro Status Bar */}
        <div className="h-14 md:h-16 border-t dark:border-white/10 border-slate-200/50 dark:bg-[#09090b]/90 bg-white/80 backdrop-blur-[40px] flex items-center px-4 md:px-8 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-tight justify-between shrink-0 select-none relative z-10">
            <div className="flex items-center gap-4 md:gap-10 overflow-hidden w-full">
                {/* Progress Bar for Individual Download */}
                {downloadProgress !== null && (
                    <div className="absolute top-0 left-0 h-1 bg-blue-600 transition-all duration-300" style={{ width: `${downloadProgress}%` }}></div>
                )}
                {/* Action Buttons */}
                {activeTab === 'workspace' && queue.length > 0 && (
                    <div className="flex items-center gap-1.5 p-1 dark:bg-[#18181b] bg-slate-200/30 rounded-[18px] border dark:border-white/10 border-slate-200/50 backdrop-blur-md">
                        {pendingConfirmationCount > 0 && (
                            <button 
                                onClick={skipAllPending}
                                title="Skip All Pending"
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] text-[9px] font-black uppercase tracking-tight transition-all text-slate-500 hover:text-orange-600 dark:text-zinc-400 dark:hover:text-orange-400 hover:bg-white dark:hover:bg-white/10"
                            >
                                <FastForward size={12} />
                                <span className="hidden sm:inline">Skip</span>
                            </button>
                        )}
                        <button 
                            onClick={redoAll}
                            title="Redo All"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] text-[9px] font-black uppercase tracking-tight transition-all text-slate-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-white/10"
                        >
                            <RefreshCcw size={12} />
                            <span className="hidden sm:inline">Redo</span>
                        </button>
                        <button 
                            onClick={() => setIsBulkRenameOpen(true)}
                            title="Bulk Rename"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] text-[9px] font-black uppercase tracking-tight transition-all text-slate-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-white/10"
                        >
                            <RefreshCw size={12} />
                            <span className="hidden sm:inline">Rename</span>
                        </button>


                        <button 
                            onClick={downloadAll}
                            title="Download All as ZIP"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] text-[9px] font-black uppercase tracking-tight transition-all text-slate-500 hover:text-green-600 dark:text-zinc-400 dark:hover:text-green-400 hover:bg-white dark:hover:bg-white/10"
                        >
                            <Download size={12} />
                            <span className="hidden sm:inline">Save ZIP</span>
                        </button>

                        <button 
                            onClick={downloadIndividually}
                            title="Download Individually"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] text-[9px] font-black uppercase tracking-tight transition-all text-slate-500 hover:text-purple-600 dark:text-zinc-400 dark:hover:text-purple-400 hover:bg-white dark:hover:bg-white/10"
                        >
                            <Download size={12} />
                            <span className="hidden sm:inline">Save Indiv.</span>
                        </button>

                        <button 
                            onClick={clearQueue}
                            title="Clear Queue"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] text-[9px] font-black uppercase tracking-tight transition-all text-slate-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 hover:bg-white dark:hover:bg-white/10"
                        >
                            <Trash2 size={12} />
                            <span className="hidden sm:inline">Clear</span>
                        </button>
                    </div>
                )}
                <span className="flex items-center gap-2 md:gap-4 whitespace-nowrap">
                    <div className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full transition-all duration-1000 shadow-sm ${isProcessingQueue ? 'bg-blue-500 animate-pulse scale-110 md:scale-125 shadow-blue-500/50' : 'bg-green-500'}`}></div>
                    <span className="opacity-60 text-[8px] md:text-[10px]">{isProcessingQueue ? 'Processing' : 'Optimized'}</span>
                </span>
                
                <div className="ml-auto flex items-center gap-4 md:gap-10">
                   <div className="hidden md:flex items-center gap-3 dark:text-white/20 text-slate-400 font-black tracking-tight">
                      <span><span className="dark:text-white/60 text-slate-600">{(stats?.filesProcessed || 0).toLocaleString()}</span> units distilled • <span className="dark:text-white/60 text-slate-600">{formatBytes(stats?.savedBytes || 0)}</span> saved.</span>
                   </div>
                   <span className="hidden lg:inline text-[9px] opacity-20 border-l dark:border-white/10 border-slate-200 pl-10 font-mono tracking-tight uppercase">v3.2.0-PRO</span>
                </div>
            </div>
        </div>
      </div>

      {/* Control Center Side Panel */}
      {isSettingsOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[45] md:hidden transition-opacity animate-in fade-in" 
          onClick={() => setIsSettingsOpen(false)}
        />
      )}
      <aside 
        className={`fixed inset-y-0 right-0 z-50 dark:bg-[#09090b] bg-[#fbfbfb] border-l dark:border-white/10 border-slate-200/60 shadow-2xl shrink-0 flex flex-col transition-all duration-500 ease-[cubic-bezier(0.2,0,0,1)] md:relative ${isSettingsOpen ? 'w-full sm:w-[340px] translate-x-0' : 'w-0 translate-x-full overflow-hidden'}`}
      >
          <div className="h-full w-full sm:w-[340px] shrink-0">
            <SettingsPanel settings={settings} theme={themeMode === 'system' ? 'dark' : themeMode} onChange={setSettings} onClose={() => setIsSettingsOpen(false)} className="h-full border-none rounded-none bg-transparent shadow-none" />
          </div>
      </aside>

      {/* Drag Mask */}
      <div className={`fixed inset-0 z-[100] bg-black/80 backdrop-blur-3xl flex items-center justify-center transition-all duration-700 pointer-events-none ${isDragging ? 'opacity-100' : 'opacity-0 scale-105'}`}>
        <div className="text-center p-8 md:p-16 rounded-[40px] md:rounded-[60px] bg-white/5 border border-white/10 shadow-2xl animate-in zoom-in-95 duration-700">
            <div className="w-16 h-16 md:w-24 md:h-24 rounded-[24px] md:rounded-[32px] bg-blue-500/10 flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-inner animate-bounce">
                <Layers size={32} className="text-blue-500 md:w-12 md:h-12" />
            </div>
            <h2 className="text-2xl md:text-4xl font-display font-black text-white tracking-tight leading-tight px-4">Optimization Cluster<br/>Ready.</h2>
            <p className="mt-4 text-blue-500 font-black uppercase tracking-widest text-[8px] md:text-xs">Drop images to start workflow</p>
        </div>
      </div>

      <input type="file" multiple accept="image/*" ref={fileInputRef} className="hidden" onChange={(e) => { if (e.target.files && e.target.files.length > 0) { addToQueue(Array.from(e.target.files)); e.target.value = ''; } }} />
      {viewingItem && viewingItem.result && <CompareModal originalUrl={viewingItem.previewUrl} compressedUrl={viewingItem.result.compressedUrl} filename={viewingItem.file.name} onClose={() => setViewingItem(null)} />}
      {/* Bulk Rename Modal */}
      {isBulkRenameOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="dark:bg-[#1a1a1a] bg-white border border-slate-200 dark:border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                  <h3 className="text-lg font-black tracking-tight mb-4 text-slate-900 dark:text-white">Bulk Rename</h3>
                  <input 
                      type="text" 
                      value={bulkRenameBase} 
                      onChange={(e) => setBulkRenameBase(e.target.value)}
                      placeholder="Enter base name (e.g., photo)"
                      className="w-full px-4 py-2 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 mb-6 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2 justify-end">
                      <button onClick={() => setIsBulkRenameOpen(false)} className="px-4 py-2 text-sm font-black text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white">Cancel</button>
                      <button onClick={bulkRename} className="px-4 py-2 text-sm font-black text-white bg-blue-600 rounded-lg hover:bg-blue-700">Rename All</button>
                  </div>
              </div>
          </div>
      )}
      
      {/* Toast */}
      <div className={`fixed bottom-20 md:bottom-24 left-1/2 -translate-x-1/2 dark:bg-white bg-slate-900 text-black dark:text-black px-8 md:px-12 py-3 md:py-5 rounded-2xl md:rounded-[24px] shadow-[0_32px_80px_rgba(0,0,0,0.4)] flex items-center gap-3 md:gap-4 transition-all duration-700 z-[100] ${toast.visible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0 pointer-events-none'}`}>
          <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
              <CheckCircle2 size={14} className="md:w-[18px] md:h-[18px]" />
          </div>
          <span className="text-[10px] md:text-sm font-black dark:text-black text-white uppercase tracking-normal font-display">{toast.message}</span>
      </div>
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default App;
