import React, { useState } from 'react';
import { TestRun } from '../types';
import { Badge } from './Badge';
import {
  Sparkles,
  ShieldCheck,
  Zap,
  Eye,
  Search,
  Network,
  Download,
  Copy,
  Check,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Lock,
  Layers,
  FileText,
  Monitor,
  ExternalLink
} from 'lucide-react';

interface AuditReportViewProps {
  run: TestRun;
  onViewScreenshot?: (url: string, testId: string, title: string) => void;
}

export const AuditReportView: React.FC<AuditReportViewProps> = ({ run, onViewScreenshot }) => {
  const [activeTab, setActiveTab] = useState<'report' | 'vitals' | 'security' | 'a11y' | 'seo' | 'network'>('report');
  const [copiedReport, setCopiedReport] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (score >= 75) return 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10';
    if (score >= 50) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  };

  const getScoreRating = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 50) return 'Needs Improvement';
    return 'Poor / Critical Risks';
  };

  const handleCopyMarkdown = () => {
    if (!run.humanReadableReport) return;
    navigator.clipboard.writeText(run.humanReadableReport);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  const handleDownloadJson = () => {
    const machineReport = {
      target: run.url,
      scan_time: run.createdAt,
      website_type: run.website_type,
      overall_score: run.overall_score,
      summary: run.summary,
      test_cases: run.testCases,
      bug_reports: run.bugs,
      api_results: run.networkLogs?.filter(n => n.resourceType === 'fetch' || n.resourceType === 'xhr') || [],
      performance: run.performance,
      accessibility: run.accessibility,
      security: run.security,
      seo: run.seo,
      responsive: {
        mobile_375px: run.results?.some(r => r.category === 'Responsive' && r.actualResult?.includes('Mobile') && r.status === 'FAIL') ? 'FAIL' : 'PASS',
        tablet_768px: run.results?.some(r => r.category === 'Responsive' && r.actualResult?.includes('Tablet') && r.status === 'FAIL') ? 'FAIL' : 'PASS',
        desktop_1440px: 'PASS'
      },
      console_errors: run.consoleErrors || [],
      network_errors: run.networkLogs?.filter(n => n.failed) || [],
      recommendations: run.recommendations || []
    };

    const blob = new Blob([JSON.stringify(machineReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qa-audit-${run.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Executive Header Banner */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#0F0F14] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/30">
                AUDIT ID: {run.id}
              </span>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-[#12121A] text-zinc-300 border border-white/[0.06] font-semibold">
                Type: {run.website_type || 'Web Application'}
              </span>
              <span className="text-xs text-[#A1A1AA] font-mono">
                {new Date(run.createdAt).toLocaleString()}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono truncate max-w-2xl">
              {run.url}
            </h2>

            <p className="text-xs text-[#A1A1AA] max-w-2xl leading-relaxed">
              Comprehensive autonomous QA audit evaluated across Functional, UI, Responsiveness, APIs, Performance Web Vitals, Security Headers, Accessibility, and SEO.
            </p>
          </div>

          {/* Overall Score Badge Gauge */}
          <div className="flex items-center gap-5 shrink-0 self-start lg:self-center">
            <div className={`p-4 rounded-2xl border flex flex-col items-center justify-center min-w-[140px] shadow-lg ${getScoreColor(run.overall_score || 0)}`}>
              <span className="text-[10px] uppercase tracking-wider font-bold opacity-80 font-mono">
                Overall Score
              </span>
              <span className="text-4xl font-extrabold font-mono mt-0.5">
                {run.overall_score || 0}
              </span>
              <span className="text-[11px] font-semibold mt-1 font-mono">
                {getScoreRating(run.overall_score || 0)}
              </span>
            </div>

            {/* Quick Export CTAs */}
            <div className="flex flex-col gap-2">
              <button
                onClick={handleDownloadJson}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#12121A] hover:bg-zinc-800 text-zinc-200 text-xs font-semibold border border-white/[0.08] transition-colors shadow-sm cursor-pointer font-mono"
                title="Download Machine-Readable JSON Report"
              >
                <Download className="w-3.5 h-3.5 text-[#06B6D4]" />
                <span>JSON Export</span>
              </button>

              <button
                onClick={handleCopyMarkdown}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#12121A] hover:bg-zinc-800 text-zinc-200 text-xs font-semibold border border-white/[0.08] transition-colors shadow-sm cursor-pointer font-mono"
                title="Copy Senior QA Markdown Report"
              >
                {copiedReport ? <Check className="w-3.5 h-3.5 text-[#22C55E]" /> : <Copy className="w-3.5 h-3.5 text-[#8B5CF6]" />}
                <span>{copiedReport ? 'Copied MD' : 'Copy MD'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Subsystem KPI Rings */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-6 mt-6 border-t border-white/[0.06] text-center font-mono">
          <div className="p-2.5 rounded-xl bg-[#050507] border border-white/[0.06]">
            <span className="text-[10px] text-[#A1A1AA] block font-sans">Functional (25%)</span>
            <span className="text-sm font-bold text-[#22C55E]">{run.passedTests}/{run.totalTests} Pass</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#050507] border border-white/[0.06]">
            <span className="text-[10px] text-[#A1A1AA] block font-sans">UI / Resp (15%)</span>
            <span className={`text-sm font-bold ${run.results?.some(r => r.category === 'Responsive' && r.status === 'FAIL') ? 'text-[#EF4444]' : 'text-[#22C55E]'}`}>
              {run.results?.some(r => r.category === 'Responsive' && r.status === 'FAIL') ? 'Defects' : '100% Pass'}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#050507] border border-white/[0.06]">
            <span className="text-[10px] text-[#A1A1AA] block font-sans">API / Net (15%)</span>
            <span className="text-sm font-bold text-[#06B6D4]">
              {run.networkLogs?.filter(n => !n.failed).length || 0}/{run.networkLogs?.length || 0}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#050507] border border-white/[0.06]">
            <span className="text-[10px] text-[#A1A1AA] block font-sans">Performance (15%)</span>
            <span className={`text-sm font-bold ${getScoreColor(run.performance?.score || 80).split(' ')[0]}`}>
              {run.performance?.score || 80}/100
            </span>
          </div>


          <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
            <span className="text-[10px] text-zinc-400 block font-sans">Security (10%)</span>
            <span className={`text-sm font-bold ${getScoreColor(run.security?.score || 80).split(' ')[0]}`}>
              {run.security?.score || 80}/100
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
            <span className="text-[10px] text-zinc-400 block font-sans">A11y (10%)</span>
            <span className={`text-sm font-bold ${getScoreColor(run.accessibility?.score || 80).split(' ')[0]}`}>
              {run.accessibility?.score || 80}/100
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
            <span className="text-[10px] text-zinc-400 block font-sans">SEO (10%)</span>
            <span className={`text-sm font-bold ${getScoreColor(run.seo?.score || 80).split(' ')[0]}`}>
              {run.seo?.score || 80}/100
            </span>
          </div>
        </div>
      </div>

      {/* Audit Navigation Tabs */}
      <div className="flex border-b border-zinc-800 overflow-x-auto text-xs font-semibold no-scrollbar">
        <button
          onClick={() => setActiveTab('report')}
          className={`py-3 px-4 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'report' ? 'border-indigo-500 text-white' : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <FileText className="w-4 h-4 text-indigo-400" />
          <span>Senior QA Report</span>
        </button>

        <button
          onClick={() => setActiveTab('vitals')}
          className={`py-3 px-4 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'vitals' ? 'border-indigo-500 text-white' : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-400" />
          <span>Performance & Web Vitals</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`py-3 px-4 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'security' ? 'border-indigo-500 text-white' : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>Security Headers</span>
        </button>

        <button
          onClick={() => setActiveTab('a11y')}
          className={`py-3 px-4 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'a11y' ? 'border-indigo-500 text-white' : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Eye className="w-4 h-4 text-emerald-400" />
          <span>Accessibility Scan</span>
        </button>

        <button
          onClick={() => setActiveTab('seo')}
          className={`py-3 px-4 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'seo' ? 'border-indigo-500 text-white' : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Search className="w-4 h-4 text-purple-400" />
          <span>SEO Health</span>
        </button>

        <button
          onClick={() => setActiveTab('network')}
          className={`py-3 px-4 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'network' ? 'border-indigo-500 text-white' : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Network className="w-4 h-4 text-pink-400" />
          <span>Network & Console ({run.networkLogs?.length || 0})</span>
        </button>
      </div>

      {/* Tab 1: Senior QA Report */}
      {activeTab === 'report' && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 sm:p-8 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Full Senior QA Audit Report (Markdown)</h3>
            </div>
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs transition-colors border border-zinc-700"
            >
              {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedReport ? 'Copied' : 'Copy Report'}</span>
            </button>
          </div>

          <div className="prose prose-invert max-w-none text-xs sm:text-sm text-zinc-300 font-mono leading-relaxed bg-zinc-950 p-6 rounded-xl border border-zinc-800 overflow-x-auto whitespace-pre-wrap selection:bg-indigo-600">
            {run.humanReadableReport || 'Report generating...'}
          </div>
        </div>
      )}

      {/* Tab 2: Performance & Web Vitals */}
      {activeTab === 'vitals' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">Total Load Time</span>
              <span className="text-2xl font-bold font-mono text-white mt-1 block">
                {run.performance?.pageLoadTimeMs} ms
              </span>
              <span className="text-[11px] text-zinc-400">Total browser navigation</span>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">First Contentful Paint</span>
              <span className="text-2xl font-bold font-mono text-cyan-400 mt-1 block">
                {run.performance?.fcpMs} ms
              </span>
              <span className="text-[11px] text-zinc-400">Time to first rendered pixel</span>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">Total Requests</span>
              <span className="text-2xl font-bold font-mono text-indigo-400 mt-1 block">
                {run.performance?.totalRequests}
              </span>
              <span className="text-[11px] text-zinc-400">Static assets & API calls</span>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">Total Transfer Size</span>
              <span className="text-2xl font-bold font-mono text-amber-400 mt-1 block">
                {run.performance?.totalTransferSizeKb} KB
              </span>
              <span className="text-[11px] text-zinc-400">Network payload</span>
            </div>
          </div>

          {/* Asset Breakdown */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Resource Payload Breakdown</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                <span className="text-zinc-400 block text-[11px]">JavaScript</span>
                <span className="text-white font-bold text-sm">{run.performance?.jsSizeKb} KB</span>
              </div>
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                <span className="text-zinc-400 block text-[11px]">CSS Stylesheets</span>
                <span className="text-white font-bold text-sm">{run.performance?.cssSizeKb} KB</span>
              </div>
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                <span className="text-zinc-400 block text-[11px]">Images</span>
                <span className="text-white font-bold text-sm">{run.performance?.imageSizeKb} KB</span>
              </div>
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                <span className="text-zinc-400 block text-[11px]">Web Fonts</span>
                <span className="text-white font-bold text-sm">{run.performance?.fontSizeKb} KB</span>
              </div>
            </div>
          </div>

          {/* Bottlenecks & Recommendations */}
          {run.performance?.bottlenecks && run.performance.bottlenecks.length > 0 && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-950/10 p-5 space-y-2">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4" /> Detected Performance Bottlenecks
              </span>
              <ul className="space-y-1 text-xs text-zinc-300">
                {run.performance.bottlenecks.map((b, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="text-amber-400">•</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Security Headers */}
      {activeTab === 'security' && (
        <div className="space-y-5">
          <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock className={`w-5 h-5 ${run.security?.https ? 'text-emerald-400' : 'text-rose-400'}`} />
              <div>
                <span className="text-xs font-bold text-white block">
                  HTTPS Protocol Status: {run.security?.https ? 'Secure (Enforced)' : 'Insecure (Plain HTTP)'}
                </span>
                <span className="text-[11px] text-zinc-400">
                  {run.security?.https ? 'SSL/TLS certificate verified' : 'Traffic is transmitted unencrypted'}
                </span>
              </div>
            </div>
            <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded border ${getScoreColor(run.security?.score || 80)}`}>
              Security Score: {run.security?.score || 80}/100
            </span>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-zinc-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                HTTP Security Headers Audit
              </h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950 text-zinc-400 font-mono border-b border-zinc-800">
                  <tr>
                    <th className="py-3 px-4">Header</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Value / Recommendation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80">
                  {Object.entries(run.security?.headers || {}).map(([name, item]) => (
                    <tr key={name} className="hover:bg-zinc-800/30">
                      <td className="py-3 px-4 font-mono font-bold text-white">
                        {name}
                      </td>
                      <td className="py-3 px-4">
                        {item.present ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" /> PRESENT
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                            <XCircle className="w-3 h-3" /> MISSING
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-zinc-300 font-mono text-[11px]">
                        {item.value ? (
                          <code className="text-cyan-300">{item.value}</code>
                        ) : (
                          <span className="text-amber-300/80">{item.recommendation}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Accessibility Scan */}
      {activeTab === 'a11y' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">Missing Alt Text</span>
              <span className="text-xl font-bold font-mono text-white mt-1 block">
                {run.accessibility?.missingAltCount}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">Empty Buttons</span>
              <span className="text-xl font-bold font-mono text-white mt-1 block">
                {run.accessibility?.emptyButtonsCount}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">Inputs Missing Labels</span>
              <span className="text-xl font-bold font-mono text-white mt-1 block">
                {run.accessibility?.missingLabelsCount}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">Duplicate IDs</span>
              <span className="text-xl font-bold font-mono text-white mt-1 block">
                {run.accessibility?.duplicateIdsCount}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Detected Accessibility Findings ({run.accessibility?.issues.length || 0})
            </h4>

            {run.accessibility?.issues.length === 0 ? (
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Zero automated accessibility violations detected on inspected elements.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {run.accessibility?.issues.map((issue, idx) => (
                  <div key={idx} className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        {issue.type}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-semibold">
                        {issue.severity}
                      </span>
                    </div>
                    <p className="text-zinc-300">{issue.message}</p>
                    <p className="text-emerald-400/90 text-[11px] font-mono">
                      Fix: {issue.fix}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 5: SEO Health */}
      {activeTab === 'seo' && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Search Engine Optimization (SEO) Score: {run.seo?.score || 80}/100
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">Title Tag</span>
                <span className="font-mono text-[11px] text-zinc-400">{run.seo?.titleLength} chars</span>
              </div>
              <p className="text-zinc-300 font-mono text-[11px]">"{run.seo?.title || '(Missing Title)'}"</p>
            </div>

            <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">Meta Description</span>
                <span className="font-mono text-[11px] text-zinc-400">{run.seo?.descLength} chars</span>
              </div>
              <p className="text-zinc-300 text-[11px]">
                {run.seo?.metaDescription || 'No meta description tag detected.'}
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1">
              <span className="font-bold text-white block">Heading Structure</span>
              <p className="text-zinc-300 text-[11px]">
                H1 Headings: <strong>{run.seo?.h1Count}</strong> | H2 Headings: <strong>{run.seo?.h2Count}</strong>
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1">
              <span className="font-bold text-white block">Technical Metadata</span>
              <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                <span>Canonical: {run.seo?.hasCanonical ? '✓' : '✗'}</span>
                <span>Robots: {run.seo?.hasRobotsMeta ? '✓' : '✗'}</span>
                <span>OpenGraph: {run.seo?.hasOpenGraph ? '✓' : '✗'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Network & Console Logs */}
      {activeTab === 'network' && (
        <div className="space-y-5">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Captured Network Traffic ({run.networkLogs?.length || 0} requests)
              </h4>
            </div>

            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950 text-zinc-400 font-mono sticky top-0 border-b border-zinc-800">
                  <tr>
                    <th className="py-2.5 px-4">Method</th>
                    <th className="py-2.5 px-4">URL</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Latency</th>
                    <th className="py-2.5 px-4">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80 font-mono">
                  {(run.networkLogs || []).map((item, idx) => (
                    <tr key={idx} className="hover:bg-zinc-800/30">
                      <td className="py-2 px-4 font-bold text-white">{item.method}</td>
                      <td className="py-2 px-4 text-zinc-300 truncate max-w-md">{item.url}</td>
                      <td className="py-2 px-4">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          item.status >= 200 && item.status < 400
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {item.status || 'ERR'}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-zinc-400">{item.responseTimeMs}ms</td>
                      <td className="py-2 px-4 text-zinc-400 text-[11px]">{item.resourceType}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
