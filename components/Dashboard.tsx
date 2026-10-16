
import React from 'react';
import { GlobalStats } from '../utils/statsManager';
import { Zap, Files, Globe, Scale, Inbox, Activity, TrendingDown, Target, ShieldCheck, Layers, BookOpen, History, ArrowRight } from 'lucide-react';

interface DashboardProps {
  stats: GlobalStats;
  onNavigate: (tab: any) => void;
}

const RadialGauge: React.FC<{ percentage: number; color: string }> = ({ percentage, color }) => {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-full max-w-[180px] md:max-w-[240px] aspect-square shrink-0">
      <svg 
        viewBox="0 0 200 200" 
        className="w-full h-full transform -rotate-90 filter drop-shadow-[0_0_15px_rgba(59,130,246,0.1)]"
      >
        <circle
          cx="100"
          cy="100"
          r={radius}
          stroke="currentColor"
          strokeWidth="12"
          fill="transparent"
          className="text-slate-200 dark:text-white/[0.03]"
        />
        <circle
          cx="100"
          cy="100"
          r={radius}
          stroke="url(#radialGradient)"
          strokeWidth="12"
          fill="transparent"
          strokeDasharray={circumference}
          style={{ strokeDashoffset, transition: 'stroke-dashoffset 2s cubic-bezier(0.3, 0, 0, 1)' }}
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="radialGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-2xl md:text-5xl font-display font-black dark:text-white text-slate-900 tracking-tight">{percentage}%</span>
        <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-tight mt-1 md:mt-2">Efficiency</span>
      </div>
    </div>
  );
};

export const Dashboard: React.FC<DashboardProps> = ({ stats, onNavigate }) => {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const efficiency = stats.totalProcessedBytes > 0 
    ? Math.round((stats.savedBytes / stats.totalProcessedBytes) * 100) 
    : 0;

  const outputBytes = stats.totalProcessedBytes - stats.savedBytes;

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 px-2 md:px-0">
      
      {/* Primary Analytics Cluster */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        
        {/* Savings Command Hub */}
        <div className="lg:col-span-2 relative overflow-hidden dark:bg-[#18181b] bg-white border dark:border-white/10 border-slate-200/60 rounded-[32px] md:rounded-[56px] p-6 md:p-12 shadow-sm transition-all group">
          <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-blue-600/5 rounded-full blur-[80px] md:blur-[140px] group-hover:scale-110 transition-transform duration-[2000ms]"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-16">
            <div className="w-full flex justify-center md:w-auto">
              <RadialGauge percentage={efficiency} color="blue" />
            </div>
            
            <div className="flex-1 space-y-6 md:space-y-10 w-full text-center md:text-left">
              <div>
                <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
                   <div className="px-3 py-1 md:px-4 md:py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-[8px] md:text-[10px] font-black uppercase tracking-tight">Live Aggregate</div>
                   <div className="flex-1 h-px dark:bg-white/5 bg-slate-100"></div>
                </div>
                <h2 className="text-[10px] md:text-sm font-black dark:text-slate-400 text-slate-500 uppercase tracking-tight mb-2 md:mb-4">Total Network Savings</h2>
                <div className="text-4xl md:text-7xl font-display font-black text-blue-600 dark:text-blue-400 tracking-tight">{formatBytes(stats.savedBytes)}</div>
              </div>

              <div className="grid grid-cols-2 gap-4 md:gap-12 border-t dark:border-white/5 border-slate-100 pt-6 md:pt-10">
                <div className="space-y-1 md:space-y-2">
                   <p className="dark:text-white/30 text-slate-400 text-[8px] md:text-[10px] font-black uppercase tracking-tight">Input</p>
                   <div className="text-lg md:text-2xl font-display font-black dark:text-white text-slate-900">{formatBytes(stats.totalProcessedBytes)}</div>
                </div>
                <div className="space-y-1 md:space-y-2">
                   <p className="dark:text-white/30 text-slate-400 text-[8px] md:text-[10px] font-black uppercase tracking-tight">Output</p>
                   <div className="text-lg md:text-2xl font-display font-black text-blue-600 dark:text-blue-400">{formatBytes(outputBytes)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System Intelligence Stack */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6 md:gap-8">
          <div className="dark:bg-[#18181b] bg-white border dark:border-white/10 border-slate-200/60 p-6 md:p-10 rounded-[32px] md:rounded-[48px] flex flex-col justify-between shadow-sm hover:shadow-2xl transition-all duration-700">
             <div className="flex items-center justify-between mb-6 md:mb-10">
                <h3 className="text-[10px] md:text-[11px] font-black text-slate-500 dark:text-zinc-500 uppercase tracking-tight">Units</h3>
                <Inbox size={20} className="text-blue-500 md:w-5.5 md:h-5.5" />
             </div>
             
             <div className="space-y-6 md:space-y-8">
                <div>
                  <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-tight mb-1 md:mb-2">Processed</p>
                  <p className="text-3xl md:text-5xl font-display font-black dark:text-white text-slate-900 tracking-tight">{stats.filesProcessed.toLocaleString()}</p>
                </div>
                
                <div className="flex items-center gap-4 md:gap-5 pt-4 md:pt-6">
                   <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-inner">
                      <Scale size={20} className="md:w-6 md:h-6" />
                   </div>
                   <div>
                      <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-tight">Avg Reduction</p>
                      <p className="text-[11px] md:text-sm font-black dark:text-white text-slate-900">{stats.filesProcessed > 0 ? (stats.savedBytes / stats.totalProcessedBytes * 100).toFixed(1) : 0}% / file</p>
                   </div>
                </div>
             </div>
          </div>

          <div className="dark:bg-[#18181b] bg-white border dark:border-white/10 border-slate-200/60 p-6 md:p-8 rounded-[32px] md:rounded-[40px] shadow-sm flex flex-col justify-center">
             <div className="flex items-center gap-3 text-[10px] md:text-[11px] font-black text-slate-500 dark:text-zinc-500 uppercase tracking-tight">
                <Activity size={16} className="text-blue-500 animate-pulse md:w-[18px] md:h-[18px]" />
                Status
             </div>
             <div className="mt-4 md:mt-6 flex items-center justify-between">
                <span className="text-[10px] md:text-xs font-black dark:text-white text-slate-900 uppercase tracking-tight">Accelerated</span>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                   <span className="text-[9px] md:text-[10px] font-black text-green-500 uppercase tracking-tight">Ready</span>
                </div>
             </div>
          </div>
        </div>

      </div>

      {/* Quick Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <button 
            onClick={() => onNavigate('workspace')}
            className="flex items-center justify-between p-6 md:p-8 rounded-[32px] md:rounded-[40px] bg-blue-600 text-white shadow-xl hover:scale-[1.02] transition-all group"
          >
              <div className="flex items-center gap-4 md:gap-5">
                  <div className="p-3 md:p-4 bg-white/10 rounded-xl md:rounded-2xl">
                      <Layers size={20} className="md:w-6 md:h-6" />
                  </div>
                  <div className="text-left">
                      <h4 className="text-base md:text-lg font-black tracking-tight leading-none mb-1 md:mb-2">Workspace</h4>
                      <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest opacity-60">Visual Assets</p>
                  </div>
              </div>
              <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform md:w-5 md:h-5" />
          </button>

          <button 
            onClick={() => onNavigate('guide')}
            className="flex items-center justify-between p-6 md:p-8 rounded-[32px] md:rounded-[40px] dark:bg-[#18181b] bg-white border dark:border-white/10 border-slate-200 hover:shadow-2xl hover:scale-[1.02] transition-all group"
          >
              <div className="flex items-center gap-4 md:gap-5">
                  <div className="p-3 md:p-4 bg-blue-500/10 rounded-xl md:rounded-2xl text-blue-500">
                      <BookOpen size={20} className="md:w-6 md:h-6" />
                  </div>
                  <div className="text-left">
                      <h4 className="text-base md:text-lg font-black tracking-tight leading-none mb-1 md:mb-2 dark:text-white text-slate-900">User Guide</h4>
                      <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Master the engine</p>
                  </div>
              </div>
              <ArrowRight size={18} className="text-slate-400 group-hover:translate-x-2 transition-transform md:w-5 md:h-5" />
          </button>

          <button 
            onClick={() => onNavigate('changelog')}
            className="flex items-center justify-between p-6 md:p-8 rounded-[32px] md:rounded-[40px] dark:bg-[#18181b] bg-white border dark:border-white/10 border-slate-200 hover:shadow-2xl hover:scale-[1.02] transition-all group md:col-span-2 lg:col-span-1"
          >
              <div className="flex items-center gap-4 md:gap-5">
                  <div className="p-3 md:p-4 bg-emerald-500/10 rounded-xl md:rounded-2xl text-emerald-500">
                      <History size={20} className="md:w-6 md:h-6" />
                  </div>
                  <div className="text-left">
                      <h4 className="text-base md:text-lg font-black tracking-tight leading-none mb-1 md:mb-2 dark:text-white text-slate-900">Updates</h4>
                      <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Version history</p>
                  </div>
              </div>
              <ArrowRight size={18} className="text-slate-400 group-hover:translate-x-2 transition-transform md:w-5 md:h-5" />
          </button>
      </div>

      <div className="text-center py-8 md:py-12">
          <p className="text-[8px] md:text-[10px] font-black dark:text-zinc-600 text-slate-300 uppercase tracking-[0.3em]">Distilled Pro v3.2</p>
      </div>
    </div>
  );
};
