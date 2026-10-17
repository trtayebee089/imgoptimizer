
import React, { useState, useRef, useEffect } from 'react';
import { X, ArrowLeftRight } from 'lucide-react';

interface CompareModalProps {
  originalUrl: string;
  compressedUrl: string;
  filename: string;
  onClose: () => void;
}

export const CompareModal: React.FC<CompareModalProps> = ({ originalUrl, compressedUrl, filename, onClose }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    const previous = document.activeElement as HTMLElement | null;
    sliderRef.current?.focus();
    return () => {
      window.removeEventListener('keydown', handleEsc);
      previous?.focus?.();
    };
  }, [onClose]);

  const handleSlide = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderPosition(Number(e.target.value));
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="compare-title">
      <div className="absolute inset-0 bg-ink/60" onClick={onClose} aria-hidden="true"></div>

      <div className="relative w-full max-w-5xl bg-white rounded-2xl overflow-hidden shadow-overlay flex flex-col max-h-[94vh]">

        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-line shrink-0">
          <div className="min-w-0">
            <h2 id="compare-title" className="text-base font-semibold text-ink font-sans">Compare original and optimized</h2>
            <p className="text-[13px] text-muted truncate">{filename}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close comparison"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-muted hover:text-ink hover:bg-canvas shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        <div className="relative flex-1 bg-canvas overflow-hidden select-none flex items-center justify-center p-3 sm:p-5">
            <div
              ref={containerRef}
              className="relative rounded-lg overflow-hidden border border-line max-h-full max-w-full bg-[repeating-conic-gradient(#EEF1F7_0_25%,#fff_0_50%)] bg-[length:20px_20px]"
            >
                {/* Optimized (right side) */}
                <img
                  src={compressedUrl}
                  alt="Optimized"
                  className="block max-h-[60vh] md:max-h-[70vh] w-auto object-contain select-none"
                  draggable={false}
                />
                <span className="absolute top-3 right-3 bg-white/90 text-ink text-xs font-semibold px-2.5 py-1 rounded-md shadow-card pointer-events-none">
                  Optimized
                </span>

                {/* Original (left side) */}
                <div
                    className="absolute inset-0 overflow-hidden border-r-2 border-white"
                    style={{ width: `${sliderPosition}%` }}
                >
                  <img
                    src={originalUrl}
                    alt="Original"
                    className="block max-h-[60vh] md:max-h-[70vh] w-auto object-contain select-none"
                    style={{
                        width: containerRef.current?.offsetWidth,
                        maxWidth: 'none'
                    }}
                    draggable={false}
                  />
                  <span className="absolute top-3 left-3 bg-ink/80 text-white text-xs font-semibold px-2.5 py-1 rounded-md pointer-events-none">
                    Original
                  </span>
                </div>

                <div
                    className="absolute inset-y-0 pointer-events-none flex items-center justify-center"
                    style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
                    aria-hidden="true"
                >
                    <div className="w-8 h-8 bg-white rounded-full shadow-raised flex items-center justify-center text-brand-800 ring-1 ring-line">
                        <ArrowLeftRight size={14} />
                    </div>
                </div>

                <input
                    ref={sliderRef}
                    type="range"
                    min="0"
                    max="100"
                    value={sliderPosition}
                    onChange={handleSlide}
                    aria-label="Comparison position: original on the left, optimized on the right"
                    aria-valuetext={`${sliderPosition}% original`}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
                />
            </div>
        </div>

        <div className="border-t border-line px-4 py-2.5 shrink-0">
             <p className="text-xs text-muted text-center">Drag the handle or use the arrow keys to compare</p>
        </div>
      </div>
    </div>
  );
};
