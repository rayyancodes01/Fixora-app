
import {
  DashboardStats,
  TestRun,
  BugReport,
  ApiTestResult,
} from '../types';

export interface SystemSettings {
  geminiConfigured: boolean;
  geminiModel: string;
  playwrightReady: boolean;
  defaultTimeoutMs: number;
  maxConcurrentTests: number;
  environment: string;
}

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  Pragma: 'no-cache',
};

const noCacheOptions: RequestInit = {
  cache: 'no-store',
  headers: NO_CACHE_HEADERS,
};

const isTerminalRun = (run: TestRun) =>
  run.status === 'completed' ||
  run.status === 'failed' ||
  run.status === 'stopped';

export const api = {
  async getStats(): Promise<DashboardStats> {
    const res = await fetch('/api/tests/stats', noCacheOptions);
    if (!res.ok) throw new Error(`Failed to fetch stats: HTTP ${res.status}`);
    return res.json();
  },

  async startTestRun(
    url: string,
    categories?: string[],
    maxTests = 6
  ): Promise<{ runId: string; run: TestRun }> {
    const res = await fetch('/api/test/start', {
      method: 'POST',
      cache: 'no-store',
      headers: {
        ...NO_CACHE_HEADERS,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, categories, maxTests }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to start test run');
    return data;
  },

  async stopTestRun(
    runId: string
  ): Promise<{ stopped: boolean; message: string; run?: TestRun }> {
    const res = await fetch(`/api/test/${encodeURIComponent(runId)}/stop`, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        ...NO_CACHE_HEADERS,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ runId }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to stop test run');
    return data;
  },

  async getTestRun(id: string): Promise<TestRun> {
    const res = await fetch(
      `/api/test/run/${encodeURIComponent(id)}`,
      noCacheOptions
    );
    if (!res.ok) throw new Error(`Failed to fetch test run: HTTP ${res.status}`);
    return res.json();
  },

  async getHistory(): Promise<TestRun[]> {
    const res = await fetch('/api/tests/history', noCacheOptions);
    if (!res.ok) throw new Error(`Failed to fetch history: HTTP ${res.status}`);
    return res.json();
  },

  async deleteRun(id: string): Promise<void> {
    const res = await fetch(`/api/test/run/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      cache: 'no-store',
      headers: NO_CACHE_HEADERS,
    });
    if (!res.ok) throw new Error(`Failed to delete run: HTTP ${res.status}`);
  },

  async getBugs(params?: {
    severity?: string;
    status?: string;
    website?: string;
  }): Promise<BugReport[]> {
    const query = new URLSearchParams();
    if (params?.severity) query.append('severity', params.severity);
    if (params?.status) query.append('status', params.status);
    if (params?.website) query.append('website', params.website);

    const res = await fetch(`/api/bugs?${query.toString()}`, noCacheOptions);
    if (!res.ok) throw new Error(`Failed to fetch bugs: HTTP ${res.status}`);
    return res.json();
  },

  async updateBugStatus(
    id: string,
    status: 'Open' | 'Investigating' | 'Resolved'
  ): Promise<BugReport> {
    const res = await fetch(`/api/bugs/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      cache: 'no-store',
      headers: {
        ...NO_CACHE_HEADERS,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error(`Failed to update bug status: HTTP ${res.status}`);
    return res.json();
  },

  async runApiTest(payload: {
    endpoint: string;
    method: string;
    headers?: Record<string, string>;
    body?: string;
    expectedStatus?: number;
  }): Promise<ApiTestResult> {
    const res = await fetch('/api/api-test/run', {
      method: 'POST',
      cache: 'no-store',
      headers: {
        ...NO_CACHE_HEADERS,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to execute API test');
    return data;
  },

  async getApiTestHistory(): Promise<ApiTestResult[]> {
    const res = await fetch('/api/api-test/history', noCacheOptions);
    if (!res.ok) {
      throw new Error(`Failed to fetch API test history: HTTP ${res.status}`);
    }
    return res.json();
  },

  async getSettings(): Promise<SystemSettings> {
    const res = await fetch('/api/settings', noCacheOptions);
    if (!res.ok) throw new Error(`Failed to fetch settings: HTTP ${res.status}`);
    return res.json();
  },

  subscribeToRun(
    runId: string,
    onUpdate: (run: TestRun) => void,
    onError?: (err: unknown) => void
  ): () => void {
    let closed = false;
    let terminalReceived = false;
    let pollInterval: ReturnType<typeof setInterval> | null = null;
    let eventSource: EventSource | null = null;
    let pollInFlight = false;

    const stopTransport = () => {
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }

      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    };

    const cleanup = () => {
      if (closed) return;
      closed = true;
      stopTransport();
    };

    const handleRun = (run: TestRun) => {
      if (closed || terminalReceived || run.id !== runId) return;

      onUpdate(run);

      if (isTerminalRun(run)) {
        terminalReceived = true;
        stopTransport();
      }
    };

    const startPollingFallback = () => {
      if (closed || terminalReceived || pollInterval) return;

      pollInterval = setInterval(async () => {
        if (closed || terminalReceived || pollInFlight) return;

        pollInFlight = true;
        try {
          const run = await api.getTestRun(runId);
          handleRun(run);
        } catch (err) {
          if (!closed && !terminalReceived) onError?.(err);
        } finally {
          pollInFlight = false;
        }
      }, 1500);
    };

    try {
      eventSource = new EventSource(
        `/api/test/run/${encodeURIComponent(runId)}/stream`
      );

      eventSource.onmessage = (event: MessageEvent) => {
        if (closed || terminalReceived) return;

        try {
          handleRun(JSON.parse(event.data) as TestRun);
        } catch (err) {
          onError?.(err);
        }
      };

      eventSource.onerror = (err) => {
        if (closed || terminalReceived) return;

        onError?.(err);

        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }

        startPollingFallback();
      };
    } catch (err) {
      onError?.(err);
      startPollingFallback();
    }

    return cleanup;
  },
};