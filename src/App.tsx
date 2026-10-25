
import React, { useState, useEffect, useRef, useCallback } from 'react';
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

const isTerminalStatus = (status: TestRun['status']) =>
  status === 'completed' ||
  status === 'failed' ||
  status === 'stopped';

const getFinishedScanState = (run: TestRun): ScanInputState =>
  run.status === 'failed' && (run.results?.length ?? 0) === 0
    ? 'ERROR'
    : 'COMPLETED';

export default function App() {
  const [url, setUrl] = useState('https://rayyan-store.vercel.app/');
  const [activeRun, setActiveRun] = useState<TestRun | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanState, setScanState] = useState<ScanInputState>('IDLE');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [browserReady, setBrowserReady] = useState(true);

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const scanStartLockRef = useRef(false);
  const currentRunIdRef = useRef<string | null>(null);
  const mountedRef = useRef(false);

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

  const [screenshotModal, setScreenshotModal] = useState<{
    isOpen: boolean;
    imageUrl: string | null;
    testId?: string;
    title?: string;
  }>({
    isOpen: false,
    imageUrl: null,
  });

  const stopSubscription = useCallback(() => {
    const unsubscribe = unsubscribeRef.current;
    unsubscribeRef.current = null;

    if (unsubscribe) {
      unsubscribe();
    }
  }, []);

  const handleIntroComplete = useCallback(() => {
    try {
      localStorage.setItem('bugscout_intro_seen', 'true');
    } catch {
      // Intro preferences are optional.
    }

    setShowIntro(false);
  }, []);

  const handleRunUpdate = useCallback(
    (runId: string, updatedRun: TestRun) => {
      if (!mountedRef.current) return;
      if (currentRunIdRef.current !== runId) return;
      if (updatedRun.id !== runId) return;

      setActiveRun(updatedRun);

      if (isTerminalStatus(updatedRun.status)) {
        setIsScanning(false);
        scanStartLockRef.current = false;
        setScanState(getFinishedScanState(updatedRun));

        setErrorMessage(
          updatedRun.error && (updatedRun.results?.length ?? 0) === 0
            ? updatedRun.error
            : null
        );

        stopSubscription();
        return;
      }

      setIsScanning(true);
      setScanState('SCANNING');
    },
    [stopSubscription]
  );

  useEffect(() => {
    mountedRef.current = true;

    const controller = new AbortController();

    fetch('/api/browser-status', {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error('Browser status request failed');
        return res.json();
      })
      .then((status) => {
        if (mountedRef.current) {
          setBrowserReady(Boolean(status.ready));
        }
      })
      .catch((err) => {
        if (err?.name !== 'AbortError' && mountedRef.current) {
          console.warn('Could not load browser status:', err);
          setBrowserReady(false);
        }
      });

    api.getHistory()
      .then((runs) => {
        if (!mountedRef.current || runs.length === 0) return;

        // Never let history overwrite a scan started by the user.
        if (scanStartLockRef.current || currentRunIdRef.current) return;

        const latest = runs[0];
        if (!latest) return;

        setActiveRun(latest);
        if (latest.url) setUrl(latest.url);

        if (isTerminalStatus(latest.status)) {
          setIsScanning(false);
          setScanState(getFinishedScanState(latest));
          return;
        }

        if (latest.status === 'running') {
          currentRunIdRef.current = latest.id;
          scanStartLockRef.current = true;
          setIsScanning(true);
          setScanState('SCANNING');

          stopSubscription();

          unsubscribeRef.current = api.subscribeToRun(
            latest.id,
            (updatedRun) => handleRunUpdate(latest.id, updatedRun),
            (err) => console.warn('Scan stream warning:', err)
          );
        } else {
          setIsScanning(false);
          setScanState('IDLE');
        }
      })
      .catch((err) => {
        if (mountedRef.current) {
          console.warn('Could not load scan history:', err);
        }
      });

    return () => {
      mountedRef.current = false;
      controller.abort();
      stopSubscription();
    };
  }, [handleRunUpdate, stopSubscription]);

  const handleStartScan = async (targetUrl: string) => {
    if (scanStartLockRef.current) return;

    scanStartLockRef.current = true;
    currentRunIdRef.current = null;

    stopSubscription();
    setErrorMessage(null);
    setIsScanning(true);
    setScanState('SCANNING');

    try {
      const { runId, run } = await api.startTestRun(targetUrl);

      if (!mountedRef.current) return;

      currentRunIdRef.current = runId;
      setActiveRun(run);

      if (isTerminalStatus(run.status)) {
        setIsScanning(false);
        scanStartLockRef.current = false;
        setScanState(getFinishedScanState(run));
        setErrorMessage(
          run.error && (run.results?.length ?? 0) === 0 ? run.error : null
        );
        return;
      }

      unsubscribeRef.current = api.subscribeToRun(
        runId,
        (updatedRun) => handleRunUpdate(runId, updatedRun),
        (err) => console.warn('Scan stream warning:', err)
      );
    } catch (err: unknown) {
      if (!mountedRef.current) return;

      console.error('Scan startup error:', err);
      stopSubscription();
      scanStartLockRef.current = false;
      currentRunIdRef.current = null;
      setIsScanning(false);
      setScanState('ERROR');
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Unable to complete scan. Please try again.'
      );
    }
  };

  const handleViewScreenshot = (
    imgUrl: string,
    testId: string,
    title: string
  ) => {
    setScreenshotModal({
      isOpen: true,
      imageUrl: imgUrl,
      testId,
      title: `Failure Evidence: ${title}`,
    });
  };

  return (
    <ErrorBoundary>
      {showIntro && (
        <CinematicIntro onComplete={handleIntroComplete} />
      )}

      <div className="min-h-screen bg-[#000000] bg-tech-grid text-white flex flex-col font-sans select-none relative overflow-x-hidden antialiased">
        <BrowserFrame browserReady={browserReady} />

        <Header
          activeRun={activeRun}
          isScanning={isScanning}
          onNavigate={() => {}}
        />

        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col gap-10">
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

          <ScanInput
            url={url}
            onChangeUrl={setUrl}
            onStartScan={handleStartScan}
            onViewResults={() => setIsAuditModalOpen(true)}
            state={scanState}
            errorMessage={errorMessage}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            <ScanStatusCard
              activeRun={activeRun}
              isScanning={isScanning}
              onStartScan={() => handleStartScan(url)}
              onViewFullAudit={() => setIsAuditModalOpen(true)}
              targetUrl={url}
            />

            <TestProgress
              activeRun={activeRun}
              isScanning={isScanning}
            />
          </div>

          <Telemetry
            activeRun={activeRun}
            onSelectTest={() => setIsAuditModalOpen(true)}
          />

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

        <ScanResults
          run={activeRun}
          isOpen={isAuditModalOpen}
          onClose={() => setIsAuditModalOpen(false)}
          onViewScreenshot={handleViewScreenshot}
        />

        <ScreenshotViewer
          isOpen={screenshotModal.isOpen}
          onClose={() =>
            setScreenshotModal({ isOpen: false, imageUrl: null })
          }
          imageUrl={screenshotModal.imageUrl}
          testId={screenshotModal.testId}
          title={screenshotModal.title}
        />
      </div>
    </ErrorBoundary>
  );
}