// Vercel serverless entry: every /api/* request is rewritten here (see vercel.json).
// The static frontend is served by Vercel from dist/.
import { createApp } from '../server/app.js';

export default createApp();
