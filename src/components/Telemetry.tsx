import React from 'react';
import { Shield, Zap, CheckCircle2, XCircle, AlertTriangle, MinusCircle, Clock, ExternalLink } from 'lucide-react';
import { TestRun, TestResult } from '../types';

interface TelemetryProps {
  activeRun: TestRun | null;
  onSelectTest?: (testId: string) => void;
}

const DETERMINISTIC_SUITE_DEFINITIONS = [
  { id: 'TEST-01', title: 'Homepage & HTTP Health', category: 'Core Load' },
  { id: 'TEST-02', title: 'Console & JavaScript Errors', category: 'Stability' },
  { id: 'TEST-03', title: 'Broken Images', category: 'Assets' },
  { id: 'TEST-04', title: 'Broken Internal Links', category: 'Navigation' },
  { id: 'TEST-05', title: 'Buttons & Interactive Elements', category: 'Interactive' },
  { id: 'TEST-06', title: 'Forms', category: 'Interactive' },
  { id: 'TEST-07', title: 'Navigation', category: 'Navigation' },
  { id: 'TEST-08', title: 'Network Failures', category: 'Network' },
  { id: 'TEST-09', title: 'Responsive Layout', category: 'Responsive' },
  { id: 'TEST-10', title: 'Accessibility Basics', category: 'Accessibility' },
  { id: 'TEST-11', title: 'SEO Basics', category: 'SEO' },
  { id: 'TEST-12', title: 'Page Content & Blank Screen', category: 'Content' },
  { id: 'TEST-13', title: 'Performance Basics', category: 'Performance' },
  { id: 'TEST-14', title: 'HTTPS / Mixed Content', category: 'Security' },
  { id: 'TEST-15', title: 'Theme / UI State', category: 'Interactive' },
  { id: 'TEST-16', title: 'Runtime Stability', category: 'Stability' },
];

export const Telemetry: React.FC<TelemetryProps> = ({ activeRun, onSelectTest }) => {
  // Results map by testId
  const resultsMap = new Map<string, TestResult>();
  if (activeRun?.results) {
    for (const r of activeRun.results) {
      resultsMap.set(r.testId, r);
    }
  }

  // Real Security Telemetry calculation from scan
  const securityTest = resultsMap.get('TEST-14');
  let securityTitle = 'Awaiting scan';
  let securitySub = 'No security telemetry recorded yet';
  let securityBadge = 'Neutral';
  let securityBadgeColor = 'text-neutral-500 bg-neutral-900 border-neutral-800';

  if (activeRun) {
    if (securityTest?.status === 'PASS') {
      securityTitle = 'Clean Assertion';
      securitySub = 'No critical security violations or mixed content';
      securityBadge = 'Passed';
      securityBadgeColor = 'text-emerald-400 bg-emerald-950/30 border-emerald-800/40';
    } else if (securityTest?.status === 'FAIL') {
      securityTitle = 'Security Issue';
      securitySub = securityTest.actualResult || 'Insecure HTTP or mixed content detected';
      securityBadge = 'Failed';
      securityBadgeColor = 'text-rose-400 bg-rose-950/30 border-rose-800/40';
    } else if (activeRun.status === 'running') {
      securityTitle = 'Evaluating';
      securitySub = 'Analyzing transport layer & headers';
      securityBadge = 'Scanning';
      securityBadgeColor = 'text-[#8B5CF6] bg-[#8B5CF6]/10 border-[#8B5CF6]/30';
    }
  }

  // Real Performance Telemetry calculation from scan
  const perfTest = resultsMap.get('TEST-13');
  let perfDuration = 'Awaiting scan';
  let perfSub = 'DOMContentLoaded timing not recorded';
  let perfBadge = 'Neutral';
  let perfBadgeColor = 'text-neutral-500 bg-neutral-900 border-neutral-800';

  if (activeRun) {
    if (perfTest) {
      const match = perfTest.actualResult?.match(/(\d+)ms/);
      if (match) {
        const ms = parseInt(match[1], 10);
        perfDuration = `${(ms / 1000).toFixed(2)}s`;
        perfSub = `DOMContentLoaded resolved in ${ms}ms`;
        perfBadge = ms < 1000 ? 'Good' : 'Needs Work';
        perfBadgeColor = ms < 1000
          ? 'text-emerald-400 bg-emerald-950/30 border-emerald-800/40'
          : 'text-amber-400 bg-amber-950/30 border-amber-800/40';
      } else {
        perfDuration = `${((perfTest.durationMs || 500) / 1000).toFixed(2)}s`;
        perfSub = perfTest.actualResult || 'Browser navigation timings captured';
        perfBadge = perfTest.status === 'PASS' ? 'Good' : 'Warning';
        perfBadgeColor = perfTest.status === 'PASS'
          ? 'text-emerald-400 bg-emerald-950/30 border-emerald-800/40'
          : 'text-amber-400 bg-amber-950/30 border-amber-800/40';
      }
    } else if (activeRun.status === 'running') {
      perfDuration = 'Measuring';
      perfSub = 'Measuring browser navigation metrics';
      perfBadge = 'Scanning';
      perfBadgeColor = 'text-[#8B5CF6] bg-[#8B5CF6]/10 border-[#8B5CF6]/30';
    }
  }

  const renderStatusBadge = (status?: string) => {
    switch (status) {
      case 'PASS':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold text-emerald-400 bg-emerald-950/30 border border-emerald-800/40 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            PASS
          </span>
        );
      case 'FAIL':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold text-rose-400 bg-rose-950/30 border border-rose-800/40 flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            FAIL
          </span>
        );
      case 'WARNING':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold text-amber-400 bg-amber-950/30 border border-amber-800/40 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            WARN
          </span>
        );
      case 'NOT_APPLICABLE':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium text-neutral-400 bg-neutral-900 border border-neutral-800 flex items-center gap-1">
            <MinusCircle className="w-3 h-3" />
            N/A
          </span>
        );
      case 'TIMEOUT':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium text-amber-500 bg-amber-950/30 border border-amber-800/40 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            TIMEOUT
          </span>
        );
      case 'RUNNING':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium text-[#8B5CF6] bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 animate-pulse">
            RUNNING
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium text-neutral-600 bg-[#121212] border border-[#1A1A1A]">
            STANDBY
          </span>
        );
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* 2 Top Telemetry Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* CARD 1: SECURITY */}
        <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between transition-all hover:border-neutral-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#121212] border border-[#1A1A1A] flex items-center justify-center text-[#8B5CF6]">
                <Shield className="w-4 h-4" />
              </div>
              <span className="text-xs font-mono font-semibold tracking-wider text-neutral-400 uppercase">
                Security
              </span>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold border ${securityBadgeColor}`}>
              {securityBadge}
            </span>
          </div>

          <div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
              {securityTitle}
            </div>
            <p className="text-xs font-mono text-neutral-500 mt-1 truncate">
              {securitySub}
            </p>
          </div>
        </div>

        {/* CARD 2: PERFORMANCE */}
        <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between transition-all hover:border-neutral-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#121212] border border-[#1A1A1A] flex items-center justify-center text-[#8B5CF6]">
                <Zap className="w-4 h-4" />
              </div>
              <span className="text-xs font-mono font-semibold tracking-wider text-neutral-400 uppercase">
                Performance
              </span>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold border ${perfBadgeColor}`}>
              {perfBadge}
            </span>
          </div>

          <div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
              {perfDuration}
            </div>
            <p className="text-xs font-mono text-neutral-500 mt-1 truncate">
              {perfSub}
            </p>
          </div>
        </div>
      </div>

      {/* 16 Deterministic Checks Grid / List */}
      <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#141414]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#8B5CF6] shadow-[0_0_8px_#8B5CF6]" />
            <h3 className="text-xs font-mono font-bold tracking-wider text-white uppercase">
              System Telemetry
            </h3>
          </div>
          <span className="text-xs font-mono text-neutral-500">
            16 Deterministic Checks
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {DETERMINISTIC_SUITE_DEFINITIONS.map((def) => {
            const result = resultsMap.get(def.id);
            const status = result?.status;
            const finding = result?.actualResult || result?.actual;

            return (
              <div
                key={def.id}
                onClick={() => onSelectTest && onSelectTest(def.id)}
                className={`p-3 rounded-xl bg-[#000000] border border-[#141414] hover:border-[#1F1F1F] transition-all flex items-center justify-between gap-3 ${
                  onSelectTest ? 'cursor-pointer hover:bg-[#070707]' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-mono font-bold text-neutral-400 shrink-0">
                    {def.id}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-neutral-200 truncate font-mono">
                      {def.title}
                    </div>
                    {finding && (
                      <div className="text-[11px] font-mono text-neutral-500 truncate max-w-[220px]">
                        {finding}
                      </div>
                    )}
                  </div>
                </div>

                <div className="shrink-0">
                  {renderStatusBadge(status)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
