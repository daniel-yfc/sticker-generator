// @vitest-environment node
import http from 'http';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createApp } from '../server.cjs';

const VALID_PNG_BASE64 = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108020000009001' +
  '2e00000000c4944415478016360f8cfc00000000200015e331de00000000049454e44ae426082',
  'hex'
).toString('base64');

function createFakeGemini() {
  const queue = [];
  const server = http.createServer((req, res) => {
    const spec = queue.shift();
    if (!spec) { res.writeHead(500); res.end('{}'); return; }
    const { status = 200, contentType = 'application/json', body = '{}' } = spec;
    res.writeHead(status, { 'Content-Type': contentType });
    res.end(body);
  });
  return {
    queue,
    server,
    start() { return new Promise(r => server.listen(0, '127.0.0.1', r)); },
    port() { return server.address().port; },
    stop() { return new Promise(r => server.close(r)); },
  };
}

function makeBody(overrides = {}) {
  return JSON.stringify({
    imageBase64: VALID_PNG_BASE64,
    styleId: 'chibi-anime',
    variationId: 'default',
    captchaToken: 'test-bypass-token',
    ...overrides,
  });
}

function post(port, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1', port,
        path: '/api/generate', method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      },
      (res) => {
        let data = '';
        res.on('data', c => { data += c; });
        res.on('end', () => resolve({ status: res.statusCode, body: data }));
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

describe('Wave 4 - Gemini call hardening', () => {
  let appServer;
  let appPort;
  let fakeGemini;

  beforeAll(async () => {
    fakeGemini = createFakeGemini();
    await fakeGemini.start();

    process.env.GEMINI_API_PROTOCOL = 'http';
    process.env.GEMINI_API_HOST     = '127.0.0.1';
    process.env.GEMINI_API_PORT     = String(fakeGemini.port());
    process.env.GENERATION_ENABLED  = 'true';
    process.env.TURNSTILE_SECRET_KEY = '';       // skip CAPTCHA
    process.env.RATE_LIMIT_PER_IP   = '1000';
    process.env.DAILY_QUOTA_LIMIT   = '1000';
    process.env.GEMINI_API_KEY      = 'test-key';

    appServer = createApp();
    await new Promise(r => appServer.listen(0, '127.0.0.1', r));
    appPort = appServer.address().port;
  });

  afterAll(async () => {
    await new Promise(r => appServer.close(r));
    await fakeGemini.stop();
    delete process.env.GEMINI_API_PROTOCOL;
    delete process.env.GEMINI_API_HOST;
    delete process.env.GEMINI_API_PORT;
  });

  beforeEach(() => {
    fakeGemini.queue.length = 0;
  });

  describe('GP55-013A - upstream status mapping', () => {
    it('AC-401: Gemini 401 -> client 401 error_auth', async () => {
      fakeGemini.queue.push({ status: 401, body: '{}' });
      const res = await post(appPort, makeBody());
      expect(res.status).toBe(401);
      expect(JSON.parse(res.body).error.code).toBe('error_auth');
    });

    it('AC-429: Gemini 429 -> client 429 error_quota (no retry)', async () => {
      fakeGemini.queue.push({ status: 429, body: '{}' });
      const res = await post(appPort, makeBody());
      expect(res.status).toBe(429);
      expect(JSON.parse(res.body).error.code).toBe('error_quota');
    });

    it('AC-503: Gemini 503 x3 -> client 502 error_upstream (retries exhausted)', async () => {
      fakeGemini.queue.push({ status: 503, body: '{}' });
      fakeGemini.queue.push({ status: 503, body: '{}' });
      fakeGemini.queue.push({ status: 503, body: '{}' });
      const res = await post(appPort, makeBody());
      expect(res.status).toBe(502);
      expect(JSON.parse(res.body).error.code).toBe('error_upstream');
    });
  });

  describe('DS4-23 - non-JSON upstream response', () => {
    it('AC-nonjson: HTML upstream -> 502 error_upstream', async () => {
      fakeGemini.queue.push({ status: 200, contentType: 'text/html', body: '<html>Bad Gateway</html>' });
      const res = await post(appPort, makeBody());
      expect(res.status).toBe(502);
      expect(JSON.parse(res.body).error.code).toBe('error_upstream');
    });
  });

  describe('GP55-008A - safety block handling', () => {
    it('AC-safety: promptFeedback.blockReason -> 200 error_safety', async () => {
      fakeGemini.queue.push({
        body: JSON.stringify({ promptFeedback: { blockReason: 'SAFETY' } }),
      });
      const res = await post(appPort, makeBody());
      expect(res.status).toBe(200);
      expect(JSON.parse(res.body).error.code).toBe('error_safety');
    });

    it('AC-success: valid generation passes through', async () => {
      const success = JSON.stringify({
        candidates: [{ content: { parts: [{ inlineData: { mimeType: 'image/png', data: 'abc' } }] } }],
      });
      fakeGemini.queue.push({ body: success });
      const res = await post(appPort, makeBody());
      expect(res.status).toBe(200);
      const parsed = JSON.parse(res.body);
      expect(parsed.error).toBeUndefined();
      expect(parsed.candidates).toBeDefined();
    });
  });

  describe('CO4-011 - retry on 5xx', () => {
    it('AC-retry-success: 5xx then 200 -> success on retry', async () => {
      const success = JSON.stringify({
        candidates: [{ content: { parts: [{ inlineData: { mimeType: 'image/png', data: 'abc' } }] } }],
      });
      fakeGemini.queue.push({ status: 503, body: '{}' });
      fakeGemini.queue.push({ body: success });
      const res = await post(appPort, makeBody());
      expect(res.status).toBe(200);
      expect(JSON.parse(res.body).candidates).toBeDefined();
    });

    it('AC-retry-exhaust: 3x 5xx -> 502 error_upstream', async () => {
      fakeGemini.queue.push({ status: 503, body: '{}' });
      fakeGemini.queue.push({ status: 503, body: '{}' });
      fakeGemini.queue.push({ status: 503, body: '{}' });
      const res = await post(appPort, makeBody());
      expect(res.status).toBe(502);
      expect(JSON.parse(res.body).error.code).toBe('error_upstream');
    });
  });
});
