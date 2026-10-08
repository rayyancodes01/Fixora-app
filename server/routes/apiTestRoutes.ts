import { Router } from 'express';
import type { Request, Response } from 'express';
import { WebsiteAnalyzer } from '../services/websiteAnalyzer.ts';
import { storage } from '../services/storage.ts';
import type { ApiTestResult } from '../types.ts';

const router = Router();

router.post('/run', async (req: Request, res: Response) => {
  try {
    const { endpoint, method = 'GET', headers = {}, body, expectedStatus = 200 } = req.body;

    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint URL is required' });
    }

    const validation = WebsiteAnalyzer.validateUrl(endpoint);
    if (!validation.valid || !validation.url) {
      return res.status(400).json({ error: validation.error || 'Invalid endpoint URL' });
    }

    const targetUrl = validation.url;
    const httpMethod = method.toUpperCase();
    if (!['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(httpMethod)) {
      return res.status(400).json({ error: `Unsupported HTTP method: ${httpMethod}` });
    }

    // Prepare request
    const reqHeaders: Record<string, string> = {
      'User-Agent': 'AIWebsiteTester-API-Runner/1.0',
      'Accept': 'application/json, text/plain, */*',
      ...headers
    };

    const startTime = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    let fetchResponse: any;
    let responseBody = '';
    let responseHeadersObj: Record<string, string> = {};
    let isPass = false;
    let errorMsg: string | undefined;

    try {
      fetchResponse = await fetch(targetUrl, {
        method: httpMethod,
        headers: reqHeaders,
        body: ['POST', 'PUT', 'PATCH'].includes(httpMethod) && body ? body : undefined,
        signal: controller.signal
      });

      clearTimeout(timeout);

      fetchResponse.headers.forEach((val: string, key: string) => {
        responseHeadersObj[key] = val;
      });

      const rawText = await fetchResponse.text();
      // Try formatting JSON if possible
      try {
        const parsed = JSON.parse(rawText);
        responseBody = JSON.stringify(parsed, null, 2);
      } catch {
        responseBody = rawText.slice(0, 5000);
      }

      const expected = Number(expectedStatus) || 200;
      isPass = fetchResponse.status === expected || (expected === 200 && fetchResponse.status >= 200 && fetchResponse.status < 300);

    } catch (fetchErr: any) {
      clearTimeout(timeout);
      if (fetchErr.name === 'AbortError') {
        errorMsg = 'Request timed out after 12 seconds';
      } else {
        errorMsg = fetchErr.message || 'Network request failed';
      }
    }

    const responseTimeMs = Date.now() - startTime;
    const statusCode = fetchResponse ? fetchResponse.status : 0;
    const statusText = fetchResponse ? fetchResponse.statusText : (errorMsg || 'Failed');

    const result: ApiTestResult = {
      id: `API-${Date.now().toString(36).toUpperCase()}`,
      endpoint: targetUrl,
      method: httpMethod,
      statusCode,
      statusText,
      responseTimeMs,
      pass: isPass,
      expectedStatus: Number(expectedStatus) || 200,
      responseHeaders: responseHeadersObj,
      responseBody: responseBody || (errorMsg ? `Error: ${errorMsg}` : ''),
      timestamp: new Date().toISOString(),
      error: errorMsg
    };

    storage.saveApiTest(result);
    return res.json(result);

  } catch (err: any) {
    console.error('API Test Execution error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

router.get('/history', (_req: Request, res: Response) => {
  return res.json(storage.getApiTests());
});

export default router;
