import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { SystemSettings } from '../types';
import {
  Settings,
  Sparkles,
  Cpu,
  ShieldCheck,
  Camera,
  CheckCircle2,
  Lock,
  Globe,
  Monitor,
  RefreshCw,
  Play,
  Film
} from 'lucide-react';

interface PlatformSettingsProps {
  onReplayIntro?: () => void;
}

export const PlatformSettings: React.FC<PlatformSettingsProps> = ({ onReplayIntro }) => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [showIntroPref, setShowIntroPref] = useState<boolean>(() => {
    return localStorage.getItem('bugscout_show_intro') !== 'false';
  });

  const handleToggleIntro = (checked: boolean) => {
    setShowIntroPref(checked);
    localStorage.setItem('bugscout_show_intro', checked ? 'true' : 'false');
  };

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await api.getSettings();
      setSettings(data);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-5xl mx-auto font-sans text-[#F5F5F7]">
      {/* Header */}
      <div className="border-b border-white/[0.06] pb-5">
        <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <Settings className="w-5 h-5 text-[#8B5CF6]" />
          <span>Platform & Automation Engine Settings</span>
        </h2>
        <p className="text-xs text-[#A1A1AA] mt-1 font-mono">
          Engine configurations, AI model integration status, and security compliance rules
        </p>
      </div>

      <div className="space-y-6">
        {/* Cinematic Opening Experience */}
        <div className="rounded-xl border border-white/[0.08] bg-[#121212] p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-[#7C3AED]/15 text-[#7C3AED]">
                <Film className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Cinematic Opening Experience</h3>
                <p className="text-xs text-[#A1A1AA]">Video-style product introduction and brand reveal screen</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {onReplayIntro && (
                <button
                  onClick={onReplayIntro}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1E1E26] hover:bg-[#272733] text-white text-xs font-semibold tracking-tight transition-all border border-white/[0.08] hover:border-[#7C3AED]/40 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 text-[#7C3AED] fill-[#7C3AED]" />
                  <span>Replay Intro</span>
                </button>
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-[#0F0F10] border border-[#1E1E26] flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <span className="text-zinc-200 font-medium block">Show intro on startup</span>
              <span className="text-zinc-400 text-[11px] block">
                When enabled, the cinematic opening experience appears before entering the dashboard
              </span>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showIntroPref}
                onChange={(e) => handleToggleIntro(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#7C3AED]"></div>
            </label>
          </div>
        </div>
        {/* Gemini AI Configuration */}
        <div className="rounded-xl border border-white/[0.06] bg-[#0F0F14] p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-[#8B5CF6]/15 text-[#8B5CF6]">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Gemini AI Model Configuration</h3>
                <p className="text-xs text-[#A1A1AA]">Handles DOM-based test case generation and bug diagnosis</p>
              </div>
            </div>

            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20 font-mono">
              <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse"></span>
              {settings?.geminiConfigured ? 'Active & Configured' : 'Using Intelligent Fallback Engine'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs">
            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1">
              <span className="text-zinc-400 font-medium">Model Designation:</span>
              <div className="font-mono text-cyan-300 font-bold">gemini-3.8-flash</div>
            </div>

            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1">
              <span className="text-zinc-400 font-medium">API Key Storage:</span>
              <div className="font-mono text-zinc-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Protected in Server Environment Variables (No Client Exposure)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Playwright Browser Configuration */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Playwright Browser Automation</h3>
                <p className="text-xs text-zinc-400">Chromium browser engine parameters and sandbox flags</p>
              </div>
            </div>

            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Chromium Headless Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono">
            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
              <span className="text-zinc-400 text-[11px] block font-sans font-medium">Navigation Timeout</span>
              <span className="text-white font-bold text-sm">15,000 ms</span>
            </div>
            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
              <span className="text-zinc-400 text-[11px] block font-sans font-medium">Max Tests / Suite</span>
              <span className="text-white font-bold text-sm">6 - 12 tests</span>
            </div>
            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
              <span className="text-zinc-400 text-[11px] block font-sans font-medium">Concurrency</span>
              <span className="text-white font-bold text-sm">Isolated Contexts</span>
            </div>
          </div>

          {/* Viewports */}
          <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
            <span className="text-zinc-300 font-bold block flex items-center gap-2">
              <Monitor className="w-4 h-4 text-indigo-400" />
              Tested Responsive Viewports:
            </span>
            <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
              <div className="p-2 rounded bg-zinc-900 border border-zinc-800 text-center">
                <span className="text-zinc-400 block">Desktop</span>
                <span className="text-cyan-300 font-bold">1280 × 800</span>
              </div>
              <div className="p-2 rounded bg-zinc-900 border border-zinc-800 text-center">
                <span className="text-zinc-400 block">Tablet</span>
                <span className="text-cyan-300 font-bold">768 × 1024</span>
              </div>
              <div className="p-2 rounded bg-zinc-900 border border-zinc-800 text-center">
                <span className="text-zinc-400 block">Mobile</span>
                <span className="text-cyan-300 font-bold">375 × 667</span>
              </div>
            </div>
          </div>
        </div>

        {/* Screenshot Capture Settings */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Failure Screenshot Capture</h3>
              <p className="text-xs text-zinc-400">Automatic DOM visual snapshots taken upon assertion failures</p>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-zinc-300 font-medium">Automatic Capture on Assertion Failure</span>
              <span className="text-emerald-400 font-bold font-mono">ENABLED</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-300 font-medium">Image Storage Format</span>
              <span className="text-zinc-400 font-mono">Lossless PNG</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-300 font-medium">Direct Inspection View</span>
              <span className="text-indigo-400 font-mono">Integrated Modal Viewer</span>
            </div>
          </div>
        </div>

        {/* Security & Authorization Rules */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">QA Automation Security & Ethical Policy</h3>
              <p className="text-xs text-zinc-400">Enforced safeguards to protect private networks and prevent abuse</p>
            </div>
          </div>

          <div className="space-y-2 text-xs text-zinc-300 leading-relaxed">
            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>SSRF Protection:</strong> Testing localhost, loopback addresses (127.0.0.1, 0.0.0.0), cloud metadata (169.254.169.254), and private RFC1918 subnets (10.x, 192.168.x, 172.16-31.x) is strictly blocked by the server validation pipeline.
              </span>
            </div>

            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Safe Interactions:</strong> Form testing strictly verifies client-side field validation and missing required attributes. No destructive submissions, transaction processing, or external writes are performed automatically.
              </span>
            </div>

            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Authorization Requirement:</strong> Users must only test web applications and REST endpoints that they own or have been explicitly granted permission to evaluate.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
