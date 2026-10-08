import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import testRoutes from './server/routes/testRoutes.ts';
import apiTestRoutes from './server/routes/apiTestRoutes.ts';
import { storage } from './server/services/storage.ts';
import { BrowserManager } from './server/services/browserManager.ts';

// Load environment variables
dotenv.config();

// Initialize Playwright environment and runtime links
BrowserManager.initEnvironment();

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Screenshot serving endpoint
app.get('/api/screenshots/:filename', (req, res) => {
  const filePath = storage.getScreenshotPath(req.params.filename);
  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(404).send('Screenshot not found');
  }
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  fs.createReadStream(filePath).pipe(res);
});

// Mount API routes
app.use('/api/test', testRoutes);
app.use('/api', testRoutes); // Mounts /api/bugs, /api/tests/history, /api/tests/stats, etc.
app.use('/api/api-test', apiTestRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'BugScout API', timestamp: new Date().toISOString() });
});

// Browser Infrastructure Status
app.get('/api/browser-status', async (_req, res) => {
  try {
    const status = await BrowserManager.getStatus();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ ready: false, error: err?.message || String(err) });
  }
});

async function startServer() {
  if (!isProduction) {
    // Development mode: Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {}
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    // Production mode: Serve dist folder
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`BugScout server running on port ${PORT} (isProduction: ${isProduction})`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
