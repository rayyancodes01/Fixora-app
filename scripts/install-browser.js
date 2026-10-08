import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('[BugScout Infrastructure] Verifying Playwright Chromium browser installation...');

// Set PLAYWRIGHT_BROWSERS_PATH=0 so Playwright installs into node_modules/playwright-core/.local-browsers
process.env.PLAYWRIGHT_BROWSERS_PATH = '0';

const localBrowsersDir = path.resolve(process.cwd(), 'node_modules/playwright-core/.local-browsers');

try {
  // Check if browser is already present in local-browsers
  let needsInstall = true;
  if (fs.existsSync(localBrowsersDir)) {
    const entries = fs.readdirSync(localBrowsersDir);
    const hasChromium = entries.some(e => e.startsWith('chromium-') || e.startsWith('chromium_headless_shell-'));
    if (hasChromium) {
      console.log('[BugScout Infrastructure] Detected Chromium in local-browsers:', entries.filter(e => e.includes('chromium')));
      needsInstall = false;
    }
  }

  if (needsInstall) {
    console.log('[BugScout Infrastructure] Installing Playwright Chromium to local-browsers (PLAYWRIGHT_BROWSERS_PATH=0)...');
    execSync('npx playwright install chromium', {
      stdio: 'inherit',
      env: { ...process.env, PLAYWRIGHT_BROWSERS_PATH: '0' }
    });
  }

  // Ensure full read/execute permissions for any runtime user (e.g. www-data, node, container uid)
  if (fs.existsSync(localBrowsersDir)) {
    try {
      execSync(`chmod -R 755 "${localBrowsersDir}"`, { stdio: 'ignore' });
    } catch {}
  }

  // Ensure compatibility symlinks for production hosting environments (e.g. /www-data-home, /var/www)
  const candidateHomes = ['/www-data-home', '/var/www'];
  for (const homeDir of candidateHomes) {
    try {
      if (fs.existsSync(homeDir)) {
        const cacheDir = path.join(homeDir, '.cache');
        if (!fs.existsSync(cacheDir)) {
          fs.mkdirSync(cacheDir, { recursive: true });
        }
        const targetLink = path.join(cacheDir, 'ms-playwright');
        try {
          if (!fs.existsSync(targetLink)) {
            fs.symlinkSync(localBrowsersDir, targetLink, 'dir');
          }
        } catch {}
      }
    } catch {}
  }

  // Verification step: test launching chromium headless
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  const version = browser.version();
  await browser.close();

  console.log(`[BugScout Infrastructure] Chromium verified and launch-ready! Version: ${version}`);
} catch (error) {
  console.error('[BugScout Infrastructure] Error during Playwright installation/verification:', error);
  process.exit(1);
}
