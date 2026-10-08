import fs from 'fs';
import path from 'path';
import type { TestRun, BugReport, ApiTestResult } from '../types.ts';

const DATA_DIR = path.resolve(process.cwd(), '.data');
const SCREENSHOTS_DIR = path.join(DATA_DIR, 'screenshots');
const RUNS_FILE = path.join(DATA_DIR, 'history.json');
const BUGS_FILE = path.join(DATA_DIR, 'bugs.json');
const API_TESTS_FILE = path.join(DATA_DIR, 'api-tests.json');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

class StorageService {
  private runs: Map<string, TestRun> = new Map();
  private bugs: Map<string, BugReport> = new Map();
  private apiTests: ApiTestResult[] = [];

  constructor() {
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(RUNS_FILE)) {
        const raw = fs.readFileSync(RUNS_FILE, 'utf-8');
        const list: TestRun[] = JSON.parse(raw);
        list.forEach(r => this.runs.set(r.id, r));
      }
      if (fs.existsSync(BUGS_FILE)) {
        const raw = fs.readFileSync(BUGS_FILE, 'utf-8');
        const list: BugReport[] = JSON.parse(raw);
        list.forEach(b => this.bugs.set(b.id, b));
      }
      if (fs.existsSync(API_TESTS_FILE)) {
        const raw = fs.readFileSync(API_TESTS_FILE, 'utf-8');
        this.apiTests = JSON.parse(raw);
      }
    } catch (err) {
      console.error('Failed to load data from disk:', err);
    }
  }

  private saveToDisk() {
    try {
      const runsArray = Array.from(this.runs.values());
      fs.writeFileSync(RUNS_FILE, JSON.stringify(runsArray, null, 2), 'utf-8');
      const bugsArray = Array.from(this.bugs.values());
      fs.writeFileSync(BUGS_FILE, JSON.stringify(bugsArray, null, 2), 'utf-8');
      fs.writeFileSync(API_TESTS_FILE, JSON.stringify(this.apiTests, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save data to disk:', err);
    }
  }

  public saveRun(run: TestRun): void {
    this.runs.set(run.id, run);
    // Also index any bugs from this run
    if (run.bugs && run.bugs.length > 0) {
      run.bugs.forEach(b => this.bugs.set(b.id, b));
    }
    this.saveToDisk();
  }

  public getRun(id: string): TestRun | undefined {
    return this.runs.get(id);
  }

  public getPreviousCompletedRun(url: string, currentRunId: string): TestRun | undefined {
    const normalize = (u: string) => u.trim().toLowerCase().replace(/\/+$/, '');
    const targetNorm = normalize(url);
    const all = this.getAllRuns();
    return all.find(r => r.id !== currentRunId && normalize(r.url) === targetNorm && (r.status === 'completed' || !!r.completedAt));
  }

  public getAllRuns(): TestRun[] {
    return Array.from(this.runs.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public deleteRun(id: string): boolean {
    const deleted = this.runs.delete(id);
    if (deleted) {
      // Remove associated bugs
      Array.from(this.bugs.values())
        .filter(b => b.testId ? b.testId.startsWith(id) : false)
        .forEach(b => this.bugs.delete(b.id));
      this.saveToDisk();
    }
    return deleted;
  }

  public getAllBugs(): BugReport[] {
    return Array.from(this.bugs.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  public updateBugStatus(id: string, status: 'Open' | 'Investigating' | 'Resolved'): BugReport | undefined {
    const bug = this.bugs.get(id);
    if (bug) {
      bug.status = status;
      this.bugs.set(id, bug);
      // Also update in parent run if present
      for (const run of this.runs.values()) {
        const found = run.bugs?.find(b => b.id === id);
        if (found) {
          found.status = status;
        }
      }
      this.saveToDisk();
      return bug;
    }
    return undefined;
  }

  public saveScreenshot(filename: string, buffer: Buffer): string {
    const fullPath = path.join(SCREENSHOTS_DIR, filename);
    fs.writeFileSync(fullPath, buffer);
    return `/api/screenshots/${filename}`;
  }

  public getScreenshotPath(filename: string): string | null {
    // Sanitize to prevent path traversal
    const safeName = path.basename(filename);
    const fullPath = path.join(SCREENSHOTS_DIR, safeName);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
    return null;
  }

  public saveApiTest(result: ApiTestResult) {
    this.apiTests.unshift(result);
    if (this.apiTests.length > 50) {
      this.apiTests = this.apiTests.slice(0, 50);
    }
    this.saveToDisk();
  }

  public getApiTests(): ApiTestResult[] {
    return this.apiTests;
  }

  public getStats() {
    const allRuns = Array.from(this.runs.values());
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let skippedTests = 0;

    allRuns.forEach(r => {
      totalTests += r.totalTests || 0;
      passedTests += r.passedTests || 0;
      failedTests += r.failedTests || 0;
      skippedTests += r.skippedTests || 0;
    });

    const bugsFound = this.bugs.size;
    const evaluated = passedTests + failedTests;
    const successRate = evaluated > 0 ? Math.round((passedTests / evaluated) * 100) : 0;
    const lastRun = allRuns.length > 0 ? this.getAllRuns()[0] : null;

    return {
      totalRuns: allRuns.length,
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      bugsFound,
      successRate,
      lastTestRun: lastRun ? {
        id: lastRun.id,
        url: lastRun.url,
        createdAt: lastRun.createdAt,
        status: lastRun.status,
        passedTests: lastRun.passedTests,
        failedTests: lastRun.failedTests,
        successRate: lastRun.successRate
      } : null
    };
  }
}

export const storage = new StorageService();
