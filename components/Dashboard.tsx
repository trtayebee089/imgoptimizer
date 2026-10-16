
import React from 'react';
import { GlobalStats } from '../utils/statsManager';
import { Images, HardDriveDownload, HardDriveUpload, TrendingDown, ArrowRight, BookOpen, Layers } from 'lucide-react';
import { Link } from '../lib/router';
import { formatBytes } from './ui';

interface DashboardProps {
  stats: GlobalStats;
  loading?: boolean;
}

const StatCard: React.FC<{ label: string; value: string; detail?: string; icon: React.ElementType }> = ({ label, value, detail, icon: Icon }) => (
  <div className="bg-white border border-line rounded-xl p-5 shadow-card">
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-muted">{label}</p>
      <span className="w-9 h-9 rounded-lg bg-brand-50 text-brand-500 flex items-center justify-center" aria-hidden="true"><Icon size={18} /></span>
    </div>
    <p className="mt-3 text-2xl md:text-3xl font-bold tracking-tight text-ink tabular-nums font-display">{value}</p>
    {detail && <p className="mt-1 text-[13px] text-muted">{detail}</p>}
  </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ stats, loading }) => {
  const efficiency = stats.totalProcessedBytes > 0
    ? Math.round((stats.savedBytes / stats.totalProcessedBytes) * 100)
    : 0;

  const outputBytes = stats.totalProcessedBytes - stats.savedBytes;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10" aria-busy={loading || undefined}>
      <header className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-[28px] font-bold tracking-tight text-ink">Statistics</h1>
        <p className="text-sm text-muted mt-1.5 max-w-2xl">
          Running totals for every image optimized on this Optimizer.pro deployment, across all users. Only file counts and byte totals are recorded — never the images themselves.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Images optimized" value={stats.filesProcessed.toLocaleString()} icon={Images} />
        <StatCard label="Total saved" value={formatBytes(stats.savedBytes, 2)} detail={`${efficiency}% smaller overall`} icon={TrendingDown} />
        <StatCard label="Original size" value={formatBytes(stats.totalProcessedBytes, 2)} detail="Before optimization" icon={HardDriveUpload} />
        <StatCard label="Optimized size" value={formatBytes(outputBytes, 2)} detail="After optimization" icon={HardDriveDownload} />
      </div>

      <div className="mt-6 bg-white border border-line rounded-xl p-5 shadow-card">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-ink">Overall size reduction</span>
          <span className="font-semibold text-ink tabular-nums">{efficiency}%</span>
        </div>
        <div className="mt-3 h-2.5 rounded-full bg-canvas border border-line overflow-hidden" role="progressbar" aria-valuenow={efficiency} aria-valuemin={0} aria-valuemax={100} aria-label="Overall size reduction">
          <div className="h-full bg-brand-500 rounded-full transition-[width] duration-700" style={{ width: `${Math.max(0, Math.min(100, efficiency))}%` }} />
        </div>
        <p className="text-[13px] text-muted mt-2.5 tabular-nums">
          {formatBytes(stats.totalProcessedBytes, 2)} in → {formatBytes(outputBytes, 2)} out
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/app" className="group flex items-center justify-between gap-4 bg-white border border-line rounded-xl p-5 shadow-card hover:border-brand-300">
          <span className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-lg bg-brand-500 text-white flex items-center justify-center" aria-hidden="true"><Layers size={18} /></span>
            <span>
              <span className="block font-semibold text-ink">Open workspace</span>
              <span className="block text-[13px] text-muted">Optimize more images</span>
            </span>
          </span>
          <ArrowRight size={18} className="text-muted group-hover:text-brand-500 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
        </Link>
        <Link to="/app/guide" className="group flex items-center justify-between gap-4 bg-white border border-line rounded-xl p-5 shadow-card hover:border-brand-300">
          <span className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-lg bg-brand-50 text-brand-500 flex items-center justify-center" aria-hidden="true"><BookOpen size={18} /></span>
            <span>
              <span className="block font-semibold text-ink">Read the guide</span>
              <span className="block text-[13px] text-muted">Learn how each setting works</span>
            </span>
          </span>
          <ArrowRight size={18} className="text-muted group-hover:text-brand-500 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
};
