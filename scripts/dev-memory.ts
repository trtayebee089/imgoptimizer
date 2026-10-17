// Local development without a MongoDB install: starts a temporary in-memory
// MongoDB, then the normal dev server. Data is discarded when the process exits.
import { MongoMemoryServer } from 'mongodb-memory-server';

const mongod = await MongoMemoryServer.create();
process.env.MONGODB_URI = mongod.getUri('optimizer_dev');
console.log('[dev] Using a temporary in-memory MongoDB (data is lost on exit).');
const stop = async () => { await mongod.stop(); process.exit(0); };
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
await import('../server.ts');
