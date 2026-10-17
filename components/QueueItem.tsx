import React, { useState, useEffect } from 'react';
import { QueueItem as QueueItemType } from '../types';
import { X, ArrowRight, RefreshCw, Copy, ChevronDown, AlertTriangle, Download, Loader2, CheckCircle2, Clock, Columns2, Pencil, Ban, ScanSearch } from 'lucide-react';
import { formatBytes } from './ui';
import { savedBytes, formatSavedPercent, savedPercent } from '../lib/savings';
import { FORMAT_LABELS, DetectedFormat } from '../lib/fileValidation';
import { downloadNameFor, isSkipped } from '../hooks/useOptimizerQueue';

interface QueueItemProps {
  item: QueueItemType;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onRedo: (id: string) => void;
  onConfirm: (id: string) => void;
  onSkip: (id: string) => void;
  onCompare: (id: string) => void;
  onToast: (msg: string, tone?: 'success' | 'error' | 'info') => void;
  onRename: (id: string, newName: string) => void;
}

const iconBtn = 'w-9 h-9 inline-flex items-center justify-center shrink-0 rounded-lg text-muted hover:bg-canvas hover:text-ink transition-colors';
const actionBtn = 'h-8 px-3 inline-flex items-center gap-1.5 rounded-lg text-[13px] font-medium text-muted hover:text-ink hover:bg-canvas';

const formatLabel = (f?: string) => (f && FORMAT_LABELS[f as DetectedFormat]) || (f ? f.toUpperCase() : '');

export const QueueItem: React.FC<QueueItemProps> = React.memo(({ item, selected, onToggleSelect, onRemove, onRedo, onConfirm, onSkip, onCompare, onToast, onRename }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(item.name);

  const isDone = item.status === 'completed';
  const isProcessing = item.status === 'processing';
  const isError = item.status === 'error';
  const isInvalid = item.status === 'invalid';
  const isValidating = item.status === 'validating';
  const needsConfirmation = item.status === 'needs_confirmation';
  const r = item.result;
  const skipped = isSkipped(item);

  useEffect(() => { setTempName(item.name); }, [item.name]);

  const handleNameSave = () => {
    if (tempName.trim()) onRename(item.id, tempName.trim());
    else setTempName(item.name);
    setIsEditingName(false);
  };

  const handleCopy = async () => {
    if (!r?.blob) return;
    try {
      await navigator.clipboard.write([new ClipboardItem({ [r.blob.type]: r.blob })]);
      onToast('Copied to clipboard');
    } catch {
      onToast('Your browser blocked copying this image format', 'error');
    }
  };

  const steps = r?.steps || [];
  const inputFormat = formatLabel(item.format) || (item.file.name.split('.').pop() || '').toUpperCase();
  const pct = r ? savedPercent(r.originalSize, r.compressedSize) : null;

  const status = isDone
    ? { label: skipped ? 'Original kept' : 'Optimized', cls: 'bg-success-50 text-success-700 border-brand-200', Icon: CheckCircle2 }
    : isProcessing ? { label: 'Optimizing', cls: 'bg-brand-50 text-brand-800 border-brand-200', Icon: Loader2 }
    : isError ? { label: 'Failed', cls: 'bg-danger-50 text-danger-700 border-danger-500/25', Icon: AlertTriangle }
    : isInvalid ? { label: 'Not supported', cls: 'bg-danger-50 text-danger-700 border-danger-500/25', Icon: Ban }
    : isValidating ? { label: 'Checking', cls: 'bg-canvas text-muted border-line', Icon: ScanSearch }
    : needsConfirmation ? { label: 'Needs review', cls: 'bg-warning-50 text-warning-700 border-warning-500/25', Icon: AlertTriangle }
    : { label: 'Queued', cls: 'bg-canvas text-muted border-line', Icon: Clock };

  return (
    <li className={`bg-white border rounded-xl shadow-card transition-colors ${selected ? 'border-brand-500 ring-1 ring-brand-500' : needsConfirmation ? 'border-warning-500/40' : isError || isInvalid ? 'border-danger-500/35' : 'border-line'}`}>
      <div className="flex gap-3 sm:gap-4 p-3 sm:p-4">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(item.id)}
          aria-label={`Select ${item.name}`}
          className="mt-1 w-4 h-4 shrink-0 accent-[#218838] cursor-pointer"
        />

        {/* Thumbnail */}
        <button
          type="button"
          disabled={!isDone || skipped}
          onClick={() => onCompare(item.id)}
          aria-label={isDone && !skipped ? `Compare original and optimized ${item.name}` : undefined}
          tabIndex={isDone && !skipped ? 0 : -1}
          className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-lg overflow-hidden bg-canvas border border-line enabled:hover:ring-2 enabled:hover:ring-brand-500/50 disabled:cursor-default"
        >
          {!isInvalid ? (
            <img
              src={isDone && r ? r.compressedUrl : item.previewUrl}
              alt=""
              loading="lazy"
              decoding="async"
              className={`w-full h-full object-cover ${isProcessing || isValidating ? 'opacity-40' : ''}`}
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-danger-600" aria-hidden="true"><Ban size={22} /></span>
          )}
          {(isProcessing || isValidating) && (
            <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
              <Loader2 size={22} className="animate-spin text-brand-700" />
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
                  className="w-full text-sm font-semibold text-ink border-b-2 border-brand-600 bg-transparent focus:outline-none py-0.5"
                />
              ) : (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setIsEditingName(true); }}
                  title="Rename"
                  disabled={isInvalid}
                  className="group/name max-w-full inline-flex items-center gap-1.5 text-left text-sm font-semibold text-ink enabled:hover:text-brand-800 rounded"
                >
                  <span className="truncate">{item.name}</span>
                  {!isInvalid && <Pencil size={12} className="shrink-0 text-subtle opacity-0 group-hover/name:opacity-100 group-focus-visible/name:opacity-100" aria-hidden="true" />}
                  {!isInvalid && <span className="sr-only">(rename)</span>}
                </button>
              )}
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-medium ${status.cls}`}>
                  <status.Icon size={12} className={isProcessing ? 'animate-spin' : ''} aria-hidden="true" />{status.label}
                </span>
                {r?.strategyLabel && !skipped && (
                  <span className="px-2 py-0.5 rounded-md bg-canvas border border-line text-xs text-muted">{r.strategyLabel}</span>
                )}
                {r?.infoMessage && !skipped && (
                  <span className="px-2 py-0.5 rounded-md bg-canvas border border-line text-xs text-muted">{r.infoMessage}</span>
                )}
              </div>
            </div>

            <button type="button" onClick={() => onRemove(item.id)} className={iconBtn + ' -mr-1 -mt-1 hover:!text-danger-600'} title="Remove" aria-label={`Remove ${item.name}`}>
              <X size={17} aria-hidden="true" />
            </button>
          </div>

          {/* Metrics / state */}
          <div className="mt-2.5 text-[13px]">
            {isDone && r ? (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                <span className="inline-flex items-center gap-1.5 text-muted">
                  <span className="font-medium">{inputFormat}</span>
                  <ArrowRight size={12} aria-hidden="true" /><span className="sr-only">to</span>
                  <span className="font-semibold text-brand-800">{r.extension.toUpperCase()}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 tabular-nums">
                  <span className="text-muted line-through decoration-subtle">{formatBytes(r.originalSize)}</span>
                  <ArrowRight size={12} className="text-subtle" aria-hidden="true" /><span className="sr-only">to</span>
                  <span className="font-semibold text-ink">{formatBytes(r.compressedSize)}</span>
                </span>
                {!skipped && pct !== null && (
                  pct >= 0.5 ? (
                    <span className="px-1.5 py-0.5 rounded-md bg-success-50 text-success-700 text-xs font-semibold tabular-nums">
                      {formatSavedPercent(r.originalSize, r.compressedSize)} · saved {formatBytes(savedBytes(r.originalSize, r.compressedSize))}
                    </span>
                  ) : pct <= -0.5 ? (
                    <span className="px-1.5 py-0.5 rounded-md bg-warning-50 text-warning-700 text-xs font-semibold tabular-nums">
                      {formatSavedPercent(r.originalSize, r.compressedSize)} — keep the original
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded-md bg-canvas text-muted text-xs font-semibold">No size change</span>
                  )
                )}
                <span className="text-muted tabular-nums hidden sm:inline">
                  {r.originalWidth}×{r.originalHeight}
                  {(r.width !== r.originalWidth || r.height !== r.originalHeight) && <> → {r.width}×{r.height}</>} px
                </span>
              </div>
            ) : needsConfirmation ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <p className="text-warning-700">Already within your target ({formatBytes(item.file.size)}). Optimize anyway?</p>
                <div className="flex items-center gap-2 shrink-0">
                  <button type="button" onClick={() => onSkip(item.id)} className="h-8 px-3 rounded-lg border border-line-strong bg-white text-[13px] font-semibold text-ink hover:bg-canvas">Keep original</button>
                  <button type="button" onClick={() => onConfirm(item.id)} className="h-8 px-3 rounded-lg bg-brand-500 text-on-brand text-[13px] font-semibold hover:bg-brand-600">Optimize</button>
                </div>
              </div>
            ) : isProcessing ? (
              <div className="max-w-xs">
                <div className="h-1.5 rounded-full bg-brand-100 overflow-hidden" role="progressbar" aria-label={`Optimizing ${item.name}`}>
                  <div className="h-full w-1/3 bg-brand-600 rounded-full animate-op-indeterminate" />
                </div>
              </div>
            ) : isError || isInvalid ? (
              <p className="text-danger-700" role="alert">{item.error || 'This image could not be processed.'}</p>
            ) : (
              <p className="text-muted tabular-nums">
                {inputFormat && <>{inputFormat} · </>}{formatBytes(item.file.size)}
                {item.width && item.height ? <> · {item.width}×{item.height} px</> : null}
                {isValidating ? ' · Checking file…' : ' · Waiting in queue'}
              </p>
            )}
          </div>

          {/* Actions */}
          {(isDone || isError) && (
            <div className="flex flex-wrap items-center gap-1 mt-3 -ml-2">
              {isDone && r && (
                <>
                  <a href={r.compressedUrl} download={downloadNameFor(item)} className="h-8 px-3 inline-flex items-center gap-1.5 rounded-lg text-[13px] font-semibold text-brand-800 hover:bg-brand-50">
                    <Download size={15} aria-hidden="true" /> Download
                  </a>
                  {!skipped && (
                    <button type="button" onClick={() => onCompare(item.id)} className={actionBtn}>
                      <Columns2 size={15} aria-hidden="true" /> Compare
                    </button>
                  )}
                  <button type="button" onClick={handleCopy} className={actionBtn}>
                    <Copy size={15} aria-hidden="true" /> Copy
                  </button>
                </>
              )}
              <button type="button" onClick={() => onRedo(item.id)} className={actionBtn} title="Process again with current settings">
                <RefreshCw size={15} aria-hidden="true" /> {isError ? 'Retry' : 'Reprocess'}
              </button>
              {isDone && steps.length > 0 && (
                <button type="button" onClick={() => setIsExpanded(v => !v)} aria-expanded={isExpanded} className={actionBtn + ' ml-auto'}>
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
                    <tr key={idx} className={`border-t border-line ${last ? 'text-brand-800 font-semibold' : 'text-ink'}`}>
                      <td className="py-1.5 pr-3 text-muted">{idx + 1}</td>
                      <td className="py-1.5 pr-3 whitespace-nowrap">{step.label}</td>
                      <td className="py-1.5 pr-3 whitespace-nowrap">{step.width}×{step.height}</td>
                      <td className="py-1.5 pr-3">{Math.round(step.quality * 100)}%</td>
                      <td className="py-1.5 text-right whitespace-nowrap">{formatBytes(step.size)}</td>
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
});
QueueItem.displayName = 'QueueItem';
