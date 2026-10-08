import React from 'react';
import {
  LayoutDashboard,
  Play,
  FileText,
  Bug,
  History,
  Settings,
  ShieldCheck,
  Send
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  openBugsCount?: number;
  activeRunRunning?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  openBugsCount = 0,
  activeRunRunning = false
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'test-website', label: 'QA Runner', icon: Play, highlight: activeRunRunning },
    { id: 'bug-reports', label: 'Findings', icon: Bug, count: openBugsCount },
    { id: 'test-history', label: 'Scans', icon: History },
    { id: 'test-results', label: 'Test Logs', icon: FileText },
    { id: 'api-testing', label: 'API Testing', icon: Send },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-60 border-r border-[#1E1E26] bg-[#0A0A0A] flex flex-col justify-between select-none shrink-0 h-screen sticky top-0 z-40">
      <div>
        {/* Brand header */}
        <div className="h-16 px-5 border-b border-[#1E1E26] flex items-center gap-3">
          <div className="flex items-center justify-center w-7 h-7 rounded-[8px] bg-[#121212] border border-[#1E1E26] text-[#7C3AED]">
            <Bug className="w-3.5 h-3.5 stroke-[2.2]" />
          </div>
          <div className="flex items-center gap-1.5 font-sans font-semibold text-sm tracking-tight text-[#F5F5F5]">
            <span>BugScout</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />
          </div>
        </div>

        {/* Navigation items */}
        <div className="p-3 space-y-1">
          <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-[#71717A] font-mono">
            Platform
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-[8px] text-[13px] font-medium transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-[#151515] text-[#F5F5F5]'
                    : 'text-[#A1A1AA] hover:text-[#F5F5F5] hover:bg-[#121212]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#7C3AED]' : 'text-[#71717A]'} ${item.highlight ? 'animate-pulse text-[#7C3AED]' : ''}`} />
                  <span>{item.label}</span>
                </div>

                {item.highlight && (
                  <span className="w-2 h-2 rounded-full bg-[#7C3AED] animate-ping" />
                )}

                {typeof item.count === 'number' && item.count > 0 && (
                  <span className="px-1.5 py-0.2 rounded-[4px] text-[10px] font-mono font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer status */}
      <div className="p-4 border-t border-[#1E1E26] bg-[#0A0A0A]">
        <div className="flex items-center gap-2 text-xs font-mono text-[#71717A]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Playwright 1.48 Ready</span>
        </div>
      </div>
    </aside>
  );
};
