import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Play, 
  LayoutDashboard, 
  FileText, 
  History, 
  Settings, 
  ArrowRight, 
  X,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Bug
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
  onStartScan: (url: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onStartScan
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isUrl = query.trim().startsWith('http://') || 
                query.trim().startsWith('https://') || 
                query.trim().includes('.') && !query.trim().includes(' ');

  const actions = [
    ...(isUrl ? [
      {
        id: 'scan-url',
        label: `Scan URL: ${query.trim()}`,
        category: 'Actions',
        icon: Play,
        run: () => {
          let u = query.trim();
          if (!u.startsWith('http://') && !u.startsWith('https://')) {
            u = 'https://' + u;
          }
          onStartScan(u);
          onClose();
        }
      }
    ] : []),
    {
      id: 'nav-dashboard',
      label: 'Go to Dashboard',
      category: 'Navigation',
      icon: LayoutDashboard,
      run: () => { onNavigate('dashboard'); onClose(); }
    },
    {
      id: 'nav-findings',
      label: 'View Findings & Bug Reports',
      category: 'Navigation',
      icon: Bug,
      run: () => { onNavigate('bug-reports'); onClose(); }
    },
    {
      id: 'nav-scans',
      label: 'View Scan History',
      category: 'Navigation',
      icon: History,
      run: () => { onNavigate('test-history'); onClose(); }
    },
    {
      id: 'nav-runner',
      label: 'Open Real QA Runner',
      category: 'Navigation',
      icon: Play,
      run: () => { onNavigate('test-website'); onClose(); }
    },
    {
      id: 'nav-settings',
      label: 'Open Platform Settings',
      category: 'Navigation',
      icon: Settings,
      run: () => { onNavigate('settings'); onClose(); }
    }
  ].filter(action => {
    if (!query) return true;
    return action.label.toLowerCase().includes(query.toLowerCase());
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, actions.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + actions.length) % Math.max(1, actions.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (actions[selectedIndex]) {
        actions[selectedIndex].run();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-start justify-center pt-20 sm:pt-28 px-4 select-none">
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-xl bg-[#0F0F10] border border-[#1E1E26] rounded-[12px] shadow-2xl overflow-hidden z-10 flex flex-col">
        {/* Search input header */}
        <div className="flex items-center px-4 border-b border-[#1E1E26] bg-[#0A0A0A]">
          <Search className="w-4 h-4 text-[#71717A] mr-3 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            autoFocus
            placeholder="Type a command or URL to scan..."
            className="w-full h-12 bg-transparent text-sm text-[#F5F5F5] placeholder-[#71717A] font-sans focus:outline-none"
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono text-[#71717A] bg-[#151515] border border-[#1E1E26]">
            ESC
          </kbd>
        </div>

        {/* Options list */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {actions.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#71717A] font-mono">
              No matching commands or pages found
            </div>
          ) : (
            actions.map((act, index) => {
              const Icon = act.icon;
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={act.id}
                  onClick={act.run}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-[8px] cursor-pointer text-xs transition-colors ${
                    isSelected ? 'bg-[#151515] text-[#F5F5F5]' : 'text-[#A1A1AA] hover:bg-[#121212]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-[#7C3AED]' : 'text-[#71717A]'}`} />
                    <span className="font-medium">{act.label}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#71717A] uppercase">
                    {act.category}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-[#1E1E26] bg-[#0A0A0A] flex items-center justify-between text-[11px] font-mono text-[#71717A]">
          <div className="flex items-center gap-3">
            <span>↑↓ to navigate</span>
            <span>↵ to select</span>
          </div>
          <span>BugScout Command Bar</span>
        </div>
      </div>
    </div>
  );
};
