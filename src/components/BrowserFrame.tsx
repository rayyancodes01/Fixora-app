import React from 'react';
import { Lock, Shield, Sparkles } from 'lucide-react';

interface BrowserFrameProps {
  browserReady?: boolean;
}

export const BrowserFrame: React.FC<BrowserFrameProps> = ({ browserReady = true }) => {
  return (
    <div className="w-full bg-[#0A0A0A] border-b border-[#1A1A1A] py-2 px-4 flex items-center justify-between text-xs select-none">
      {/* Window Controls (Left) */}
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-[#222222] border border-[#2A2A2A] transition-colors hover:bg-red-500/80 cursor-default" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#222222] border border-[#2A2A2A] transition-colors hover:bg-yellow-500/80 cursor-default" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#222222] border border-[#2A2A2A] transition-colors hover:bg-green-500/80 cursor-default" />
      </div>

      {/* Center Address Pill */}
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-1.5 px-4 py-1 rounded-full bg-[#000000] border border-[#1A1A1A] text-neutral-400 font-mono text-[11px] shadow-inner transition-colors hover:border-[#2A2A2A]">
          <Lock className="w-3 h-3 text-[#8B5CF6]" />
          <span className="text-neutral-300 font-medium">website-tester.ai.studio</span>
        </div>
      </div>

      {/* Engine Status (Right) */}
      <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-500">
        <span className="hidden sm:inline">Playwright v1243</span>
        <div className="flex items-center gap-1">
          <div className={`w-1.5 h-1.5 rounded-full ${browserReady ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' : 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]'}`} />
          <span className="text-neutral-400">{browserReady ? 'Active' : 'Standby'}</span>
        </div>
      </div>
    </div>
  );
};
