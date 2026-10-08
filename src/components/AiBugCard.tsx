import React, { useState } from 'react';
import { BugReport } from '../types';
import { Badge } from './Badge';
import { Sparkles, Copy, Check, ExternalLink, Image as ImageIcon, CheckCircle, AlertTriangle } from 'lucide-react';

interface AiBugCardProps {
  bug: BugReport;
  onStatusChange?: (id: string, newStatus: 'Open' | 'Investigating' | 'Resolved') => void;
  onViewScreenshot?: (url: string, testId: string, title: string) => void;
}

export const AiBugCard: React.FC<AiBugCardProps> = ({
  bug,
  onStatusChange,
  onViewScreenshot
}) => {
  const [copied, setCopied] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(bug.status);

  const handleCopyMarkdown = () => {
    const md = `### [${bug.id}] ${bug.title}
**Severity:** ${bug.severity} | **Status:** ${currentStatus}
**Website:** ${bug.websiteUrl}
**Discovered by:** ${bug.testId} (${bug.testName})

#### Description
${bug.description}

#### Error Stack / Trace
\`\`\`
${bug.error}
\`\`\`

#### AI Analysis (Gemini)
- **Possible Cause:** ${bug.aiAnalysis?.possibleCause || bug.root_cause || 'Under investigation'}
- **Suggested Fix:** ${bug.aiAnalysis?.suggestedFix || bug.fix_suggestion || 'Review element state'}

#### Reproduction Steps
${(bug.aiAnalysis?.reproductionSteps || bug.steps_to_reproduce || []).map((step, idx) => `${idx + 1}. ${step}`).join('\n')}
`;
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStatusSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value as 'Open' | 'Investigating' | 'Resolved';
    setCurrentStatus(next);
    if (onStatusChange) {
      onStatusChange(bug.id, next);
    }
  };

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0F0F14] overflow-hidden shadow-xl transition-all duration-200 hover:border-white/20">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-[#0A0A0E] border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-bold text-[#EF4444] bg-[#EF4444]/15 px-2.5 py-1 rounded border border-[#EF4444]/30 shadow-[0_0_8px_rgba(239,68,68,0.2)]">
            {bug.id}
          </span>
          <Badge severity={bug.severity} size="sm" />
          <span className="text-xs text-[#A1A1AA] font-mono hidden sm:inline">
            via {bug.testId}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Status selector */}
          <select
            value={currentStatus}
            onChange={handleStatusSelect}
            className={`text-xs font-semibold px-2.5 py-1 rounded border transition-colors outline-none cursor-pointer font-mono ${
              currentStatus === 'Resolved'
                ? 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30'
                : currentStatus === 'Investigating'
                ? 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30'
                : 'bg-[#12121A] text-zinc-300 border-white/[0.08]'
            }`}
          >
            <option value="Open" className="bg-[#12121A] text-zinc-200">Status: Open</option>
            <option value="Investigating" className="bg-[#12121A] text-amber-300">Status: Investigating</option>
            <option value="Resolved" className="bg-[#12121A] text-emerald-300">Status: Resolved</option>
          </select>

          <button
            onClick={handleCopyMarkdown}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#12121A] hover:bg-zinc-800 text-zinc-300 rounded text-xs transition-colors border border-white/[0.08] font-mono cursor-pointer"
            title="Copy as Markdown / Jira"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#22C55E]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Export'}</span>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        {/* Title & Target */}
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">
            {bug.title}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400">
            <span className="font-mono text-cyan-400">{bug.websiteUrl}</span>
            <span>•</span>
            <span>Discovered in: <strong className="text-zinc-300">{bug.testName}</strong></span>
          </div>
        </div>

        {/* Technical Description */}
        <p className="text-sm text-zinc-300 leading-relaxed">
          {bug.description}
        </p>

        {/* Error Trace */}
        {bug.error && (
          <div className="rounded-lg bg-zinc-950 border border-zinc-800 p-3 font-mono text-xs text-rose-300 overflow-x-auto">
            <div className="text-[10px] uppercase tracking-wider text-zinc-400 mb-1 font-sans font-semibold">
              Assertion Failure / Error:
            </div>
            <code>{bug.error}</code>
          </div>
        )}

        {/* AI Analysis Section */}
        <div className="rounded-xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/20 via-zinc-900 to-zinc-900 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-indigo-500/20 text-indigo-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold tracking-wide uppercase text-indigo-300">
                AI Analysis (Gemini 3.8 Flash)
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 italic">
              AI-generated diagnostics & suggestions
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="rounded-lg bg-zinc-950/50 border border-zinc-800/80 p-3">
              <span className="text-xs font-semibold text-amber-400 block mb-1 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Possible Root Cause
              </span>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {bug.aiAnalysis?.possibleCause || bug.root_cause || 'Root cause under investigation.'}
              </p>
            </div>

            <div className="rounded-lg bg-zinc-950/50 border border-zinc-800/80 p-3">
              <span className="text-xs font-semibold text-emerald-400 block mb-1 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" /> Suggested Developer Fix
              </span>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {bug.aiAnalysis?.suggestedFix || bug.fix_suggestion || 'Review element selector, network timing, and responsive state.'}
              </p>
            </div>
          </div>

          {/* Reproduction Steps */}
          {((bug.aiAnalysis?.reproductionSteps && bug.aiAnalysis.reproductionSteps.length > 0) || (bug.steps_to_reproduce && bug.steps_to_reproduce.length > 0)) && (
            <div className="rounded-lg bg-zinc-950/50 border border-zinc-800/80 p-3 mt-2">
              <span className="text-xs font-semibold text-zinc-300 block mb-1.5">
                Reproduction Steps:
              </span>
              <ol className="list-decimal list-inside space-y-1 text-xs text-zinc-400">
                {(bug.aiAnalysis?.reproductionSteps || bug.steps_to_reproduce || []).map((step, idx) => (
                  <li key={idx} className="leading-relaxed">
                    <span className="text-zinc-300">{step.replace(/^\d+[\.\)]\s*/, '')}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* Screenshot preview */}
        {bug.screenshotUrl && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-950/60 border border-zinc-800">
            <div className="flex items-center gap-2.5">
              <ImageIcon className="w-4 h-4 text-rose-400" />
              <span className="text-xs font-medium text-zinc-300">Failure Screenshot Available</span>
            </div>
            <button
              onClick={() => onViewScreenshot && onViewScreenshot(bug.screenshotUrl!, bug.testId || bug.id, bug.title)}
              className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              <span>View Screenshot</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-2.5 bg-zinc-950/40 border-t border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-between">
        <span>Recorded: {new Date(bug.date).toLocaleString()}</span>
        <span className="font-mono text-zinc-400">{bug.category} Test Suite</span>
      </div>
    </div>
  );
};
