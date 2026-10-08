import { DashboardStats, TestRun, BugReport, ApiTestResult } from '../types';

export interface SystemSettings {
  geminiConfigured: boolean;
  geminiModel: string;
  playwrightReady: boolean;
  defaultTimeoutMs: number;
  maxConcurrentTests: number;
  environment: string;
}

export const api = {
  async getStats(): Promise<DashboardStats> {
    const res = await fetch('/api/tests/stats');
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },

  async startTestRun(url: string, categories?: string[], maxTests = 6): Promise<{ runId: string; run: TestRun }> {
    const res = await fetch('/api/test/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, categories, maxTests })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to start test run');
    }
    return data;
  },

  async stopTestRun(runId: string): Promise<{ stopped: boolean; message: string; run?: TestRun }> {
    const res = await fetch(`/api/test/${runId}/stop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ runId })
    });
    const data = await res.json();
    return data;
  },

  async getTestRun(id: string): Promise<TestRun> {
    const res = await fetch(`/api/test/run/${id}`);
    if (!res.ok) throw new Error('Failed to fetch test run');
    return res.json();
  },

  async getHistory(): Promise<TestRun[]> {
    const res = await fetch('/api/tests/history');
    if (!res.ok) throw new Error('Failed to fetch history');
    return res.json();
  },

  async deleteRun(id: string): Promise<void> {
    const res = await fetch(`/api/test/run/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete run');
  },

  async getBugs(params?: { severity?: string; status?: string; website?: string }): Promise<BugReport[]> {
    const query = new URLSearchParams();
    if (params?.severity) query.append('severity', params.severity);
    if (params?.status) query.append('status', params.status);
    if (params?.website) query.append('website', params.website);

    const res = await fetch(`/api/bugs?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch bugs');
    return res.json();
  },

  async updateBugStatus(id: string, status: 'Open' | 'Investigating' | 'Resolved'): Promise<BugReport> {
    const res = await fetch(`/api/bugs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Failed to update bug status');
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to execute API test');
    return data;
  },

  async getApiTestHistory(): Promise<ApiTestResult[]> {
    const res = await fetch('/api/api-test/history');
    if (!res.ok) throw new Error('Failed to fetch API test history');
    return res.json();
  },

  async getSettings(): Promise<SystemSettings> {
    const res = await fetch('/api/settings');
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  subscribeToRun(runId: string, onUpdate: (run: TestRun) => void, onError?: (err: any) => void): () => void {
    let isTerminated = false;
    let pollInterval: any = null;
    let eventSource: EventSource | null = null;

    const startPollingFallback = () => {
      if (isTerminated || pollInterval) return;
      pollInterval = setInterval(async () => {
        if (isTerminated) return;
        try {
          const run = await api.getTestRun(runId);
          onUpdate(run);
          if (run.status === 'completed' || run.status === 'failed' || run.status === 'stopped') {
            isTerminated = true;
            if (pollInterval) clearInterval(pollInterval);
          }
        } catch {
          // Ignore transient fetch failure during polling
        }
      }, 1500);
    };

    try {
      eventSource = new EventSource(`/api/test/run/${runId}/stream`);

      eventSource.onmessage = (event) => {
        try {
          const run = JSON.parse(event.data) as TestRun;
          onUpdate(run);
          if (run.status === 'completed' || run.status === 'failed' || run.status === 'stopped') {
            isTerminated = true;
            if (eventSource) eventSource.close();
            if (pollInterval) clearInterval(pollInterval);
          }
        } catch (e) {
          console.warn('Error parsing SSE stream message:', e);
        }
      };

      eventSource.onerror = (err) => {
        if (onError) onError(err);
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        startPollingFallback();
      };
    } catch {
      startPollingFallback();
    }

    // Redundant heartbeat check every 3 seconds to guarantee updates never stall
    const heartbeatPoll = setInterval(async () => {
      if (isTerminated) {
        clearInterval(heartbeatPoll);
        return;
      }
      try {
        const run = await api.getTestRun(runId);
        onUpdate(run);
        if (run.status === 'completed' || run.status === 'failed' || run.status === 'stopped') {
          isTerminated = true;
          clearInterval(heartbeatPoll);
          if (eventSource) eventSource.close();
        }
      } catch {}
    }, 3000);

    return () => {
      isTerminated = true;
      if (eventSource) eventSource.close();
      if (pollInterval) clearInterval(pollInterval);
      clearInterval(heartbeatPoll);
    };
  }
};
