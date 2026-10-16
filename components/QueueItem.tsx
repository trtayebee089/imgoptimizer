
import React, { useState, useEffect } from 'react';
import { QueueItem as QueueItemType } from '../types';
import { X, ArrowRight, RefreshCw, Maximize2, Copy, Zap, ChevronDown, ChevronUp, History, AlertTriangle, Play, Download, Bot } from 'lucide-react';

interface QueueItemProps {
  item: QueueItemType;
  onRemove: (id: string) => void;
  onRedo: (id: string) => void;
  onConfirm?: (id: string) => void;
  onSkip?: (id: string) => void;
  onCompare: () => void;
  onToast: (msg: string) => void;
  onRename: (id: string, newName: string) => void;
}

export const QueueItem: React.FC<QueueItemProps> = ({ item, onRemove, onRedo, onConfirm, onSkip, onCompare, onToast, onRename }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [justFinished, setJustFinished] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(item.name);

  const isDone = item.status === 'completed';
  const isProcessing = item.status === 'processing';
  const isError = item.status === 'error';
  const needsConfirmation = item.status === 'needs_confirmation';

  useEffect(() => {
    if (isDone) {
      setJustFinished(true);
      const timer = setTimeout(() => setJustFinished(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isDone]);
  
  useEffect(() => {
      setTempName(item.name);
  }, [item.name]);

  const handleNameSave = () => {
      if (tempName.trim()) {
          onRename(item.id, tempName.trim());
      } else {
          setTempName(item.name);
      }
      setIsEditingName(false);
  };

  const savedPercent = isDone && item.result && item.result.originalSize > 0 
    ? Math.round(((item.result.originalSize - item.result.compressedSize) / item.result.originalSize) * 100) 
    : 0;

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleCopy = async () => {
    if (!item.result?.blob) return;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ [item.result.blob.type]: item.result.blob })
      ]);
      onToast("Copied to clipboard!");
    } catch (err) {
      onToast("Clipboard interaction failed");
    }
  };

  const steps = item.result?.steps || [];

  return (
    <div className={`
      group relative dark:bg-[#18181b] bg-white backdrop-blur-3xl border rounded-[24px] md:rounded-[40px] p-3 md:p-5 flex flex-col gap-2 md:gap-4 transition-all duration-700 animate-in fade-in slide-in-from-bottom-4 shadow-sm hover:shadow-2xl md:hover:-translate-y-1
      ${needsConfirmation ? 'border-yellow-500/30 bg-yellow-500/[0.01]' : ''}
      ${justFinished ? 'border-green-500/30 shadow-[0_24px_64px_rgba(34,197,94,0.1)]' : 'dark:border-white/10 border-slate-200/80 hover:border-blue-500/20'}
    `}>
      
      {/* Interaction Ambience */}
      {isProcessing && <div className="absolute inset-0 bg-blue-500/[0.02] animate-pulse rounded-[24px] md:rounded-[40px] pointer-events-none"></div>}

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-6 relative z-10">
          
          {/* Thumbnail Module */}
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div 
              className={`relative w-16 h-16 md:w-24 md:h-24 shrink-0 rounded-[18px] md:rounded-[28px] overflow-hidden dark:bg-black/40 bg-slate-50 border dark:border-white/10 border-slate-200 transition-all duration-700 ${isDone ? 'cursor-pointer sm:group-hover:scale-105 sm:group-hover:rotate-2' : ''}`}
              onClick={() => isDone && onCompare()}
            >
              <img 
                src={isDone && item.result ? item.result.compressedUrl : item.previewUrl} 
                alt={item.file.name}
                className={`w-full h-full object-cover transition-all duration-1000 ${isProcessing ? 'scale-125 blur-[6px] opacity-30' : 'scale-100'}`}
              />
              
              {isProcessing && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 md:w-12 md:h-12 border-[4px] md:border-[6px] border-blue-500/10 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
              )}

              {isDone && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 sm:group-hover:opacity-100 transition-all duration-500">
                  <Maximize2 size={20} className="text-white md:w-7 md:h-7 scale-75 sm:group-hover:scale-100 transition-all duration-500" />
                </div>
              )}
            </div>

            {/* Actions for Mobile (Visible by default on tiny screens) */}
            <div className="flex sm:hidden items-center gap-2 ml-auto">
              <button onClick={() => onRemove(item.id)} className="w-8 h-8 flex items-center justify-center text-slate-400 dark:bg-white/5 bg-slate-100 rounded-lg border dark:border-white/10 border-slate-200/50"><X size={16} /></button>
            </div>
          </div>

          {/* Info Module */}
          <div className="flex-grow min-w-0 w-full sm:w-auto">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2 md:mb-3">
                {isEditingName ? (
                     <input 
                        type="text" value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        onBlur={handleNameSave}
                        onKeyDown={(e) => e.key === 'Enter' ? handleNameSave() : e.key === 'Escape' ? (setTempName(item.name), setIsEditingName(false)) : null}
                        autoFocus
                        className="text-sm md:text-base font-black dark:text-white text-slate-900 bg-transparent border-b-2 border-blue-500 focus:outline-none w-full max-w-full sm:max-w-[400px] p-0 rounded-none tracking-tight"
                     />
                ) : (
                    <h4 
                        className="text-sm md:text-base font-display font-black dark:text-white/90 text-slate-900 truncate max-w-full sm:max-w-[400px] cursor-text hover:text-blue-600 dark:hover:text-blue-400 transition-all tracking-tight leading-none" 
                        onClick={(e) => { e.stopPropagation(); setIsEditingName(true); }}
                    >
                        {item.name}
                    </h4>
                )}

                <div className="flex items-center gap-2">
                    {item.result?.aiUsed && (
                        <span className="px-2 py-0.5 md:px-2.5 md:py-1 rounded-lg bg-indigo-500/10 text-indigo-500 text-[8px] md:text-[9px] font-black uppercase tracking-tight border border-indigo-500/10 shadow-sm"><Bot size={8} className="inline mr-1" /> Vision</span>
                    )}
                    {item.result?.strategyLabel && (
                        <span className="px-2 py-0.5 md:px-2.5 md:py-1 rounded-lg bg-blue-500/10 text-blue-600 text-[8px] md:text-[9px] font-black uppercase tracking-tight border border-blue-500/10 shadow-sm">{item.result.strategyLabel}</span>
                    )}
                </div>
            </div>
            
            <div className="flex items-center gap-3 md:gap-6 text-[10px] md:text-[11px] font-bold">
                {isDone && item.result ? (
                  <div className="flex flex-wrap items-center gap-2 md:gap-6 animate-in fade-in slide-in-from-left-2 duration-700">
                      <div className="flex items-center gap-2 px-2 py-1 md:px-3 md:py-1.5 dark:bg-black/20 bg-slate-100 rounded-lg md:rounded-xl text-slate-500 dark:text-zinc-500 border dark:border-white/5 border-slate-200/50">
                         <span className="uppercase text-[8px] md:text-[10px] opacity-60 font-black tracking-tight">{item.file.name.split('.').pop()}</span>
                         <ArrowRight size={10} className="opacity-30 md:w-3 md:h-3" />
                         <span className="uppercase text-[8px] md:text-[10px] text-blue-500 font-black tracking-tight">{item.result.extension}</span>
                      </div>

                      <div className="flex items-center gap-2 md:gap-4">
                        <span className="line-through opacity-30 text-slate-500 font-black text-[9px] md:text-[11px]">{formatSize(item.result.originalSize)}</span>
                        <span className="dark:text-white text-slate-900 font-black tracking-tight text-xs md:text-sm">{formatSize(item.result.compressedSize)}</span>
                        {savedPercent > 0 && (
                          <span className="text-green-500 bg-green-500/10 px-2 py-0.5 md:px-3 md:py-1 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black tracking-tight border border-green-500/10">-{savedPercent}%</span>
                        )}
                      </div>
                  </div>
                ) : needsConfirmation ? (
                    <div className="flex items-center gap-2 text-yellow-500 animate-pulse text-[9px] md:text-[10px]">
                        <AlertTriangle size={14} /> <span className="uppercase tracking-widest font-black">Ignored: Asset is {formatSize(item.file.size)}</span>
                    </div>
                ) : isProcessing ? (
                   <div className="flex flex-col gap-2 w-full max-w-[200px] md:max-w-sm">
                       <span className="text-blue-500 uppercase tracking-widest text-[8px] md:text-[9px] font-black animate-pulse">Distilling...</span>
                       <div className="w-full h-1 md:h-2 bg-blue-500/10 rounded-full overflow-hidden relative">
                           <div className="h-full bg-blue-600 w-full animate-[liquid_3s_infinite] rounded-full shadow-[0_0_15px_rgba(37,99,235,0.4)]"></div>
                       </div>
                   </div>
                ) : (
                  <div className="flex items-center gap-2 md:gap-4 text-slate-400 dark:text-zinc-500 font-black uppercase tracking-widest text-[8px] md:text-[9px]">
                    <span className="bg-slate-100 dark:bg-white/5 px-2 py-0.5 md:px-3 md:py-1 rounded-lg">{formatSize(item.file.size)}</span>
                    <span className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-slate-300 dark:bg-zinc-700"></span>
                    <span>Queued</span>
                  </div>
                )}
            </div>
          </div>

          {/* Actions Module */}
          <div className="flex items-center gap-2 md:gap-3 pr-0 md:pr-2 w-full sm:w-auto mt-2 sm:mt-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-500 sm:translate-x-4 sm:group-hover:translate-x-0 overflow-x-auto no-scrollbar">
            {needsConfirmation && (
                <div className="flex items-center gap-2 mr-2">
                    <button onClick={() => onSkip?.(item.id)} className="px-3 md:px-5 py-2 md:py-3 text-[9px] md:text-[10px] font-black text-slate-400 hover:text-slate-900 dark:hover:text-white uppercase tracking-tight transition-all">Skip</button>
                    <button onClick={() => onConfirm?.(item.id)} className="flex items-center gap-2 bg-blue-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-tight transition-all shadow-xl whitespace-nowrap"><Play size={10} fill="currentColor" /> Distill</button>
                </div>
            )}
            {isDone && item.result && (
              <>
                <button onClick={handleCopy} className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center shrink-0 text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 dark:bg-black/20 bg-slate-100 rounded-xl md:rounded-2xl transition-all border dark:border-white/10 border-slate-200/50" title="Copy"><Copy size={16} className="md:w-5 md:h-5" /></button>
                <a href={item.result.compressedUrl} download={tempName.replace(/\.[^/.]+$/, "") + "." + item.result.extension} className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center shrink-0 text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 dark:bg-black/20 bg-slate-100 rounded-xl md:rounded-2xl transition-all border dark:border-white/10 border-slate-200/50" title="Download"><Download size={16} className="md:w-5 md:h-5" /></a>
              </>
            )}
            {(isDone || isError) && (
                <button onClick={() => onRedo(item.id)} className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center shrink-0 text-slate-400 hover:text-blue-500 dark:bg-black/20 bg-slate-100 rounded-xl md:rounded-2xl transition-all border dark:border-white/10 border-slate-200/50" title="Reset"><RefreshCw size={16} className="md:w-5 md:h-5" /></button>
            )}
            <button onClick={() => onRemove(item.id)} className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center shrink-0 text-slate-400 hover:text-red-500 dark:bg-black/20 bg-slate-100 rounded-xl md:rounded-2xl transition-all border dark:border-white/10 border-slate-200/50" title="Remove"><X size={18} className="md:w-5.5 md:h-5.5" /></button>
          </div>
      </div>

      {isDone && item.result && steps.length > 0 && (
          <div className="pt-2 md:pt-4 border-t dark:border-white/10 border-slate-100 sm:ml-24 md:ml-32 mr-2 md:mr-6 animate-in slide-in-from-top-4 duration-700">
               {!isExpanded ? (
                 <button onClick={() => setIsExpanded(true)} className="flex items-center gap-2 md:gap-4 text-[8px] md:text-[10px] font-black text-slate-400 hover:text-blue-500 dark:hover:text-white uppercase tracking-widest transition-all">
                    <History size={12} className="opacity-40 md:w-[14px] md:h-[14px]" /> Trace ({steps.length}) <ChevronDown size={12} className="opacity-40 md:w-[14px] md:h-[14px]" />
                 </button>
               ) : (
                  <div className="space-y-2 md:space-y-3 pb-2 md:pb-4">
                      <div className="flex items-center justify-between mb-2 md:mb-4">
                         <span className="text-[8px] md:text-[10px] font-black text-slate-500 dark:text-zinc-600 uppercase tracking-widest">Trace</span>
                         <button onClick={() => setIsExpanded(false)} className="text-[8px] md:text-[10px] font-black text-slate-400 hover:text-blue-500 transition-all uppercase tracking-tight flex items-center gap-1 md:gap-2"><ChevronUp size={12} /> Close</button>
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-2 no-scrollbar">
                        {steps.map((step, idx) => (
                            <div key={idx} className={`flex items-center gap-3 md:gap-6 text-[9px] md:text-[11px] font-bold p-3 md:p-4 rounded-xl md:rounded-[22px] transition-all ${idx === steps.length - 1 ? 'bg-blue-600/5 text-blue-600 border border-blue-500/20' : 'dark:bg-black/40 bg-slate-50 text-slate-500 border dark:border-white/5 border-slate-100'}`}>
                                <span className="w-4 md:w-8 opacity-30 font-black tracking-widest">#{idx + 1}</span>
                                <div className="flex-1 truncate uppercase tracking-tight text-[8px] md:text-[9px] font-black">{step.label}</div>
                                <div className="hidden sm:flex items-center gap-1 md:gap-2 min-w-[80px] md:min-w-[120px] font-black text-[9px] md:text-[10px]">{step.width}×{step.height}</div>
                                <div className="ml-auto font-black text-[10px] md:text-xs tracking-tight">{formatSize(step.size)}</div>
                            </div>
                        ))}
                      </div>
                  </div>
               )}
          </div>
      )}
    </div>
  );
};
