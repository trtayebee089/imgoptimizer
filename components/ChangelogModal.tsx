
import React, { useEffect } from 'react';
import { X, Sparkles, Zap, Layout, Shield, History, Layers, BarChart3, HardDrive } from 'lucide-react';

interface ChangelogModalProps {
  onClose: () => void;
}

const ChangelogEntry: React.FC<{ version: string; date: string; tag?: string; items: { icon: any; title: string; desc: string }[] }> = ({ version, date, tag, items }) => (
  <div className="relative pl-10 pb-12 last:pb-0">
    <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-blue-500/50 via-indigo-500/20 to-transparent"></div>
    <div className="absolute left-[-5px] top-1 w-[11px] h-[11px] rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
    
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-2xl font-black dark:text-white text-slate-900 tracking-tight">{version}</h3>
          {tag && <span className="px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-widest border border-blue-500/20">{tag}</span>}
        </div>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{date}</span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item, i) => (
          <div key={i} className="dark:bg-white/[0.03] bg-slate-100/50 border dark:border-white/5 border-slate-200/60 p-4 rounded-3xl hover:border-blue-500/30 transition-all group">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 dark:bg-white/5 bg-white rounded-xl text-blue-500 shadow-sm transition-transform group-hover:scale-110">
                <item.icon size={16} />
              </div>
              <h4 className="text-xs font-black dark:text-zinc-300 text-slate-700 uppercase tracking-wider">{item.title}</h4>
            </div>
            <p className="text-[11px] font-medium leading-relaxed dark:text-zinc-500 text-slate-500">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const ChangelogModal: React.FC<ChangelogModalProps> = ({ onClose }) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-10">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-2xl animate-in fade-in duration-700" onClick={onClose}></div>

      <div className="relative w-full max-w-4xl dark:bg-white/[0.04] bg-white/70 backdrop-blur-[50px] border dark:border-white/10 border-slate-200/50 rounded-[56px] overflow-hidden shadow-[0_48px_160px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-500 flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-10 py-8 border-b dark:border-white/10 border-slate-200/40 shrink-0">
          <div className="flex items-center gap-6">
             <div className="w-14 h-14 dark:bg-blue-500/20 bg-blue-500/10 text-blue-500 rounded-[22px] flex items-center justify-center shadow-inner border border-blue-500/10">
               <History size={28} />
             </div>
             <div>
               <h3 className="text-2xl font-black dark:text-white text-slate-900 tracking-tight leading-none mb-1">Changelog</h3>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">The evolution of Optimizer.pro</p>
             </div>
          </div>
          <button onClick={onClose} className="w-14 h-14 flex items-center justify-center dark:bg-white/10 bg-slate-100 rounded-[22px] text-slate-500 hover:text-red-500 transition-all active:scale-90 border dark:border-white/10 border-slate-200/50 shadow-sm"><X size={32} /></button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
          <div className="space-y-12">
            <ChangelogEntry 
              version="2.5.0" 
              date="Current Version"
              tag="Latest"
              items={[
                { icon: Layout, title: "Glass Design", desc: "Full-scale visual overhaul with backdrop blurs and ambient noise textures." },
                { icon: BarChart3, title: "Pro Dashboard", desc: "Interactive analytics hub with savings tracking and efficiency scoring." },
                { icon: Layers, title: "Workspace V2", desc: "Refined queue management with pencil-on-hover renaming support." },
                { icon: Zap, title: "Micro-FX", desc: "Premium hover animations and layouts transitions for a smoother experience." }
              ]}
            />
            
            <ChangelogEntry 
              version="2.0.0" 
              date="Released Dec 2024"
              tag="AI Update"
              items={[
                { icon: Sparkles, title: "Gemini 3 Core", desc: "Integrated gemini-3-flash-preview for intelligent content analysis." },
                { icon: Zap, title: "Smart Scaling", desc: "Added 1/N divisor logic for high-performance optimization on 4K files." },
                { icon: HardDrive, title: "Batch Actions", desc: "Implemented JSZip for one-click downloading of all processed images." },
                { icon: Shield, title: "Privacy Path", desc: "Fully local processing—none of your data ever leaves your device." }
              ]}
            />

            <ChangelogEntry 
              version="1.0.0" 
              date="Released Sep 2024"
              tag="Stable"
              items={[
                { icon: Zap, title: "Core Optimizer", desc: "Iterative compression engine targeting 100KB file sizes automatically." },
                { icon: Layers, title: "WebP Native", desc: "High-speed conversion to WebP using browser-native Canvas APIs." },
                { icon: BarChart3, title: "Local Stats", desc: "Initial implementation of persistent lifetime savings tracking." }
              ]}
            />
          </div>
        </div>

        <div className="px-10 py-6 text-center dark:bg-black/40 bg-slate-100/40 backdrop-blur-xl flex items-center justify-center gap-4 border-t dark:border-white/10 border-slate-200/40 shrink-0">
             <div className="w-2 h-2 rounded-full bg-blue-500"></div>
             <p className="text-[10px] font-black dark:text-zinc-500 text-slate-400 uppercase tracking-[0.4em]">Continuously Evolving for Better Pixels</p>
             <div className="w-2 h-2 rounded-full bg-blue-500"></div>
        </div>
      </div>
    </div>
  );
};
