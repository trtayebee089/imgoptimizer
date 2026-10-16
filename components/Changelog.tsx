
import React from 'react';
// Added Trophy to the import list from lucide-react
import { Sparkles, Zap, Layout, Shield, History, Layers, BarChart3, HardDrive, Cpu, MousePointer2, Type, PieChart, Trophy, Inbox, Target, Bot, BookOpen } from 'lucide-react';

const ChangelogEntry: React.FC<{ version: string; date: string; tag?: string; items: { icon: any; title: string; desc: string }[] }> = ({ version, date, tag, items }) => (
  <div className="relative pl-12 pb-16 last:pb-0">
    <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-blue-500/50 via-indigo-500/20 to-transparent"></div>
    <div className="absolute left-[-6px] top-1 w-[13px] h-[13px] rounded-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)] border-2 border-white dark:border-black"></div>
    
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-3xl font-display font-black dark:text-white text-slate-900 tracking-normal">{version}</h3>
          {tag && <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-normal border border-blue-500/20">{tag}</span>}
        </div>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-normal">{date}</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item, i) => (
          <div key={i} className="dark:bg-[#18181b] bg-white/50 border dark:border-white/10 border-slate-200/60 p-5 rounded-[24px] hover:border-blue-500/30 transition-all group backdrop-blur-lg">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-2.5 dark:bg-white/5 bg-white rounded-xl text-blue-500 shadow-sm transition-transform group-hover:scale-110">
                <item.icon size={18} />
              </div>
              <h4 className="text-xs font-black dark:text-zinc-300 text-slate-700 uppercase tracking-normal">{item.title}</h4>
            </div>
            <p className="text-[11px] font-medium leading-relaxed dark:text-zinc-500 text-slate-500">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const Changelog: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-24 px-4 sm:px-6">
      <div className="flex items-center gap-6">
         <div className="w-16 h-16 dark:bg-blue-500/20 bg-blue-500/10 text-blue-500 rounded-[24px] flex items-center justify-center shadow-inner border border-blue-500/10">
           <History size={32} />
         </div>
         <div>
           <h3 className="text-3xl font-display font-black dark:text-white text-slate-900 tracking-normal leading-none mb-2">Version History</h3>
           <p className="text-xs font-bold text-slate-400 uppercase tracking-normal">Tracking every breakthrough</p>
         </div>
      </div>

      <div className="mt-8">
        {/* Added v3.2.1 changelog entry */}
        <ChangelogEntry 
          version="3.2.1" 
          date="Today"
          tag="UX Refinement"
          items={[
            { icon: Layout, title: "Aesthetic Patch", desc: "Resolved broken shadow rendering in the primary logo module for a cleaner look." },
            { icon: PieChart, title: "Circle Gauge Fix", desc: "Hardened the RadialGauge scaling using SVG viewBox for pixel-perfect mobile displays." },
            { icon: Layers, title: "Nav Minimalism", desc: "Optimized header navigation to prioritize icons on tablet/mobile viewports." }
          ]}
        />

        <ChangelogEntry 
          version="3.1.1" 
          date="Earlier Today"
          tag="Hotfix"
          items={[
            { icon: BookOpen, title: "Icon Recovery", desc: "Successfully restored 'BookOpen' icon in the primary navigation bridge." },
            { icon: Zap, title: "State Hardening", desc: "Resolved undefined variable crashes for pending confirmation counters." },
            { icon: Layout, title: "UX Polish", desc: "Synchronized formatBytes utility implementation across viewing modules." }
          ]}
        />

        <ChangelogEntry 
          version="3.1.0" 
          date="Yesterday"
          tag="Maintenance"
          items={[
            { icon: BookOpen, title: "Dependency Fix", desc: "Initial pass at resolving missing icon imports in the navigation system." },
            { icon: Bot, title: "Vision Engine", desc: "Improved image processing stability when utilizing Gemini for analysis." },
            { icon: Zap, title: "Stability", desc: "Reinforced iterative loops for higher reliability on asset clusters." }
          ]}
        />

        <ChangelogEntry 
          version="3.0.0" 
          date="Yesterday"
          tag="Major Release"
          items={[
            { icon: Layout, title: "Visual Perfection", desc: "Complete UI/UX overhaul with premium glassmorphism and ambient motion." },
            { icon: Bot, title: "Intelligence Engine", desc: "Upgraded asset loading and icon registry for the AI vision core." },
            { icon: Zap, title: "Engine Tuning", desc: "Hardened the iterative compression loop for consistency." }
          ]}
        />

        <ChangelogEntry 
          version="2.9.0" 
          date="Last Week"
          tag="Utility Update"
          items={[
            { icon: Inbox, title: "Data Distillation", desc: "Removed vanity metrics to focus on raw bandwidth savings." },
            { icon: Target, title: "Impact Summary", desc: "Added detailed 'Original vs Optimized' throughput analysis." },
            { icon: Layout, title: "Control Center UX", desc: "Refactored settings into an integrated zero-scroll sidebar." }
          ]}
        />
        
        <ChangelogEntry 
          version="2.0.0" 
          date="Dec 2024"
          tag="AI Integration"
          items={[
            { icon: Cpu, title: "Gemini 3 Core", desc: "Integrated Gemini 3 Flash for intelligent 'Photo vs Graphic' analysis." },
            { icon: Zap, title: "Smart Scaling", desc: "Implemented 1/N divisor logic to handle ultra-high-res 4K files efficiently." }
          ]}
        />
      </div>

      <div className="mt-16 py-10 text-center dark:bg-black/40 bg-slate-100/40 backdrop-blur-xl flex flex-col items-center justify-center gap-4 border rounded-[48px] dark:border-white/10 border-slate-200/40">
           <Zap size={24} className="text-blue-500 animate-pulse" />
           <p className="text-[10px] font-black dark:text-zinc-500 text-slate-400 uppercase tracking-normal">Continuously Evolving for Better Pixels</p>
      </div>
    </div>
  );
};
