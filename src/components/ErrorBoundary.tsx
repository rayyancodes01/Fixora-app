import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Bug, RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('BugScout Frontend Error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#000000] text-white flex flex-col items-center justify-center p-6 select-none font-sans">
          <div className="w-full max-w-md bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#8B5CF6] to-transparent" />
            
            <div className="w-14 h-14 rounded-2xl bg-[#121212] border border-[#1A1A1A] flex items-center justify-center mx-auto mb-6 text-[#8B5CF6] shadow-[0_0_30px_rgba(139,92,246,0.15)]">
              <Bug className="w-7 h-7" />
            </div>

            <div className="flex items-center justify-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-[#8B5CF6]" />
              <span className="text-xs uppercase tracking-widest text-[#8B5CF6] font-mono font-medium">System Shield</span>
            </div>

            <h1 className="text-xl font-bold tracking-tight text-white mb-2">
              Something went wrong.
            </h1>

            <p className="text-xs text-neutral-400 mb-6 leading-relaxed">
              BugScout caught an unexpected runtime exception. The background browser testing engine remains isolated and unaffected.
            </p>

            {this.state.error && (
              <div className="mb-6 p-3 bg-[#000000] border border-[#1A1A1A] rounded-lg text-left overflow-x-auto max-h-24 text-[11px] font-mono text-neutral-400">
                {this.state.error.message}
              </div>
            )}

            <button
              onClick={this.handleReload}
              className="w-full py-3 px-4 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-xl text-xs font-semibold tracking-wide flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] active:scale-[0.99] cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reload BugScout
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
