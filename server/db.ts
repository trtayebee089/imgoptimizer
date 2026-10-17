import mongoose from 'mongoose';

// One cached connection per runtime instance. On Vercel a warm function reuses
// it across invocations; a cold start connects again.

type DbState = 'connected' | 'not_configured' | 'unavailable';

const g = globalThis as typeof globalThis & { __opDb?: Promise<typeof mongoose> | null };

const CONNECT_TIMEOUT_MS = 8000;

export const isDbConfigured = () => Boolean(process.env.MONGODB_URI);

let warnedMissing = false;

/** Connects (once) and resolves when the connection is usable. Rejects on failure so the caller can answer 503. */
export const connectDb = async (): Promise<typeof mongoose> => {
  if (mongoose.connection.readyState === 1) return mongoose;
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    if (!warnedMissing) {
      console.error('[config] MONGODB_URI is not set. Accounts, sessions and history are unavailable until it is configured.');
      warnedMissing = true;
    }
    throw new Error('MONGODB_URI not configured');
  }
  if (!g.__opDb) {
    g.__opDb = mongoose
      .connect(uri, {
        serverSelectionTimeoutMS: CONNECT_TIMEOUT_MS,
        maxPoolSize: 10,
        // Fail fast instead of queueing queries while disconnected.
        bufferCommands: false,
      })
      .catch((err) => {
        g.__opDb = null; // allow a later request to retry
        // Never log the URI itself; the driver message does not include credentials.
        console.error('[db] MongoDB connection failed:', err?.name || 'Error', err?.message || '');
        throw err;
      });
  }
  return g.__opDb;
};

export const dbState = (): DbState => {
  if (!isDbConfigured()) return 'not_configured';
  return mongoose.connection.readyState === 1 ? 'connected' : 'unavailable';
};
