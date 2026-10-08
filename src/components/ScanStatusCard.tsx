import React from 'react';
import { Loader2, ArrowRight, ShieldCheck, AlertTriangle, CheckCircle2, RotateCcw } from 'lucide-react';
import { TestRun } from '../types';

interface ScanStatusCardProps {
  activeRun: TestRun | null;
  isScanning: boolean;
  onStartScan: () => void;
  onViewFullAudit: () => void;
  targetUrl: string;
}

export const ScanStatusCard: React.FC<ScanStatusCardProps> = ({
  activeRun,
  isScanning,
  onStartScan,
  onViewFullAudit,
  targetUrl,
}) => {
  // Determine subtext
  const currentTest = activeRun?.currentTestId
    ? `${activeRun.currentTestId}: ${activeRun.currentTestName || 'Execution'}`
    : 'TEST-09: Navigation';
  const subtext = isScanning
    ? `${currentTest} • Max budget: 120s`
    : activeRun
      ? `${activeRun.url || targetUrl} • 16 Tests Evaluated`
      : 'TEST-09: Navigation • Max budget: 120s';

  // Determine score and status badge
  const score = activeRun?.overall_score ?? null;
  const healthStatus = activeRun?.healthStatus ?? (isScanning ? 'SCANNING' : 'STANDBY');

  const getHealthBadgeColor = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return 'text-emerald-400 bg-emerald-950/30 border-emerald-800/40';
      case 'GOOD':
        return 'text-emerald-300 bg-emerald-950/20 border-emerald-800/30';
      case 'NEEDS ATTENTION':
        return 'text-amber-400 bg-amber-950/30 border-amber-800/40';
      case 'CRITICAL':
        return 'text-rose-400 bg-rose-950/30 border-rose-800/40';
      default:
        return 'text-[#8B5CF6] bg-[#8B5CF6]/10 border-[#8B5CF6]/20';
    }
  };

  return (
    <div className="w-full bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-xl relative overflow-hidden transition-all hover:border-neutral-800">
      {/* Top Header Row */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#8B5CF6] shadow-[0_0_8px_#8B5CF6]" />
          <span className="text-xs font-mono font-medium tracking-wider text-neutral-400 uppercase">
            Site Health
          </span>
        </div>

        <button
          onClick={onViewFullAudit}
          className="text-xs font-mono text-[#8B5CF6] hover:text-[#7C3AED] transition-colors flex items-center gap-1 group cursor-pointer focus:outline-none"
        >
          <span>View Full Audit</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Main Status / Score Display */}
      <div className="my-4">
        {isScanning ? (
          <div className="flex items-center gap-4">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white font-mono flex items-center gap-3">
              SCANNING
              <Loader2 className="w-7 h-7 sm:w-9 sm:h-9 text-[#8B5CF6] animate-spin" />
            </h2>
          </div>
        ) : activeRun ? (
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-3">
            <div className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white font-mono">
              {score !== null ? `${score} / 100` : 'COMPLETED'}
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-mono font-semibold border ${getHealthBadgeColor(healthStatus)}`}>
                {healthStatus}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-3">
            <div className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-neutral-400 font-mono">
              READY TO AUDIT
            </div>
          </div>
        )}

        {/* Technical Subtext */}
        <p className="text-xs font-mono text-neutral-500 mt-3 truncate">
          {subtext}
        </p>
      </div>

      {/* Bottom Main Action Button */}
      <div className="mt-6 pt-4 border-t border-[#141414]">
        {isScanning ? (
          <button
            disabled
            className="w-full py-4 rounded-2xl bg-[#8B5CF6]/80 text-white font-semibold text-sm tracking-wide font-mono flex items-center justify-center gap-2 cursor-not-allowed shadow-[0_0_25px_rgba(139,92,246,0.25)]"
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>SCANNING...</span>
          </button>
        ) : activeRun ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={onViewFullAudit}
              className="w-full py-3.5 rounded-2xl bg-[#121212] hover:bg-[#181818] border border-[#1A1A1A] hover:border-neutral-700 text-white font-semibold text-xs tracking-wide font-mono flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-[#8B5CF6]" />
              <span>VIEW FULL AUDIT</span>
            </button>
            <button
              onClick={onStartScan}
              className="w-full py-3.5 rounded-2xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-semibold text-xs tracking-wide font-mono flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] active:scale-[0.99] cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>SCAN AGAIN</span>
            </button>
          </div>
        ) : (
          <button
            onClick={onStartScan}
            className="w-full py-4 rounded-2xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-semibold text-sm tracking-wide font-mono flex items-center justify-center gap-2 transition-all shadow-[0_0_25px_rgba(139,92,246,0.3)] hover:shadow-[0_0_35px_rgba(139,92,246,0.5)] active:scale-[0.99] cursor-pointer"
          >
            <span>START PLAYWRIGHT AUDIT</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
