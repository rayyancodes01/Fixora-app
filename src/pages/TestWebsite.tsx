import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TestRun, TestCase, ExecutionLogEvent, BugReport, WarningReport } from '../types';
import { api } from '../services/api';
import {
  Play,
  Square,
  RotateCcw,
  Globe,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MinusCircle,
  Terminal,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Copy,
  Check,
  Download,
  AlertCircle,
  Clock,
  ShieldCheck,
  Bug
} from 'lucide-react';

interface TestWebsiteProps {
  activeRun: TestRun | null;
  setActiveRun: (run: TestRun | null) => void;
  onViewReport: (runId: string) => void;
  onViewBugs: () => void;
  onViewScreenshot: (url: string, testId: string, title: string) => void;
  initialUrl?: string;
}

// Versioned localStorage key for Strict Real QA suite
const TEST_SUITE_STORAGE_KEY = 'websiteTester.testSuite.v2';

interface LockedSuiteDefinition {
  version: 2;
  tests: Array<{ id: string; name: string; category: string }>;
}

const DEFAULT_LOCKED_SUITE: LockedSuiteDefinition = {
  version: 2,
  tests: [
    { id: 'TEST-01', name: 'Homepage / Page Load', category: 'Core Load' },
    { id: 'TEST-02', name: 'Console Error Check', category: 'Diagnostics' },
    { id: 'TEST-03', name: 'Broken Image Check', category: 'Assets' },
    { id: 'TEST-04', name: 'Broken Link Check', category: 'Links' },
    { id: 'TEST-05', name: 'Button Functionality Check', category: 'Interactive' },
    { id: 'TEST-06', name: 'Form Validation Check', category: 'Forms' },
    { id: 'TEST-07', name: 'Navigation Check', category: 'Navigation' },
    { id: 'TEST-08', name: 'Responsive Layout Check', category: 'Responsive' },
    { id: 'TEST-09', name: 'JavaScript Runtime Error Check', category: 'Stability' },
    { id: 'TEST-10', name: 'Failed Network Request Check', category: 'Network' },
    { id: 'TEST-11', name: 'Missing / Invisible Content Check', category: 'Content' },
    { id: 'TEST-12', name: 'Accessibility Basic Check', category: 'Accessibility' },
    { id: 'TEST-13', name: 'SEO Basic Check', category: 'SEO' },
    { id: 'TEST-14', name: 'Performance Basic Check', category: 'Performance' },
    { id: 'TEST-15', name: 'HTTPS / Mixed Content Check', category: 'Security' },
    { id: 'TEST-16', name: 'External Resource Check', category: 'Assets' }
  ]
};

function getOrCreateLockedSuite(): LockedSuiteDefinition {
  try {
    const raw = localStorage.getItem(TEST_SUITE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.version === 2 && Array.isArray(parsed?.tests) && parsed.tests.length === 16) {
        return parsed;
      }
    }
    localStorage.setItem(TEST_SUITE_STORAGE_KEY, JSON.stringify(DEFAULT_LOCKED_SUITE, null, 2));
    return DEFAULT_LOCKED_SUITE;
  } catch {
    return DEFAULT_LOCKED_SUITE;
  }
}

export const TestWebsite: React.FC<TestWebsiteProps> = ({
  activeRun,
  setActiveRun,
  onViewScreenshot,
  initialUrl = ''
}) => {
  const [url, setUrl] = useState(initialUrl || (activeRun ? activeRun.url : 'https://example.com'));
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [expandedTestId, setExpandedTestId] = useState<string | null>('TEST-01');
  const [copiedLogs, setCopiedLogs] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [autoScrollLogs, setAutoScrollLogs] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Read locked test suite from localStorage
  const lockedSuite = useMemo(() => getOrCreateLockedSuite(), []);

  const logsEndRef = useRef<HTMLDivElement>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const activeRunIdRef = useRef<string | null>(activeRun?.id || null);
  const scanStartTimeRef = useRef<number | null>(null);

  useEffect(() => {
    activeRunIdRef.current = activeRun?.id || null;
  }, [activeRun?.id]);

  const isTesting = activeRun && (
    activeRun.status === 'running' ||
    activeRun.status === 'researching' ||
    activeRun.status === 'discovering' ||
    activeRun.status === 'generating' ||
    activeRun.status === 'analyzing'
  );

  const isCompletedOrStopped = activeRun && (
    activeRun.status === 'completed' ||
    activeRun.status === 'stopped' ||
    activeRun.status === 'failed'
  );

  // Auto-scroll terminal log events
  useEffect(() => {
    if (autoScrollLogs && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeRun?.executionLogs?.length, autoScrollLogs]);

  // 120-second Execution Budget Real Timer with automatic completion watchdog
  useEffect(() => {
    let timerInterval: any = null;
    if (isTesting || isStarting) {
      if (!scanStartTimeRef.current) {
        scanStartTimeRef.current = Date.now();
      }
      timerInterval = setInterval(async () => {
        if (scanStartTimeRef.current) {
          const secs = Math.floor((Date.now() - scanStartTimeRef.current) / 1000);
          setElapsedSeconds(Math.min(secs, 120));

          // Frontend watchdog: If scan exceeds 122 seconds, force-sync or terminate
          if (secs >= 122 && activeRunIdRef.current) {
            try {
              const latest = await api.getTestRun(activeRunIdRef.current);
              setActiveRun(latest);
              if (latest.status === 'running' || latest.status === 'analyzing') {
                const stopped = await api.stopTestRun(activeRunIdRef.current).catch(() => null);
                if (stopped?.run) {
                  setActiveRun(stopped.run);
                }
              }
            } catch (watchdogErr) {
              console.warn('Watchdog check error:', watchdogErr);
            }
            setIsStarting(false);
          }
        }
      }, 500);
    } else {
      if (activeRun?.executionTimeMs) {
        setElapsedSeconds(Math.floor(activeRun.executionTimeMs / 1000));
      }
      scanStartTimeRef.current = null;
    }
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [isTesting, isStarting, activeRun?.executionTimeMs]);

  const formatTime = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Auto-start scan when triggered from Header or Dashboard quick start
  useEffect(() => {
    if (initialUrl && initialUrl !== url) {
      setUrl(initialUrl);
      startNewRun(initialUrl);
    }
  }, [initialUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  const validateUrl = (raw: string): boolean => {
    let testUrl = raw.trim();
    if (!testUrl) {
      setUrlError('Website URL is required');
      return false;
    }
    if (!testUrl.startsWith('http://') && !testUrl.startsWith('https://')) {
      testUrl = 'https://' + testUrl;
    }
    try {
      const parsed = new URL(testUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        setUrlError('Only HTTP and HTTPS protocols are supported');
        return false;
      }
      if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
        setUrlError('Testing localhost is restricted for security');
        return false;
      }
      setUrlError(null);
      return true;
    } catch {
      setUrlError('Invalid website URL format (e.g. https://example.com)');
      return false;
    }
  };

  const startNewRun = async (targetUrl: string) => {
    if (isTesting) return;

    if (!validateUrl(targetUrl)) return;

    let cleanUrl = targetUrl.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    try {
      setIsStarting(true);
      setUrlError(null);

      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }

      const { runId, run } = await api.startTestRun(cleanUrl);
      activeRunIdRef.current = runId;
      setActiveRun(run);
      setExpandedTestId('TEST-01');

      const unsub = api.subscribeToRun(
        runId,
        (updatedRun) => {
          if (updatedRun.id === activeRunIdRef.current) {
            setActiveRun(updatedRun);
            if (updatedRun.status === 'completed' || updatedRun.status === 'failed' || updatedRun.status === 'stopped') {
              setIsStarting(false);
            }
          }
        },
        (err) => {
          console.warn('Live stream disconnected:', err);
          setIsStarting(false);
        }
      );

      unsubscribeRef.current = unsub;
    } catch (err: any) {
      setUrlError(err.message || 'Failed to start testing run');
      setIsStarting(false);
    }
  };

  const handleStartTesting = (e: React.FormEvent) => {
    e.preventDefault();
    startNewRun(url);
  };

  const handleStopTesting = async () => {
    if (!activeRun?.id || !isTesting) return;
    try {
      const res = await api.stopTestRun(activeRun.id);
      if (res.run) {
        setActiveRun(res.run);
      }
    } catch (err) {
      console.error('Stop request failed:', err);
    }
  };

  const handleReRun = () => {
    startNewRun(url);
  };

  const handleCopyLogs = () => {
    if (!activeRun?.executionLogs) return;
    const text = activeRun.executionLogs
      .map(l => `[${l.timestamp}] [${l.status || 'INFO'}] ${l.testId ? `${l.testId}: ` : ''}${l.message}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopiedLogs(true);
    setTimeout(() => setCopiedLogs(false), 2000);
  };

  const handleDownloadJson = () => {
    if (!activeRun) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(activeRun, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `qa-test-run-${activeRun.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCopyJson = () => {
    if (!activeRun) return;
    navigator.clipboard.writeText(JSON.stringify(activeRun, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  // Locked 16 tests mapped from active run or default suite
  const displayTests: TestCase[] = useMemo(() => {
    if (activeRun?.testCases && activeRun.testCases.length === 16) {
      return activeRun.testCases;
    }
    return lockedSuite.tests.map((def, idx) => ({
      id: def.id,
      title: def.name,
      name: def.name,
      category: def.category,
      priority: (idx === 0 || idx === 8 ? 'P0' : idx < 8 ? 'P1' : 'P2'),
      steps: [],
      expected_result: 'Assertion met',
      actual_result: '',
      status: 'PENDING',
      duration_ms: 0,
      url,
      evidence: []
    }));
  }, [activeRun?.testCases, lockedSuite.tests, url]);

  // Section 20 Strict Scoring Logic:
  // Score = 100 - (failedCount * 18) - (warningCount * 5)
  // Minimum score: 0
  const failedCount = activeRun ? activeRun.failedTests : 0;
  const warningCount = activeRun ? activeRun.warningsCount : 0;
  const passedCount = activeRun ? activeRun.passedTests : 0;
  const notApplicableCount = activeRun ? (activeRun.notApplicableCount || 0) : 0;
  const totalTests = 16;
  const completedCount = passedCount + failedCount + warningCount + notApplicableCount;
  const progressPercent = totalTests > 0 ? Math.round((completedCount / totalTests) * 100) : 0;

  const rawScore = Math.max(0, 100 - (failedCount * 18) - (warningCount * 5));
  // If failedCount > 0, NEVER display 100/100
  const score = failedCount > 0 ? Math.min(rawScore, 99) : rawScore;

  // Section 21 Overall Status:
  const overallStatus = activeRun?.overallStatus || (
    failedCount > 0 ? 'FAIL' : (warningCount > 0 ? 'PASS WITH WARNINGS' : 'PASS')
  );

  // Section 22 Diagnostics & Findings count MUST equal failedCount:
  const findingsCount = failedCount;

  // Real deterministic calculation of 4 Health Metrics
  const healthMetrics = useMemo(() => {
    if (!activeRun) {
      return {
        performance: 92,
        seo: 90,
        accessibility: 95,
        bestPractices: 96
      };
    }

    const testMap = new Map((activeRun.testCases || []).map(t => [t.id, t]));

    // PERFORMANCE: TEST-14 (Performance check)
    let perf = 100;
    const test14 = testMap.get('TEST-14');
    if (test14?.status === 'FAIL') perf -= 45;
    else if (test14?.status === 'WARNING') perf -= 20;
    if (testMap.get('TEST-01')?.status === 'FAIL') perf -= 30;

    // SEO: TEST-13 (SEO Basic check)
    let seo = 100;
    const test13 = testMap.get('TEST-13');
    if (test13?.status === 'FAIL') seo -= 45;
    else if (test13?.status === 'WARNING') seo -= 20;

    // ACCESSIBILITY: TEST-12 (Accessibility check)
    let a11y = 100;
    const test12 = testMap.get('TEST-12');
    if (test12?.status === 'FAIL') a11y -= 45;
    else if (test12?.status === 'WARNING') a11y -= 20;

    // BEST PRACTICES: TEST-15 (HTTPS), TEST-02 (Console Errors), TEST-10 (Network Failures), TEST-03 (Broken Images)
    let bp = 100;
    if (testMap.get('TEST-15')?.status === 'FAIL') bp -= 25;
    if (testMap.get('TEST-02')?.status === 'FAIL') bp -= 30;
    else if (testMap.get('TEST-02')?.status === 'WARNING') bp -= 15;
    if (testMap.get('TEST-10')?.status === 'FAIL') bp -= 25;
    if (testMap.get('TEST-03')?.status === 'FAIL') bp -= 20;

    return {
      performance: Math.max(10, Math.min(100, perf)),
      seo: Math.max(10, Math.min(100, seo)),
      accessibility: Math.max(10, Math.min(100, a11y)),
      bestPractices: Math.max(10, Math.min(100, bp))
    };
  }, [activeRun]);

  const scoreColor = score >= 90 ? '#10B981' : score >= 70 ? '#7C3AED' : score >= 40 ? '#F59E0B' : '#EF4444';
  const circumference = 2 * Math.PI * 52;
  const strokeOffset = circumference - ((activeRun ? score : 0) / 100) * circumference;

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 select-text">
      {/* Top Header & BugScout Branding */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E1E26] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#71717A] font-semibold">
              BUGSCOUT • DETERMINISTIC QA RUNNER • 16 FIXED TESTS
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F5F5F5] mt-1">
            Real Playwright Automation & Telemetry
          </h1>
          <p className="text-xs text-[#71717A] font-mono">
            Deterministic execution against target URL with failure screenshots and captured stack traces.
          </p>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          {isTesting && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-[#151515] border border-[#1E1E26] text-[#F5F5F5] text-xs font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] animate-ping" />
              <span>Scanning: {activeRun?.currentTestName || 'Executing Tests...'}</span>
            </div>
          )}
          {activeRun?.status === 'stopped' && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#151515] border border-[#1E1E26] text-[#A1A1AA] text-xs font-mono">
              <Square className="w-3 h-3 fill-zinc-400" />
              <span>SCAN STOPPED BY USER</span>
            </div>
          )}
          {activeRun?.status === 'completed' && (
            <div className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[8px] border text-xs font-mono font-medium ${
              overallStatus === 'FAIL'
                ? 'bg-red-500/10 border-red-500/20 text-red-400'
                : overallStatus === 'PASS WITH WARNINGS'
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            }`}>
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>STATUS: {overallStatus} ({activeRun.executionTimeMs ? `${(activeRun.executionTimeMs / 1000).toFixed(1)}s` : 'Done'})</span>
            </div>
          )}
        </div>
      </div>

      {/* Target Website Input Form & Action Buttons */}
      <div className="rounded-[12px] border border-[#1E1E26] bg-[#0F0F10] p-4 sm:p-5 shadow-sm">
        <form onSubmit={handleStartTesting} className="space-y-4">
          <div>
            <label htmlFor="target-url-input" className="block text-[11px] font-mono uppercase tracking-wider text-[#71717A] mb-1.5 font-semibold">
              Target Website URL
            </label>
            <div className="relative">
              <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717A] pointer-events-none" />
              <input
                id="target-url-input"
                type="text"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (urlError) setUrlError(null);
                }}
                disabled={!!isTesting}
                placeholder="https://example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-[8px] bg-[#0A0A0A] border border-[#1E1E26] text-[#F5F5F5] font-mono text-sm placeholder-[#71717A] focus:outline-none focus:border-[#7C3AED] transition-colors disabled:opacity-60"
              />
            </div>
            {urlError && (
              <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1 font-mono">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{urlError}</span>
              </p>
            )}
          </div>

          {/* Action Button Bar */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={!!isTesting || isStarting}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-[8px] font-semibold text-xs tracking-wide uppercase font-mono transition-all duration-150 cursor-pointer ${
                isTesting || isStarting
                  ? 'bg-[#151515] text-[#71717A] cursor-not-allowed border border-[#1E1E26]'
                  : 'bg-[#7C3AED] hover:bg-[#8B5CF6] text-white shadow-sm hover:-translate-y-0.5 active:scale-95'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isStarting ? 'Initiating...' : isTesting ? 'Scanning...' : 'RUN SCAN'}</span>
            </button>

            {isTesting && (
              <button
                type="button"
                onClick={handleStopTesting}
                className="flex items-center gap-2 px-4 py-2 rounded-[8px] bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-semibold text-xs tracking-wide uppercase font-mono transition-all cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Cancel</span>
              </button>
            )}

            {isCompletedOrStopped && (
              <button
                type="button"
                onClick={handleReRun}
                className="flex items-center gap-2 px-4 py-2 rounded-[8px] bg-[#121212] hover:bg-[#151515] text-[#F5F5F5] border border-[#1E1E26] font-semibold text-xs tracking-wide uppercase font-mono transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Re-run Suite</span>
              </button>
            )}

            <div className="text-xs text-[#71717A] ml-auto hidden sm:flex items-center gap-2 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />
              <span>Budget: 120s • 16 Fixed Tests</span>
            </div>
          </div>
        </form>
      </div>

      {/* 2-MINUTE SCANNER STATUS BAR */}
      <div className="rounded-[12px] border border-[#1E1E26] bg-[#0F0F10] p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-xs">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-[#7C3AED]" />
            <span className="text-[#71717A] uppercase tracking-wider font-semibold">SCAN TIME</span>
            <span className="text-[#F5F5F5] font-bold bg-[#121212] px-2.5 py-1 rounded-[6px] border border-[#1E1E26]">
              {formatTime(elapsedSeconds)} / 02:00
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-[#71717A]">
              {isCompletedOrStopped ? 'Scan Completed' : isTesting ? `Executing: ${activeRun?.currentTestName || 'Suite'}` : 'Idle — ready to scan'}
            </span>
            <span className="text-[#F5F5F5] font-bold">
              {completedCount} / {totalTests} Tests ({isCompletedOrStopped ? 100 : progressPercent}%)
            </span>
          </div>
        </div>

        {/* Progress Bar (Indeterminate if starting, otherwise real percentage) */}
        <div className="w-full bg-[#121212] h-1.5 rounded-full overflow-hidden border border-[#1E1E26] relative">
          {isTesting && completedCount === 0 ? (
            <div className="h-full bg-[#7C3AED] animate-pulse w-full" />
          ) : (
            <div
              className="h-full bg-[#7C3AED] transition-all duration-300"
              style={{ width: `${isCompletedOrStopped ? 100 : progressPercent}%` }}
            />
          )}
        </div>
      </div>

      {/* PART 3 & PART 4: AUDIT HERO & HEALTH METRICS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Main Score Hero Card (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-[#1F1F28] bg-[#0F0F14] p-6 shadow-2xl flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#8B5CF6]/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#06B6D4]/5 rounded-full blur-3xl pointer-events-none" />

          <span className="text-[11px] font-mono uppercase tracking-widest text-[#A1A1AA] font-semibold mb-4">
            WEBSITE HEALTH
          </span>

          {/* Large Circular Score Ring */}
          <div className="relative w-36 h-36 flex items-center justify-center my-1">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              {/* Background Track */}
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="#12121A"
                strokeWidth="8"
              />
              {/* Animated Progress Ring */}
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke={scoreColor}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
                style={{
                  filter: `drop-shadow(0 0 8px ${scoreColor}80)`
                }}
              />
            </svg>

            {/* Score in Center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
              <span className="text-4xl font-extrabold font-mono text-white tracking-tight leading-none">
                {activeRun ? score : '--'}
              </span>
              <span className="text-xs font-mono text-[#A1A1AA] mt-1">/100</span>
            </div>
          </div>

          <div className="mt-3">
            <div className="text-sm font-semibold text-white">Website Health</div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#12121A] border border-[#1F1F28] mt-2 font-mono text-xs text-[#A1A1AA] max-w-xs truncate">
              <Globe className="w-3 h-3 text-[#06B6D4] flex-shrink-0" />
              <span className="truncate">{activeRun ? activeRun.url : url}</span>
            </div>
          </div>
        </div>

        {/* 4 Health Metric Cards (7 cols) */}
        <div className="lg:col-span-7 grid grid-cols-2 gap-4">
          {/* PERFORMANCE */}
          <div className="rounded-2xl border border-[#1F1F28] bg-[#0F0F14] p-5 shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-[#A1A1AA] font-semibold">
                PERFORMANCE
              </span>
              <span className="text-xs font-mono text-[#06B6D4] font-medium">Core Web</span>
            </div>
            <div className="my-3">
              <div className="text-3xl font-extrabold font-mono text-white">
                {activeRun ? healthMetrics.performance : '--'}
              </div>
            </div>
            <div>
              <div className="w-full bg-[#12121A] h-1.5 rounded-full overflow-hidden border border-[#1F1F28]">
                <div
                  className="h-full bg-gradient-to-r from-[#06B6D4] to-[#22C55E] transition-all duration-500"
                  style={{ width: `${activeRun ? healthMetrics.performance : 0}%` }}
                />
              </div>
              <span className="text-[10px] text-[#A1A1AA] font-mono mt-1.5 block">
                Load latency & runtime responsiveness
              </span>
            </div>
          </div>

          {/* SEO */}
          <div className="rounded-2xl border border-[#1F1F28] bg-[#0F0F14] p-5 shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-[#A1A1AA] font-semibold">
                SEO
              </span>
              <span className="text-xs font-mono text-[#8B5CF6] font-medium">Metadata</span>
            </div>
            <div className="my-3">
              <div className="text-3xl font-extrabold font-mono text-white">
                {activeRun ? healthMetrics.seo : '--'}
              </div>
            </div>
            <div>
              <div className="w-full bg-[#12121A] h-1.5 rounded-full overflow-hidden border border-[#1F1F28]">
                <div
                  className="h-full bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] transition-all duration-500"
                  style={{ width: `${activeRun ? healthMetrics.seo : 0}%` }}
                />
              </div>
              <span className="text-[10px] text-[#A1A1AA] font-mono mt-1.5 block">
                Tags, titles & viewport structure
              </span>
            </div>
          </div>

          {/* ACCESSIBILITY */}
          <div className="rounded-2xl border border-[#1F1F28] bg-[#0F0F14] p-5 shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-[#A1A1AA] font-semibold">
                ACCESSIBILITY
              </span>
              <span className="text-xs font-mono text-[#22C55E] font-medium">A11y</span>
            </div>
            <div className="my-3">
              <div className="text-3xl font-extrabold font-mono text-white">
                {activeRun ? healthMetrics.accessibility : '--'}
              </div>
            </div>
            <div>
              <div className="w-full bg-[#12121A] h-1.5 rounded-full overflow-hidden border border-[#1F1F28]">
                <div
                  className="h-full bg-[#22C55E] transition-all duration-500"
                  style={{ width: `${activeRun ? healthMetrics.accessibility : 0}%` }}
                />
              </div>
              <span className="text-[10px] text-[#A1A1AA] font-mono mt-1.5 block">
                Image alt tags, forms & aria checks
              </span>
            </div>
          </div>

          {/* BEST PRACTICES */}
          <div className="rounded-2xl border border-[#1F1F28] bg-[#0F0F14] p-5 shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-[#A1A1AA] font-semibold">
                BEST PRACTICES
              </span>
              <span className="text-xs font-mono text-[#F59E0B] font-medium">Security</span>
            </div>
            <div className="my-3">
              <div className="text-3xl font-extrabold font-mono text-white">
                {activeRun ? healthMetrics.bestPractices : '--'}
              </div>
            </div>
            <div>
              <div className="w-full bg-[#12121A] h-1.5 rounded-full overflow-hidden border border-[#1F1F28]">
                <div
                  className="h-full bg-gradient-to-r from-[#F59E0B] to-[#22C55E] transition-all duration-500"
                  style={{ width: `${activeRun ? healthMetrics.bestPractices : 0}%` }}
                />
              </div>
              <span className="text-[10px] text-[#A1A1AA] font-mono mt-1.5 block">
                HTTPS, clean console & zero broken assets
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* TOTAL TESTS */}
        <div className="rounded-xl border border-[#1F1F28] bg-[#0F0F14] p-3 flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#A1A1AA] font-medium">
            Total Tests
          </span>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {totalTests}
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">Fixed suite</span>
        </div>

        {/* PASSED */}
        <div className="rounded-xl border border-[#1F1F28] bg-[#0F0F14] p-3 flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#22C55E] font-medium flex items-center justify-between">
            <span>Passed</span>
            <CheckCircle2 className="w-3 h-3 text-[#22C55E]" />
          </span>
          <div className="text-2xl font-bold font-mono text-[#22C55E] mt-1">
            {passedCount}
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">Verified OK</span>
        </div>

        {/* FAILED */}
        <div className="rounded-xl border border-[#1F1F28] bg-[#0F0F14] p-3 flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#EF4444] font-medium flex items-center justify-between">
            <span>Failed</span>
            <XCircle className="w-3 h-3 text-[#EF4444]" />
          </span>
          <div className="text-2xl font-bold font-mono text-[#EF4444] mt-1">
            {failedCount}
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">{findingsCount} findings</span>
        </div>

        {/* WARNINGS */}
        <div className="rounded-xl border border-[#1F1F28] bg-[#0F0F14] p-3 flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#F59E0B] font-medium flex items-center justify-between">
            <span>Warnings</span>
            <AlertTriangle className="w-3 h-3 text-[#F59E0B]" />
          </span>
          <div className="text-2xl font-bold font-mono text-[#F59E0B] mt-1">
            {warningCount}
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">-5 pts each</span>
        </div>

        {/* NOT APPLICABLE */}
        <div className="rounded-xl border border-[#1F1F28] bg-[#0F0F14] p-3 flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#A1A1AA] font-medium flex items-center justify-between">
            <span>N/A</span>
            <MinusCircle className="w-3 h-3 text-zinc-500" />
          </span>
          <div className="text-2xl font-bold font-mono text-zinc-300 mt-1">
            {notApplicableCount}
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">Not on page</span>
        </div>

        {/* SCORE */}
        <div className="rounded-xl border border-[#1F1F28] bg-[#0F0F14] p-3 flex flex-col justify-between relative overflow-hidden">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#A1A1AA] font-medium">
            Score
          </span>
          <div className="py-1 flex items-baseline gap-1">
            <span className={`text-2xl font-extrabold font-mono ${
              score >= 80 ? 'text-[#22C55E]' : score >= 50 ? 'text-[#F59E0B]' : score > 0 ? 'text-[#EF4444]' : 'text-zinc-500'
            }`}>
              {activeRun ? score : '--'}
            </span>
            <span className="text-[10px] font-mono text-zinc-500">/ 100</span>
          </div>
          <div className="w-full bg-[#12121A] h-1 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                score >= 80 ? 'bg-[#22C55E]' : score >= 50 ? 'bg-[#F59E0B]' : 'bg-[#EF4444]'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
            />
          </div>
        </div>

        {/* OVERALL STATUS */}
        <div className="rounded-xl border border-[#1F1F28] bg-[#0F0F14] p-3 flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#A1A1AA] font-medium">
            Overall Status
          </span>
          <div className={`text-xs font-bold font-mono mt-1 ${
            overallStatus === 'FAIL' ? 'text-[#EF4444]' : overallStatus === 'PASS WITH WARNINGS' ? 'text-[#F59E0B]' : 'text-[#22C55E]'
          }`}>
            {activeRun ? overallStatus : 'IDLE'}
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">Real evidence</span>
        </div>

        {/* TEST EXECUTION TIME */}
        <div className="rounded-xl border border-[#1F1F28] bg-[#0F0F14] p-3 flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#A1A1AA] font-medium flex items-center justify-between">
            <span>Execution</span>
            <Clock className="w-3 h-3 text-zinc-500" />
          </span>
          <div className="text-xl font-bold font-mono text-white mt-1">
            {activeRun?.executionTimeMs ? `${(activeRun.executionTimeMs / 1000).toFixed(1)}s` : '--'}
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">Wall clock</span>
        </div>
      </div>


      {/* Main 2-Column Split: Test Results (Left) + Live Execution Terminal (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Fixed Test Suite (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-mono uppercase tracking-wider text-zinc-300 font-bold">
              Test Results ({displayTests.length} Tests)
            </h2>
            <span className="text-xs text-zinc-500 font-mono">Sequential Execution</span>
          </div>

          <div className="space-y-2">
            {displayTests.map((tc) => {
              const result = activeRun?.results?.find(r => r.testId === tc.id);
              const status = result?.status || tc.status || 'PENDING';
              const duration = result?.durationMs || tc.duration_ms;
              const isExpanded = expandedTestId === tc.id;

              return (
                <div
                  key={tc.id}
                  className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                    status === 'RUNNING'
                      ? 'border-[#8B5CF6]/60 bg-[#8B5CF6]/10 shadow-[0_0_15px_rgba(139,92,246,0.15)]'
                      : status === 'PASS'
                      ? 'border-white/[0.06] bg-[#0F0F14] hover:border-white/20'
                      : status === 'FAIL'
                      ? 'border-[#EF4444]/40 bg-[#EF4444]/10 hover:border-[#EF4444]/60 shadow-[0_0_15px_rgba(239,68,68,0.15)]'
                      : status === 'WARNING'
                      ? 'border-[#F59E0B]/30 bg-[#F59E0B]/10 hover:border-[#F59E0B]/50'
                      : status === 'NOT_APPLICABLE'
                      ? 'border-white/[0.04] bg-[#0A0A0E] opacity-60'
                      : 'border-white/[0.06] bg-[#0A0A0E] opacity-80'
                  }`}
                >
                  {/* Card Header Row */}
                  <div
                    onClick={() => setExpandedTestId(isExpanded ? null : tc.id)}
                    className="p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Status Icon */}
                      <div>
                        {status === 'PASS' && <CheckCircle2 className="w-4 h-4 text-[#22C55E] flex-shrink-0" />}
                        {status === 'FAIL' && <XCircle className="w-4 h-4 text-[#EF4444] flex-shrink-0" />}
                        {status === 'WARNING' && <AlertTriangle className="w-4 h-4 text-[#F59E0B] flex-shrink-0" />}
                        {status === 'NOT_APPLICABLE' && <MinusCircle className="w-4 h-4 text-[#A1A1AA] flex-shrink-0" />}
                        {status === 'RUNNING' && <span className="w-4 h-4 rounded-full border-2 border-[#8B5CF6] border-t-transparent animate-spin inline-block" />}
                        {status === 'STOPPED' && <Square className="w-4 h-4 fill-zinc-400 text-zinc-400 flex-shrink-0" />}
                        {status === 'PENDING' && <span className="w-3.5 h-3.5 rounded-full border border-zinc-600 inline-block" />}
                      </div>

                      {/* Test Title & ID */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-[#A1A1AA] font-semibold">{tc.id}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#12121A] border border-white/[0.06] text-[#A1A1AA] font-mono">
                            {tc.category}
                          </span>
                        </div>
                        <p className={`text-xs sm:text-sm font-medium truncate mt-0.5 ${
                          status === 'FAIL' ? 'text-red-200 font-semibold' : 'text-white'
                        }`}>
                          {tc.name || tc.title}
                        </p>
                      </div>
                    </div>

                    {/* Right side: Status badge & Duration */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {duration ? (
                        <span className="font-mono text-xs text-[#A1A1AA] hidden sm:inline">
                          {duration}ms
                        </span>
                      ) : null}

                      <span
                        className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded border ${
                          status === 'PASS'
                            ? 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30'
                            : status === 'FAIL'
                            ? 'bg-[#EF4444]/20 text-rose-300 border-[#EF4444]/40'
                            : status === 'WARNING'
                            ? 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30'
                            : status === 'NOT_APPLICABLE'
                            ? 'bg-[#12121A] text-[#A1A1AA] border-white/[0.06]'
                            : status === 'RUNNING'
                            ? 'bg-[#8B5CF6]/15 text-[#8B5CF6] border-[#8B5CF6]/30'
                            : 'bg-[#12121A] text-zinc-500 border-white/[0.06]'
                        }`}
                      >
                        {status}
                      </span>

                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-zinc-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-zinc-500" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Card Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-white/[0.06] bg-black/30 space-y-3 text-xs font-mono">
                      {tc.description && (
                        <div>
                          <span className="text-[#A1A1AA] uppercase tracking-wider text-[10px] block">Description</span>
                          <span className="text-zinc-300 font-sans">{tc.description}</span>
                        </div>
                      )}

                      <div>
                        <span className="text-[#A1A1AA] uppercase tracking-wider text-[10px] block">Expected Result</span>
                        <span className="text-zinc-300 font-sans">{tc.expected_result}</span>
                      </div>

                      {result?.actualResult && (
                        <div>
                          <span className="text-[#A1A1AA] uppercase tracking-wider text-[10px] block">Actual Result</span>
                          <span className={`font-sans ${
                            status === 'FAIL' ? 'text-red-300 font-semibold' : status === 'WARNING' ? 'text-amber-300' : 'text-emerald-300'
                          }`}>
                            {result.actualResult}
                          </span>
                        </div>
                      )}

                      {result?.problem && (
                        <div className="p-2.5 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30">
                          <span className="text-[#EF4444] uppercase tracking-wider text-[10px] block font-bold font-mono">Failure Reason</span>
                          <span className="text-rose-200 font-sans">{result.problem}</span>
                        </div>
                      )}

                      {result?.suggestedFix && (
                        <div className="p-2.5 rounded-lg bg-[#8B5CF6]/10 border border-[#8B5CF6]/30">
                          <span className="text-[#8B5CF6] uppercase tracking-wider text-[10px] block font-bold font-mono">Suggested Fix</span>
                          <span className="text-purple-200 font-sans">{result.suggestedFix}</span>
                        </div>
                      )}

                      {result?.evidence && result.evidence.length > 0 && (
                        <div>
                          <span className="text-[#A1A1AA] uppercase tracking-wider text-[10px] block">Evidence Logs</span>
                          <div className="space-y-1 mt-1 max-h-36 overflow-y-auto">
                            {result.evidence.map((ev, i) => (
                              <div key={i} className="text-[#A1A1AA] bg-[#0A0A0E] p-1.5 rounded border border-white/[0.06] truncate">
                                {ev}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Live Execution Terminal Stream (5 cols) */}
        <div className="lg:col-span-5 flex flex-col rounded-xl border border-white/[0.06] bg-[#0A0A0E] shadow-2xl overflow-hidden min-h-[500px] max-h-[820px]">
          {/* Terminal Header */}
          <div className="p-3 bg-[#0F0F14] border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#8B5CF6]" />
              <span className="text-xs font-mono font-semibold text-zinc-300">Live Execution Log Stream</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyLogs}
                disabled={!activeRun?.executionLogs?.length}
                className="flex items-center gap-1 px-2 py-1 rounded bg-[#12121A] hover:bg-zinc-800 text-zinc-300 text-[10px] font-mono border border-white/[0.06] transition-colors disabled:opacity-40 cursor-pointer"
              >
                {copiedLogs ? <Check className="w-3 h-3 text-[#22C55E]" /> : <Copy className="w-3 h-3" />}
                <span>{copiedLogs ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Terminal Log Output Stream */}
          <div
            className="flex-1 p-3.5 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-1.5 scrollbar-thin select-text"
            role="log"
            aria-live="polite"
          >
            {(!activeRun?.executionLogs || activeRun.executionLogs.length === 0) ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-2">
                <Terminal className="w-6 h-6 opacity-30 text-[#8B5CF6]" />
                <p className="text-xs">Awaiting audit initiation...</p>
                <p className="text-[10px] text-zinc-600">Click &ldquo;Start Audit&rdquo; to execute 16 strict tests</p>
              </div>
            ) : (
              activeRun.executionLogs.map((log: ExecutionLogEvent, idx: number) => {
                const isPass = log.status === 'PASS';
                const isFail = log.status === 'FAIL';
                const isWarn = log.status === 'WARNING';
                const isNotApp = log.status === 'NOT_APPLICABLE';
                const isRunning = log.status === 'RUNNING';
                const isStopped = log.status === 'STOPPED';

                return (
                  <div key={idx} className="flex items-start gap-2 hover:bg-white/[0.02] py-0.5 px-1 rounded">
                    <span className="text-[#A1A1AA] flex-shrink-0 select-none text-[10px]">[{log.timestamp}]</span>
                    <span className="flex-shrink-0">
                      {isPass && <span className="text-[#22C55E] font-bold">✓</span>}
                      {isFail && <span className="text-[#EF4444] font-bold">✕</span>}
                      {isWarn && <span className="text-[#F59E0B] font-bold">⚠</span>}
                      {isNotApp && <span className="text-[#A1A1AA] font-bold">–</span>}
                      {isRunning && <span className="text-[#8B5CF6] font-bold">→</span>}
                      {isStopped && <span className="text-zinc-400 font-bold">■</span>}
                      {!isPass && !isFail && !isWarn && !isNotApp && !isRunning && !isStopped && (
                        <span className="text-zinc-500 font-bold">•</span>
                      )}
                    </span>
                    <span className={`break-words ${
                      isPass ? 'text-zinc-200' : isFail ? 'text-red-300 font-medium' : isWarn ? 'text-amber-300' : isRunning ? 'text-purple-300' : isStopped ? 'text-zinc-400' : 'text-[#A1A1AA]'
                    }`}>
                      {log.message}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={logsEndRef} />
          </div>

          {/* Terminal Footer Info */}
          <div className="px-3.5 py-2 bg-[#0F0F14] border-t border-white/[0.06] flex items-center justify-between text-[10px] text-[#A1A1AA] font-mono">
            <span>{activeRun?.executionLogs?.length || 0} events logged</span>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={autoScrollLogs}
                onChange={(e) => setAutoScrollLogs(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-900 text-[#8B5CF6] text-xs focus:ring-0"
              />
              <span>Auto-scroll</span>
            </label>
          </div>
        </div>
      </div>

      {/* Section 22 & 23: DIAGNOSTICS & FINDINGS (Count MUST equal failedCount) */}
      <div className="space-y-4 pt-4 border-t border-white/[0.06]">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-mono uppercase tracking-wider text-zinc-300 font-bold flex items-center gap-2">
            <Bug className="w-4 h-4 text-[#EF4444]" />
            <span>Diagnostics & Findings</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold font-mono ${
              findingsCount > 0 ? 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30' : 'bg-[#12121A] text-[#A1A1AA]'
            }`}>
              {findingsCount}
            </span>
          </h2>
          {activeRun && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyJson}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#12121A] hover:bg-zinc-800 text-zinc-300 text-xs font-mono border border-white/[0.06] transition-colors cursor-pointer"
              >
                {copiedJson ? <Check className="w-3.5 h-3.5 text-[#22C55E]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Export JSON</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadJson}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#12121A] hover:bg-zinc-800 text-zinc-300 text-xs font-mono border border-white/[0.06] transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Report</span>
              </button>
            </div>
          )}
        </div>

        {findingsCount === 0 ? (
          <div className="rounded-xl border border-white/[0.06] bg-[#0F0F14] p-6 text-center text-[#A1A1AA]">
            <CheckCircle2 className="w-8 h-8 text-[#22C55E] mx-auto mb-2" />
            <h3 className="text-sm font-bold text-white font-mono">Zero Critical Failure Findings</h3>
            <p className="text-xs text-[#A1A1AA] mt-1 font-mono">
              All applicable executed tests passed successfully without critical failures.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Exactly one BUG card for each failed test */}
            {activeRun?.bugs?.map((bug: BugReport) => (
              <div
                key={bug.id}
                className="rounded-xl border border-[#EF4444]/30 bg-[#12121A] p-4 space-y-3 shadow-xl"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#EF4444]">{bug.id}</span>
                      <span className="font-mono text-xs text-[#A1A1AA] font-bold">[{bug.testId}]</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold ${
                        bug.severity === 'Critical'
                          ? 'bg-[#EF4444] text-white shadow-[0_0_8px_rgba(239,68,68,0.3)]'
                          : 'bg-[#EF4444]/20 text-rose-300 border border-[#EF4444]/30'
                      }`}>
                        {bug.severity}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-white mt-1">
                      {bug.title}
                    </h3>
                  </div>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div>
                    <span className="text-[#A1A1AA] uppercase tracking-wider text-[10px] block">URL</span>
                    <span className="text-zinc-300 break-all">{bug.affected_url || bug.websiteUrl}</span>
                  </div>

                  <div>
                    <span className="text-[#A1A1AA] uppercase tracking-wider text-[10px] block">Problem Description</span>
                    <p className="text-rose-200 font-sans leading-relaxed">{bug.problemDescription || bug.problem || bug.actual_result}</p>
                  </div>

                  <div>
                    <span className="text-[#A1A1AA] uppercase tracking-wider text-[10px] block">Expected Result</span>
                    <p className="text-zinc-300 font-sans">{bug.expected_result}</p>
                  </div>

                  <div>
                    <span className="text-[#A1A1AA] uppercase tracking-wider text-[10px] block">Actual Result</span>
                    <p className="text-rose-300 font-sans font-semibold">{bug.actual_result}</p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-black/50 border border-[#8B5CF6]/30">
                    <span className="text-[#8B5CF6] uppercase tracking-wider text-[10px] block font-bold font-mono">Suggested Fix</span>
                    <p className="text-purple-200 font-sans mt-0.5">{bug.suggestedFix || bug.fix_suggestion}</p>
                  </div>

                  {bug.evidence && bug.evidence.length > 0 && (
                    <div>
                      <span className="text-[#A1A1AA] uppercase tracking-wider text-[10px] block">Evidence</span>
                      <div className="mt-1 space-y-1 max-h-28 overflow-y-auto">
                        {bug.evidence.map((ev, i) => (
                          <div key={i} className="text-[#A1A1AA] bg-black/60 p-1.5 rounded border border-white/[0.06] truncate text-[11px]">
                            {ev}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {bug.screenshotUrl && (
                    <button
                      type="button"
                      onClick={() => onViewScreenshot(bug.screenshotUrl!, bug.testId || 'FAIL', bug.title)}
                      className="inline-flex items-center gap-1.5 text-xs text-[#8B5CF6] hover:text-[#a78bfa] underline font-mono cursor-pointer pt-1"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>View failure screenshot</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
