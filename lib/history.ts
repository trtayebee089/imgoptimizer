import { useCallback, useEffect, useState } from 'react';
import { apiRequest, ApiError } from './auth';

export interface HistoryBatch {
  batchId: string;
  startedAt: string;
  endedAt: string;
  images: number;
  failed: number;
  originalBytes: number;
  outputBytes: number;
  savedBytes: number;
  formats: string[];
  status: 'completed' | 'partial' | 'failed';
}

export interface HistorySummary {
  totals: { imagesOptimized: number; failed: number; originalBytes: number; outputBytes: number; savedBytes: number };
  recent: HistoryBatch[];
}

export interface HistoryPage { items: HistoryBatch[]; page: number; limit: number; total: number; pages: number }

/** Small fetch hook: { data, error, loading, reload }. Keeps previous data visible while reloading. */
export const useApi = <T,>(path: string | null) => {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(path));
  const [nonce, setNonce] = useState(0);
  useEffect(() => {
    if (!path) return;
    let cancelled = false;
    setLoading(true);
    apiRequest<T>(path)
      .then(d => { if (!cancelled) { setData(d); setError(null); } })
      .catch(e => { if (!cancelled) setError(e instanceof ApiError ? e.message : 'Could not load data.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [path, nonce]);
  const reload = useCallback(() => setNonce(n => n + 1), []);
  return { data, error, loading, reload };
};

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
