import React, { useState, useEffect, useRef } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CinematicIntro } from './components/CinematicIntro';
import { BrowserFrame } from './components/BrowserFrame';
import { Header } from './components/Header';
import { ScanInput, ScanInputState } from './components/ScanInput';
import { ScanStatusCard } from './components/ScanStatusCard';
import { TestProgress } from './components/TestProgress';
import { Telemetry } from './components/Telemetry';
import { ScanResults } from './components/ScanResults';
import { ScreenshotViewer } from './components/ScreenshotViewer';
import { TestRun } from './types';
import { api } from './services/api';

export default function App() {
  const [url, setUrl] = useState<string>('https://rayyan-store.vercel.app/');
  const [activeRun, setActiveRun] = useState<TestRun | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanState, setScanState] = useState<ScanInputState>('IDLE');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [browserReady, setBrowserReady] = useState<boolean>(true);

  // Unsubscribe handler ref
const unsubscribeRef = useRef<any>(null);
  // Cinematic Intro State
  const [showIntro, setShowIntro] = useState<boolean>(() => {
    try {
      const userPref = localStorage.getItem('bugscout_show_intro');
      if (userPref === 'false') return false;
      const seen = localStorage.getItem('bugscout_intro_seen');
      if (seen && userPref !== 'true') return false;
      return true;
    } catch {
      return true;
    }
  });

  const handleIntroComplete = () => {
    try {
      localStorage.setItem('bugscout_intro_seen', 'true');
    } catch {}
    setShowIntro(false);
  };

  // Screenshot viewer modal
  const [screenshotModal, setScreenshotModal] = useState<{
    isOpen: boolean;
    imageUrl: string | null;
    testId?: string;
    title?: string;
  }>({
    isOpen: false,
    imageUrl: null,
  });

  // Verify production browser readiness on load & load most recent run if any
  useEffect(() => {
    fetch('/api/browser-status')
      .then(res => res.json())
      .then(status => {
        setBrowserReady(!!status.ready);
      })
      .catch(() => setBrowserReady(true));

    api.getHistory()
      .then(runs => {
        if (runs.length > 0) {
          const latest = runs[0];
          setActiveRun(latest);
          if (latest.url) setUrl(latest.url);
          setScanState('COMPLETED');
        }
      })
      .catch(() => {});

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  // Real Playwright Scan Trigger
  const handleStartScan = async (targetUrl: string) => {
    if (isScanning) return; // Prevent double execution

    setErrorMessage(null);
    setIsScanning(true);
    setScanState('SCANNING');

    // Clean up any existing subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    try {
      const { runId, run } = await api.startTestRun(targetUrl);
      setActiveRun(run);

      // Subscribe to real-time events & polling fallback
      unsubscribeRef.current = api.subscribeToRun(
        runId,
        (updatedRun: TestRun) => {
          setActiveRun(updatedRun);
          if (
            updatedRun.status === 'completed' ||
            updatedRun.status === 'failed' ||
            updatedRun.status === 'stopped'
          ) {
            setIsScanning(false);
            setScanState(updatedRun.status === 'failed' && updatedRun.results.length === 0 ? 'ERROR' : 'COMPLETED');
            if (updatedRun.error && updatedRun.results.length === 0) {
              setErrorMessage(updatedRun.error);
            }
          }
        },
        (err) => {
          console.warn('Scan stream warning:', err);
        }
      );
    } catch (err: any) {
      console.error('Scan startup error:', err);
      setIsScanning(false);
      setScanState('ERROR');
      setErrorMessage(err.message || 'Unable to complete scan. Please try again.');
    }
  };

  const handleViewScreenshot = (imgUrl: string, testId: string, title: string) => {
    setScreenshotModal({
      isOpen: true,
      imageUrl: imgUrl,
      testId,
      title: `Failure Evidence: ${title}`,
    });
  };

  return (
    <ErrorBoundary>
      {/* Cinematic Video Intro (0 - 4.5s) */}
      {showIntro && (
        <CinematicIntro onComplete={handleIntroComplete} />
      )}

      {/* Main BugScout OLED Experience */}
      <div className="min-h-screen bg-[#000000] bg-tech-grid text-white flex flex-col font-sans select-none relative overflow-x-hidden antialiased">
        {/* Top Browser Bar */}
        <BrowserFrame browserReady={browserReady} />

        {/* Top Navigation Header */}
        <Header
          activeRun={activeRun}
          isScanning={isScanning}
          onNavigate={() => {}}
        />

        {/* Main Dashboard Hero & Execution Workspace */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col gap-10">
          
          {/* Brand Identity / Headline */}
          <div className="text-center space-y-3 pt-2">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white font-mono">
              BugScout
            </h1>
            <p className="text-base sm:text-lg font-medium text-neutral-300 tracking-tight">
              Find bugs before your users do.
            </p>
            <p className="text-xs sm:text-sm font-mono text-neutral-500 max-w-md mx-auto">
              Real browser testing. Verified findings. One powerful scan.
            </p>
          </div>

          {/* Main Website Input Box */}
          <ScanInput
            url={url}
            onChangeUrl={setUrl}
            onStartScan={handleStartScan}
            onViewResults={() => setIsAuditModalOpen(true)}
            state={scanState}
            errorMessage={errorMessage}
          />

          {/* Dual Metrics & Real Progress Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {/* Left: Site Health Card */}
            <ScanStatusCard
              activeRun={activeRun}
              isScanning={isScanning}
              onStartScan={() => handleStartScan(url)}
              onViewFullAudit={() => setIsAuditModalOpen(true)}
              targetUrl={url}
            />

            {/* Right: Real Test Progress */}
            <TestProgress
              activeRun={activeRun}
              isScanning={isScanning}
            />
          </div>

          {/* System Telemetry & 16 Deterministic Checks */}
          <Telemetry
            activeRun={activeRun}
            onSelectTest={() => setIsAuditModalOpen(true)}
          />

          {/* Minimalist Developer Footer */}
          <footer className="pt-8 pb-4 border-t border-[#141414] text-center text-xs font-mono text-neutral-600 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]" />
              <span>BugScout • Deterministic Browser Testing Engine</span>
            </div>
            <div className="flex items-center gap-4 text-neutral-500">
              <button
                onClick={() => setShowIntro(true)}
                className="hover:text-neutral-300 transition-colors cursor-pointer"
              >
                Replay Intro
              </button>
              <span>•</span>
              <span>Playwright Chromium 153.0.8010.12</span>
            </div>
          </footer>
        </main>

        {/* Full Audit Results Modal / Drawer */}
        <ScanResults
          run={activeRun}
          isOpen={isAuditModalOpen}
          onClose={() => setIsAuditModalOpen(false)}
          onViewScreenshot={handleViewScreenshot}
        />

        {/* Screenshot Viewer Modal */}
        <ScreenshotViewer
          isOpen={screenshotModal.isOpen}
          onClose={() => setScreenshotModal({ isOpen: false, imageUrl: null })}
          imageUrl={screenshotModal.imageUrl}
          testId={screenshotModal.testId}
          title={screenshotModal.title}
        />
      </div>
    </ErrorBoundary>
  );
}
