import type { Request, Response, NextFunction } from 'express';

/** Last-resort API error handler: logs server-side, never sends stack traces or internals to the client. */
export const apiErrorHandler = (err: any, req: Request, res: Response, _next: NextFunction) => {
  if (res.headersSent) return;
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'Malformed JSON body.' });
  if (err?.type === 'entity.too.large') return res.status(413).json({ error: 'Request body is too large.' });
  const dbDown = err?.name === 'MongoServerSelectionError' || err?.name === 'MongoNetworkError' || /buffering timed out|not connected/i.test(err?.message || '');
  if (dbDown) {
    console.error(`[api] Database error on ${req.method} ${req.path}:`, err?.name);
    return res.status(503).json({ error: 'The service is temporarily unavailable. Please try again in a moment.', code: 'db_unavailable' });
  }
  console.error(`[api] Unexpected error on ${req.method} ${req.path}:`, err);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
};
