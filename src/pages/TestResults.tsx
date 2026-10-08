import React, { useState, useEffect } from 'react';
import { TestRun, TestResult, TestStatus, TestCategory } from '../types';
import { api } from '../services/api';
import { Badge } from '../components/Badge';
import { AuditReportView } from '../components/AuditReportView';
import {
  FileCheck,
  Globe,
  Filter,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Sparkles,
  AlertTriangle,
  Image as ImageIcon,
  X,
  Copy,
  Check,
  LayoutDashboard,
  Table
} from 'lucide-react';

interface TestResultsProps {
  activeRun: TestRun | null;
  selectedRunId?: string;
  onViewScreenshot: (url: string, testId: string, title: string) => void;
  onNavigateToRunner: (url?: string) => void;
}

export const TestResults: React.FC<TestResultsProps> = ({
  activeRun,
  selectedRunId: propRunId,
  onViewScreenshot,
  onNavigateToRunner
}) => {
  const [runs, setRuns] = useState<TestRun[]>([]);
  const [currentRunId, setCurrentRunId] = useState<string>(propRunId || activeRun?.id || '');
  const [viewMode, setViewMode] = useState<'audit_report' | 'table'>('audit_report');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchRuns = async () => {
      try {
        const list = await api.getHistory();
        setRuns(list);
        if (!currentRunId && list.length > 0) {
          setCurrentRunId(list[0].id);
        }
      } catch (err) {
        console.error('Failed to load history:', err);
      }
    };
    fetchRuns();
  }, []);

  useEffect(() => {
    if (propRunId) {
      setCurrentRunId(propRunId);
    } else if (activeRun?.id) {
      setCurrentRunId(activeRun.id);
    }
  }, [propRunId, activeRun?.id]);

  const currentRun = activeRun?.id === currentRunId ? activeRun : runs.find(r => r.id === currentRunId);
  const results: TestResult[] = currentRun?.results || [];

  const filteredResults = results.filter(r => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (categoryFilter !== 'ALL' && r.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.testId.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.actualResult.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCopyResult = (res: TestResult) => {
    const text = `Test ID: ${res.testId} - ${res.name}
Status: ${res.status} (${res.durationMs}ms)
Expected: ${res.expectedResult}
Actual: ${res.actualResult}
Error: ${res.error || 'None'}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <FileCheck className="w-5 h-5 text-[#8B5CF6]" />
            <span>Execution Logs & Assertion Traces</span>
          </h2>
          <p className="text-xs text-[#A1A1AA] mt-1 font-mono">
            Deterministic pass/fail assertion outcomes, execution times, and failure evidence traces
          </p>
        </div>

        {/* View mode toggle + Run Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg bg-[#0F0F14] border border-white/[0.06] p-1">
            <button
              onClick={() => setViewMode('audit_report')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer font-mono ${
                viewMode === 'audit_report'
                  ? 'bg-[#8B5CF6] text-white shadow-[0_0_12px_rgba(139,92,246,0.25)]'
                  : 'text-[#A1A1AA] hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>QA Audit Report</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer font-mono ${
                viewMode === 'table'
                  ? 'bg-[#8B5CF6] text-white shadow-[0_0_12px_rgba(139,92,246,0.25)]'
                  : 'text-[#A1A1AA] hover:text-white'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Assertion Logs</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#A1A1AA] shrink-0" />
            <select
              value={currentRunId}
              onChange={(e) => setCurrentRunId(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-indigo-500 font-mono"
            >
              {runs.map(r => (
                <option key={r.id} value={r.id}>
                  {r.url.replace(/^https?:\/\//, '')} ({r.id})
                </option>
              ))}
              {runs.length === 0 && (
                <option value="">No historical runs available</option>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Render AuditReportView when in audit_report mode */}
      {viewMode === 'audit_report' && currentRun && (
        <AuditReportView run={currentRun} onViewScreenshot={onViewScreenshot} />
      )}

      {/* Assertion Table View */}
      {viewMode === 'table' && (
        <div className="space-y-6">
          {currentRun && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-zinc-400">Target:</span>
                <span className="font-mono text-xs text-cyan-400 font-bold">{currentRun.url}</span>
                <span className="text-xs font-mono text-zinc-400">({currentRun.id})</span>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="text-zinc-300">Total: <strong>{currentRun.totalTests}</strong></span>
                <span className="text-emerald-400 font-bold">Passed: {currentRun.passedTests}</span>
                <span className="text-rose-400 font-bold">Failed: {currentRun.failedTests}</span>
                {currentRun.skippedTests > 0 && (
                  <span className="text-zinc-400">Skipped: {currentRun.skippedTests}</span>
                )}
                <span className="text-indigo-400 font-bold">Score: {currentRun.overall_score || currentRun.successRate}%</span>
              </div>
            </div>
          )}

      {/* Filters and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-950/70 p-3.5 rounded-xl border border-zinc-800">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-4 h-4 text-zinc-400 mr-1" />

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Outcomes</option>
            <option value="PASS">PASS Only</option>
            <option value="FAIL">FAIL Only</option>
            <option value="SKIPPED">SKIPPED</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Categories</option>
            <option value="UI">UI</option>
            <option value="Button">Button</option>
            <option value="Link">Link</option>
            <option value="Form">Form</option>
            <option value="Navigation">Navigation</option>
            <option value="Responsive">Responsive</option>
          </select>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search result text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs placeholder-zinc-400 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Results Table */}
      {filteredResults.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-zinc-800 mx-auto flex items-center justify-center text-zinc-400">
            <FileCheck className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-white">No test results found</h4>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            {results.length === 0
              ? 'Execute a test run in the Test Website console to view execution results.'
              : 'No results match your active filters.'}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/80 text-zinc-400 uppercase tracking-wider font-mono border-b border-zinc-800">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Test ID</th>
                  <th className="py-3.5 px-4 font-semibold">Test Name</th>
                  <th className="py-3.5 px-4 font-semibold">Category</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold">Duration</th>
                  <th className="py-3.5 px-4 font-semibold">Timestamp</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {filteredResults.map((res) => (
                  <tr
                    key={res.testId}
                    onClick={() => setSelectedResult(res)}
                    className="hover:bg-zinc-800/30 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-zinc-300">
                      {res.testId}
                    </td>
                    <td className="py-3 px-4 font-medium text-white max-w-xs truncate">
                      {res.name}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                        {res.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge status={res.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-400">
                      {res.durationMs}ms
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-400 text-[11px]">
                      {new Date(res.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {res.screenshotUrl && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewScreenshot(res.screenshotUrl!, res.testId, res.name);
                            }}
                            className="p-1 rounded text-rose-400 hover:bg-rose-500/10"
                            title="Failure Screenshot"
                          >
                            <ImageIcon className="w-4 h-4" />
                          </button>
                        )}
                        <span className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
                          Inspect &rarr;
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>
      )}

      {/* Test Result Inspector Modal */}
      {selectedResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="relative max-w-3xl w-full max-h-[90vh] bg-zinc-900 border border-zinc-700 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/70">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-zinc-300 px-2.5 py-1 rounded bg-zinc-800 border border-zinc-700">
                  {selectedResult.testId}
                </span>
                <Badge status={selectedResult.status} />
                <h3 className="text-sm font-bold text-white truncate max-w-md">
                  {selectedResult.name}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyResult(selectedResult)}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
                  title="Copy test result"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setSelectedResult(null)}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-6 space-y-5">
              {/* Expected vs Actual Result */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                    Expected Outcome
                  </span>
                  <p className="text-xs text-zinc-300 font-mono leading-relaxed">
                    {selectedResult.expectedResult}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block">
                    Actual Outcome Recorded
                  </span>
                  <p className="text-xs text-zinc-300 font-mono leading-relaxed">
                    {selectedResult.actualResult}
                  </p>
                </div>
              </div>

              {/* Error Stack Trace if Failed */}
              {selectedResult.error && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> Assertion Failure / Error Message
                  </span>
                  <div className="p-4 rounded-xl bg-zinc-950 border border-rose-500/20 text-rose-300 font-mono text-xs overflow-x-auto">
                    <code>{selectedResult.error}</code>
                  </div>
                </div>
              )}

              {/* Console Errors */}
              {selectedResult.consoleErrors && selectedResult.consoleErrors.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-amber-400">
                    Browser Console Errors Recorded ({selectedResult.consoleErrors.length})
                  </span>
                  <div className="p-3 rounded-xl bg-zinc-950 border border-amber-500/20 text-amber-300 font-mono text-xs space-y-1">
                    {selectedResult.consoleErrors.map((err, idx) => (
                      <div key={idx} className="truncate">• {err}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Failure Screenshot Button */}
              {selectedResult.screenshotUrl && (
                <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ImageIcon className="w-5 h-5 text-rose-400" />
                    <div>
                      <h4 className="text-xs font-bold text-white">Failure Screenshot Available</h4>
                      <p className="text-[11px] text-zinc-400">Captured at the exact moment the test assertion failed</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onViewScreenshot(selectedResult.screenshotUrl!, selectedResult.testId, selectedResult.name);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
                  >
                    <span>Inspect Screenshot</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Associated AI Bug Report link if any */}
              {selectedResult.bugId && (
                <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                    <div>
                      <h4 className="text-xs font-bold text-indigo-300">
                        Gemini AI Bug Report Generated ({selectedResult.bugId})
                      </h4>
                      <p className="text-[11px] text-zinc-400">Root-cause analysis and developer fix ready in Bug Reports</p>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold text-indigo-400">
                    {selectedResult.bugId}
                  </span>
                </div>
              )}

              {/* Execution Telemetry Details */}
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/80 flex flex-wrap items-center justify-between text-xs font-mono text-zinc-400 gap-2">
                <span>Duration: <strong className="text-white">{selectedResult.durationMs}ms</strong></span>
                <span>Category: <strong className="text-white">{selectedResult.category}</strong></span>
                <span>Priority: <strong className="text-white">{selectedResult.priority}</strong></span>
                <span>Timestamp: <strong className="text-white">{new Date(selectedResult.timestamp).toLocaleString()}</strong></span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-950/70 flex justify-end">
              <button
                onClick={() => setSelectedResult(null)}
                className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
