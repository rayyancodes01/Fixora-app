import React, { useState, useEffect } from 'react';
import { TestRun } from '../types';
import { api } from '../services/api';
import {
  History,
  Trash2,
  FileCheck,
  Play,
  ArrowRight,
  RefreshCw,
  Clock,
  ExternalLink
} from 'lucide-react';

interface TestHistoryProps {
  onOpenReport: (runId: string) => void;
  onNavigateToRunner: (url?: string) => void;
}

export const TestHistory: React.FC<TestHistoryProps> = ({
  onOpenReport,
  onNavigateToRunner
}) => {
  const [runs, setRuns] = useState<TestRun[]>([]);
  const [loading, setLoading] = useState(false);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await api.getHistory();
      setRuns(data);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this scan record?')) return;
    try {
      await api.deleteRun(id);
      setRuns(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error('Failed to delete run:', err);
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 select-text">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E1E26] pb-5">
        <div>
          <h1 className="text-xl font-bold text-[#F5F5F5] tracking-tight flex items-center gap-2.5">
            <History className="w-5 h-5 text-[#7C3AED]" />
            <span>Scan History</span>
          </h1>
          <p className="text-xs text-[#71717A] mt-1 font-mono">
            Persistent execution audit trail of deterministic Playwright testing sessions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadHistory}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#121212] hover:bg-[#151515] text-[#A1A1AA] hover:text-[#F5F5F5] border border-[#1E1E26] text-xs font-mono transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => onNavigateToRunner()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-[8px] bg-[#7C3AED] hover:bg-[#8B5CF6] text-white text-xs font-semibold font-mono transition-colors cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>New Scan</span>
          </button>
        </div>
      </div>

      {runs.length === 0 ? (
        <div className="rounded-[12px] border border-[#1E1E26] bg-[#0F0F10] p-12 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-[#151515] mx-auto flex items-center justify-center text-[#71717A]">
            <Clock className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-semibold text-[#F5F5F5]">No scans yet</h4>
          <p className="text-xs text-[#71717A] max-w-sm mx-auto">
            Run your first website audit to see its health score, telemetry, and verified findings.
          </p>
          <div className="pt-2">
            <button
              onClick={() => onNavigateToRunner()}
              className="px-4 py-2 bg-[#7C3AED] hover:bg-[#8B5CF6] text-white rounded-[8px] text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span>RUN FIRST SCAN</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-[12px] bg-[#0F0F10] border border-[#1E1E26] overflow-hidden shadow-sm">
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
                  <th className="py-3 px-5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#18181B] text-xs">
                {runs.map((run) => (
                  <tr
                    key={run.id}
                    onClick={() => onOpenReport(run.id)}
                    className="h-16 hover:bg-[#141414] transition-colors cursor-pointer group"
                  >
                    {/* URL */}
                    <td className="py-3 px-5 whitespace-nowrap font-mono text-[#F5F5F5]">
                      <span className="truncate max-w-[260px] block font-medium">
                        {run.url.replace(/^https?:\/\//, '')}
                      </span>
                      <span className="text-[10px] text-[#71717A] block font-mono">
                        {run.id}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-5 whitespace-nowrap font-mono text-[#71717A] text-xs">
                      {new Date(run.createdAt).toLocaleString()}
                    </td>

                    {/* Score */}
                    <td className="py-3 px-5 whitespace-nowrap font-mono font-semibold text-[#F5F5F5]">
                      {run.overall_score}/100
                    </td>

                    {/* Bugs */}
                    <td className="py-3 px-5 whitespace-nowrap font-mono">
                      <span className={run.bugsCount > 0 ? 'text-amber-400 font-semibold' : 'text-[#71717A]'}>
                        {run.bugsCount} {run.bugsCount === 1 ? 'bug' : 'bugs'}
                      </span>
                    </td>

                    {/* Duration */}
                    <td className="py-3 px-5 whitespace-nowrap font-mono text-[#71717A]">
                      {run.executionTimeMs ? `${Math.round(run.executionTimeMs / 1000)}s` : '18s'}
                    </td>

                    {/* Status */}
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

                    {/* Actions */}
                    <td className="py-3 px-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onOpenReport(run.id)}
                          className="px-2.5 py-1 rounded-[6px] bg-[#151515] hover:bg-[#1e1e26] text-[#F5F5F5] border border-[#1E1E26] text-xs font-mono transition-colors"
                          title="View findings & report"
                        >
                          View
                        </button>
                        <button
                          onClick={() => onNavigateToRunner(run.url)}
                          className="px-2.5 py-1 rounded-[6px] bg-[#151515] hover:bg-[#1e1e26] text-emerald-400 border border-[#1E1E26] text-xs font-mono transition-colors"
                          title="Re-run scan"
                        >
                          Re-run
                        </button>
                        <button
                          onClick={(e) => handleDelete(run.id, e)}
                          className="p-1 rounded-[6px] hover:bg-red-500/10 text-[#71717A] hover:text-red-400 transition-colors"
                          title="Delete scan record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
  );
};
