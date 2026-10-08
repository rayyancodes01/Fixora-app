import React, { useState } from 'react';
import { 
  X, 
  Download, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  MinusCircle, 
  Clock, 
  ChevronDown, 
  ChevronRight,
  ShieldAlert,
  Camera,
  ExternalLink,
  Layers
} from 'lucide-react';
import { TestRun, TestResult } from '../types';

interface ScanResultsProps {
  run: TestRun | null;
  isOpen: boolean;
  onClose: () => void;
  onViewScreenshot?: (url: string, testId: string, title: string) => void;
}

export const ScanResults: React.FC<ScanResultsProps> = ({
  run,
  isOpen,
  onClose,
  onViewScreenshot,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'FAIL' | 'WARNING' | 'PASS' | 'NOT_APPLICABLE'>('ALL');
  const [expandedTests, setExpandedTests] = useState<Record<string, boolean>>({});

  if (!isOpen || !run) return null;

  const toggleExpand = (testId: string) => {
    setExpandedTests(prev => ({ ...prev, [testId]: !prev[testId] }));
  };

  const results = run.results || [];
  const passedCount = results.filter(r => r.status === 'PASS').length;
  const failedCount = results.filter(r => r.status === 'FAIL').length;
  const warnCount = results.filter(r => r.status === 'WARNING').length;
  const naCount = results.filter(r => r.status === 'NOT_APPLICABLE').length;

  const filteredResults = results.filter(r => {
    if (filter === 'ALL') return true;
    return r.status === filter;
  });

  const handleExportJson = () => {
    const reportData = {
      runId: run.id,
      url: run.url,
      overall_score: run.overall_score,
      healthStatus: run.healthStatus,
      completedAt: run.completedAt,
      summary: {
        total: 16,
        passed: passedCount,
        failed: failedCount,
        warnings: warnCount,
        not_applicable: naCount,
      },
      results: run.results,
      bugs: run.bugs || [],
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `bugscout-audit-${run.id}.json`;
    link.click();
    URL.revokeObjectURL(blobUrl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md select-none font-sans">
      <div 
        className="w-full max-w-4xl max-h-[90vh] bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="audit-modal-title"
      >
        {/* Top Header Bar */}
        <div className="px-6 py-4 border-b border-[#1A1A1A] flex items-center justify-between bg-[#000000]">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6] shadow-[0_0_8px_#8B5CF6]" />
            <div>
              <h2 id="audit-modal-title" className="text-base font-bold font-mono text-white tracking-tight">
                Full Playwright Audit Report
              </h2>
              <p className="text-xs font-mono text-neutral-500 truncate max-w-md">
                {run.url} • {run.id}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJson}
              className="px-3 py-1.5 rounded-lg bg-[#121212] hover:bg-[#1A1A1A] border border-[#1A1A1A] text-xs font-mono text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Download JSON Report"
            >
              <Download className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <span className="hidden sm:inline">Export JSON</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[#1A1A1A] text-neutral-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Overview Stats Strip */}
        <div className="px-6 py-4 bg-[#080808] border-b border-[#141414] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-baseline gap-3 font-mono">
            <span className="text-3xl font-extrabold text-white">
              {run.overall_score ?? '--'} / 100
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full border border-neutral-800 text-neutral-300 font-semibold bg-[#121212]">
              {run.healthStatus || 'COMPLETED'}
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                filter === 'ALL'
                  ? 'bg-neutral-800 border-neutral-700 text-white font-bold'
                  : 'bg-[#121212] border-[#1A1A1A] text-neutral-400 hover:text-white'
              }`}
            >
              16 Tests
            </button>
            <button
              onClick={() => setFilter('PASS')}
              className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                filter === 'PASS'
                  ? 'bg-emerald-950/60 border-emerald-700 text-emerald-400 font-bold'
                  : 'bg-[#121212] border-[#1A1A1A] text-neutral-400 hover:text-emerald-400'
              }`}
            >
              {passedCount} Passed
            </button>
            <button
              onClick={() => setFilter('FAIL')}
              className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                filter === 'FAIL'
                  ? 'bg-rose-950/60 border-rose-700 text-rose-400 font-bold'
                  : 'bg-[#121212] border-[#1A1A1A] text-neutral-400 hover:text-rose-400'
              }`}
            >
              {failedCount} Failed
            </button>
            <button
              onClick={() => setFilter('WARNING')}
              className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                filter === 'WARNING'
                  ? 'bg-amber-950/60 border-amber-700 text-amber-400 font-bold'
                  : 'bg-[#121212] border-[#1A1A1A] text-neutral-400 hover:text-amber-400'
              }`}
            >
              {warnCount} Warnings
            </button>
            <button
              onClick={() => setFilter('NOT_APPLICABLE')}
              className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                filter === 'NOT_APPLICABLE'
                  ? 'bg-neutral-800 border-neutral-700 text-white font-bold'
                  : 'bg-[#121212] border-[#1A1A1A] text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {naCount} N/A
            </button>
          </div>
        </div>

        {/* Scrollable Test Findings List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {filteredResults.length === 0 ? (
            <div className="text-center py-12 text-xs font-mono text-neutral-500">
              No tests match the selected filter.
            </div>
          ) : (
            filteredResults.map((test) => {
              const isExpanded = !!expandedTests[test.testId];
              const isFail = test.status === 'FAIL';
              const isWarn = test.status === 'WARNING';
              const isPass = test.status === 'PASS';
              const isNA = test.status === 'NOT_APPLICABLE';

              return (
                <div
                  key={test.testId}
                  className="bg-[#000000] border border-[#141414] hover:border-[#222222] rounded-xl overflow-hidden transition-all"
                >
                  <div
                    onClick={() => toggleExpand(test.testId)}
                    className="p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-mono font-bold text-neutral-400 shrink-0">
                        {test.testId}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold font-mono text-white truncate">
                          {test.name || test.testId}
                        </div>
                        <div className="text-[11px] font-mono text-neutral-400 truncate max-w-lg mt-0.5">
                          {test.actualResult || test.actual || 'Evaluated successfully'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {test.durationMs && (
                        <span className="hidden sm:inline text-[10px] font-mono text-neutral-500">
                          {test.durationMs}ms
                        </span>
                      )}

                      {isPass && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          PASS
                        </span>
                      )}

                      {isFail && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold text-rose-400 bg-rose-950/40 border border-rose-800/40 flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          FAIL
                        </span>
                      )}

                      {isWarn && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold text-amber-400 bg-amber-950/40 border border-amber-800/40 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          WARN
                        </span>
                      )}

                      {isNA && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium text-neutral-400 bg-neutral-900 border border-neutral-800 flex items-center gap-1">
                          <MinusCircle className="w-3 h-3" />
                          N/A
                        </span>
                      )}

                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-neutral-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-neutral-500" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Details Section */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-[#141414] bg-[#070707] space-y-3 text-xs font-mono">
                      <div>
                        <span className="text-[10px] uppercase text-neutral-500 font-semibold">Expected:</span>
                        <p className="text-neutral-300 mt-0.5 text-[11px]">
                          {test.expectedResult || test.expected || 'Assertion condition satisfied.'}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase text-neutral-500 font-semibold">Actual Result:</span>
                        <p className="text-neutral-200 mt-0.5 text-[11px]">
                          {test.actualResult || test.actual || 'Test execution completed.'}
                        </p>
                      </div>

                      {test.evidence && test.evidence.length > 0 && (
                        <div>
                          <span className="text-[10px] uppercase text-neutral-500 font-semibold">Evidence:</span>
                          <ul className="list-disc list-inside mt-1 space-y-0.5 text-neutral-400 text-[11px]">
                            {test.evidence.map((ev, i) => (
                              <li key={i} className="truncate">{ev}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {test.screenshotUrl && onViewScreenshot && (
                        <div className="pt-2">
                          <button
                            onClick={() => onViewScreenshot(test.screenshotUrl!, test.testId, test.name)}
                            className="px-3 py-1.5 rounded-lg bg-[#121212] hover:bg-[#1A1A1A] border border-[#222222] text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer text-xs"
                          >
                            <Camera className="w-3.5 h-3.5 text-[#8B5CF6]" />
                            <span>View Captured Evidence Screenshot</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
