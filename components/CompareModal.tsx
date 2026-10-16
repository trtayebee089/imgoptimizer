
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

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleSlide = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderPosition(Number(e.target.value));
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4 md:p-8">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 dark:bg-black/90 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-5xl dark:bg-[#1e293b] bg-white border dark:border-white/10 border-slate-200 rounded-[24px] md:rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[95vh] sm:max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b dark:border-white/10 border-slate-100 dark:bg-[#0f172a]/50 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
             <div className="p-1.5 md:p-2 dark:bg-purple-500/10 bg-purple-100 text-purple-600 dark:text-purple-400 rounded-lg shrink-0">
               <ArrowLeftRight size={16} className="md:w-5 md:h-5" />
             </div>
             <div className="min-w-0">
               <h3 className="text-sm md:text-lg font-bold dark:text-white text-slate-900 truncate">Compare</h3>
               <p className="text-[10px] md:text-xs text-gray-500 truncate max-w-full">{filename}</p>
             </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 md:p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white shrink-0"
          >
            <X size={20} className="md:w-6 md:h-6" />
          </button>
        </div>

        {/* Comparison Area */}
        <div className="relative flex-1 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] dark:bg-gray-900 bg-slate-100 overflow-hidden select-none flex items-center justify-center p-2 md:p-4">
            
            <div 
              ref={containerRef}
              className="relative shadow-2xl rounded-lg overflow-hidden border dark:border-white/5 border-slate-300 max-h-full max-w-full"
            >
                {/* Image Base (Compressed - Right Side) */}
                <img 
                  src={compressedUrl} 
                  alt="Compressed" 
                  className="block max-h-[60vh] md:max-h-[70vh] w-auto object-contain select-none"
                  draggable={false}
                />
                <div className="absolute top-2 right-2 md:top-4 md:right-4 bg-black/60 backdrop-blur text-white text-[8px] md:text-xs font-bold px-2 py-0.5 md:px-3 md:py-1 rounded-full border border-white/10 pointer-events-none shadow-lg">
                  Optimized
                </div>

                {/* Image Overlay (Original - Left Side) */}
                <div 
                    className="absolute inset-0 overflow-hidden border-r-2 border-white shadow-[0_0_20px_rgba(0,0,0,0.5)]"
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
                  <div className="absolute top-2 left-2 md:top-4 md:left-4 bg-purple-500/80 backdrop-blur text-white text-[8px] md:text-xs font-bold px-2 py-0.5 md:px-3 md:py-1 rounded-full border border-white/10 pointer-events-none shadow-lg">
                    Original
                  </div>
                </div>

                {/* Slider Thumb Handle */}
                <div 
                    className="absolute inset-y-0 pointer-events-none flex items-center justify-center"
                    style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
                >
                    <div className="w-6 h-6 md:w-8 md:h-8 bg-white rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)] flex items-center justify-center text-black">
                        <ArrowLeftRight size={12} className="md:w-3.5 md:h-3.5" />
                    </div>
                </div>

                {/* Invisible Range Input for Interaction */}
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={sliderPosition}
                    onChange={handleSlide}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
                />
            </div>

        </div>

        {/* Footer Hint */}
        <div className="dark:bg-[#0f172a]/50 bg-slate-50 border-t dark:border-white/10 border-slate-200 px-4 py-2 shrink-0">
             <p className="text-[10px] md:text-xs text-gray-500 text-center">Slide to compare</p>
        </div>

      </div>
    </div>
  );
};
