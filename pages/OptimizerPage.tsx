import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Trash2, Download, Plus, CheckCircle2, SlidersHorizontal, RefreshCw, RefreshCcw, ChevronDown, Loader2, Play, FastForward, FolderDown, PencilLine, AlertTriangle, XCircle } from 'lucide-react';
import { DropZone } from '../components/DropZone';
import { QueueItem } from '../components/QueueItem';
import { SettingsPanel, summarizeSettings } from '../components/SettingsPanel';
import { CompareModal } from '../components/CompareModal';
import { Alert, Button, Dialog, TextField, formatBytes } from '../components/ui';
import { OptimizerQueue } from '../hooks/useOptimizerQueue';
import { formatSavedPercent } from '../lib/savings';

const toolbarBtn = 'h-9 px-3 inline-flex items-center gap-1.5 rounded-lg text-[13px] font-medium text-muted hover:text-ink hover:bg-ink/[0.04] disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap';

export const OptimizerPage: React.FC<{ optimizer: OptimizerQueue; isDragging: boolean }> = ({ optimizer, isDragging }) => {
  const {
    queue, settings, setSettings, isProcessingQueue, counts, totals, selected, toggleSelected, setAllSelected,
    showToast, downloadProgress, historyError, addFiles, removeFromQueue, removeItems, redoItem, reprocess,
    renameItem, confirmItem, skipItem, confirmAllPending, skipAllPending, bulkRename, clearQueue, downloadZip, downloadIndividually,
  } = optimizer;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameBase, setRenameBase] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  const selectedIds = useMemo(() => queue.filter(i => selected.has(i.id)).map(i => i.id), [queue, selected]);
  const hasSelection = selectedIds.length > 0;
  const scope = hasSelection ? selectedIds : undefined;
  const scopeLabel = hasSelection ? 'selected' : 'all';
  const allSelected = queue.length > 0 && selectedIds.length === queue.length;
  const finishedInScope = queue.filter(i => i.status === 'completed' && (!scope || selected.has(i.id))).length;

  const active = counts.validating + counts.pending + counts.processing;
  const settled = counts.completed + counts.error + counts.invalid;
  const progressPct = counts.total ? Math.round((settled / Math.max(1, counts.total - counts.needs_confirmation)) * 100) : 0;
  const failedIds = queue.filter(i => i.status === 'error').map(i => i.id);
  const invalidIds = queue.filter(i => i.status === 'invalid').map(i => i.id);
  const viewing = viewingId ? queue.find(i => i.id === viewingId) : null;
  const onCompare = useCallback((id: string) => setViewingId(id), []);

  const settingsPanel = <SettingsPanel settings={settings} onChange={setSettings} />;

  return (
    <div className="flex min-h-full">
      <div className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="max-w-4xl mx-auto">
          <header className="flex flex-wrap items-end justify-between gap-3 mb-5">
            <div>
              <h1 className="text-2xl md:text-[28px] font-bold tracking-tight text-ink">Image Optimizer</h1>
              <p className="text-sm text-muted mt-1">Images are optimized one at a time, in your browser, as soon as you add them.</p>
            </div>
            {queue.length > 0 && (
              <Button onClick={() => fileInputRef.current?.click()}><Plus size={17} aria-hidden="true" /> Add images</Button>
            )}
          </header>

          {/* Settings on small screens */}
          <div className="xl:hidden mb-5 bg-white border border-line rounded-xl shadow-card">
            <button
              type="button"
              onClick={() => setSettingsOpen(o => !o)}
              aria-expanded={settingsOpen}
              aria-controls="mobile-settings"
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left rounded-xl"
            >
              <span className="w-9 h-9 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center shrink-0" aria-hidden="true"><SlidersHorizontal size={18} /></span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold text-ink">Optimization settings</span>
                <span className="block text-xs text-muted truncate">{summarizeSettings(settings)}</span>
              </span>
              <ChevronDown size={18} className={`text-muted shrink-0 transition-transform ${settingsOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
            {settingsOpen && <div id="mobile-settings" className="px-4 pt-5 pb-2 border-t border-line">{settingsPanel}</div>}
          </div>

          {historyError && <Alert tone="warning" className="mb-4">{historyError}</Alert>}

          {queue.length === 0 ? (
            <DropZone onFilesSelect={addFiles} isDragging={isDragging} />
          ) : (
            <>
              {/* Progress + primary action */}
              <div className="bg-white border border-line rounded-xl shadow-card mb-4 relative overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
                  <div role="status" aria-live="polite" className="min-w-0">
                    <p className="flex items-center gap-2 text-sm text-ink">
                      {active > 0
                        ? <Loader2 size={18} className="animate-spin text-brand-700 shrink-0" aria-hidden="true" />
                        : counts.error > 0 && counts.completed === 0
                          ? <XCircle size={18} className="text-danger-600 shrink-0" aria-hidden="true" />
                          : <CheckCircle2 size={18} className="text-brand-700 shrink-0" aria-hidden="true" />}
                      <span>
                        <span className="font-semibold tabular-nums">{counts.completed}</span> of <span className="tabular-nums">{counts.total}</span> {counts.total === 1 ? 'image' : 'images'} done
                        {counts.error > 0 && <span className="text-danger-600"> · {counts.error} failed</span>}
                        {counts.invalid > 0 && <span className="text-danger-600"> · {counts.invalid} unsupported</span>}
                        {active > 0 && <span className="text-muted"> · {active} in progress</span>}
                      </span>
                    </p>
                    {totals.count > 0 && (
                      <p className="text-[13px] text-muted mt-0.5 tabular-nums">
                        {formatBytes(totals.originalBytes)} → <span className="text-ink font-medium">{formatBytes(totals.outputBytes)}</span>
                        {' · '}{totals.savedBytes >= 0 ? `saved ${formatBytes(totals.savedBytes)}` : `${formatBytes(-totals.savedBytes)} larger`} ({formatSavedPercent(totals.originalBytes, totals.outputBytes)})
                      </p>
                    )}
                  </div>
                  <Button onClick={() => downloadZip(scope)} disabled={finishedInScope === 0}>
                    <FolderDown size={16} aria-hidden="true" /> Download {hasSelection ? 'selected' : 'all'} (ZIP)
                  </Button>
                </div>
                {active > 0 && (
                  <div className="h-1 bg-brand-50" role="progressbar" aria-label="Overall progress" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}>
                    <div className="h-full bg-brand-600 transition-[width] duration-300" style={{ width: `${progressPct}%` }} />
                  </div>
                )}

                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-t border-line bg-canvas/60">
                  <label className="h-9 px-2 inline-flex items-center gap-2 text-[13px] font-medium text-ink cursor-pointer">
                    <input type="checkbox" checked={allSelected} ref={el => { if (el) el.indeterminate = hasSelection && !allSelected; }} onChange={(e) => setAllSelected(e.target.checked)} className="w-4 h-4 accent-[#218838]" />
                    {hasSelection ? `${selectedIds.length} selected` : 'Select all'}
                  </label>
                  <span className="w-px h-5 bg-line mx-1" aria-hidden="true" />
                  <button type="button" onClick={() => downloadIndividually(scope)} disabled={finishedInScope === 0} className={toolbarBtn} title={`Download ${scopeLabel} finished images as separate files`}>
                    <Download size={15} aria-hidden="true" /> Download files
                  </button>
                  <button type="button" onClick={() => setRenameOpen(true)} className={toolbarBtn} title={`Rename ${scopeLabel} files with a common base name`}>
                    <PencilLine size={15} aria-hidden="true" /> Rename
                  </button>
                  <button type="button" onClick={() => reprocess(scope)} className={toolbarBtn} title={`Process ${scopeLabel} images again with the current settings`}>
                    <RefreshCcw size={15} aria-hidden="true" /> Reprocess {hasSelection ? 'selected' : 'all'}
                  </button>
                  {hasSelection ? (
                    <button type="button" onClick={() => removeItems(selectedIds)} className={toolbarBtn + ' ml-auto hover:!text-danger-600 hover:!bg-danger-50'}>
                      <Trash2 size={15} aria-hidden="true" /> Remove selected
                    </button>
                  ) : (
                    <button type="button" onClick={() => setConfirmClear(true)} className={toolbarBtn + ' ml-auto hover:!text-danger-600 hover:!bg-danger-50'} title="Remove all images from the queue">
                      <Trash2 size={15} aria-hidden="true" /> Clear
                    </button>
                  )}
                </div>
                {downloadProgress !== null && (
                  <div className="absolute bottom-0 left-0 h-1 bg-brand-600 transition-all duration-300" style={{ width: `${downloadProgress}%` }} role="progressbar" aria-valuenow={downloadProgress} aria-valuemin={0} aria-valuemax={100} aria-label="Download progress" />
                )}
              </div>

              {counts.needs_confirmation > 0 && (
                <div className="mb-4 rounded-xl border border-warning-500/30 bg-warning-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
                  <p className="text-sm text-warning-700 flex-1">
                    <span className="font-semibold">{counts.needs_confirmation} {counts.needs_confirmation === 1 ? 'image is' : 'images are'}</span> already within your target size. Optimize anyway, or keep the originals?
                  </p>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="secondary" size="sm" onClick={skipAllPending}><FastForward size={14} aria-hidden="true" /> Keep originals</Button>
                    <Button size="sm" onClick={confirmAllPending}><Play size={14} aria-hidden="true" /> Optimize all</Button>
                  </div>
                </div>
              )}

              {failedIds.length > 0 && active === 0 && (
                <Alert tone={counts.completed > 0 ? 'warning' : 'error'} className="mb-4" title={counts.completed > 0 ? 'Some images failed' : 'No images could be optimized'}>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
                    <span>{counts.completed > 0 ? 'Your other results are not affected.' : 'Check the messages on each image, or try a different output format.'}</span>
                    <Button variant="secondary" size="sm" onClick={() => reprocess(failedIds)}><RefreshCw size={14} aria-hidden="true" /> Retry failed</Button>
                  </div>
                </Alert>
              )}

              {invalidIds.length > 0 && (
                <Alert tone="warning" className="mb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
                    <span>{invalidIds.length} {invalidIds.length === 1 ? "file can't be optimized: it isn't a supported image or is over the limits." : "files can't be optimized: they aren't supported images or are over the limits."}</span>
                    <Button variant="secondary" size="sm" onClick={() => removeItems(invalidIds)}>Remove {invalidIds.length === 1 ? 'it' : 'them'}</Button>
                  </div>
                </Alert>
              )}

              <ul className="space-y-3" aria-label="Image queue">
                {queue.map(item => (
                  <QueueItem
                    key={item.id}
                    item={item}
                    selected={selected.has(item.id)}
                    onToggleSelect={toggleSelected}
                    onRemove={removeFromQueue}
                    onRedo={redoItem}
                    onConfirm={confirmItem}
                    onSkip={skipItem}
                    onCompare={onCompare}
                    onToast={showToast}
                    onRename={renameItem}
                  />
                ))}
              </ul>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 w-full py-6 rounded-xl border-2 border-dashed border-line-strong bg-white/60 text-muted hover:text-brand-800 hover:border-brand-400 hover:bg-brand-50/40 flex items-center justify-center gap-2 text-sm font-semibold transition-colors"
              >
                <Plus size={18} aria-hidden="true" /> Add more images
              </button>
            </>
          )}
        </div>
      </div>

      {/* Settings rail on wide screens */}
      <aside aria-labelledby="settings-heading" className="hidden xl:block w-[340px] shrink-0 bg-white border-l border-line">
        <div className="sticky top-0 max-h-[calc(100dvh-4rem)] overflow-y-auto">
          <div className="px-5 h-14 flex items-center border-b border-line bg-white sticky top-0 z-10">
            <h2 id="settings-heading" className="text-sm font-semibold text-ink flex items-center gap-2">
              <SlidersHorizontal size={16} className="text-brand-700" aria-hidden="true" /> Optimization settings
            </h2>
          </div>
          <div className="px-5 py-5">{settingsPanel}</div>
        </div>
      </aside>

      <input type="file" multiple accept="image/*,.avif,.heic" ref={fileInputRef} className="hidden" aria-label="Add image files" onChange={(e) => { if (e.target.files && e.target.files.length > 0) { addFiles(Array.from(e.target.files)); e.target.value = ''; } }} />

      {viewing && viewing.result && (
        <CompareModal originalUrl={viewing.previewUrl} compressedUrl={viewing.result.compressedUrl} filename={viewing.name} onClose={() => setViewingId(null)} />
      )}

      <Dialog
        open={renameOpen}
        onClose={() => setRenameOpen(false)}
        title={hasSelection ? `Rename ${selectedIds.length} selected files` : 'Rename all files'}
        description={<>Files will be named <span className="font-medium text-ink">{renameBase.trim() || 'name'}_1</span>, <span className="font-medium text-ink">{renameBase.trim() || 'name'}_2</span>, and so on.</>}
      >
        <form onSubmit={(e) => { e.preventDefault(); bulkRename(renameBase, scope); setRenameOpen(false); setRenameBase(''); }} className="space-y-5">
          <TextField label="Base name" value={renameBase} onChange={(e) => setRenameBase(e.target.value)} placeholder="e.g. product-photo" autoFocus />
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
            <Button variant="ghost" onClick={() => setRenameOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={!renameBase.trim()}>Rename</Button>
          </div>
        </form>
      </Dialog>

      <Dialog open={confirmClear} onClose={() => setConfirmClear(false)} title="Clear the queue?" description={counts.completed > 0 ? 'Finished images you haven\'t downloaded will be lost.' : 'All images will be removed from the workspace.'}>
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <Button variant="ghost" onClick={() => setConfirmClear(false)}>Cancel</Button>
          <Button variant="danger" onClick={() => { clearQueue(); setConfirmClear(false); }}><AlertTriangle size={15} aria-hidden="true" /> Clear queue</Button>
        </div>
      </Dialog>
    </div>
  );
};
