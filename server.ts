import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import mongoose from "mongoose";
import { createAuthRouter } from "./server/auth";

// --- Schema ---
const StatsSchema = new mongoose.Schema({
    filesProcessed: Number,
    totalProcessedBytes: Number,
    savedBytes: Number,
    singleton: { type: String, default: 'singleton', unique: true }
});
const Stats = mongoose.model('Stats', StatsSchema);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  
  app.use(express.json());

  // Connect to DB
  console.log('Attempting to connect to MongoDB...');
  if (process.env.MONGODB_URI) {
      try {
          await mongoose.connect(process.env.MONGODB_URI);
          console.log('Connected to MongoDB');
      } catch (err) {
          console.error('Failed to connect to MongoDB:', err);
      }
  } else {
      console.warn('MONGODB_URI not set');
  }

  // --- API routes ---
  app.get("/api/stats", async (req, res) => {
      try {
          const stats = await Stats.findOne({ singleton: 'singleton' });
          res.json(stats || { filesProcessed: 0, totalProcessedBytes: 0, savedBytes: 0 });
      } catch (err) {
          res.status(500).json({ error: String(err) });
      }
  });

  app.post("/api/stats", async (req, res) => {
      try {
          const { filesProcessed, totalProcessedBytes, savedBytes } = req.body;
          const stats = await Stats.findOneAndUpdate(
              { singleton: 'singleton' },
              { filesProcessed, totalProcessedBytes, savedBytes },
              { upsert: true, new: true }
          );
          res.json(stats);
      } catch (err) {
          res.status(500).json({ error: String(err) });
      }
  });

  // --- Auth routes ---
  app.use("/api/auth", createAuthRouter());

  // Unknown API routes should not fall through to the SPA.
  app.use("/api", (req, res) => {
      res.status(404).json({ error: "Not found" });
  });

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Express 5 requires a named wildcard; '*' crashes at startup.
    app.get('/{*splat}', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
