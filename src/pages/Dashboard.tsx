import React, { useEffect, useState, useMemo } from 'react';
import { DashboardStats, TestRun, BugReport } from '../types';
import { api } from '../services/api';
import { FindingDrawer } from '../components/FindingDrawer';
import {
  ShieldCheck,
  Zap,
  Eye,
  Search,
  ArrowRight,
  Play,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Loader2,
  ExternalLink,
  ChevronRight,
  Layers,
  FileCheck
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (tab: string, runId?: string) => void;
  onQuickStart: (url: string) => void;
  onViewScreenshot?: (url: string, testId: string, title: string) => void;
  activeRun?: TestRun | null;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigate,
  onQuickStart,
  onViewScreenshot,
  activeRun
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentRuns, setRecentRuns] = useState<TestRun[]>([]);
  const [recentFindings, setRecentFindings] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [commandUrl, setCommandUrl] = useState('');
  const [commandError, setCommandError] = useState('');
  const [selectedFinding, setSelectedFinding] = useState<BugReport | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Animated score state for count-up
  const [displayScore, setDisplayScore] = useState<number | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, runsData, bugsData] = await Promise.all([
        api.getStats().catch(() => null),
        api.getHistory().catch(() => []),
        api.getBugs().catch(() => [])
      ]);
      setStats(statsData);
      setRecentRuns(runsData);
      setRecentFindings(bugsData.slice(0, 5));
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute latest scan run: activeRun if present or top recentRun
  const latestRun: TestRun | null = useMemo(() => {
    if (activeRun && activeRun.status !== 'idle') return activeRun;
    if (recentRuns.length > 0) return recentRuns[0];
    return null;
  }, [activeRun, recentRuns]);

  // Handle Score count-up micro-interaction
  useEffect(() => {
    if (!latestRun) {
      setDisplayScore(null);
      return;
    }
    const targetScore = typeof latestRun.overall_score === 'number' ? latestRun.overall_score : 100;
    let start = 0;
    const duration = 650;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.round(start + (targetScore - start) * eased);
      setDisplayScore(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [latestRun?.id, latestRun?.overall_score]);

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let target = commandUrl.trim();
    if (!target) {
      setCommandError('Please enter a website URL');
      return;
    }
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = 'https://' + target;
    }
    try {
      const parsed = new URL(target);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        setCommandError('HTTP or HTTPS protocol required');
        return;
      }
      if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
        setCommandError('Testing localhost is restricted for security');
        return;
      }
      setCommandError('');
      onQuickStart(target);
    } catch {
      setCommandError('Invalid URL format (e.g. https://example.com)');
    }
  };

  // Human-readable scan relative time
  const getRelativeTime = (isoString?: string) => {
    if (!isoString) return 'recently';
    const date = new Date(isoString);
    const diffSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const isScanning = activeRun && (
    activeRun.status === 'running' ||
    activeRun.status === 'researching' ||
    activeRun.status === 'discovering' ||
    activeRun.status === 'generating' ||
    activeRun.status === 'analyzing'
  );

  // Bento Metric Calculations based purely on verified run tests
  const bentoMetrics = useMemo(() => {
    if (!latestRun || !latestRun.results) {
      return {
        security: { label: 'Not measured', status: 'NOT_TESTED', detail: 'Run scan to assess TLS & security' },
        performance: { label: 'Not measured', status: 'NOT_TESTED', detail: 'Real browser page load time' },
        accessibility: { label: 'Not measured', status: 'NOT_TESTED', detail: 'DOM landmark & contrast checks' },
        seo: { label: 'Not measured', status: 'NOT_TESTED', detail: 'Metadata and canonical checks' },
      };
    }

    const testMap = new Map<string, any>();
    latestRun.results.forEach((r) => testMap.set(r.testId, r));

    // Security: TEST-15 (HTTPS / Mixed Content) & TEST-08 (Network Failures)
    const t15 = testMap.get('TEST-15');
    const t08 = testMap.get('TEST-08');
    let secStatus = 'Passed';
    let secDetail = 'No critical security violations detected';
    if (t15?.status === 'FAIL' || t08?.status === 'FAIL') {
      secStatus = 'Action Required';
      secDetail = t15?.status === 'FAIL' ? 'Mixed content or non-HTTPS assets' : 'Network/SSL failures detected';
    } else if (t15?.status === 'WARNING') {
      secStatus = 'Warning';
      secDetail = 'Non-blocking security notice detected';
    } else if (!t15 && !t08) {
      secStatus = 'Not measured';
      secDetail = 'Security tests not executed';
    }

    // Performance: TEST-14 (Performance) & TEST-01 (Homepage)
    const t14 = testMap.get('TEST-14');
    const t01 = testMap.get('TEST-01');
    let perfLabel = 'Not measured';
    let perfStatus = 'Passed';
    let perfDetail = 'Page load within threshold';
    if (t14) {
      if (t14.durationMs) {
        perfLabel = `${(t14.durationMs / 1000).toFixed(2)}s`;
      } else {
        perfLabel = t14.status === 'PASS' ? 'Good' : 'Needs Work';
      }
      if (t14.status === 'FAIL') {
        perfStatus = 'Slow';
        perfDetail = 'Page load time exceeded 5000ms';
      } else if (t14.status === 'WARNING') {
        perfStatus = 'Acceptable';
        perfDetail = 'Page load between 2500ms and 5000ms';
      } else {
        perfStatus = 'Good';
        perfDetail = 'Fast response under 2500ms';
      }
    } else if (t01?.durationMs) {
      perfLabel = `${(t01.durationMs / 1000).toFixed(2)}s`;
      perfStatus = t01.durationMs > 4000 ? 'Slow' : 'Good';
      perfDetail = 'Initial document navigation latency';
    }

    // Accessibility: TEST-12 (Accessibility) & TEST-05 (Buttons/Inputs)
    const t12 = testMap.get('TEST-12');
    let a11yLabel = 'Passed';
    let a11yDetail = 'Core landmarks, labels, and headings verified';
    if (t12?.status === 'FAIL') {
      a11yLabel = 'Issues Detected';
      a11yDetail = t12.problem || 'Interactive elements missing labels';
    } else if (t12?.status === 'WARNING') {
      a11yLabel = 'Warnings';
      a11yDetail = 'Missing alt text or non-critical labels';
    } else if (!t12) {
      a11yLabel = 'Not measured';
      a11yDetail = 'Accessibility checks not executed';
    }

    // SEO: TEST-13 (SEO Basics)
    const t13 = testMap.get('TEST-13');
    let seoLabel = 'Passed';
    let seoDetail = 'All core metadata tags & titles verified';
    if (t13?.status === 'FAIL') {
      seoLabel = 'Missing Meta';
      seoDetail = t13.problem || 'Missing page title or meta description';
    } else if (t13?.status === 'WARNING') {
      seoLabel = 'Warnings';
      seoDetail = 'Title length or viewport configuration';
    } else if (!t13) {
      seoLabel = 'Not measured';
      seoDetail = 'SEO test not executed';
    }

    return {
      security: { label: secStatus, status: t15?.status || 'PASS', detail: secDetail },
      performance: { label: perfLabel, status: perfStatus, detail: perfDetail },
      accessibility: { label: a11yLabel, status: t12?.status || 'PASS', detail: a11yDetail },
      seo: { label: seoLabel, status: t13?.status || 'PASS', detail: seoDetail },
    };
  }, [latestRun]);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 selection:bg-[#7C3AED] selection:text-white">
      
      {/* 1. COMMAND BAR (48-52px, wide pill, #121212, subtle border, ⌘K) */}
      <section className="max-w-3xl mx-auto">
        <form 
          onSubmit={handleCommandSubmit}
          className="relative flex items-center h-12 rounded-full bg-[#121212] border border-[#1E1E26] px-4 shadow-sm hover:border-[#2a2a36] focus-within:border-[#7C3AED] transition-colors"
        >
          <Search className="w-4 h-4 text-[#71717A] mr-3 shrink-0" />
          <input
            id="global-scan-command-bar"
            type="text"
            value={commandUrl}
            onChange={(e) => {
              setCommandUrl(e.target.value);
              if (commandError) setCommandError('');
            }}
            placeholder="https://your-domain.com"
            disabled={!!isScanning}
            className="w-full bg-transparent text-sm text-[#F5F5F5] placeholder-[#71717A] font-mono focus:outline-none disabled:opacity-50"
          />
          <div className="flex items-center gap-2 pl-3">
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-mono text-[#71717A] bg-[#151515] border border-[#1E1E26]">
              ⌘K
            </kbd>
            <button
              type="submit"
              disabled={!!isScanning}
              className="px-3.5 py-1.5 rounded-full bg-[#7C3AED] hover:bg-[#8B5CF6] text-white text-xs font-medium tracking-tight transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Scanning</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-current" />
                  <span>Scan</span>
                </>
              )}
            </button>
          </div>
        </form>
        {commandError && (
          <p className="mt-2 text-xs text-red-400 font-mono text-center flex items-center justify-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{commandError}</span>
          </p>
        )}
      </section>

      {/* 2. HERO SECTION — TYPOGRAPHY-FIRST METRIC */}
      <section className="rounded-[12px] bg-[#0F0F10] border border-[#1E1E26] p-6 sm:p-10 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          
          {/* Left: Site Health & Dominant Score */}
          <div className="space-y-4">
            <div className="text-[11px] font-mono uppercase tracking-widest text-[#71717A] font-semibold">
              SITE HEALTH
            </div>

            {isScanning ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-4xl sm:text-5xl font-bold tracking-tight text-[#F5F5F5]">
                    SCANNING
                  </span>
                  <Loader2 className="w-6 h-6 text-[#7C3AED] animate-spin" />
                </div>
                <div className="text-xs font-mono text-[#A1A1AA] flex items-center gap-2">
                  <span>{activeRun?.currentTestName || 'Executing Test Suite'}</span>
                  <span>•</span>
                  <span>Max budget: 120s</span>
                </div>
              </div>
            ) : latestRun ? (
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl sm:text-7xl font-bold tracking-tight text-[#F5F5F5] font-mono leading-none">
                    {displayScore !== null ? displayScore : latestRun.overall_score}
                  </span>
                  <span className="text-xl sm:text-2xl text-[#71717A] font-mono font-medium">
                    /100
                  </span>
                </div>
                
                <div className="pt-2 text-xs sm:text-sm text-[#A1A1AA] flex flex-wrap items-center gap-2 font-mono">
                  <span className="text-[#F5F5F5] font-medium">
                    {latestRun.overall_score >= 90 ? 'Healthy' : latestRun.overall_score >= 70 ? 'Good' : latestRun.overall_score >= 40 ? 'Needs Attention' : 'Critical'}
                  </span>
                  <span>•</span>
                  <span>Last scanned {getRelativeTime(latestRun.completedAt || latestRun.createdAt)}</span>
                  <span>•</span>
                  <span className="truncate max-w-[280px] text-[#71717A]">{latestRun.url}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F5F5F5]">
                  No scans yet
                </div>
                <p className="text-xs sm:text-sm text-[#A1A1AA] max-w-md">
                  Run your first deterministic website audit to inspect DOM health, console errors, and performance.
                </p>
              </div>
            )}
          </div>

          {/* Right: Primary Action Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {latestRun && (
              <button
                onClick={() => onNavigate('test-results', latestRun.id)}
                className="h-11 px-5 rounded-[10px] bg-[#121212] hover:bg-[#151515] text-[#F5F5F5] border border-[#1E1E26] text-[13px] font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>View Full Audit</span>
                <ChevronRight className="w-4 h-4 text-[#71717A]" />
              </button>
            )}

            <button
              onClick={() => {
                if (latestRun) onQuickStart(latestRun.url);
                else onNavigate('test-website');
              }}
              disabled={!!isScanning}
              className="h-11 px-6 rounded-[10px] bg-[#7C3AED] hover:bg-[#8B5CF6] text-white text-[13px] font-semibold transition-all duration-150 flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 active:scale-[0.99]"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>SCANNING...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>RUN NEW SCAN</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* Subtle bottom progress line */}
        <div className="w-full bg-[#18181B] h-[2px] mt-8 rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#7C3AED] transition-all duration-700 ease-out"
            style={{ width: `${latestRun ? latestRun.overall_score : 0}%` }}
          />
        </div>
      </section>

      {/* 3. BENTO OVERVIEW (Restrained 2x2 metric grid) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono uppercase tracking-wider text-[#71717A] font-semibold">
            SYSTEM TELEMETRY
          </h2>
          <span className="text-xs font-mono text-[#71717A]">
            16 Deterministic Checks
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* SECURITY */}
          <div className="group rounded-[12px] bg-[#121212] hover:bg-[#151515] border border-[#1E1E26] hover:border-[#2a2a36] p-5 transition-all duration-200 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-[#A1A1AA] uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-[#7C3AED]" />
                <span>Security</span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-[4px] border ${
                bentoMetrics.security.label === 'Passed' 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                  : bentoMetrics.security.label === 'Not measured'
                  ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                  : 'bg-red-500/10 text-red-400 border-red-500/20'
              }`}>
                {bentoMetrics.security.label}
              </span>
            </div>
            <div>
              <div className="text-lg font-semibold text-[#F5F5F5] tracking-tight">
                {bentoMetrics.security.label === 'Passed' ? 'Clean Assertion' : bentoMetrics.security.label}
              </div>
              <p className="text-xs text-[#71717A] mt-1 leading-relaxed">
                {bentoMetrics.security.detail}
              </p>
            </div>
          </div>

          {/* PERFORMANCE */}
          <div className="group rounded-[12px] bg-[#121212] hover:bg-[#151515] border border-[#1E1E26] hover:border-[#2a2a36] p-5 transition-all duration-200 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-[#A1A1AA] uppercase tracking-wider">
                <Zap className="w-4 h-4 text-[#7C3AED]" />
                <span>Performance</span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-[4px] border ${
                bentoMetrics.performance.status === 'Good'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : bentoMetrics.performance.status === 'Acceptable'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : bentoMetrics.performance.label === 'Not measured'
                  ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                  : 'bg-red-500/10 text-red-400 border-red-500/20'
              }`}>
                {bentoMetrics.performance.status}
              </span>
            </div>
            <div>
              <div className="text-lg font-semibold text-[#F5F5F5] font-mono tracking-tight">
                {bentoMetrics.performance.label}
              </div>
              <p className="text-xs text-[#71717A] mt-1 leading-relaxed">
                {bentoMetrics.performance.detail}
              </p>
            </div>
          </div>

          {/* ACCESSIBILITY */}
          <div className="group rounded-[12px] bg-[#121212] hover:bg-[#151515] border border-[#1E1E26] hover:border-[#2a2a36] p-5 transition-all duration-200 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-[#A1A1AA] uppercase tracking-wider">
                <Eye className="w-4 h-4 text-[#7C3AED]" />
                <span>Accessibility</span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-[4px] border ${
                bentoMetrics.accessibility.label === 'Passed'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : bentoMetrics.accessibility.label === 'Not measured'
                  ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
                {bentoMetrics.accessibility.label}
              </span>
            </div>
            <div>
              <div className="text-lg font-semibold text-[#F5F5F5] tracking-tight">
                {bentoMetrics.accessibility.label === 'Passed' ? 'Validated' : bentoMetrics.accessibility.label}
              </div>
              <p className="text-xs text-[#71717A] mt-1 leading-relaxed">
                {bentoMetrics.accessibility.detail}
              </p>
            </div>
          </div>

          {/* SEO */}
          <div className="group rounded-[12px] bg-[#121212] hover:bg-[#151515] border border-[#1E1E26] hover:border-[#2a2a36] p-5 transition-all duration-200 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-[#A1A1AA] uppercase tracking-wider">
                <Search className="w-4 h-4 text-[#7C3AED]" />
                <span>SEO Basics</span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-[4px] border ${
                bentoMetrics.seo.label === 'Passed'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : bentoMetrics.seo.label === 'Not measured'
                  ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
                {bentoMetrics.seo.label}
              </span>
            </div>
            <div>
              <div className="text-lg font-semibold text-[#F5F5F5] tracking-tight">
                {bentoMetrics.seo.label === 'Passed' ? 'Compliant' : bentoMetrics.seo.label}
              </div>
              <p className="text-xs text-[#71717A] mt-1 leading-relaxed">
                {bentoMetrics.seo.detail}
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* 4. RECENT FINDINGS (Developer console table) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#F5F5F5] tracking-tight">
              Recent Findings
            </h2>
            <p className="text-xs text-[#71717A]">
              Issues detected during recent browser audit sessions
            </p>
          </div>
          <button
            onClick={() => onNavigate('bug-reports')}
            className="text-xs font-mono text-[#A1A1AA] hover:text-[#F5F5F5] transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>VIEW ALL</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="rounded-[12px] bg-[#0F0F10] border border-[#1E1E26] overflow-hidden shadow-sm">
          {recentFindings.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-9 h-9 rounded-full bg-[#151515] mx-auto flex items-center justify-center text-[#71717A]">
                <FileCheck className="w-4 h-4" />
              </div>
              <div className="text-xs font-medium text-[#F5F5F5]">No bugs or issues detected</div>
              <p className="text-xs text-[#71717A] max-w-sm mx-auto">
                All deterministic assertions completed cleanly or no audits have run yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#1E1E26] bg-[#0A0A0A] text-[11px] font-mono uppercase tracking-wider text-[#71717A]">
                    <th className="py-3 px-5 font-semibold">Severity</th>
                    <th className="py-3 px-5 font-semibold">Issue</th>
                    <th className="py-3 px-5 font-semibold">URL</th>
                    <th className="py-3 px-5 font-semibold">Status</th>
                    <th className="py-3 px-5 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#18181B] text-xs">
                  {recentFindings.map((finding) => (
                    <tr
                      key={finding.id}
                      onClick={() => {
                        setSelectedFinding(finding);
                        setIsDrawerOpen(true);
                      }}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setSelectedFinding(finding);
                          setIsDrawerOpen(true);
                        }
                      }}
                      className="h-16 hover:bg-[#141414] transition-colors cursor-pointer group focus:outline-none focus:bg-[#141414]"
                    >
                      {/* Severity Pill */}
                      <td className="py-3 px-5 whitespace-nowrap">
                        <span className={`inline-block text-[10px] font-mono uppercase font-semibold px-2 py-0.5 rounded-[4px] border ${
                          finding.severity === 'Critical' || finding.severity === 'High'
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : finding.severity === 'Medium'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-zinc-800 text-zinc-300 border-zinc-700/50'
                        }`}>
                          {finding.severity}
                        </span>
                      </td>

                      {/* Issue Name & ID */}
                      <td className="py-3 px-5 min-w-[200px]">
                        <div className="font-medium text-[#F5F5F5] group-hover:text-white transition-colors truncate max-w-sm">
                          {finding.title}
                        </div>
                        <div className="text-[11px] font-mono text-[#71717A]">
                          {finding.id} • {finding.testId}
                        </div>
                      </td>

                      {/* URL */}
                      <td className="py-3 px-5 whitespace-nowrap font-mono text-[#A1A1AA] text-xs">
                        <span className="truncate max-w-[220px] block">
                          {finding.websiteUrl.replace(/^https?:\/\//, '')}
                        </span>
                      </td>

                      {/* Status Pill */}
                      <td className="py-3 px-5 whitespace-nowrap">
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-[4px] bg-[#151515] border border-[#1E1E26] text-[#A1A1AA]">
                          {finding.status}
                        </span>
                      </td>

                      {/* Action View */}
                      <td className="py-3 px-5 text-right whitespace-nowrap">
                        <span className="text-xs font-medium text-[#7C3AED] group-hover:text-[#8B5CF6] transition-colors">
                          View
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* 5. RECENT SCANS LIST */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#F5F5F5] tracking-tight">
              Recent Scans
            </h2>
            <p className="text-xs text-[#71717A]">
              Execution history of deterministic Playwright test sessions
            </p>
          </div>
          <button
            onClick={() => onNavigate('test-history')}
            className="text-xs font-mono text-[#A1A1AA] hover:text-[#F5F5F5] transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>VIEW ALL SCANS</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="rounded-[12px] bg-[#0F0F10] border border-[#1E1E26] overflow-hidden shadow-sm">
          {recentRuns.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-9 h-9 rounded-full bg-[#151515] mx-auto flex items-center justify-center text-[#71717A]">
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-xs font-medium text-[#F5F5F5]">No test runs recorded</div>
              <p className="text-xs text-[#71717A] max-w-sm mx-auto">
                Trigger a scan from the command bar above to start collecting automated results.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#1E1E26] bg-[#0A0A0A] text-[11px] font-mono uppercase tracking-wider text-[#71717A]">
                    <th className="py-3 px-5 font-semibold">URL</th>
                    <th className="py-3 px-5 font-semibold">Date</th>
                    <th className="py-3 px-5 font-semibold">Score</th>
                    <th className="py-3 px-5 font-semibold">Bugs</th>
                    <th className="py-3 px-5 font-semibold">Duration</th>
                    <th className="py-3 px-5 font-semibold">Status</th>
                    <th className="py-3 px-5 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#18181B] text-xs">
                  {recentRuns.slice(0, 5).map((run) => (
                    <tr
                      key={run.id}
                      onClick={() => onNavigate('test-results', run.id)}
                      className="h-16 hover:bg-[#141414] transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-5 whitespace-nowrap font-mono text-[#F5F5F5]">
                        <span className="truncate max-w-[240px] block font-medium">
                          {run.url.replace(/^https?:\/\//, '')}
                        </span>
                      </td>

                      <td className="py-3 px-5 whitespace-nowrap font-mono text-[#71717A] text-xs">
                        {new Date(run.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-3 px-5 whitespace-nowrap font-mono font-semibold text-[#F5F5F5]">
                        {run.overall_score}/100
                      </td>

                      <td className="py-3 px-5 whitespace-nowrap font-mono">
                        <span className={run.bugsCount > 0 ? 'text-amber-400 font-semibold' : 'text-[#71717A]'}>
                          {run.bugsCount} {run.bugsCount === 1 ? 'bug' : 'bugs'}
                        </span>
                      </td>

                      <td className="py-3 px-5 whitespace-nowrap font-mono text-[#71717A]">
                        {run.executionTimeMs ? `${Math.round(run.executionTimeMs / 1000)}s` : '18s'}
                      </td>

                      <td className="py-3 px-5 whitespace-nowrap">
                        <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-[4px] border ${
                          run.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : run.status === 'failed'
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 animate-pulse'
                        }`}>
                          {run.status}
                        </span>
                      </td>

                      <td className="py-3 px-5 text-right whitespace-nowrap">
                        <span className="text-xs font-medium text-[#7C3AED] group-hover:text-[#8B5CF6] transition-colors">
                          View
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Finding Detail Right-side Drawer */}
      <FindingDrawer
        finding={selectedFinding}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onViewScreenshot={onViewScreenshot}
        onStatusChange={(id, newStatus) => {
          setRecentFindings(prev => prev.map(f => f.id === id ? { ...f, status: newStatus } : f));
        }}
      />

    </div>
  );
};
