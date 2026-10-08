import React from 'react';
import { Bug, Menu } from 'lucide-react';
import { TestRun } from '../types';

interface HeaderProps {
  currentTab?: string;
  activeRun: TestRun | null;
  onNavigate?: (tab: string) => void;
  onOpenCommandPalette?: () => void;
  onToggleMobileMenu?: () => void;
  isScanning?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeRun,
  onNavigate,
  onToggleMobileMenu,
  isScanning = false,
}) => {
  // Determine active check or default to TEST-09: Navigation
  const activePillLabel = activeRun && (isScanning || activeRun.status === 'running')
    ? (activeRun.currentTestId ? `${activeRun.currentTestId}: ${activeRun.currentTestName || 'Running'}` : 'TEST-09: Navigation')
    : 'TEST-09: Navigation';

  return (
    <header className="h-14 w-full bg-[#000000] border-b border-[#1A1A1A] px-4 sm:px-6 flex items-center justify-between select-none relative z-30">
      {/* LEFT: BugScout Logo + Bug Icon + Small Purple Status Dot */}
      <div 
        onClick={() => onNavigate && onNavigate('dashboard')}
        className="flex items-center gap-2.5 cursor-pointer group"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && onNavigate) onNavigate('dashboard'); }}
        aria-label="BugScout Home"
      >
        <div className="w-7 h-7 rounded-lg bg-[#0A0A0A] border border-[#1A1A1A] flex items-center justify-center text-[#8B5CF6] group-hover:border-[#8B5CF6]/50 transition-colors">
          <Bug className="w-4 h-4" />
        </div>

        <div className="flex items-center gap-1.5 font-sans font-semibold text-sm tracking-tight text-white">
          <span>BugScout</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] shadow-[0_0_8px_#8B5CF6]" />
        </div>
      </div>

      {/* CENTER: Pill: TEST-09: Navigation with Purple Dot (Hidden on small mobile to prevent overflow) */}
      <div className="hidden sm:flex items-center justify-center">
        <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#0A0A0A] border border-[#1A1A1A] text-xs font-mono text-neutral-300 shadow-sm transition-all hover:border-neutral-800">
          <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] shadow-[0_0_6px_#8B5CF6] animate-pulse" />
          <span className="truncate max-w-[200px] md:max-w-none">{activePillLabel}</span>
        </div>
      </div>

      {/* RIGHT: RA Circular Avatar */}
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-[#0A0A0A] border border-[#1A1A1A] transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        <div 
          className="w-7 h-7 rounded-full bg-[#0A0A0A] border border-[#1A1A1A] flex items-center justify-center text-[11px] font-mono font-medium text-neutral-300 hover:border-[#8B5CF6]/60 hover:text-white transition-all cursor-default select-none shadow-sm"
          title="QA Engineer Profile (RA)"
          aria-label="User Avatar RA"
        >
          RA
        </div>
      </div>
    </header>
  );
};
