import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { chromium, type Browser } from 'playwright';

// Ensure default Playwright browser path points to local-browsers unless specifically overridden
if (!process.env.PLAYWRIGHT_BROWSERS_PATH) {
  process.env.PLAYWRIGHT_BROWSERS_PATH = '0';
}

export interface BrowserStatus {
  ready: boolean;
  version?: string;
  executablePath?: string;
  browsersPath: string;
  user: string;
  homeDir: string;
  error?: string;
}

export class BrowserManager {
  private static cachedStatus: BrowserStatus | null = null;
  private static localBrowsersPath = path.resolve(process.cwd(), 'node_modules/playwright-core/.local-browsers');

  /**
   * Automatically configures permissions and directories on system boot
   */
  public static initEnvironment(): void {
    if (!process.env.PLAYWRIGHT_BROWSERS_PATH) {
      process.env.PLAYWRIGHT_BROWSERS_PATH = '0';
    }

    // Ensure permissions if directory exists
    if (process.platform === 'linux' && fs.existsSync(this.localBrowsersPath)) {
      try {
        execSync(`chmod -R 755 "${this.localBrowsersPath}"`, { stdio: 'ignore' });
      } catch {}
    }

    // Link for standard production runtime users (/www-data-home, /var/www)
    const systemHomes = ['/www-data-home', '/var/www'];
    for (const h of systemHomes) {
      try {
        if (fs.existsSync(h)) {
          const cacheDir = path.join(h, '.cache');
          if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
          }
          const linkTarget = path.join(cacheDir, 'ms-playwright');
          if (!fs.existsSync(linkTarget) && fs.existsSync(this.localBrowsersPath)) {
            try {
              fs.symlinkSync(this.localBrowsersPath, linkTarget, 'dir');
            } catch {}
          }
        }
      } catch {}
    }
  }

  /**
   * Finds the best executable path for Chromium if needed
   */
  public static findChromiumExecutable(): string | null {
    // 1. Search in local-browsers
    if (fs.existsSync(this.localBrowsersPath)) {
      const candidates = [
        'chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell',
        'chromium-1243/chrome-linux64/chrome'
      ];

      for (const rel of candidates) {
        const fullPath = path.join(this.localBrowsersPath, rel);
        if (fs.existsSync(fullPath)) {
          return fullPath;
        }
      }

      // Dynamic search in any chromium directory inside local-browsers
      try {
        const entries = fs.readdirSync(this.localBrowsersPath);
        for (const entry of entries) {
          const shellPath = path.join(this.localBrowsersPath, entry, 'chrome-headless-shell-linux64', 'chrome-headless-shell');
          if (fs.existsSync(shellPath)) return shellPath;
          const chromePath = path.join(this.localBrowsersPath, entry, 'chrome-linux64', 'chrome');
          if (fs.existsSync(chromePath)) return chromePath;
        }
      } catch {}
    }

    // 2. Check standard user cache paths
    const userHomes = [process.env.HOME, '/www-data-home', '/var/www', '/root'].filter(Boolean) as string[];
    for (const home of userHomes) {
      const cacheDir = path.join(home, '.cache/ms-playwright');
      if (fs.existsSync(cacheDir)) {
        try {
          const entries = fs.readdirSync(cacheDir);
          for (const entry of entries) {
            const shellPath = path.join(cacheDir, entry, 'chrome-headless-shell-linux64', 'chrome-headless-shell');
            if (fs.existsSync(shellPath)) return shellPath;
            const chromePath = path.join(cacheDir, entry, 'chrome-linux64', 'chrome');
            if (fs.existsSync(chromePath)) return chromePath;
          }
        } catch {}
      }
    }

    return null;
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Launch Chromium with bounded retries. Browser installation belongs in build/postinstall,
   * not inside a live scan request (which can block the Node event loop).
   */
  public static async launch(): Promise<Browser> {
    this.initEnvironment();

    const launchArgs = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--ignore-certificate-errors',
      '--disable-extensions',
      '--disable-default-apps'
    ];

    const resolvedPath = this.findChromiumExecutable();
    const strategies: Array<{ executablePath?: string; label: string }> = [
      { label: 'Playwright default' },
      ...(resolvedPath ? [{ executablePath: resolvedPath, label: 'explicit executable' }] : [])
    ];
    let lastError: unknown;

    // Retry each available launch strategy up to 2 times. A short backoff helps transient
    // process/resource contention without allowing a scan to hang indefinitely.
    for (let attempt = 1; attempt <= 2; attempt++) {
      for (const strategy of strategies) {
        try {
          const browser = await chromium.launch({
            headless: true,
            args: launchArgs,
            timeout: 10000,
            ...(strategy.executablePath ? { executablePath: strategy.executablePath } : {})
          });
          this.cachedStatus = {
            ready: true,
            version: browser.version(),
            executablePath: strategy.executablePath || resolvedPath || 'detected-by-playwright',
            browsersPath: process.env.PLAYWRIGHT_BROWSERS_PATH || '0',
            user: process.env.USER || (process.getuid ? String(process.getuid()) : 'unknown'),
            homeDir: process.env.HOME || ''
          };
          return browser;
        } catch (err) {
          lastError = err;
          console.warn(`[BrowserManager] ${strategy.label} launch attempt ${attempt}/2 failed: ${(err as Error)?.message || err}`);
        }
      }
      if (attempt < 2) await this.delay(300 * attempt);
    }

    const message = lastError instanceof Error ? lastError.message : String(lastError || 'Unknown Chromium error');
    this.cachedStatus = {
      ready: false,
      executablePath: resolvedPath || 'not-found',
      browsersPath: process.env.PLAYWRIGHT_BROWSERS_PATH || '0',
      user: process.env.USER || (process.getuid ? String(process.getuid()) : 'unknown'),
      homeDir: process.env.HOME || '',
      error: message
    };
    throw new Error(`Chromium failed to launch after 2 bounded attempts per strategy: ${message}. Install the browser with "npx playwright install chromium" and restart BugScout.`);
  }

  /**
   * Initialize the environment and perform one bounded launch check before the API starts
   * accepting requests. The API remains available even if this check fails.
   */
  public static async initialize(): Promise<BrowserStatus> {
    this.initEnvironment();
    try {
      const browser = await this.launch();
      const status = this.cachedStatus || {
        ready: true,
        version: browser.version(),
        executablePath: this.findChromiumExecutable() || 'detected-by-playwright',
        browsersPath: process.env.PLAYWRIGHT_BROWSERS_PATH || '0',
        user: process.env.USER || (process.getuid ? String(process.getuid()) : 'unknown'),
        homeDir: process.env.HOME || ''
      };
      await browser.close();
      this.cachedStatus = status;
      return { ...status };
    } catch (err) {
      const status = this.cachedStatus || {
        ready: false,
        executablePath: this.findChromiumExecutable() || 'not-found',
        browsersPath: process.env.PLAYWRIGHT_BROWSERS_PATH || '0',
        user: process.env.USER || (process.getuid ? String(process.getuid()) : 'unknown'),
        homeDir: process.env.HOME || '',
        error: (err as Error)?.message || String(err)
      };
      this.cachedStatus = status;
      return { ...status };
    }
  }

  /**
   * Checks browser availability and returns diagnostic info
   */
  public static async getStatus(): Promise<BrowserStatus> {
    this.initEnvironment();
    if (this.cachedStatus) return { ...this.cachedStatus };
    return this.initialize();
  }

}
