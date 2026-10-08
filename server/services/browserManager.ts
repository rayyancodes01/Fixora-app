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
  private static localBrowsersPath = path.resolve(process.cwd(), 'node_modules/playwright-core/.local-browsers');

  /**
   * Automatically configures permissions and directories on system boot
   */
  public static initEnvironment(): void {
    if (!process.env.PLAYWRIGHT_BROWSERS_PATH) {
      process.env.PLAYWRIGHT_BROWSERS_PATH = '0';
    }

    // Ensure permissions if directory exists
    if (fs.existsSync(this.localBrowsersPath)) {
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

  /**
   * Ensures browser is installed, downloading if missing
   */
  public static ensureInstalled(): void {
    const existing = this.findChromiumExecutable();
    if (existing) {
      return;
    }

    console.log('[BrowserManager] Chromium executable not found. Running playwright install chromium...');
    try {
      execSync('npx playwright install chromium', {
        stdio: 'inherit',
        env: { ...process.env, PLAYWRIGHT_BROWSERS_PATH: '0' }
      });
      this.initEnvironment();
    } catch (e: any) {
      console.error('[BrowserManager] Failed to install playwright browser:', e?.message || e);
    }
  }

  /**
   * Launches browser with multi-strategy fallback to ensure reliable execution in production
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

    // Primary attempt: standard launch with environment configured
    try {
      return await chromium.launch({
        headless: true,
        args: launchArgs
      });
    } catch (primaryErr: any) {
      console.warn(`[BrowserManager] Standard launch failed (${primaryErr?.message}). Trying explicit executable...`);

      // Attempt with explicit executablePath
      const resolvedPath = this.findChromiumExecutable();
      if (resolvedPath) {
        try {
          return await chromium.launch({
            headless: true,
            executablePath: resolvedPath,
            args: launchArgs
          });
        } catch (execErr: any) {
          console.warn(`[BrowserManager] Explicit executable launch failed: ${execErr?.message}`);
        }
      }

      // If missing, attempt on-demand install
      this.ensureInstalled();
      const retryPath = this.findChromiumExecutable();

      if (retryPath) {
        return await chromium.launch({
          headless: true,
          executablePath: retryPath,
          args: launchArgs
        });
      }

      // Final attempt standard
      return await chromium.launch({
        headless: true,
        args: launchArgs
      });
    }
  }

  /**
   * Checks browser availability and returns diagnostic info
   */
  public static async getStatus(): Promise<BrowserStatus> {
    this.initEnvironment();
    const execPath = this.findChromiumExecutable();
    const currentUser = process.env.USER || (process.getuid ? String(process.getuid()) : 'unknown');
    const homeDir = process.env.HOME || '';

    try {
      const browser = await this.launch();
      const version = browser.version();
      await browser.close();
      return {
        ready: true,
        version,
        executablePath: execPath || 'detected-by-playwright',
        browsersPath: process.env.PLAYWRIGHT_BROWSERS_PATH || '0',
        user: currentUser,
        homeDir
      };
    } catch (err: any) {
      return {
        ready: false,
        executablePath: execPath || 'not-found',
        browsersPath: process.env.PLAYWRIGHT_BROWSERS_PATH || '0',
        user: currentUser,
        homeDir,
        error: err?.message || String(err)
      };
    }
  }
}
