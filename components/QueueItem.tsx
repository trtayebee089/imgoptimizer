
import React, { useState, useEffect } from 'react';
import { QueueItem as QueueItemType } from '../types';
import { X, ArrowRight, RefreshCw, Copy, ChevronDown, AlertTriangle, Download, Loader2, CheckCircle2, Clock, Columns2, Pencil } from 'lucide-react';

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

const iconBtn = 'w-9 h-9 inline-flex items-center justify-center shrink-0 rounded-lg text-muted border border-transparent hover:border-line hover:bg-canvas hover:text-ink transition-colors';

export const QueueItem: React.FC<QueueItemProps> = ({ item, onRemove, onRedo, onConfirm, onSkip, onCompare, onToast, onRename }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(item.name);

  const isDone = item.status === 'completed';
  const isProcessing = item.status === 'processing';
  const isError = item.status === 'error';
  const needsConfirmation = item.status === 'needs_confirmation';

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
  const r = item.result;
  const inputExt = (item.file.name.split('.').pop() || '').toUpperCase();
  const downloadName = tempName.replace(/\.[^/.]+$/, "") + "." + (r?.extension || '');

  const status = isDone
    ? { label: r?.strategyLabel === 'Skipped' ? 'Original kept' : 'Optimized', cls: 'bg-success-50 text-success-700', Icon: CheckCircle2 }
    : isProcessing ? { label: 'Optimizing', cls: 'bg-brand-50 text-brand-700', Icon: Loader2 }
    : isError ? { label: 'Failed', cls: 'bg-danger-50 text-danger-700', Icon: AlertTriangle }
    : needsConfirmation ? { label: 'Needs review', cls: 'bg-warning-50 text-warning-700', Icon: AlertTriangle }
    : { label: 'Queued', cls: 'bg-canvas text-muted', Icon: Clock };

  return (
    <li className={`bg-white border rounded-xl shadow-card transition-colors ${needsConfirmation ? 'border-warning-500/40' : isError ? 'border-danger-500/40' : 'border-line'}`}>
      <div className="flex gap-3 sm:gap-4 p-3 sm:p-4">

          {/* Thumbnail */}
          <button
            type="button"
            disabled={!isDone}
            onClick={() => isDone && onCompare()}
            aria-label={isDone ? `Compare original and optimized ${item.name}` : undefined}
            tabIndex={isDone ? 0 : -1}
            className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-lg overflow-hidden bg-canvas border border-line enabled:hover:ring-2 enabled:hover:ring-brand-500/40 disabled:cursor-default"
          >
            <img
              src={isDone && r ? r.compressedUrl : item.previewUrl}
              alt=""
              className={`w-full h-full object-cover ${isProcessing ? 'opacity-40' : ''}`}
            />
            {isProcessing && (
              <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
                <Loader2 size={22} className="animate-spin text-brand-500" />
              </span>
            )}
          </button>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                {isEditingName ? (
                  <input
                    type="text" value={tempName}
                    aria-label="File name"
                    onChange={(e) => setTempName(e.target.value)}
                    onBlur={handleNameSave}
                    onKeyDown={(e) => e.key === 'Enter' ? handleNameSave() : e.key === 'Escape' ? (setTempName(item.name), setIsEditingName(false)) : null}
                    autoFocus
                    className="w-full text-sm font-semibold text-ink border-b-2 border-brand-500 bg-transparent focus:outline-none py-0.5"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setIsEditingName(true); }}
                    title="Rename"
                    className="group/name max-w-full inline-flex items-center gap-1.5 text-left text-sm font-semibold text-ink hover:text-brand-600 rounded"
                  >
                    <span className="truncate">{item.name}</span>
                    <Pencil size={12} className="shrink-0 text-subtle opacity-0 group-hover/name:opacity-100 group-focus-visible/name:opacity-100" aria-hidden="true" />
                    <span className="sr-only">(rename)</span>
                  </button>
                )}
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${status.cls}`}>
                    <status.Icon size={12} className={isProcessing ? 'animate-spin' : ''} aria-hidden="true" />{status.label}
                  </span>
                  {r?.strategyLabel && r.strategyLabel !== 'Skipped' && (
                    <span className="px-2 py-0.5 rounded-md bg-canvas border border-line text-xs text-muted">{r.strategyLabel}</span>
                  )}
                </div>
              </div>

              {/* Remove is always reachable */}
              <button type="button" onClick={() => onRemove(item.id)} className={iconBtn + ' -mr-1 -mt-1 hover:text-danger-600'} title="Remove" aria-label={`Remove ${item.name}`}>
                <X size={17} />
              </button>
            </div>

            {/* Metrics / state */}
            <div className="mt-2.5 text-[13px]">
              {isDone && r ? (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                  <span className="inline-flex items-center gap-1.5 text-muted">
                    <span className="font-medium">{inputExt}</span>
                    <ArrowRight size={12} aria-hidden="true" /><span className="sr-only">to</span>
                    <span className="font-semibold text-brand-600">{r.extension.toUpperCase()}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 tabular-nums">
                    <span className="text-muted line-through decoration-subtle">{formatSize(r.originalSize)}</span>
                    <ArrowRight size={12} className="text-subtle" aria-hidden="true" /><span className="sr-only">to</span>
                    <span className="font-semibold text-ink">{formatSize(r.compressedSize)}</span>
                  </span>
                  {savedPercent > 0 ? (
                    <span className="px-1.5 py-0.5 rounded-md bg-success-50 text-success-700 text-xs font-semibold tabular-nums">−{savedPercent}%</span>
                  ) : savedPercent < 0 ? (
                    <span className="px-1.5 py-0.5 rounded-md bg-warning-50 text-warning-700 text-xs font-semibold tabular-nums">+{Math.abs(savedPercent)}% larger</span>
                  ) : null}
                  <span className="text-muted tabular-nums hidden sm:inline">
                    {r.originalWidth}×{r.originalHeight}
                    {(r.width !== r.originalWidth || r.height !== r.originalHeight) && <> → {r.width}×{r.height}</>} px
                  </span>
                </div>
              ) : needsConfirmation ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <p className="text-warning-700">Already within the target size ({formatSize(item.file.size)}). Optimize anyway?</p>
                  <div className="flex items-center gap-2 shrink-0">
                    <button type="button" onClick={() => onSkip?.(item.id)} className="h-8 px-3 rounded-lg border border-line-strong bg-white text-[13px] font-semibold text-ink hover:bg-canvas">Skip</button>
                    <button type="button" onClick={() => onConfirm?.(item.id)} className="h-8 px-3 rounded-lg bg-brand-500 text-white text-[13px] font-semibold hover:bg-brand-600">Optimize</button>
                  </div>
                </div>
              ) : isProcessing ? (
                <div className="max-w-xs">
                  <div className="h-1.5 rounded-full bg-brand-100 overflow-hidden" role="progressbar" aria-label={`Optimizing ${item.name}`}>
                    <div className="h-full w-1/3 bg-brand-500 rounded-full animate-[op-indeterminate_1.4s_ease-in-out_infinite]" />
                  </div>
                </div>
              ) : isError ? (
                <p className="text-danger-700">This image could not be processed. Try again, or check that the file is a valid image.</p>
              ) : (
                <p className="text-muted tabular-nums">{formatSize(item.file.size)} · Waiting in queue</p>
              )}
            </div>

            {/* Actions */}
            {(isDone || isError) && (
              <div className="flex flex-wrap items-center gap-1 mt-3 -ml-2">
                {isDone && r && (
                  <>
                    <a href={r.compressedUrl} download={downloadName} className="h-8 px-3 inline-flex items-center gap-1.5 rounded-lg text-[13px] font-semibold text-brand-600 hover:bg-brand-50" title="Download">
                      <Download size={15} aria-hidden="true" /> Download
                    </a>
                    <button type="button" onClick={onCompare} className="h-8 px-3 inline-flex items-center gap-1.5 rounded-lg text-[13px] font-medium text-muted hover:text-ink hover:bg-canvas">
                      <Columns2 size={15} aria-hidden="true" /> Compare
                    </button>
                    <button type="button" onClick={handleCopy} className="h-8 px-3 inline-flex items-center gap-1.5 rounded-lg text-[13px] font-medium text-muted hover:text-ink hover:bg-canvas">
                      <Copy size={15} aria-hidden="true" /> Copy
                    </button>
                  </>
                )}
                <button type="button" onClick={() => onRedo(item.id)} className="h-8 px-3 inline-flex items-center gap-1.5 rounded-lg text-[13px] font-medium text-muted hover:text-ink hover:bg-canvas" title="Process again with current settings">
                  <RefreshCw size={15} aria-hidden="true" /> {isError ? 'Retry' : 'Reprocess'}
                </button>
                {isDone && steps.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsExpanded(v => !v)}
                    aria-expanded={isExpanded}
                    className="h-8 px-3 ml-auto inline-flex items-center gap-1.5 rounded-lg text-[13px] font-medium text-muted hover:text-ink hover:bg-canvas"
                  >
                    {steps.length} {steps.length === 1 ? 'step' : 'steps'}
                    <ChevronDown size={15} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} aria-hidden="true" />
                  </button>
                )}
              </div>
            )}
          </div>
      </div>

      {isDone && r && steps.length > 0 && isExpanded && (
        <div className="border-t border-line px-3 sm:px-4 py-3">
          <div className="overflow-x-auto">
            <table className="w-full text-xs tabular-nums">
              <caption className="sr-only">Optimization steps for {item.name}</caption>
              <thead>
                <tr className="text-left text-muted">
                  <th scope="col" className="font-medium py-1.5 pr-3 w-8">#</th>
                  <th scope="col" className="font-medium py-1.5 pr-3">Step</th>
                  <th scope="col" className="font-medium py-1.5 pr-3">Dimensions</th>
                  <th scope="col" className="font-medium py-1.5 pr-3">Quality</th>
                  <th scope="col" className="font-medium py-1.5 text-right">Size</th>
                </tr>
              </thead>
              <tbody>
                {steps.map((step, idx) => {
                  const last = idx === steps.length - 1;
                  return (
                    <tr key={idx} className={`border-t border-line ${last ? 'text-brand-700 font-semibold' : 'text-ink'}`}>
                      <td className="py-1.5 pr-3 text-muted">{idx + 1}</td>
                      <td className="py-1.5 pr-3 whitespace-nowrap">{step.label}</td>
                      <td className="py-1.5 pr-3 whitespace-nowrap">{step.width}×{step.height}</td>
                      <td className="py-1.5 pr-3">{Math.round(step.quality * 100)}%</td>
                      <td className="py-1.5 text-right whitespace-nowrap">{formatSize(step.size)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </li>
  );
};
