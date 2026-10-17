import React, { useState } from 'react';
import { History, ChevronLeft, ChevronRight, RotateCw } from 'lucide-react';
import { Card, EmptyState, Alert, Button, LinkButton, PageHeader } from '../components/ui';
import { HistoryTable } from '../components/HistoryTable';
import { useApi, HistoryPage as HistoryPageData } from '../lib/history';
import { TAB_PATHS } from '../lib/routes';

const PAGE_SIZE = 10;

export const HistoryPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const { data, error, loading, reload } = useApi<HistoryPageData>(`/api/history/batches?page=${page}&limit=${PAGE_SIZE}`);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
      <PageHeader
        title="Optimization History"
        description="Each batch of images you optimized, newest first. Only sizes and formats are stored — never the images or their names."
        actions={<Button variant="secondary" size="sm" onClick={reload} disabled={loading}><RotateCw size={14} className={loading ? 'animate-spin' : ''} aria-hidden="true" /> Refresh</Button>}
      />

      {error && (
        <Alert className="mb-4">
          {error}{' '}<button type="button" onClick={reload} className="font-semibold underline">Try again</button>
        </Alert>
      )}

      <Card className="overflow-hidden" aria-busy={loading || undefined}>
        {loading && !data ? (
          <div className="p-5 space-y-3" aria-hidden="true">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 rounded-md bg-canvas animate-pulse" />)}</div>
        ) : data && data.items.length > 0 ? (
          <>
            <HistoryTable items={data.items} caption={`Optimization batches, page ${data.page} of ${data.pages}`} />
            <nav aria-label="History pages" className="flex items-center justify-between gap-3 px-5 py-3 border-t border-line text-sm">
              <p className="text-muted tabular-nums">
                {(data.page - 1) * data.limit + 1}–{Math.min(data.page * data.limit, data.total)} of {data.total} batches
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" disabled={page <= 1 || loading} onClick={() => setPage(p => p - 1)}><ChevronLeft size={15} aria-hidden="true" /> Newer</Button>
                <Button variant="secondary" size="sm" disabled={page >= data.pages || loading} onClick={() => setPage(p => p + 1)}>Older <ChevronRight size={15} aria-hidden="true" /></Button>
              </div>
            </nav>
          </>
        ) : !error ? (
          <EmptyState
            icon={History}
            title="Your history is empty"
            description="Optimized batches will appear here. A batch is every image you process in one go."
            action={<LinkButton to={TAB_PATHS.optimizer}>Optimize images</LinkButton>}
          />
        ) : null}
      </Card>
    </div>
  );
};
