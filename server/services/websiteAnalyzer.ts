import { URL } from 'url';
import type { SecurityAudit, SeoAudit, AccessibilityAudit } from '../types.ts';

export interface PageStructure {
  url: string;
  title: string;
  description?: string;
  websiteType: string;
  headings: string[];
  h1List: string[];
  h2List: string[];
  h3List: string[];
  buttons: Array<{ text: string; selector: string; type?: string; disabled?: boolean }>;
  links: Array<{ text: string; href: string; isInternal: boolean }>;
  forms: Array<{
    id?: string;
    action?: string;
    inputs: Array<{ name?: string; type?: string; placeholder?: string; required?: boolean }>;
    hasSubmitButton: boolean;
    isLoginForm?: boolean;
    isSearchForm?: boolean;
  }>;
  navItems: string[];
  totalImages: number;
  imagesWithoutAlt: number;
  hasResponsiveMeta: boolean;
  hasCanonical: boolean;
  hasRobotsMeta: boolean;
  hasOpenGraph: boolean;
  hasAuthUI: boolean;
  hasSearchUI: boolean;
  hasCookieBanner: boolean;
  loadTimeMs: number;
  bodyTextSnippet: string;
  rawHeaders: Record<string, string>;
}

export class WebsiteAnalyzer {
  /**
   * Validates target URL against SSRF and private address ranges
   */
  public static validateUrl(inputUrl: string): { valid: boolean; error?: string; url?: string } {
    if (!inputUrl || typeof inputUrl !== 'string') {
      return { valid: false, error: 'Website URL is required' };
    }

    let trimmed = inputUrl.trim();
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      trimmed = 'https://' + trimmed;
    }

    let parsed: URL;
    try {
      parsed = new URL(trimmed);
    } catch {
      return { valid: false, error: 'Invalid URL format. Please provide a valid web address (e.g., https://example.com).' };
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { valid: false, error: 'Only HTTP and HTTPS protocols are supported.' };
    }

    const hostname = parsed.hostname.toLowerCase();

    // Check for private / loopback addresses
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      hostname === 'metadata.google.internal' ||
      hostname === '169.254.169.254'
    ) {
      return { valid: false, error: 'Testing local or private network addresses is restricted for safety.' };
    }

    // Check IPv4 private ranges
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const ipMatch = hostname.match(ipv4Regex);
    if (ipMatch) {
      const octet1 = parseInt(ipMatch[1], 10);
      const octet2 = parseInt(ipMatch[2], 10);
      if (
        octet1 === 10 || // 10.0.0.0/8
        octet1 === 127 || // 127.0.0.0/8
        (octet1 === 172 && octet2 >= 16 && octet2 <= 31) || // 172.16.0.0/12
        (octet1 === 192 && octet2 === 168) || // 192.168.0.0/16
        (octet1 === 169 && octet2 === 254) // 169.254.0.0/16
      ) {
        return { valid: false, error: 'Testing private IP ranges is restricted for safety.' };
      }
    }

    return { valid: true, url: parsed.toString() };
  }

  /**
   * Pre-flight ping to check whether the website can be reached and capture headers
   */
  public static async checkReachability(targetUrl: string, timeoutMs: number = 8000): Promise<{
    reachable: boolean;
    status?: number;
    headers?: Record<string, string>;
    error?: string;
  }> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 AIWebsiteTester/2.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        signal: controller.signal
      });

      clearTimeout(timer);
      const headersMap: Record<string, string> = {};
      res.headers.forEach((val, key) => {
        headersMap[key.toLowerCase()] = val;
      });

      return { reachable: true, status: res.status, headers: headersMap };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { reachable: false, error: 'Connection timed out. The website took too long to respond.' };
      }
      return { reachable: false, error: `Unable to access this website (${err.message || 'Network error'}). Please verify the URL and try again.` };
    }
  }

  /**
   * Passive Security Audit based on HTTP headers and protocol
   */
  public static evaluateSecurityHeaders(url: string, headers: Record<string, string>): SecurityAudit {
    const isHttps = url.startsWith('https://');
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    if (!isHttps) {
      score -= 30;
      issues.push('Website is not served over secure HTTPS protocol.');
      recommendations.push('Enforce HTTPS and implement automatic HTTP to HTTPS 301 redirection.');
    }

    const headerChecks = {
      'strict-transport-security': {
        name: 'HSTS (Strict-Transport-Security)',
        penalty: 15,
        rec: 'Add Strict-Transport-Security header (e.g. max-age=31536000; includeSubDomains; preload).'
      },
      'content-security-policy': {
        name: 'Content-Security-Policy (CSP)',
        penalty: 20,
        rec: 'Implement Content-Security-Policy to mitigate Cross-Site Scripting (XSS) and unauthorized data injection.'
      },
      'x-content-type-options': {
        name: 'X-Content-Type-Options',
        penalty: 10,
        rec: 'Add "X-Content-Type-Options: nosniff" to prevent MIME-type sniffing.'
      },
      'x-frame-options': {
        name: 'X-Frame-Options',
        penalty: 10,
        rec: 'Add "X-Frame-Options: DENY" or "SAMEORIGIN" to protect users against clickjacking.'
      },
      'referrer-policy': {
        name: 'Referrer-Policy',
        penalty: 5,
        rec: 'Configure "Referrer-Policy: strict-origin-when-cross-origin" to protect user privacy on external navigations.'
      },
      'permissions-policy': {
        name: 'Permissions-Policy',
        penalty: 5,
        rec: 'Add Permissions-Policy to restrict sensitive browser APIs (e.g. camera, microphone, geolocation).'
      }
    };

    const headerResults: Record<string, { present: boolean; value?: string; recommendation: string }> = {};

    for (const [headerKey, config] of Object.entries(headerChecks)) {
      const val = headers[headerKey];
      if (val) {
        headerResults[config.name] = {
          present: true,
          value: val.slice(0, 100),
          recommendation: 'Configured properly.'
        };
      } else {
        score -= config.penalty;
        headerResults[config.name] = {
          present: false,
          recommendation: config.rec
        };
        issues.push(`Missing security header: ${config.name}`);
        recommendations.push(config.rec);
      }
    }

    return {
      score: Math.max(0, score),
      https: isHttps,
      httpRedirectsToHttps: isHttps,
      headers: headerResults,
      mixedContentCount: 0,
      issues,
      recommendations
    };
  }

  /**
   * Safe passive 404 Error page test
   */
  public static async test404Page(baseUrl: string): Promise<{
    handledCorrectly: boolean;
    statusCode: number;
    hasCustom404: boolean;
    notes: string;
  }> {
    try {
      const test404Url = new URL('/this-page-does-not-exist-qa-audit-test-404', baseUrl).toString();
      const res = await fetch(test404Url, {
        method: 'GET',
        headers: { 'User-Agent': 'AIWebsiteTester-QA-Audit/2.0' }
      });
      const text = await res.text();
      const is404Status = res.status === 404;
      const hasCustomText = text.toLowerCase().includes('not found') || text.toLowerCase().includes('404') || text.toLowerCase().includes('page');

      return {
        handledCorrectly: is404Status,
        statusCode: res.status,
        hasCustom404: hasCustomText && text.length > 200,
        notes: is404Status 
          ? 'Returns standard HTTP 404 Not Found response code' 
          : `Responds with HTTP ${res.status} instead of expected 404 for missing route`
      };
    } catch (err: any) {
      return {
        handledCorrectly: false,
        statusCode: 0,
        hasCustom404: false,
        notes: `Failed to test missing route: ${err.message}`
      };
    }
  }

  /**
   * Heuristic website type detection based on DOM signatures
   */
  public static detectWebsiteType(page: {
    title: string;
    description?: string;
    bodyText: string;
    forms: any[];
    buttons: any[];
    links: any[];
  }): string {
    const text = `${page.title} ${page.description || ''} ${page.bodyText}`.toLowerCase();

    if (text.includes('cart') || text.includes('checkout') || text.includes('price') || text.includes('shop') || text.includes('product') || text.includes('add to cart')) {
      return 'E-commerce';
    }
    if (text.includes('pricing') || text.includes('features') || text.includes('sign in') || text.includes('free trial') || text.includes('dashboard') || text.includes('api')) {
      return 'SaaS / Web Application';
    }
    if (text.includes('resume') || text.includes('portfolio') || text.includes('projects') || text.includes('about me') || text.includes('contact me')) {
      return 'Portfolio';
    }
    if (text.includes('blog') || text.includes('article') || text.includes('read more') || text.includes('published on') || text.includes('author')) {
      return 'Blog / Editorial';
    }
    if (text.includes('menu') || text.includes('reservation') || text.includes('book a table') || text.includes('order online')) {
      return 'Restaurant / Hospitality';
    }
    if (text.includes('doctor') || text.includes('patient') || text.includes('appointment') || text.includes('health') || text.includes('clinic')) {
      return 'Healthcare / Medical';
    }
    if (text.includes('course') || text.includes('learn') || text.includes('student') || text.includes('tutorial') || text.includes('curriculum')) {
      return 'Educational';
    }
    if (text.includes('company') || text.includes('services') || text.includes('our team') || text.includes('contact us') || text.includes('clients')) {
      return 'Corporate / Business';
    }
    return 'Landing Page / Web Service';
  }
}
