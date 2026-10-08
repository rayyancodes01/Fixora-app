import { Router } from 'express';
import type { Request, Response } from 'express';
import { EventEmitter } from 'events';
import { storage } from '../services/storage.ts';
import { WebsiteAnalyzer } from '../services/websiteAnalyzer.ts';
import { PlaywrightRunner } from '../services/playwrightRunner.ts';
import { AiService } from '../services/aiService.ts';
import type { TestRun } from '../types.ts';

const router = Router();
const runEvents = new EventEmitter();
runEvents.setMaxListeners(100);

let currentlyActiveRunId: string | null = null;
let activeRunStartTime: number = 0;

function broadcastRunUpdate(run: TestRun) {
  runEvents.emit(`update:${run.id}`, run);
}

/**
 * Start a new lightweight 6-test automated run
 */
router.post('/start', async (req: Request, res: Response) => {
  try {
    const { url = 'https://example.com' } = req.body;

    // 1. Validate URL
    const urlValidation = WebsiteAnalyzer.validateUrl(url);
    if (!urlValidation.valid || !urlValidation.url) {
      return res.status(400).json({ error: urlValidation.error || 'Invalid website URL' });
    }
    const targetUrl = urlValidation.url;

    // 2. Prevent concurrent duplicate scans
    if (currentlyActiveRunId) {
      const elapsed = Date.now() - activeRunStartTime;
      const existingRun = storage.getRun(currentlyActiveRunId);
      const isTerminal = existingRun && (existingRun.status === 'completed' || existingRun.status === 'failed' || existingRun.status === 'stopped');

      if (!isTerminal && elapsed < 125000) {
        if (existingRun && existingRun.url === targetUrl) {
          return res.status(200).json({
            message: 'Scan is already running for this website',
            runId: existingRun.id,
            run: existingRun
          });
        } else {
          return res.status(409).json({
            error: 'Another scan is currently in progress. Please wait for it to finish or cancel it first.',
            activeRunId: currentlyActiveRunId
          });
        }
      }
    }

    const runId = `RUN-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
    // Acquire lock immediately to prevent race conditions
    currentlyActiveRunId = runId;
    activeRunStartTime = Date.now();

    // 3. Pre-flight reachability check
    const reachability = await WebsiteAnalyzer.checkReachability(targetUrl, 7000);
    if (!reachability.reachable && reachability.error?.includes('ENOTFOUND')) {
      currentlyActiveRunId = null;
      return res.status(400).json({
        error: reachability.error || 'Unable to access this domain. Please verify the URL and try again.'
      });
    }

    // 4. Create Run Record with the 5 steps and 16 standardized test slots
    const securityInit = WebsiteAnalyzer.evaluateSecurityHeaders(targetUrl, reachability.headers || {});
    const initialTestCases = AiService.getStandardSuite(targetUrl);

    const newRun: TestRun = {
      id: runId,
      url: targetUrl,
      website_type: 'Web Application',
      overall_score: 100,
      overallStatus: 'PASS',
      status: 'running',
      currentStep: 4,
      stepName: 'Playwright Test Execution',
      statusMessage: 'Starting strict 16-test deterministic QA suite (TEST-01 → TEST-16)...',
      categories: ['Core Load', 'Diagnostics', 'Assets', 'Links', 'Interactive', 'Forms', 'Navigation', 'Responsive', 'Stability', 'Network', 'Content', 'Accessibility', 'SEO', 'Performance', 'Security'],
      createdAt: new Date().toISOString(),
      totalTests: initialTestCases.length,
      completedTests: 0,
      passedTests: 0,
      failedTests: 0,
      warningsCount: 0,
      notApplicableCount: 0,
      findingsCount: 0,
      flakyCount: 0,
      skippedTests: 0,
      bugsCount: 0,
      successRate: 0,
      testCases: initialTestCases,
      results: [],
      bugs: [],
      warnings: [],
      executionLogs: [
        {
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
          message: `Run ${runId} initiated for target: ${targetUrl}`,
          status: 'INFO'
        }
      ],
      summary: {
        total_tests: initialTestCases.length,
        passed: 0,
        failed: 0,
        warnings: 0,
        skipped: 0,
        not_applicable: 0,
        stopped: 0,
        flaky: 0,
        not_tested: initialTestCases.length,
        critical_bugs: 0,
        high_bugs: 0,
        medium_bugs: 0,
        low_bugs: 0,
        performance_score: 100,
        accessibility_score: 90,
        security_score: securityInit.score,
        seo_score: 90
      },
      security: securityInit,
      networkLogs: [],
      consoleErrors: [],
      recommendations: []
    };

    storage.saveRun(newRun);

    // 5. Start background execution pipeline (sequential 1 by 1)
    (async () => {
      try {
        await PlaywrightRunner.executeTestRun(newRun, (updated) => {
          broadcastRunUpdate(updated);
        });
      } catch (runErr: any) {
        console.error(`Run ${runId} execution error:`, runErr);
        newRun.status = 'failed';
        newRun.error = runErr.message || 'Execution error during test run';
        storage.saveRun(newRun);
        broadcastRunUpdate(newRun);
      } finally {
        if (currentlyActiveRunId === runId) {
          currentlyActiveRunId = null;
        }
      }
    })();

    return res.status(201).json({
      message: 'Autonomous website test suite initiated successfully',
      runId,
      run: newRun
    });

  } catch (err: any) {
    if (currentlyActiveRunId) {
      currentlyActiveRunId = null;
    }
    console.error('Failed to start test run:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

/**
 * Stop an ongoing test run
 */
router.post(['/stop', '/:id/stop', '/run/:id/stop'], (req: Request, res: Response) => {
  const runId = req.params.id || req.body.runId;
  if (!runId) {
    return res.status(400).json({ error: 'Run ID is required to stop' });
  }

  const stopped = PlaywrightRunner.stopRun(runId);
  if (currentlyActiveRunId === runId) {
    currentlyActiveRunId = null;
  }
  const run = storage.getRun(runId);
  if (run) {
    run.stopped = true;
    run.status = 'stopped';
    run.statusMessage = 'Testing stopped by user';
    storage.saveRun(run);
    broadcastRunUpdate(run);
    return res.json({ message: 'Run stopped successfully', stopped: true, run });
  }

  return res.json({ message: stopped ? 'Stop requested' : 'Run was not active', stopped });
});

/**
 * Get all test history (supports both /history and /tests/history)
 */
router.get(['/history', '/tests/history'], (_req: Request, res: Response) => {
  const runs = storage.getAllRuns();
  return res.json(runs);
});

/**
 * Get dashboard stats (supports both /stats and /tests/stats)
 */
router.get(['/stats', '/tests/stats'], (_req: Request, res: Response) => {
  const stats = storage.getStats();
  return res.json(stats);
});

/**
 * Standalone failure analysis endpoint
 */
router.post('/bug/analyze', async (req: Request, res: Response) => {
  try {
    const analysis = await AiService.analyzeFailure(req.body);
    return res.json(analysis);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Bug analysis failed' });
  }
});

/**
 * Get all bugs
 */
router.get('/bugs', (req: Request, res: Response) => {
  const { severity, status, website } = req.query;
  let bugs = storage.getAllBugs();

  if (severity && typeof severity === 'string' && severity !== 'ALL') {
    bugs = bugs.filter(b => b.severity.toLowerCase() === severity.toLowerCase());
  }
  if (status && typeof status === 'string' && status !== 'ALL') {
    bugs = bugs.filter(b => b.status.toLowerCase() === status.toLowerCase());
  }
  if (website && typeof website === 'string' && website !== 'ALL') {
    bugs = bugs.filter(b => b.websiteUrl.toLowerCase().includes(website.toLowerCase()));
  }

  return res.json(bugs);
});

/**
 * Update bug status
 */
router.patch('/bugs/:id', (req: Request, res: Response) => {
  const { status } = req.body;
  if (!['Open', 'Investigating', 'Resolved'].includes(status)) {
    return res.status(400).json({ error: 'Invalid bug status. Must be Open, Investigating, or Resolved.' });
  }

  const updated = storage.updateBugStatus(req.params.id, status);
  if (!updated) {
    return res.status(404).json({ error: 'Bug report not found' });
  }
  return res.json(updated);
});

/**
 * System settings and status
 */
router.get('/settings', (_req: Request, res: Response) => {
  return res.json({
    geminiConfigured: AiService.isConfigured(),
    geminiModel: 'gemini-3.8-flash',
    playwrightReady: true,
    defaultTimeoutMs: 10000,
    maxConcurrentTests: 1,
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * Export machine-readable JSON Report
 */
router.get(['/run/:id/report.json', '/report.json/:id'], (req: Request, res: Response) => {
  const run = storage.getRun(req.params.id);
  if (!run) {
    return res.status(404).json({ error: 'Test run not found' });
  }

  const machineReport = {
    runId: run.id,
    target: run.url,
    timestamp: run.createdAt,
    completedAt: run.completedAt,
    executionTimeMs: run.executionTimeMs,
    score: run.overall_score,
    website_type: run.website_type,
    summary: run.summary,
    tests: run.testCases,
    results: run.results,
    bugs: run.bugs,
    warnings: run.warnings || []
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="qa-audit-${run.id}.json"`);
  return res.json(machineReport);
});

/**
 * Server-Sent Events stream for real-time test progress
 */
router.get(['/run/:id/stream', '/:id/stream'], (req: Request, res: Response) => {
  const { id } = req.params;
  const run = storage.getRun(id);
  if (!run) {
    return res.status(404).json({ error: 'Test run not found' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  res.write(`data: ${JSON.stringify(run)}\n\n`);

  if (run.status === 'completed' || run.status === 'failed' || run.status === 'stopped') {
    return res.end();
  }

  const updateListener = (updatedRun: TestRun) => {
    res.write(`data: ${JSON.stringify(updatedRun)}\n\n`);
    if (updatedRun.status === 'completed' || updatedRun.status === 'failed' || updatedRun.status === 'stopped') {
      runEvents.off(`update:${id}`, updateListener);
      res.end();
    }
  };

  runEvents.on(`update:${id}`, updateListener);

  req.on('close', () => {
    runEvents.off(`update:${id}`, updateListener);
  });
});

/**
 * Get details of a specific test run
 */
router.get(['/run/:id', '/run-details/:id'], (req: Request, res: Response) => {
  const run = storage.getRun(req.params.id);
  if (!run) {
    return res.status(404).json({ error: 'Test run not found' });
  }
  return res.json(run);
});

/**
 * Delete a test run
 */
router.delete(['/run/:id', '/run-details/:id'], (req: Request, res: Response) => {
  const deleted = storage.deleteRun(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Run not found' });
  }
  return res.json({ message: 'Run deleted successfully' });
});

export default router;
