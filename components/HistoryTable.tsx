import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { Badge, formatBytes } from './ui';
import { HistoryBatch, formatDateTime } from '../lib/history';
import { formatSavedPercent } from '../lib/savings';

const STATUS = {
  completed: { label: 'Completed', tone: 'success' as const, Icon: CheckCircle2 },
  partial: { label: 'Partly failed', tone: 'warning' as const, Icon: AlertTriangle },
  failed: { label: 'Failed', tone: 'danger' as const, Icon: XCircle },
};

export const StatusBadge: React.FC<{ status: HistoryBatch['status'] }> = ({ status }) => {
  const s = STATUS[status];
  return <Badge tone={s.tone}><s.Icon size={12} aria-hidden="true" />{s.label}</Badge>;
};

/** Table on wide screens, stacked cards on small screens. */
export const HistoryTable: React.FC<{ items: HistoryBatch[]; caption: string }> = ({ items, caption }) => (
  <>
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="text-left text-xs font-medium text-muted border-b border-line">
            <th scope="col" className="py-2.5 pl-5 pr-3 font-medium">Date</th>
            <th scope="col" className="py-2.5 px-3 font-medium">Images</th>
            <th scope="col" className="py-2.5 px-3 font-medium text-right">Original</th>
            <th scope="col" className="py-2.5 px-3 font-medium text-right">Optimized</th>
            <th scope="col" className="py-2.5 px-3 font-medium text-right">Saved</th>
            <th scope="col" className="py-2.5 px-3 font-medium">Output</th>
            <th scope="col" className="py-2.5 pl-3 pr-5 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {items.map(b => (
            <tr key={b.batchId} className="border-b border-line last:border-b-0">
              <td className="py-3 pl-5 pr-3 text-ink whitespace-nowrap">{formatDateTime(b.endedAt)}</td>
              <td className="py-3 px-3 text-ink">{b.images}{b.failed > 0 && <span className="text-danger-600"> · {b.failed} failed</span>}</td>
              <td className="py-3 px-3 text-right text-muted whitespace-nowrap">{formatBytes(b.originalBytes)}</td>
              <td className="py-3 px-3 text-right text-ink whitespace-nowrap">{formatBytes(b.outputBytes)}</td>
              <td className="py-3 px-3 text-right whitespace-nowrap">
                <span className="font-semibold text-ink">{formatBytes(b.savedBytes)}</span>
                {b.images > 0 && <span className="ml-1.5 text-xs text-muted">{formatSavedPercent(b.originalBytes, b.outputBytes)}</span>}
              </td>
              <td className="py-3 px-3 text-muted uppercase text-xs">{b.formats.join(', ')}</td>
              <td className="py-3 pl-3 pr-5"><StatusBadge status={b.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <ul className="md:hidden divide-y divide-line" aria-label={caption}>
      {items.map(b => (
        <li key={b.batchId} className="px-4 py-3.5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-ink">{formatDateTime(b.endedAt)}</p>
            <StatusBadge status={b.status} />
          </div>
          <p className="mt-1 text-[13px] text-muted tabular-nums">
            {b.images} {b.images === 1 ? 'image' : 'images'}{b.failed > 0 && <span className="text-danger-600"> · {b.failed} failed</span>}
            {' · '}{formatBytes(b.originalBytes)} → <span className="text-ink font-medium">{formatBytes(b.outputBytes)}</span>
            {b.images > 0 && <> · saved {formatBytes(b.savedBytes)}</>}
          </p>
        </li>
      ))}
    </ul>
  </>
);
