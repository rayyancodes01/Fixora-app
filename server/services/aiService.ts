import { GoogleGenAI } from '@google/genai';
import type {
  TestCase,
  AiBugAnalysis,
  Priority,
  Severity,
  TestRun
} from '../types.ts';

const apiKey = process.env.GEMINI_API_KEY;

let aiClient: GoogleGenAI | null = null;
if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  aiClient = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export class AiService {
  public static isConfigured(): boolean {
    return !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY';
  }

  /**
   * The locked, immutable, standardized 16 tests for BugScout.
   * Deterministic code is the source of truth.
   */
  public static getStandardSuite(url: string): TestCase[] {
    return [
      {
        id: 'TEST-01',
        title: 'Homepage & HTTP Health',
        name: 'Homepage & HTTP Health',
        category: 'Core Load',
        priority: 'P0',
        steps: [
          '1. Launch headless Chromium browser session',
          `2. Navigate to target URL (${url}) with timeout controller`,
          '3. Verify HTTP response is acceptable (2xx/3xx)',
          '4. Assert document.body exists and is not blank',
          '5. Assert document.title is retrieved and non-empty'
        ],
        description: 'Navigates to URL and verifies valid HTTP response, main document load, and page title.',
        expected_result: 'Page navigation succeeds with valid HTTP status (2xx/3xx), document body has content, and document title exists.',
        actual_result: '',
        status: 'PENDING',
        duration_ms: 0,
        url,
        evidence: [],
        targetSelector: 'body',
        testType: 'page_load'
      },
      {
        id: 'TEST-02',
        title: 'Console & JavaScript Errors',
        name: 'Console & JavaScript Errors',
        category: 'Diagnostics',
        priority: 'P0',
        steps: [
          '1. Attach listeners to console.error and pageerror events',
          '2. Filter out harmless favicon.ico 404s',
          '3. Monitor browser window.consoleErrors array during page execution',
          '4. Assert zero console errors or uncaught script errors'
        ],
        description: 'Captures console.error and uncaught JavaScript errors during page execution.',
        expected_result: 'Zero console.error messages or uncaught JavaScript exceptions.',
        actual_result: '',
        status: 'PENDING',
        duration_ms: 0,
        url,
        evidence: [],
        testType: 'console_errors'
      },
      {
        id: 'TEST-03',
        title: 'Broken Images',
        name: 'Broken Images',
        category: 'Assets',
        priority: 'P1',
        steps: [
          '1. Evaluate all document.images on page',
          '2. Filter images where !img.complete or naturalWidth === 0',
          '3. Collect broken image URLs and assert count is 0',
          '4. Mark N/A if page contains zero images'
        ],
        description: 'Verifies all <img> elements on the page render with non-zero natural dimensions.',
        expected_result: 'All document images complete loading with naturalWidth > 0, or zero images on page.',
        actual_result: '',
        status: 'PENDING',
        duration_ms: 0,
        url,
        evidence: [],
        testType: 'broken_images'
      },
      {
        id: 'TEST-04',
        title: 'Broken Internal Links',
        name: 'Broken Internal Links',
        category: 'Links',
        priority: 'P1',
        steps: [
          '1. Collect all internal <a> links matching location.origin',
          '2. Filter out mailto:, tel:, javascript:, and fragment-only links',
          '3. Perform safe HTTP status checks for internal routes',
          '4. Assert zero 404, 500, 502, 503, or 504 responses'
        ],
        description: 'Validates internal links on page return successful HTTP status (no 404 or 5xx errors).',
        expected_result: 'All tested internal links return valid HTTP status (2xx/3xx).',
        actual_result: '',
        status: 'PENDING',
        duration_ms: 0,
        url,
        evidence: [],
        testType: 'broken_links'
      },
      {
        id: 'TEST-05',
        title: 'Buttons & Interactive Elements',
        name: 'Buttons & Interactive Elements',
        category: 'Interactive',
        priority: 'P1',
        steps: [
          '1. Query visible interactive buttons in DOM',
          '2. Filter out destructive actions (delete, payment, logout, signout)',
          '3. Verify buttons are enabled and visible',
          '4. Safely verify non-destructive controls operate without runtime errors'
        ],
        description: 'Tests visible interactive buttons for enabled state and safe execution without runtime exceptions.',
        expected_result: 'Interactive buttons are enabled, visible, and operate without triggering JavaScript errors.',
        actual_result: '',
        status: 'PENDING',
        duration_ms: 0,
        url,
        evidence: [],
        testType: 'buttons'
      },
      {
        id: 'TEST-06',
        title: 'Forms',
        name: 'Forms',
        category: 'Forms',
        priority: 'P2',
        steps: [
          '1. Query form elements and inputs on page',
          '2. Check for input labels, placeholders, and required constraint markings',
          '3. Verify submit control availability',
          '4. Mark N/A if no forms exist on page'
        ],
        description: 'Checks form elements for proper validation markup, required attributes, and submit controls without submitting real production data.',
        expected_result: 'Forms contain labeled inputs and submit controls; marks N/A if no forms exist.',
        actual_result: '',
        status: 'PENDING',
        duration_ms: 0,
        url,
        evidence: [],
        testType: 'forms'
      },
      {
        id: 'TEST-07',
        title: 'Navigation',
        name: 'Navigation',
        category: 'Navigation',
        priority: 'P1',
        steps: [
          '1. Query header / navigation structure (header, nav, [role="navigation"])',
          '2. Extract primary navigation destinations',
          '3. Verify navigation links are non-empty and accessible',
          '4. Confirm navigation targets are valid and not dead-ends'
        ],
        description: 'Verifies presence, accessibility, and valid destinations of navigation menus.',
        expected_result: 'Navigation structure is visible with responsive valid links.',
        actual_result: '',
        status: 'PENDING',
        duration_ms: 0,
        url,
        evidence: [],
        testType: 'navigation'
      },
      {
        id: 'TEST-08',
        title: 'Network Failures',
        name: 'Network Failures',
        category: 'Network',
        priority: 'P1',
        steps: [
          '1. Intercept all page network requests and responses',
          '2. Filter failed responses with status >= 400 or net::ERR',
          '3. Distinguish critical app resources from harmless analytics',
          '4. Assert zero critical network failures'
        ],
        description: 'Monitors HTTP traffic to catch 4xx/5xx responses and aborted critical network requests.',
        expected_result: 'All critical page network requests (HTML, JS, CSS, APIs) resolve successfully.',
        actual_result: '',
        status: 'PENDING',
        duration_ms: 0,
        url,
        evidence: [],
        testType: 'network_requests'
      },
      {
        id: 'TEST-09',
        title: 'Responsive Layout',
        name: 'Responsive Layout',
        category: 'Responsive',
        priority: 'P1',
        steps: [
          '1. Test Desktop: 1440x900',
          '2. Test Laptop: 1024x768',
          '3. Test Tablet: 768x1024',
          '4. Test Mobile: 390x844',
          '5. Assert scrollWidth <= clientWidth across all tested viewports'
        ],
        description: 'Verifies responsive layout across Desktop, Laptop, Tablet, and Mobile without horizontal overflow.',
        expected_result: 'No horizontal overflow (scrollWidth <= clientWidth) across Desktop, Laptop, Tablet, and Mobile.',
        actual_result: '',
        status: 'PENDING',
        duration_ms: 0,
        url,
        evidence: [],
        testType: 'responsiveness'
      },
      {
        id: 'TEST-10',
        title: 'Accessibility Basics',
        name: 'Accessibility Basics',
        category: 'Accessibility',
        priority: 'P1',
        steps: [
          '1. Check images for alt attributes or presentation roles',
          '2. Check buttons for accessible names or aria-labels',
          '3. Check input elements for associated label tags or aria-label',
          '4. Verify html lang attribute and heading hierarchy'
        ],
        description: 'Performs automated checks for image alt attributes, button accessible names, input labels, and language tag.',
        expected_result: 'Images have alt text, interactive buttons have accessible names, inputs have labels, and html lang is set.',
        actual_result: '',
        status: 'PENDING',
        duration_ms: 0,
        url,
        evidence: [],
        testType: 'accessibility'
      },
      {
        id: 'TEST-11',
        title: 'SEO Basics',
        name: 'SEO Basics',
        category: 'SEO',
        priority: 'P2',
        steps: [
          '1. Verify document.title exists and is non-empty',
          '2. Verify meta description tag presence',
          '3. Verify h1 heading exists on page',
          '4. Verify meta viewport is configured'
        ],
        description: 'Checks essential SEO tags including title, meta description, H1 heading, and viewport configuration.',
        expected_result: 'Document title, meta description, H1 heading, and viewport meta tag are present.',
        actual_result: '',
        status: 'PENDING',
        duration_ms: 0,
        url,
        evidence: [],
        testType: 'seo'
      },
      {
        id: 'TEST-12',
        title: 'Page Content & Blank Screen',
        name: 'Page Content & Blank Screen',
        category: 'Content',
        priority: 'P0',
        steps: [
          '1. Verify document.body exists and has child elements',
          '2. Measure visible text content length (innerText.length > 50)',
          '3. Assert page is not an empty application shell or blank rendering failure'
        ],
        description: 'Verifies page contains meaningful visible content and is not a blank rendering failure.',
        expected_result: 'Page renders meaningful visible text and DOM elements; not completely blank.',
        actual_result: '',
        status: 'PENDING',
        duration_ms: 0,
        url,
        evidence: [],
        testType: 'page_content'
      },
      {
        id: 'TEST-13',
        title: 'Performance Basics',
        name: 'Performance Basics',
        category: 'Performance',
        priority: 'P2',
        steps: [
          '1. Measure navigation load event timing via PerformanceNavigationTiming API',
          '2. Measure DOMContentLoaded and response timing',
          '3. Assert page load completes within acceptable threshold'
        ],
        description: 'Evaluates real browser navigation timing, DOMContentLoaded, and total load duration.',
        expected_result: 'Page navigation and DOMContentLoaded complete within acceptable performance threshold.',
        actual_result: '',
        status: 'PENDING',
        duration_ms: 0,
        url,
        evidence: [],
        testType: 'performance'
      },
      {
        id: 'TEST-14',
        title: 'HTTPS / Mixed Content',
        name: 'HTTPS / Mixed Content',
        category: 'Security',
        priority: 'P1',
        steps: [
          '1. Verify page URL protocol is HTTPS',
          '2. Monitor network requests to detect any insecure http:// resources on https page',
          '3. Assert zero mixed-content resource requests'
        ],
        description: 'Verifies HTTPS protocol and flags insecure http:// subresources loaded on HTTPS pages.',
        expected_result: 'Page is served over HTTPS and zero insecure HTTP mixed-content resources are loaded.',
        actual_result: '',
        status: 'PENDING',
        duration_ms: 0,
        url,
        evidence: [],
        testType: 'https'
      },
      {
        id: 'TEST-15',
        title: 'Theme / UI State',
        name: 'Theme / UI State',
        category: 'Interactive',
        priority: 'P2',
        steps: [
          '1. Detect if page contains a theme toggle or dark/light mode control',
          '2. If found, safely interact and verify state change without errors',
          '3. If no theme toggle exists, mark cleanly as N/A'
        ],
        description: 'Feature-aware test verifying dark/light theme toggles or UI state controls when present.',
        expected_result: 'If theme toggle exists, changes theme state without JS errors; otherwise marks N/A.',
        actual_result: '',
        status: 'PENDING',
        duration_ms: 0,
        url,
        evidence: [],
        testType: 'theme_toggle'
      },
      {
        id: 'TEST-16',
        title: 'Runtime Stability',
        name: 'Runtime Stability',
        category: 'Stability',
        priority: 'P0',
        steps: [
          '1. Monitor for unhandled pageerror and unhandledrejection events throughout scan',
          '2. Verify browser process remains responsive and crash-free',
          '3. Assert zero fatal unhandled runtime exceptions'
        ],
        description: 'Detects uncaught browser runtime exceptions, fatal crashes, and unhandled promise rejections.',
        expected_result: 'Zero uncaught fatal runtime exceptions or page crashes during test session.',
        actual_result: '',
        status: 'PENDING',
        duration_ms: 0,
        url,
        evidence: [],
        testType: 'runtime_stability'
      }
    ];
  }

  public static getStandardSixTests(url: string): TestCase[] {
    return this.getStandardSuite(url);
  }

  /**
   * Generates a concise AI Bug Report when a Playwright test fails (for genuine FAIL only)
   */
  public static async analyzeFailure(params: {
    testId: string;
    testName: string;
    category: string;
    websiteUrl: string;
    expectedResult: string;
    actualResult: string;
    error: string;
    selector?: string;
    consoleErrors?: string[];
  }): Promise<AiBugAnalysis & { severity: Severity; priority: Priority; title: string; description: string }> {
    if (this.isConfigured() && aiClient) {
      try {
        const prompt = `You are a Senior QA Bug Analysis Specialist for BugScout. A Playwright automated browser test failed against a live website.
Test ID: ${params.testId} — ${params.testName}
URL: ${params.websiteUrl}
Expected: ${params.expectedResult}
Actual: ${params.actualResult}
Selector: ${params.selector || 'N/A'}
Error: ${params.error}
Console Errors: ${JSON.stringify(params.consoleErrors || [])}

Provide a concise, developer-focused bug report in JSON format:
{
  "title": "Clear concise bug title (under 60 chars)",
  "severity": "Critical" | "High" | "Medium" | "Low",
  "priority": "P0" | "P1" | "P2" | "P3",
  "description": "Short explanation of what went wrong",
  "possibleCause": "Likely technical root cause",
  "suggestedFix": "Concrete code suggestion or fix steps",
  "reproductionSteps": ["Step 1", "Step 2", "Step 3"]
}`;

        const responsePromise = aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json'
          }
        });

        const response = await Promise.race([
          responsePromise,
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('AI analysis timeout')), 3500))
        ]);

        const text = response.text;
        if (text) {
          const parsed = JSON.parse(text);
          return {
            title: parsed.title || `${params.testId} Failure: ${params.testName}`,
            severity: (['Critical', 'High', 'Medium', 'Low'].includes(parsed.severity) ? parsed.severity : 'Medium') as Severity,
            priority: (['P0', 'P1', 'P2', 'P3'].includes(parsed.priority) ? parsed.priority : 'P1') as Priority,
            description: parsed.description || params.error,
            possibleCause: parsed.possibleCause || 'Element was not found or an unhandled browser error occurred.',
            suggestedFix: parsed.suggestedFix || 'Inspect element selector, verify markup, and confirm required attributes.',
            reproductionSteps: Array.isArray(parsed.reproductionSteps) && parsed.reproductionSteps.length > 0 
              ? parsed.reproductionSteps 
              : [`1. Open ${params.websiteUrl}`, `2. Run ${params.testName}`, `3. Observe failure`]
          };
        }
      } catch {
        // Fall back to heuristic bug report
      }
    }

    // Heuristic Fallback
    const isCritical = params.testId === 'TEST-01' || params.testId === 'TEST-11' || params.error.toLowerCase().includes('500');
    return {
      title: `${params.testId} Failure: ${params.testName}`,
      severity: isCritical ? 'Critical' : 'High',
      priority: isCritical ? 'P0' : 'P1',
      description: params.error || params.actualResult,
      possibleCause: params.selector 
        ? `Element matching "${params.selector}" failed verification or caused unexpected rejection.`
        : 'Unexpected DOM structure or unhandled runtime rejection.',
      suggestedFix: params.selector 
        ? `Ensure element matching "${params.selector}" exists, is rendered in DOM, and does not trigger script errors.`
        : 'Verify page markup, ensure resources exist (200 OK), and check console logs for unhandled errors.',
      reproductionSteps: [
        `1. Navigate to ${params.websiteUrl}`,
        `2. Execute test step: ${params.testName}`,
        `3. Observe failure: ${params.error || params.actualResult}`
      ]
    };
  }

  /**
   * Generates a clean final Markdown report
   */
  public static generateCleanReport(run: TestRun): string {
    const passed = run.passedTests;
    const failed = run.failedTests;
    const warnings = run.warningsCount;
    const notApp = run.notApplicableCount || 0;
    const execTime = run.executionTimeMs ? `${(run.executionTimeMs / 1000).toFixed(1)}s` : 'N/A';
    const overallStatus = run.overallStatus || (failed > 0 ? 'FAIL' : warnings > 0 ? 'PASS WITH WARNINGS' : 'PASS');

    return `# BUGSCOUT — REAL QA AUDIT REPORT

### Target URL: **${run.url}**
### Overall Status: **${overallStatus}**
### Score: **${run.overall_score} / 100**
- **Total Tests:** ${run.totalTests || 16}
- **Passed:** ${passed}
- **Failed:** ${failed}
- **Warnings:** ${warnings}
- **Not Applicable:** ${notApp}
- **Execution Time:** ${execTime}

---

### Executed Tests (Deterministic Suite)
${run.results.map(r => `- **${r.testId} — ${r.name}:** ${r.status} (${r.durationMs}ms)
  - Expected: ${r.expectedResult}
  - Actual: ${r.actualResult}${r.problem ? `\n  - Problem: ${r.problem}` : ''}`).join('\n')}

---

${run.bugs.length > 0 ? `### Diagnostics & Findings — ${run.bugs.length} BUGS
${run.bugs.map((b) => `#### ${b.id} [${b.testId}] ${b.title}
- **Location:** ${b.affected_url || b.websiteUrl}
- **Problem:** ${b.problem || b.description || b.actual_result}
- **Suggested Fix:** ${b.suggestedFix || b.fix_suggestion}
- **Expected:** ${b.expected_result}
- **Actual:** ${b.actual_result}
${b.evidence && b.evidence.length > 0 ? `- **Evidence:**\n${b.evidence.map(e => `  - ${e}`).join('\n')}` : ''}
`).join('\n')}` : '### Diagnostics & Findings — 0 BUGS\n_Zero bugs detected. All assertions passed successfully._'}

${run.warnings && run.warnings.length > 0 ? `---
### Warnings (${run.warnings.length})
${run.warnings.map(w => `- **${w.testId} — ${w.title}:** ${w.message}`).join('\n')}` : ''}
`;
  }
}
