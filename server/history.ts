import express from 'express';
import mongoose from 'mongoose';
import { OptimizationRecord } from './models.js';
import { ensureDb, requireAuth, sameOriginJson, authOf, h } from './auth.js';
import { rateLimit } from './rateLimit.js';
import { apiErrorHandler } from './errors.js';

// Per-user optimization history. Images are processed in the browser; the client
// reports only byte counts and formats for each finished file.

const MAX_RECORDS_PER_REQUEST = 50;
const MAX_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB — far above any file the browser optimizer can decode
const BATCH_ID_RE = /^[A-Za-z0-9_-]{8,64}$/;
const FORMAT_RE = /^[a-z0-9.+-]{1,16}$/;

const isBytes = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= MAX_BYTES;

export const parseRecords = (body: any): { batchId: string; records: any[] } | { error: string } => {
  const batchId = body?.batchId;
  const items = body?.records;
  if (typeof batchId !== 'string' || !BATCH_ID_RE.test(batchId)) return { error: 'Invalid batch id.' };
  if (!Array.isArray(items) || items.length === 0 || items.length > MAX_RECORDS_PER_REQUEST) return { error: `Send between 1 and ${MAX_RECORDS_PER_REQUEST} records.` };
  const records = [];
  for (const r of items) {
    if (!r || (r.status !== 'optimized' && r.status !== 'failed')) return { error: 'Invalid record status.' };
    if (!isBytes(r.originalBytes) || !isBytes(r.outputBytes)) return { error: 'Invalid byte counts.' };
    if (r.status === 'failed' && r.outputBytes !== 0) return { error: 'Failed records cannot have output.' };
    if (r.outputFormat !== 'webp' && r.outputFormat !== 'jpeg' && r.outputFormat !== 'png') return { error: 'Invalid output format.' };
    if (r.mode !== 'smart' && r.mode !== 'basic') return { error: 'Invalid mode.' };
    const inputFormat = typeof r.inputFormat === 'string' && FORMAT_RE.test(r.inputFormat.toLowerCase()) ? r.inputFormat.toLowerCase() : 'unknown';
    records.push({ batchId, status: r.status, originalBytes: r.originalBytes, outputBytes: r.outputBytes, inputFormat, outputFormat: r.outputFormat, mode: r.mode });
  }
  return { batchId, records };
};

const batchGroupStages = [
  {
    $group: {
      _id: '$batchId',
      startedAt: { $min: '$createdAt' },
      endedAt: { $max: '$createdAt' },
      images: { $sum: { $cond: [{ $eq: ['$status', 'optimized'] }, 1, 0] } },
      failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
      originalBytes: { $sum: { $cond: [{ $eq: ['$status', 'optimized'] }, '$originalBytes', 0] } },
      outputBytes: { $sum: { $cond: [{ $eq: ['$status', 'optimized'] }, '$outputBytes', 0] } },
      formats: { $addToSet: '$outputFormat' },
    },
  },
  { $sort: { endedAt: -1 as const, _id: 1 as const } },
];

const shapeBatch = (b: any) => ({
  batchId: b._id,
  startedAt: b.startedAt,
  endedAt: b.endedAt,
  images: b.images,
  failed: b.failed,
  originalBytes: b.originalBytes,
  outputBytes: b.outputBytes,
  savedBytes: b.originalBytes - b.outputBytes,
  formats: b.formats,
  status: b.failed === 0 ? 'completed' : b.images === 0 ? 'failed' : 'partial',
});

export const createHistoryRouter = () => {
  const router = express.Router();
  router.use(express.json({ limit: '32kb' }));
  router.use(sameOriginJson);
  router.use((_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
  router.use(ensureDb);
  router.use(requireAuth);

  const writeLimiter = rateLimit('history:write', 600, 10 * 60 * 1000);

  router.post('/', writeLimiter, h(async (req, res) => {
    const parsed = parseRecords(req.body);
    if ('error' in parsed) return res.status(400).json({ error: parsed.error });
    const userId = authOf(req).user._id;
    await OptimizationRecord.insertMany(parsed.records.map(r => ({ ...r, userId })));
    res.status(201).json({ ok: true, stored: parsed.records.length });
  }));

  router.get('/summary', h(async (req, res) => {
    const userId = new mongoose.Types.ObjectId(String(authOf(req).user._id));
    const [totals] = await OptimizationRecord.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          imagesOptimized: { $sum: { $cond: [{ $eq: ['$status', 'optimized'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
          originalBytes: { $sum: { $cond: [{ $eq: ['$status', 'optimized'] }, '$originalBytes', 0] } },
          outputBytes: { $sum: { $cond: [{ $eq: ['$status', 'optimized'] }, '$outputBytes', 0] } },
        },
      },
    ]);
    const recent = await OptimizationRecord.aggregate([{ $match: { userId } }, ...batchGroupStages, { $limit: 5 }]);
    const t = totals || { imagesOptimized: 0, failed: 0, originalBytes: 0, outputBytes: 0 };
    res.json({
      totals: { imagesOptimized: t.imagesOptimized, failed: t.failed, originalBytes: t.originalBytes, outputBytes: t.outputBytes, savedBytes: t.originalBytes - t.outputBytes },
      recent: recent.map(shapeBatch),
    });
  }));

  router.get('/batches', h(async (req, res) => {
    const userId = new mongoose.Types.ObjectId(String(authOf(req).user._id));
    const page = Math.max(1, Math.min(10000, parseInt(String(req.query.page || '1'), 10) || 1));
    const limit = Math.max(1, Math.min(50, parseInt(String(req.query.limit || '10'), 10) || 10));
    const [result] = await OptimizationRecord.aggregate([
      { $match: { userId } },
      ...batchGroupStages,
      { $facet: { items: [{ $skip: (page - 1) * limit }, { $limit: limit }], count: [{ $count: 'n' }] } },
    ]);
    const total = result?.count?.[0]?.n || 0;
    res.json({ items: (result?.items || []).map(shapeBatch), page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) });
  }));

  router.delete('/', h(async (req, res) => {
    const { deletedCount } = await OptimizationRecord.deleteMany({ userId: authOf(req).user._id });
    res.json({ ok: true, deleted: deletedCount });
  }));

  router.use(apiErrorHandler);
  return router;
};
