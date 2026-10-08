import React, { useState, useEffect } from 'react';
import { 
  X, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle2, 
  Copy, 
  Check, 
  Camera, 
  Terminal, 
  ShieldAlert, 
  FileCode,
  ArrowRight
} from 'lucide-react';
import { BugReport } from '../types';

interface FindingDrawerProps {
  finding: BugReport | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (id: string, newStatus: 'Open' | 'Investigating' | 'Resolved') => void;
  onViewScreenshot?: (url: string, testId: string, title: string) => void;
}

export const FindingDrawer: React.FC<FindingDrawerProps> = ({
  finding,
  isOpen,
  onClose,
  onStatusChange,
  onViewScreenshot
}) => {
  const [copied, setCopied] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<'Open' | 'Investigating' | 'Resolved'>(
    finding?.status || 'Open'
  );

  useEffect(() => {
    if (finding) {
      setCurrentStatus(finding.status);
    }
  }, [finding]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !finding) return null;

  const handleCopySummary = () => {
    const text = `[${finding.id}] ${finding.title}\nSeverity: ${finding.severity}\nURL: ${finding.websiteUrl}\nTest: ${finding.testId} - ${finding.testName || ''}\n\nProblem:\n${finding.problem || finding.description}\n\nEvidence:\n${(finding.evidence || []).join('\n')}\n\nFix:\n${finding.fix_suggestion || finding.suggestedFix || 'Inspect element'}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const severityBadgeClass = 
    finding.severity === 'Critical' || finding.severity === 'High'
      ? 'bg-red-500/10 text-red-400 border-red-500/20'
      : finding.severity === 'Medium'
      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      : 'bg-zinc-800 text-zinc-300 border-zinc-700/50';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-4 sm:pl-10">
        <div className="w-screen max-w-xl bg-[#0F0F10] border-l border-[#1E1E26] flex flex-col shadow-2xl select-text">
          
          {/* Header */}
          <div className="h-16 px-6 border-b border-[#1E1E26] flex items-center justify-between bg-[#0A0A0A] shrink-0">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-semibold text-[#A1A1AA] bg-[#151515] px-2.5 py-1 rounded-[6px] border border-[#1E1E26]">
                {finding.id}
              </span>
              <span className={`text-[11px] font-mono font-semibold uppercase px-2 py-0.5 rounded-[4px] border ${severityBadgeClass}`}>
                {finding.severity}
              </span>
              <span className="text-xs font-mono text-[#71717A]">
                {finding.testId}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopySummary}
                className="p-1.5 text-[#A1A1AA] hover:text-[#F5F5F5] rounded-[6px] hover:bg-[#151515] transition-colors"
                title="Copy finding details"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-[#A1A1AA] hover:text-[#F5F5F5] rounded-[6px] hover:bg-[#151515] transition-colors"
                aria-label="Close drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Title & Target */}
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-[#F5F5F5] leading-snug tracking-tight">
                {finding.title}
              </h2>
              <div className="flex items-center gap-2 text-xs font-mono text-[#A1A1AA]">
                <span className="text-[#71717A]">Target:</span>
                <a 
                  href={finding.websiteUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="hover:text-[#F5F5F5] underline underline-offset-2 truncate max-w-sm"
                >
                  {finding.websiteUrl}
                </a>
              </div>
            </div>

            {/* Status Selector */}
            <div className="p-3.5 rounded-[10px] bg-[#121212] border border-[#1E1E26] flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-xs font-medium text-[#F5F5F5]">Triage Status</div>
                <div className="text-[11px] text-[#71717A]">Update resolution state</div>
              </div>
              <select
                value={currentStatus}
                onChange={(e) => {
                  const val = e.target.value as 'Open' | 'Investigating' | 'Resolved';
                  setCurrentStatus(val);
                  if (onStatusChange) onStatusChange(finding.id, val);
                }}
                className="bg-[#151515] border border-[#1E1E26] text-[#F5F5F5] text-xs rounded-[6px] px-3 py-1.5 font-mono focus:outline-none focus:border-[#7C3AED]"
              >
                <option value="Open">OPEN</option>
                <option value="Investigating">INVESTIGATING</option>
                <option value="Resolved">RESOLVED</option>
              </select>
            </div>

            {/* Expected vs Actual */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-[10px] bg-[#121212] border border-[#1E1E26] space-y-1">
                <div className="text-[11px] font-mono uppercase tracking-wider text-[#71717A] font-semibold">
                  Expected
                </div>
                <div className="text-xs text-[#A1A1AA] leading-relaxed">
                  {finding.expected_result || 'Expected test assertions to pass cleanly.'}
                </div>
              </div>

              <div className="p-3.5 rounded-[10px] bg-[#121212] border border-[#1E1E26] space-y-1">
                <div className="text-[11px] font-mono uppercase tracking-wider text-red-400 font-semibold">
                  Actual
                </div>
                <div className="text-xs text-[#F5F5F5] leading-relaxed">
                  {finding.actual_result || finding.problem || 'Assertion violation or runtime error.'}
                </div>
              </div>
            </div>

            {/* Verified Evidence */}
            {finding.evidence && finding.evidence.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-mono uppercase tracking-wider text-[#A1A1AA] font-semibold">
                  Captured Evidence
                </div>
                <div className="p-3 rounded-[10px] bg-[#0A0A0A] border border-[#1E1E26] font-mono text-[11px] text-[#A1A1AA] space-y-1 max-h-48 overflow-y-auto">
                  {finding.evidence.map((line, i) => (
                    <div key={i} className="leading-relaxed whitespace-pre-wrap break-all text-zinc-300">
                      • {line}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Raw Error Log if present */}
            {finding.error && (
              <div className="space-y-2">
                <div className="text-xs font-mono uppercase tracking-wider text-red-400 font-semibold">
                  Console / Stack Trace
                </div>
                <pre className="p-3 rounded-[10px] bg-[#0A0A0A] border border-red-500/20 text-red-300 font-mono text-[11px] overflow-x-auto leading-relaxed max-h-40">
                  {finding.error}
                </pre>
              </div>
            )}

            {/* Suggested Fix */}
            {(finding.fix_suggestion || finding.suggestedFix || finding.aiAnalysis?.suggestedFix) && (
              <div className="p-4 rounded-[10px] bg-[#121212] border border-[#1E1E26] space-y-2">
                <div className="text-xs font-medium text-[#F5F5F5] flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-[#7C3AED]" />
                  <span>Suggested Fix</span>
                </div>
                <p className="text-xs text-[#A1A1AA] leading-relaxed">
                  {finding.fix_suggestion || finding.suggestedFix || finding.aiAnalysis?.suggestedFix}
                </p>
              </div>
            )}

            {/* Reproduction Steps */}
            {finding.steps_to_reproduce && finding.steps_to_reproduce.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-mono uppercase tracking-wider text-[#A1A1AA] font-semibold">
                  Reproduction Steps
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-xs text-[#A1A1AA] font-mono bg-[#121212] p-3.5 rounded-[10px] border border-[#1E1E26]">
                  {finding.steps_to_reproduce.map((step, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Failure Screenshot Button */}
            {finding.screenshotUrl && onViewScreenshot && (
              <div className="pt-2">
                <button
                  onClick={() => onViewScreenshot(finding.screenshotUrl!, finding.testId, finding.title)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-[8px] bg-[#121212] hover:bg-[#151515] border border-[#1E1E26] text-xs font-mono text-[#F5F5F5] transition-colors cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-[#7C3AED]" />
                  <span>View Verified Failure Screenshot</span>
                </button>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="h-14 px-6 border-t border-[#1E1E26] bg-[#0A0A0A] flex items-center justify-between text-xs font-mono text-[#71717A] shrink-0">
            <span>Date: {new Date(finding.date).toLocaleDateString()}</span>
            <span>Deterministic Playwright Engine</span>
          </div>

        </div>
      </div>
    </div>
  );
};
