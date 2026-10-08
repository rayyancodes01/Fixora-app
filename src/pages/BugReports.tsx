import React, { useState, useEffect } from 'react';
import { BugReport } from '../types';
import { api } from '../services/api';
import { FindingDrawer } from '../components/FindingDrawer';
import {
  Bug,
  Filter,
  Search,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

interface BugReportsProps {
  onViewScreenshot: (url: string, testId: string, title: string) => void;
  onNavigateToRunner: (url?: string) => void;
}

export const BugReports: React.FC<BugReportsProps> = ({
  onViewScreenshot,
  onNavigateToRunner
}) => {
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedBug, setSelectedBug] = useState<BugReport | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const loadBugs = async () => {
    try {
      setLoading(true);
      const data = await api.getBugs({
        severity: severityFilter,
        status: statusFilter,
        website: searchFilter
      });
      setBugs(data);
    } catch (err) {
      console.error('Failed to load bugs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBugs();
  }, [severityFilter, statusFilter]);

  const handleStatusChange = async (id: string, newStatus: 'Open' | 'Investigating' | 'Resolved') => {
    try {
      await api.updateBugStatus(id, newStatus);
      setBugs(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
      if (selectedBug && selectedBug.id === id) {
        setSelectedBug(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err) {
      console.error('Failed to update bug status:', err);
    }
  };

  const handleExportAll = () => {
    const json = JSON.stringify(bugs, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bugscout-findings-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const criticalCount = bugs.filter(b => b.severity === 'Critical').length;
  const highCount = bugs.filter(b => b.severity === 'High').length;
  const mediumCount = bugs.filter(b => b.severity === 'Medium').length;
  const openCount = bugs.filter(b => b.status === 'Open').length;

  const filteredBugs = bugs.filter(b => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return b.title.toLowerCase().includes(q) ||
           b.websiteUrl.toLowerCase().includes(q) ||
           b.id.toLowerCase().includes(q) ||
           b.testId.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 select-text">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E1E26] pb-5">
        <div>
          <h1 className="text-xl font-bold text-[#F5F5F5] tracking-tight flex items-center gap-2.5">
            <Bug className="w-5 h-5 text-[#7C3AED]" />
            <span>Verified Findings & Bug Reports</span>
          </h1>
          <p className="text-xs text-[#71717A] mt-1 font-mono">
            Evidence-backed assertion failures with captured stack traces and reproduction steps
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadBugs}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#121212] hover:bg-[#151515] text-[#A1A1AA] hover:text-[#F5F5F5] border border-[#1E1E26] text-xs font-mono transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          {bugs.length > 0 && (
            <button
              onClick={handleExportAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#121212] hover:bg-[#151515] text-[#A1A1AA] hover:text-[#F5F5F5] border border-[#1E1E26] text-xs font-mono transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-[12px] bg-[#121212] border border-[#1E1E26] p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#71717A] block">
              Total Findings
            </span>
            <span className="text-2xl font-bold font-mono text-[#F5F5F5] mt-1 block">
              {bugs.length}
            </span>
          </div>
          <span className="text-xs font-mono px-2 py-0.5 rounded-[4px] bg-[#151515] border border-[#1E1E26] text-[#A1A1AA]">
            {openCount} Open
          </span>
        </div>

        <div className="rounded-[12px] bg-[#121212] border border-[#1E1E26] p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-red-400 block">
              Critical
            </span>
            <span className="text-2xl font-bold font-mono text-red-400 mt-1 block">
              {criticalCount}
            </span>
          </div>
          <span className="text-xs font-mono px-2 py-0.5 rounded-[4px] bg-red-500/10 border border-red-500/20 text-red-400">
            P0
          </span>
        </div>

        <div className="rounded-[12px] bg-[#121212] border border-[#1E1E26] p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-red-400 block">
              High Severity
            </span>
            <span className="text-2xl font-bold font-mono text-red-400 mt-1 block">
              {highCount}
            </span>
          </div>
          <span className="text-xs font-mono px-2 py-0.5 rounded-[4px] bg-red-500/10 border border-red-500/20 text-red-400">
            P1
          </span>
        </div>

        <div className="rounded-[12px] bg-[#121212] border border-[#1E1E26] p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 block">
              Medium Severity
            </span>
            <span className="text-2xl font-bold font-mono text-amber-400 mt-1 block">
              {mediumCount}
            </span>
          </div>
          <span className="text-xs font-mono px-2 py-0.5 rounded-[4px] bg-amber-500/10 border border-amber-500/20 text-amber-400">
            P2
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0F0F10] p-3 rounded-[12px] border border-[#1E1E26] font-mono text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-[#71717A] mr-1" />

          {/* Severity filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-[#121212] border border-[#1E1E26] text-[#F5F5F5] text-xs rounded-[6px] px-2.5 py-1.5 outline-none focus:border-[#7C3AED]"
          >
            <option value="ALL">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#121212] border border-[#1E1E26] text-[#F5F5F5] text-xs rounded-[6px] px-2.5 py-1.5 outline-none focus:border-[#7C3AED]"
          >
            <option value="ALL">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Investigating">Investigating</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search findings..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-[6px] bg-[#121212] border border-[#1E1E26] text-[#F5F5F5] text-xs placeholder-[#71717A] focus:outline-none focus:border-[#7C3AED]"
          />
        </div>
      </div>

      {/* Findings Table */}
      {filteredBugs.length === 0 ? (
        <div className="rounded-[12px] border border-[#1E1E26] bg-[#0F0F10] p-12 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-semibold text-[#F5F5F5]">Zero findings reported</h4>
          <p className="text-xs text-[#71717A] max-w-sm mx-auto">
            Either all tests passed cleanly with no assertion violations, or no automated scans have run yet.
          </p>
          <div className="pt-2">
            <button
              onClick={() => onNavigateToRunner()}
              className="px-4 py-2 bg-[#7C3AED] hover:bg-[#8B5CF6] text-white rounded-[8px] text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span>Run Website Scan</span>
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
                  <th className="py-3 px-5 font-semibold">Severity</th>
                  <th className="py-3 px-5 font-semibold">Issue</th>
                  <th className="py-3 px-5 font-semibold">URL</th>
                  <th className="py-3 px-5 font-semibold">Status</th>
                  <th className="py-3 px-5 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#18181B] text-xs">
                {filteredBugs.map((bug) => (
                  <tr
                    key={bug.id}
                    onClick={() => {
                      setSelectedBug(bug);
                      setIsDrawerOpen(true);
                    }}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setSelectedBug(bug);
                        setIsDrawerOpen(true);
                      }
                    }}
                    className="h-16 hover:bg-[#141414] transition-colors cursor-pointer group focus:outline-none focus:bg-[#141414]"
                  >
                    {/* Severity */}
                    <td className="py-3 px-5 whitespace-nowrap">
                      <span className={`inline-block text-[10px] font-mono uppercase font-semibold px-2 py-0.5 rounded-[4px] border ${
                        bug.severity === 'Critical' || bug.severity === 'High'
                          ? 'bg-red-500/10 text-red-400 border-red-500/20'
                          : bug.severity === 'Medium'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-zinc-800 text-zinc-300 border-zinc-700/50'
                      }`}>
                        {bug.severity}
                      </span>
                    </td>

                    {/* Issue */}
                    <td className="py-3 px-5 min-w-[220px]">
                      <div className="font-medium text-[#F5F5F5] group-hover:text-white transition-colors truncate max-w-sm">
                        {bug.title}
                      </div>
                      <div className="text-[11px] font-mono text-[#71717A]">
                        {bug.id} • {bug.testId}
                      </div>
                    </td>

                    {/* URL */}
                    <td className="py-3 px-5 whitespace-nowrap font-mono text-[#A1A1AA] text-xs">
                      <span className="truncate max-w-[220px] block">
                        {bug.websiteUrl.replace(/^https?:\/\//, '')}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-5 whitespace-nowrap">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-[4px] bg-[#151515] border border-[#1E1E26] text-[#A1A1AA]">
                        {bug.status}
                      </span>
                    </td>

                    {/* Action */}
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
        </div>
      )}

      {/* Drawer */}
      <FindingDrawer
        finding={selectedBug}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onViewScreenshot={onViewScreenshot}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
};
