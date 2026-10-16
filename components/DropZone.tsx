
import React, { useRef } from 'react';
import { ImagePlus, Zap, Plus, Sparkles } from 'lucide-react';

interface DropZoneProps {
  onFilesSelect: (files: File[]) => void;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFilesSelect }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelect(Array.from(e.target.files));
    }
  };

  return (
    <div className="flex flex-col items-center justify-center text-center p-4 md:p-6 animate-in fade-in zoom-in duration-700 w-full max-w-2xl mx-auto">
      <div 
        onClick={() => inputRef.current?.click()}
        className="group cursor-pointer w-full dark:bg-[#18181b] bg-white border dark:border-white/10 border-slate-200/80 backdrop-blur-[60px] rounded-[48px] md:rounded-[64px] p-10 md:p-16 transition-all duration-700 flex flex-col items-center gap-6 md:gap-10 hover:shadow-[0_48px_120px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_48px_120px_rgba(59,130,246,0.05)] hover:-translate-y-2"
      >
        <div className="relative">
            <div className="absolute inset-0 bg-blue-500/10 blur-[40px] md:blur-[60px] rounded-full scale-150 group-hover:bg-blue-500/20 transition-all duration-700"></div>
            <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-[32px] md:rounded-[36px] dark:bg-black/20 bg-slate-50 border dark:border-white/5 border-slate-200/60 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all duration-700 animate-[breath_6s_infinite_ease-in-out]">
                <ImagePlus size={40} className="text-blue-500 md:w-[48px] md:h-[48px] transition-colors" />
            </div>
            <div className="absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 w-8 h-8 md:w-10 md:h-10 bg-white dark:bg-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-2xl border-2 dark:border-black border-white group-hover:scale-125 transition-all">
                <Plus size={16} className="dark:text-white text-blue-600 md:w-[20px] md:h-[20px]" />
            </div>
        </div>
        
        <div className="space-y-3 md:space-y-4">
          <h3 className="text-3xl md:text-4xl font-display font-black dark:text-white text-slate-900 tracking-tight leading-tight text-center px-2">
            Upload Assets.
          </h3>
          <p className="text-[9px] md:text-[11px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest opacity-60 px-4">
            Drag here or tap to browse
          </p>
        </div>
        
        <button className="h-12 md:h-14 px-8 md:px-10 rounded-[18px] md:rounded-[22px] bg-slate-900 dark:bg-white text-white dark:text-black text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl">
            Choose Files
        </button>

        <div className="flex items-center gap-4 md:gap-6 pt-1 md:pt-2 opacity-30 group-hover:opacity-60 transition-all">
            <div className="flex items-center gap-2 text-[8px] md:text-[9px] font-black dark:text-white text-slate-900 uppercase tracking-tight">
                <Zap size={12} className="text-yellow-500 md:w-[14px] md:h-[14px]" /> WebP
            </div>
            <div className="w-1 h-1 rounded-full bg-slate-400"></div>
            <div className="flex items-center gap-2 text-[8px] md:text-[9px] font-black dark:text-white text-slate-900 uppercase tracking-tight">
                <Sparkles size={12} className="text-blue-500 md:w-[14px] md:h-[14px]" /> AI
            </div>
        </div>
      </div>

      <input type="file" multiple accept="image/*" ref={inputRef} onChange={handleInputChange} className="hidden" />
      
      <style>{`
        @keyframes breath {
            0%, 100% { transform: scale(1) translateY(0); }
            50% { transform: scale(1.05) translateY(-5px); }
        }
      `}</style>
    </div>
  );
};
