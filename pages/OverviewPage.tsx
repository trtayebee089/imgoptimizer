import React from 'react';
import { Images, HardDriveUpload, HardDriveDownload, TrendingDown, ArrowRight, Wand2, History, LifeBuoy, ShieldCheck, RotateCw } from 'lucide-react';
import { Card, StatCard, EmptyState, Alert, Button, LinkButton, formatBytes } from '../components/ui';
import { HistoryTable } from '../components/HistoryTable';
import { useAuth, firstName } from '../lib/auth';
import { Link } from '../lib/router';
import { TAB_PATHS } from '../lib/routes';
import { useApi, HistorySummary } from '../lib/history';
import { savedPercent } from '../lib/savings';

export const OverviewPage: React.FC<{ queueCount: number }> = ({ queueCount }) => {
  const { user } = useAuth();
  const { data, error, loading, reload } = useApi<HistorySummary>('/api/history/summary');
  const t = data?.totals;
  const pct = t ? savedPercent(t.originalBytes, t.outputBytes) : null;
  const hasHistory = Boolean(t && (t.imagesOptimized > 0 || t.failed > 0));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
      {/* Welcome */}
      <Card className="p-6 md:p-8 overflow-hidden relative">
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-brand-50" aria-hidden="true" />
        <div className="relative flex flex-col md:flex-row md:items-center gap-6 justify-between">
          <div>
            <p className="text-sm font-medium text-brand-800">Welcome{user ? `, ${firstName(user.name)}` : ''}</p>
            <h1 className="mt-1 text-2xl md:text-3xl font-bold tracking-tight text-ink">Ready to make some images smaller?</h1>
            <p className="mt-2 text-[15px] text-muted max-w-xl">
              Drop images into the optimizer, pick a target size, and download web-ready WebP files. Everything is processed on your device.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <LinkButton to={TAB_PATHS.optimizer} size="lg"><Wand2 size={18} aria-hidden="true" /> {queueCount > 0 ? `Open optimizer (${queueCount})` : 'Optimize New Images'}</LinkButton>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <section aria-labelledby="stats-heading" className="mt-8">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 id="stats-heading" className="text-lg font-semibold text-ink">Your results</h2>
          <span className="text-xs text-muted">All time · your account only</span>
        </div>
        {error && !data ? (
          <Alert className="mb-4">
            {error}{' '}
            <button type="button" onClick={reload} className="font-semibold underline">Try again</button>
          </Alert>
        ) : null}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard label="Images optimized" value={(t?.imagesOptimized ?? 0).toLocaleString()} detail={t && t.failed > 0 ? `${t.failed} failed (not counted)` : 'Successful optimizations'} icon={Images} loading={loading && !data} />
          <StatCard label="Original size processed" value={formatBytes(t?.originalBytes ?? 0, 2)} detail="Before optimization" icon={HardDriveUpload} loading={loading && !data} />
          <StatCard label="Optimized output" value={formatBytes(t?.outputBytes ?? 0, 2)} detail="After optimization" icon={HardDriveDownload} loading={loading && !data} />
          <StatCard
            label="Total size saved"
            value={formatBytes(t?.savedBytes ?? 0, 2)}
            detail={pct !== null ? `${Math.round(pct)}% ${pct >= 0 ? 'smaller overall' : 'larger overall'}` : 'Nothing processed yet'}
            icon={TrendingDown}
            loading={loading && !data}
          />
        </div>
      </section>

      <div className="mt-8 grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent activity */}
        <Card as="section" className="xl:col-span-2 overflow-hidden" aria-labelledby="recent-heading">
          <div className="px-5 py-4 border-b border-line flex items-center justify-between gap-3">
            <h2 id="recent-heading" className="text-base font-semibold text-ink">Recent activity</h2>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={reload} aria-label="Refresh recent activity" disabled={loading}><RotateCw size={14} className={loading ? 'animate-spin' : ''} aria-hidden="true" /></Button>
              {hasHistory && <Link to={TAB_PATHS.history} className="text-sm font-semibold text-brand-800 hover:underline inline-flex items-center gap-1">View all <ArrowRight size={14} aria-hidden="true" /></Link>}
            </div>
          </div>
          {loading && !data ? (
            <div className="p-5 space-y-3" aria-hidden="true">{[0, 1, 2].map(i => <div key={i} className="h-10 rounded-md bg-canvas animate-pulse" />)}</div>
          ) : data && data.recent.length > 0 ? (
            <HistoryTable items={data.recent} caption="Recent optimization batches" />
          ) : (
            <EmptyState
              icon={History}
              title="No optimizations yet"
              description="When you optimize images, each batch appears here with its original size, optimized size and savings."
              action={<LinkButton to={TAB_PATHS.optimizer}>Optimize your first images</LinkButton>}
            />
          )}
        </Card>

        {/* Shortcuts */}
        <div className="space-y-4">
          <Link to={TAB_PATHS.help} className="group flex items-center gap-4 bg-white border border-line rounded-xl p-5 shadow-card hover:border-brand-300 transition-colors">
            <span className="w-10 h-10 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center shrink-0" aria-hidden="true"><LifeBuoy size={19} /></span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-ink">How Smart mode works</span>
              <span className="block text-[13px] text-muted">Target size, quality floor and dimensions explained</span>
            </span>
            <ArrowRight size={18} className="text-muted group-hover:text-brand-700 group-hover:translate-x-0.5 transition-transform shrink-0" aria-hidden="true" />
          </Link>
          <Card className="p-5">
            <div className="flex items-start gap-3">
              <span className="w-10 h-10 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center shrink-0" aria-hidden="true"><ShieldCheck size={19} /></span>
              <div>
                <p className="font-semibold text-ink">Your images stay on your device</p>
                <p className="text-[13px] text-muted mt-0.5">Optimization runs in your browser. History stores only sizes and formats — never images or file names.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
