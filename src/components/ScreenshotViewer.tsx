import React from 'react';
import { X, ExternalLink, Download } from 'lucide-react';

interface ScreenshotViewerProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  title?: string;
  testId?: string;
}

export const ScreenshotViewer: React.FC<ScreenshotViewerProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title = 'Failure Screenshot',
  testId
}) => {
  if (!isOpen || !imageUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="relative max-w-5xl w-full max-h-[90vh] bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <div>
              <h3 className="text-sm font-semibold text-white">{title}</h3>
              {testId && <span className="text-xs font-mono text-zinc-400">{testId}</span>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
              title="Open full image in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <a
              href={imageUrl}
              download={`screenshot-${testId || 'failure'}.png`}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
              title="Download image"
            >
              <Download className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Content */}
        <div className="overflow-auto p-4 flex-1 flex items-center justify-center bg-zinc-950/90">
          <img
            src={imageUrl}
            alt="Failure Screenshot"
            className="max-w-full max-h-[75vh] object-contain rounded-lg border border-zinc-800 shadow-md"
          />
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-zinc-800 bg-zinc-950/60 text-xs text-zinc-400 flex items-center justify-between">
          <span>Captured automatically by Playwright on test assertion failure</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
