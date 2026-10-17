import React, { useRef } from 'react';
import { UploadCloud, ShieldCheck } from 'lucide-react';
import { ACCEPTED_DESCRIPTION, MAX_FILE_BYTES, MAX_FILES_PER_ADD } from '../lib/fileValidation';
import { buttonClass } from './ui';

interface DropZoneProps {
  onFilesSelect: (files: File[]) => void;
  isDragging?: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFilesSelect, isDragging = false }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelect(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      className={`w-full cursor-pointer rounded-2xl border-2 border-dashed px-6 py-12 md:py-16 flex flex-col items-center text-center transition-colors ${isDragging ? 'border-brand-600 bg-brand-50' : 'border-line-strong bg-white hover:border-brand-400 hover:bg-brand-50/40'}`}
    >
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-colors ${isDragging ? 'bg-brand-500 text-on-brand' : 'bg-brand-50 text-brand-700'}`} aria-hidden="true">
        <UploadCloud size={28} />
      </div>
      <h2 className="text-xl md:text-2xl font-bold text-ink tracking-tight">
        {isDragging ? 'Release to add your images' : 'Drop your images here'}
      </h2>
      <p className="text-sm text-muted mt-2 max-w-sm">
        Drag files anywhere on this page, paste with <kbd className="px-1.5 py-0.5 rounded border border-line bg-canvas text-xs font-sans">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded border border-line bg-canvas text-xs font-sans">V</kbd>, or browse your device.
      </p>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
        className={buttonClass('primary', 'lg', 'mt-6')}
      >
        Choose images
      </button>
      <p className="text-xs text-muted mt-5 max-w-md">
        {ACCEPTED_DESCRIPTION} · up to {Math.round(MAX_FILE_BYTES / 1024 / 1024)} MB each · {MAX_FILES_PER_ADD} files at a time
      </p>
      <p className="text-xs text-muted mt-2 inline-flex items-center gap-1.5">
        <ShieldCheck size={13} className="text-brand-700" aria-hidden="true" /> Processed in your browser — files are not uploaded
      </p>
      <input type="file" multiple accept="image/*,.avif,.heic" ref={inputRef} onChange={handleInputChange} className="hidden" aria-label="Choose image files" />
    </div>
  );
};
