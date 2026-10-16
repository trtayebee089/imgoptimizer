
import React, { useEffect } from 'react';
import { X, BookOpen, MousePointer2, Zap, BrainCircuit, BarChart3, ShieldCheck, Layers, ArrowLeftRight, Download } from 'lucide-react';

interface UserGuideModalProps {
  onClose: () => void;
}

const GuideSection: React.FC<{ icon: any; title: string; children: React.ReactNode }> = ({ icon: Icon, title, children }) => (
  <div className="dark:bg-white/[0.03] bg-slate-100/50 border dark:border-white/5 border-slate-200/60 p-6 rounded-[32px] hover:border-blue-500/30 transition-all group">
    <div className="flex items-center gap-4 mb-4">
      <div className="w-12 h-12 dark:bg-blue-500/10 bg-white rounded-2xl flex items-center justify-center text-blue-500 shadow-sm border dark:border-white/5 border-slate-200/50 group-hover:scale-110 transition-transform">
        <Icon size={24} />
      </div>
      <h4 className="text-sm font-black dark:text-white text-slate-800 uppercase tracking-wider">{title}</h4>
    </div>
    <div className="text-[11px] font-medium leading-relaxed dark:text-zinc-400 text-slate-500 space-y-2">
      {children}
    </div>
  </div>
);

export const UserGuideModal: React.FC<UserGuideModalProps> = ({ onClose }) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-10">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-2xl animate-in fade-in duration-700" onClick={onClose}></div>

      <div className="relative w-full max-w-5xl dark:bg-white/[0.04] bg-white/70 backdrop-blur-[50px] border dark:border-white/10 border-slate-200/50 rounded-[56px] overflow-hidden shadow-[0_48px_160px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-500 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-10 py-8 border-b dark:border-white/10 border-slate-200/40 shrink-0">
          <div className="flex items-center gap-6">
             <div className="w-14 h-14 dark:bg-blue-500/20 bg-blue-500/10 text-blue-500 rounded-[22px] flex items-center justify-center shadow-inner border border-blue-500/10">
               <BookOpen size={28} />
             </div>
             <div>
               <h3 className="text-2xl font-black dark:text-white text-slate-900 tracking-tight leading-none mb-1">User Guide</h3>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Master your optimization workflow</p>
             </div>
          </div>
          <button onClick={onClose} className="w-14 h-14 flex items-center justify-center dark:bg-white/10 bg-slate-100 rounded-[22px] text-slate-500 hover:text-red-500 transition-all border dark:border-white/10 border-slate-200/50"><X size={32} /></button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <GuideSection icon={MousePointer2} title="Quick Import">
              <p>Drag images from your desktop or browser directly into the workspace. You can also <strong>paste</strong> images from your clipboard or click the Browse button.</p>
            </GuideSection>

            <GuideSection icon={Zap} title="Smart Mode">
              <p>Our intelligent engine iteratively compresses images until they meet your <strong>target KB size</strong>. It balances quality loss against size perfectly.</p>
            </GuideSection>

            <GuideSection icon={BrainCircuit} title="AI Intelligence">
              <p>Powered by <strong>Gemini 3 Flash</strong>, the optimizer distinguishes between photos and graphics to select the best downscaling strategy automatically.</p>
            </GuideSection>

            <GuideSection icon={ArrowLeftRight} title="A/B Comparison">
              <p>Click any thumbnail to open the <strong>Quality Inspector</strong>. Use the interactive slider to compare original vs optimized pixels in real-time.</p>
            </GuideSection>

            <GuideSection icon={BarChart3} title="Insights Hub">
              <p>Switch to the <strong>Dashboard</strong> to view global stats, lifetime bandwidth saved, and your efficiency quotient across all processed files.</p>
            </GuideSection>

            <GuideSection icon={Layers} title="Optimization Log">
              <p>Expand any queue item to see the <strong>Step-by-Step history</strong>. View exactly how many iterations were required to hit your target.</p>
            </GuideSection>

            <GuideSection icon={Download} title="Batch Export">
              <p>Once your workspace is ready, use the <strong>Download All</strong> button to package every optimized image into a single high-speed ZIP archive.</p>
            </GuideSection>

            <GuideSection icon={ShieldCheck} title="Privacy First">
              <p>All processing is <strong>100% Client-Side</strong>. Your images never touch our servers. Security and speed, guaranteed by your own hardware.</p>
            </GuideSection>

            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed dark:border-white/10 border-slate-200 rounded-[32px] text-center">
               <Zap size={32} className="text-blue-500 mb-4 animate-pulse" />
               <p className="text-[10px] font-black dark:text-zinc-500 text-slate-400 uppercase tracking-widest leading-loose">Need help?<br/>Start dropping files!</p>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="px-10 py-6 text-center dark:bg-black/40 bg-slate-100/40 backdrop-blur-xl flex items-center justify-center gap-4 border-t dark:border-white/10 border-slate-200/40 shrink-0">
             <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></div>
             <p className="text-[10px] font-black dark:text-zinc-500 text-slate-400 uppercase tracking-[0.4em]">Engine Version 2.5.0-Glass Stable</p>
        </div>
      </div>
    </div>
  );
};
