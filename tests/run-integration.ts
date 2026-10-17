// Runs the MongoDB integration tests against a temporary in-memory MongoDB
// (downloaded by mongodb-memory-server on first use). Nothing touches a real database.
import { spawnSync } from 'node:child_process';
import { MongoMemoryServer } from 'mongodb-memory-server';

const mongod = await MongoMemoryServer.create();
const uri = mongod.getUri('optimizer_test');
console.log(`[integration] Temporary MongoDB at ${uri}`);
const result = spawnSync(process.execPath, ['--import', 'tsx', '--test', 'tests/auth.api.test.ts'], {
  stdio: 'inherit',
  env: { ...process.env, MONGODB_URI_TEST: uri, NODE_ENV: 'test' },
});
await mongod.stop();
process.exit(result.status ?? 1);
