import React, { useState, useEffect } from 'react';
import { TestCase, TestRun, TestCategory, Priority } from '../types';
import { api } from '../services/api';
import { Badge } from '../components/Badge';
import {
  Sparkles,
  Filter,
  CheckSquare,
  Globe,
  Tag,
  ArrowRight,
  Search,
  Code
} from 'lucide-react';

interface TestCasesProps {
  activeRun: TestRun | null;
  onNavigateToRunner: (url?: string) => void;
}

export const TestCases: React.FC<TestCasesProps> = ({ activeRun, onNavigateToRunner }) => {
  const [runs, setRuns] = useState<TestRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string>(activeRun?.id || '');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const list = await api.getHistory();
        setRuns(list);
        if (!selectedRunId && list.length > 0) {
          setSelectedRunId(list[0].id);
        }
      } catch (err) {
        console.error('Failed to load runs history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  useEffect(() => {
    if (activeRun?.id) {
      setSelectedRunId(activeRun.id);
    }
  }, [activeRun?.id]);

  const currentRun = activeRun?.id === selectedRunId ? activeRun : runs.find(r => r.id === selectedRunId);
  const testCases: TestCase[] = currentRun?.testCases || [];

  const filteredCases = testCases.filter(tc => {
    if (categoryFilter !== 'ALL' && tc.category !== categoryFilter) return false;
    if (priorityFilter !== 'ALL' && tc.priority !== priorityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleText = (tc.title || tc.name || '').toLowerCase();
      const descText = (tc.description || tc.steps?.join(' ') || '').toLowerCase();
      return (
        tc.id.toLowerCase().includes(q) ||
        titleText.includes(q) ||
        descText.includes(q) ||
        (tc.targetSelector && tc.targetSelector.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <CheckSquare className="w-5 h-5 text-[#8B5CF6]" />
            <span>Deterministic Test Suite Specifications</span>
          </h2>
          <p className="text-xs text-[#A1A1AA] mt-1 font-mono">
            Fixed 16-test deterministic Playwright assertions and condition checks (TEST-01 → TEST-16)
          </p>
        </div>

        {/* Run Selector Dropdown */}
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-[#A1A1AA] shrink-0" />
          <select
            value={selectedRunId}
            onChange={(e) => setSelectedRunId(e.target.value)}
            className="bg-[#0F0F14] border border-white/[0.08] text-zinc-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#8B5CF6] font-mono"
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

      {/* Target details snippet */}
      {currentRun && (
        <div className="rounded-xl border border-white/[0.06] bg-[#0F0F14] p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-[#A1A1AA] font-mono">Target:</span>
            <span className="font-mono text-xs text-[#06B6D4] font-bold">{currentRun.url}</span>
            {currentRun.pageMetadata?.title && (
              <span className="text-xs text-[#A1A1AA] truncate max-w-xs font-mono">
                ("{currentRun.pageMetadata.title}")
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-[#A1A1AA] font-mono">
            <span>Executed: {new Date(currentRun.createdAt).toLocaleString()}</span>
            <span>•</span>
            <span className="text-[#8B5CF6] font-bold">{testCases.length} Test Cases</span>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0F0F14] p-3.5 rounded-xl border border-white/[0.06]">
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          <Filter className="w-4 h-4 text-[#A1A1AA] mr-1" />

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#12121A] border border-white/[0.08] text-zinc-200 text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-[#8B5CF6]"
          >
            <option value="ALL">All Categories</option>
            <option value="Core Load">Core Load</option>
            <option value="Diagnostics">Diagnostics</option>
            <option value="Assets">Assets</option>
            <option value="Links">Links</option>
            <option value="Interactive">Interactive</option>
            <option value="Forms">Forms</option>
            <option value="Navigation">Navigation</option>
            <option value="Responsive">Responsive</option>
            <option value="Stability">Stability</option>
            <option value="Network">Network</option>
            <option value="Content">Content</option>
            <option value="Accessibility">Accessibility</option>
            <option value="SEO">SEO</option>
            <option value="Performance">Performance</option>
            <option value="Security">Security</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-[#12121A] border border-white/[0.08] text-zinc-200 text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-[#8B5CF6]"
          >
            <option value="ALL">All Priorities</option>
            <option value="P0">P0 (Critical)</option>
            <option value="P1">P1 (High)</option>
            <option value="P2">P2 (Medium)</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#A1A1AA] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search test specifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#12121A] border border-white/[0.08] text-zinc-200 text-xs font-mono placeholder-zinc-500 focus:outline-none focus:border-[#8B5CF6]"
          />
        </div>
      </div>


      {/* Test Cases Cards List */}
      {filteredCases.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-zinc-800 mx-auto flex items-center justify-center text-zinc-400">
            <CheckSquare className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-white">No test cases found</h4>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            {testCases.length === 0
              ? 'Run an automated website test to trigger Gemini AI test case generation.'
              : 'No test cases matched your selected filters.'}
          </p>
          {testCases.length === 0 && (
            <button
              onClick={() => onNavigateToRunner()}
              className="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-2 transition-colors"
            >
              <span>Go to Test Website Runner</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCases.map((tc) => (
            <div
              key={tc.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5 space-y-4 hover:border-zinc-700 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {tc.id}
                    </span>
                    <Badge priority={tc.priority} size="sm" />
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                    {tc.category}
                  </span>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    {tc.title || tc.name}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    {tc.description || (tc.steps && tc.steps[0]) || ''}
                  </p>
                </div>

                {/* Target details */}
                {tc.targetSelector && (
                  <div className="flex items-center gap-2 text-xs font-mono bg-zinc-950 p-2 rounded border border-zinc-800/80 overflow-x-auto">
                    <Code className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="text-zinc-400 text-[11px]">Selector:</span>
                    <span className="text-cyan-300 text-[11px]">{tc.targetSelector}</span>
                  </div>
                )}
                {tc.targetUrl && (
                  <div className="flex items-center gap-2 text-xs font-mono bg-zinc-950 p-2 rounded border border-zinc-800/80 overflow-x-auto">
                    <Globe className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="text-zinc-400 text-[11px]">Target:</span>
                    <span className="text-indigo-300 text-[11px]">{tc.targetUrl}</span>
                  </div>
                )}

                {/* Required Action & Expected Result */}
                <div className="space-y-2 pt-1 text-xs">
                  <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                      Execution Steps
                    </span>
                    <div className="text-zinc-300 font-mono text-[11px] space-y-0.5">
                      {tc.steps && tc.steps.length > 0 
                        ? tc.steps.map((st, i) => <div key={i}>{st}</div>)
                        : <div>{tc.requiredAction || 'Verify element state in DOM'}</div>}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                      Expected Result
                    </span>
                    <span className="text-zinc-300 font-mono text-[11px]">
                      {tc.expected_result || tc.expectedResult}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
                <span className="flex items-center gap-1 text-indigo-400">
                  <Sparkles className="w-3 h-3" /> Gemini 3.8 Flash Spec
                </span>
                <span className="font-mono text-zinc-400">Type: {tc.testType}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
