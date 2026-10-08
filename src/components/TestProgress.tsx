import React from 'react';
import { Loader2, CheckCircle2, AlertTriangle, XCircle, MinusCircle, Clock } from 'lucide-react';
import { TestRun } from '../types';

interface TestProgressProps {
  activeRun: TestRun | null;
  isScanning: boolean;
}

export const TestProgress: React.FC<TestProgressProps> = ({ activeRun, isScanning }) => {
  const totalTests = 16;
  const completedTests = activeRun?.results ? activeRun.results.length : 0;
  const percentage = Math.min(100, Math.round((completedTests / totalTests) * 100));

  const passedCount = activeRun?.results.filter(r => r.status === 'PASS').length || 0;
  const failedCount = activeRun?.results.filter(r => r.status === 'FAIL').length || 0;
  const warnCount = activeRun?.results.filter(r => r.status === 'WARNING').length || 0;
  const naCount = activeRun?.results.filter(r => r.status === 'NOT_APPLICABLE').length || 0;

  // Active test indicator
  const currentRunningTestTitle = activeRun?.currentTestId
    ? `${activeRun.currentTestId} — ${activeRun.currentTestName || 'Executing'}`
    : completedTests > 0 && completedTests < totalTests
      ? `TEST-${String(completedTests + 1).padStart(2, '0')}`
      : 'All Checks Concluded';

  const completedString = String(completedTests).padStart(2, '0');
  const totalString = String(totalTests).padStart(2, '0');

  return (
    <div className="w-full bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl p-6 shadow-xl transition-all hover:border-neutral-800">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-3">
          <span className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
            {completedString} / {totalString}
          </span>
          <div className="h-4 w-[1px] bg-[#222222]" />
          <span className="text-xs sm:text-sm font-mono text-neutral-300 truncate">
            {isScanning ? (
              <span className="flex items-center gap-2 text-white">
                <Loader2 className="w-3.5 h-3.5 text-[#8B5CF6] animate-spin shrink-0" />
                <span className="truncate">Running {currentRunningTestTitle}</span>
              </span>
            ) : completedTests === 16 ? (
              <span className="text-emerald-400 font-medium">
                Complete — 16 / 16 Tests Evaluated
              </span>
            ) : (
              <span className="text-neutral-400">
                Deterministic Test Execution Pipeline
              </span>
            )}
          </span>
        </div>

        <div className="text-xs font-mono font-semibold text-neutral-400 self-end sm:self-auto">
          {percentage}%
        </div>
      </div>

      {/* Real Progress Bar */}
      <div className="w-full h-2 rounded-full bg-[#1A1A1A] overflow-hidden relative">
        <div
          className="h-full bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] transition-all duration-300 ease-out rounded-full shadow-[0_0_12px_#8B5CF6]"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Bottom Summary Tags */}
      <div className="mt-4 pt-3 border-t border-[#141414] flex flex-wrap items-center gap-3 text-xs font-mono">
        <div className="flex items-center gap-1.5 text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{passedCount} Passed</span>
        </div>

        <div className="flex items-center gap-1.5 text-rose-400">
          <XCircle className="w-3.5 h-3.5" />
          <span>{failedCount} Failed</span>
        </div>

        <div className="flex items-center gap-1.5 text-amber-400">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>{warnCount} Warning</span>
        </div>

        <div className="flex items-center gap-1.5 text-neutral-400">
          <MinusCircle className="w-3.5 h-3.5" />
          <span>{naCount} N/A</span>
        </div>

        {isScanning && (
          <div className="ml-auto text-[11px] text-neutral-500 flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#8B5CF6]" />
            <span>Max 120s budget</span>
          </div>
        )}
      </div>
    </div>
  );
};
