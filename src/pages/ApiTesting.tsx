import React, { useState, useEffect } from 'react';
import { ApiTestResult } from '../types';
import { api } from '../services/api';
import {
  Send,
  Globe,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Code,
  Copy,
  Check,
  RefreshCw,
  ShieldAlert
} from 'lucide-react';

export const ApiTesting: React.FC = () => {
  const [endpoint, setEndpoint] = useState('https://jsonplaceholder.typicode.com/posts/1');
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'>('GET');
  const [expectedStatus, setExpectedStatus] = useState<number>(200);
  const [headersJson, setHeadersJson] = useState('{\n  "Content-Type": "application/json"\n}');
  const [requestBody, setRequestBody] = useState('{\n  "title": "foo",\n  "body": "bar",\n  "userId": 1\n}');
  const [activeTab, setActiveTab] = useState<'body' | 'headers'>('body');
  const [loading, setLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState<ApiTestResult | null>(null);
  const [history, setHistory] = useState<ApiTestResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadHistory = async () => {
    try {
      const list = await api.getApiTestHistory();
      setHistory(list);
    } catch (err) {
      console.error('Failed to load API test history:', err);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleRunTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!endpoint.trim()) {
      setError('Endpoint URL is required');
      return;
    }

    let parsedHeaders: Record<string, string> = {};
    if (headersJson.trim()) {
      try {
        parsedHeaders = JSON.parse(headersJson);
      } catch {
        setError('Headers must be valid JSON object format (e.g. {"Authorization": "Bearer token"})');
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.runApiTest({
        endpoint: endpoint.trim(),
        method,
        headers: parsedHeaders,
        body: ['POST', 'PUT', 'PATCH'].includes(method) ? requestBody : undefined,
        expectedStatus: Number(expectedStatus) || 200
      });

      setCurrentResult(res);
      setHistory(prev => [res, ...prev.slice(0, 19)]);
    } catch (err: any) {
      setError(err.message || 'API Test execution failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyResponseBody = () => {
    if (!currentResult?.responseBody) return;
    navigator.clipboard.writeText(currentResult.responseBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isDestructive = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-zinc-800 pb-5">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Send className="w-5 h-5 text-indigo-400" />
          <span>API Endpoint Testing</span>
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Verify HTTP REST APIs, status code assertions, response latency, and payload structure
        </p>
      </div>

      {/* Main Request Form & Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Request Builder (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <form onSubmit={handleRunTest} className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 space-y-4 shadow-xl">
            {/* Method + URL Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 block uppercase tracking-wider">
                API Endpoint & Method
              </label>
              <div className="flex gap-2">
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as any)}
                  className={`font-mono text-xs font-bold px-3 py-2.5 rounded-lg border outline-none cursor-pointer ${
                    method === 'GET'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : method === 'POST'
                      ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                      : method === 'PUT'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : method === 'DELETE'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                  }`}
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                  <option value="DELETE">DELETE</option>
                </select>

                <div className="relative flex-1">
                  <input
                    type="text"
                    value={endpoint}
                    onChange={(e) => {
                      setEndpoint(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="https://api.example.com/v1/users"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-950 border border-zinc-700 text-white font-mono text-xs placeholder-zinc-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Expected Status & Preset URL helpers */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-zinc-400 font-medium">Expected Status:</span>
                <input
                  type="number"
                  value={expectedStatus}
                  onChange={(e) => setExpectedStatus(Number(e.target.value))}
                  className="w-20 px-2.5 py-1 rounded bg-zinc-950 border border-zinc-700 text-white font-mono text-xs text-center focus:border-indigo-500 outline-none"
                />
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 text-zinc-400">
                <span className="text-[11px]">Presets:</span>
                <button
                  type="button"
                  onClick={() => {
                    setMethod('GET');
                    setEndpoint('https://jsonplaceholder.typicode.com/posts/1');
                    setExpectedStatus(200);
                  }}
                  className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-mono transition-colors"
                >
                  GET Post
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMethod('POST');
                    setEndpoint('https://jsonplaceholder.typicode.com/posts');
                    setExpectedStatus(201);
                  }}
                  className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-mono transition-colors"
                >
                  POST Post
                </button>
              </div>
            </div>

            {/* Warning for modifying actions */}
            {isDestructive && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Notice: {method} requests may create or modify data on the remote target. Only test endpoints you are authorized to interact with.</span>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Tabs for Headers / Body */}
            <div className="space-y-2 pt-2">
              <div className="flex border-b border-zinc-800 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('body')}
                  className={`pb-2 px-3 font-semibold transition-colors border-b-2 ${
                    activeTab === 'body'
                      ? 'border-indigo-500 text-white'
                      : 'border-transparent text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Request Body {isDestructive && <span className="text-indigo-400">•</span>}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('headers')}
                  className={`pb-2 px-3 font-semibold transition-colors border-b-2 ${
                    activeTab === 'headers'
                      ? 'border-indigo-500 text-white'
                      : 'border-transparent text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Headers (JSON)
                </button>
              </div>

              {activeTab === 'body' ? (
                <div>
                  <textarea
                    rows={6}
                    value={requestBody}
                    onChange={(e) => setRequestBody(e.target.value)}
                    disabled={method === 'GET'}
                    placeholder={method === 'GET' ? 'Request body not applicable for GET requests' : '{\n  "key": "value"\n}'}
                    className="w-full p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 font-mono text-xs focus:outline-none focus:border-indigo-500 disabled:opacity-40"
                  />
                </div>
              ) : (
                <div>
                  <textarea
                    rows={6}
                    value={headersJson}
                    onChange={(e) => setHeadersJson(e.target.value)}
                    placeholder='{\n  "Authorization": "Bearer token"\n}'
                    className="w-full p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 font-mono text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}
            </div>

            {/* Execute Button */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Executing Request...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Request</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Response Inspector (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-white tracking-tight">Response Inspector</h3>
              {currentResult && (
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                    currentResult.pass
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {currentResult.pass ? 'PASS' : 'FAIL'}
                  </span>
                  <button
                    onClick={handleCopyResponseBody}
                    className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                    title="Copy response body"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>

            {!currentResult ? (
              <div className="py-16 text-center space-y-2">
                <Code className="w-8 h-8 text-zinc-400 mx-auto" />
                <p className="text-xs text-zinc-400">
                  Send a request to inspect response status code, latency, and response payload.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Status + Latency Badges */}
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">HTTP Status</span>
                    <span className={`text-base font-bold font-mono ${
                      currentResult.statusCode >= 200 && currentResult.statusCode < 300
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                    }`}>
                      {currentResult.statusCode} {currentResult.statusText}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Latency</span>
                    <span className="text-base font-bold font-mono text-cyan-400 flex items-center justify-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {currentResult.responseTimeMs} ms
                    </span>
                  </div>
                </div>

                {/* Response Body Box */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold block">
                    Response Body
                  </span>
                  <div className="h-64 overflow-auto rounded-lg bg-zinc-950 border border-zinc-800 p-3 font-mono text-xs text-zinc-300">
                    <pre>{currentResult.responseBody || '(Empty Response)'}</pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Past API Test Runs History */}
      {history.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Recent API Test Runs
            </h3>
            <span className="text-[11px] font-mono text-zinc-400">{history.length} runs</span>
          </div>

          <div className="divide-y divide-zinc-800/80">
            {history.slice(0, 5).map((item) => (
              <div
                key={item.id}
                onClick={() => setCurrentResult(item)}
                className="py-2.5 flex items-center justify-between gap-3 hover:bg-zinc-800/20 px-2 rounded cursor-pointer transition-colors text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    item.method === 'GET' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'
                  }`}>
                    {item.method}
                  </span>
                  <span className="font-mono text-zinc-300 truncate max-w-sm">
                    {item.endpoint}
                  </span>
                </div>

                <div className="flex items-center gap-3 font-mono shrink-0">
                  <span className={item.pass ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {item.statusCode}
                  </span>
                  <span className="text-zinc-400">{item.responseTimeMs}ms</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    item.pass ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                  }`}>
                    {item.pass ? 'PASS' : 'FAIL'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
