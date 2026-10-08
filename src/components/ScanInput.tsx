import React, { useState } from 'react';
import { Loader2, ArrowRight, RotateCcw, AlertCircle } from 'lucide-react';

export type ScanInputState = 'IDLE' | 'SCANNING' | 'COMPLETED' | 'ERROR';

interface ScanInputProps {
  url: string;
  onChangeUrl: (url: string) => void;
  onStartScan: (targetUrl: string) => void;
  onViewResults?: () => void;
  state: ScanInputState;
  errorMessage?: string | null;
}

export const ScanInput: React.FC<ScanInputProps> = ({
  url,
  onChangeUrl,
  onStartScan,
  onViewResults,
  state,
  errorMessage,
}) => {
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (state === 'SCANNING') {
      return; // Protect against double submission
    }

    if (state === 'COMPLETED' && !url.trim()) {
      if (onViewResults) {
        onViewResults();
      }
      return;
    }

    let trimmed = url.trim();
    if (!trimmed) {
      setLocalError('Please enter a website URL');
      return;
    }

    // Auto prepend https:// if missing protocol
    if (!/^https?:\/\//i.test(trimmed)) {
      trimmed = `https://${trimmed}`;
      onChangeUrl(trimmed);
    }

    try {
      new URL(trimmed);
    } catch {
      setLocalError('Please enter a valid URL (e.g. https://your-domain.com)');
      return;
    }

    onStartScan(trimmed);
  };

  const isScanning = state === 'SCANNING';
  const displayError = localError || errorMessage;

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
      <form onSubmit={handleSubmit} className="w-full relative">
        <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl p-1.5 focus-within:border-[#8B5CF6]/80 focus-within:shadow-[0_0_25px_rgba(139,92,246,0.15)] transition-all">
          <input
            type="text"
            value={url}
            onChange={(e) => {
              onChangeUrl(e.target.value);
              if (localError) setLocalError(null);
            }}
            disabled={isScanning}
            placeholder="https://your-domain.com"
            aria-label="Website domain to test"
            className="flex-1 bg-transparent px-4 py-3 text-sm text-white placeholder-neutral-500 font-mono outline-none disabled:opacity-60"
          />

          <div className="flex items-center gap-2 mt-2 sm:mt-0 p-1 sm:p-0">
            {state === 'IDLE' && (
              <button
                type="submit"
                disabled={isScanning}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-medium text-xs tracking-wide transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Scan Website</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {state === 'SCANNING' && (
              <button
                type="button"
                disabled
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#8B5CF6]/70 text-white font-medium text-xs tracking-wide cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(139,92,246,0.4)]"
              >
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Scanning...</span>
              </button>
            )}

            {state === 'COMPLETED' && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="submit"
                  className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-medium text-xs tracking-wide transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Scan Again</span>
                </button>
              </div>
            )}

            {state === 'ERROR' && (
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-medium text-xs tracking-wide transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>
            )}
          </div>
        </div>

        {displayError && (
          <div className="mt-2.5 px-3 py-2 bg-red-950/30 border border-red-900/40 rounded-xl flex items-center gap-2 text-xs text-red-400 font-mono">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{displayError}</span>
          </div>
        )}
      </form>
    </div>
  );
};
