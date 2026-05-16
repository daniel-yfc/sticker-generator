// @vitest-environment node
import http from 'http';
import nock from 'nock';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createApp } from '../server.cjs';

// Minimal valid 1x1 PNG
const VALID_PNG_BASE64 = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108020000009001' +
  '2e00000000c4944415478016360f8cfc00000000200015e331de00000000049454e44ae426082',
  'hex'
).toString('base64');

const GEMINI_HOST = 'https://generativelanguage.googleapis.com';
const GEMINI_PATH = /\/v1beta\/models\/gemini-2\.5-flash-image:generateContent/;

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
        hostname: '127.0.0.1',
        port,
        path: '/api/generate',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
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
  let server;
  let port;

  beforeAll(async () => {
    // Disable CAPTCHA check and generation kill-switch for these tests
    process.env.GENERATION_ENABLED = 'true';
    process.env.TURNSTILE_SECRET_KEY = '';
    process.env.RATE_LIMIT_PER_IP = '1000';
    process.env.DAILY_QUOTA_LIMIT = '1000';
    process.env.GEMINI_API_KEY = 'test-key';
    nock.disableNetConnect();
    nock.enableNetConnect('127.0.0.1');
    server = createApp();
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    port = server.address().port;
  });

  afterAll(async () => {
    nock.cleanAll();
    nock.enableNetConnect();
    await new Promise(r => server.close(r));
  });

  beforeEach(() => {
    nock.cleanAll();
  });

  // GP55-013A
  describe('GP55-013A - upstream status mapping', () => {
    it('AC-upstream-401: Gemini 401 -> client 401 error_auth', async () => {
      nock(GEMINI_HOST).post(GEMINI_PATH).reply(401, JSON.stringify({ error: 'unauthorized' }), { 'Content-Type': 'application/json' });
      const res = await post(port, makeBody());
      expect(res.status).toBe(401);
      expect(JSON.parse(res.body).error).toBe('error_auth');
    });

    it('AC-upstream-429: Gemini 429 -> client 429 error_quota', async () => {
      nock(GEMINI_HOST).post(GEMINI_PATH).reply(429, JSON.stringify({ error: 'quota' }), { 'Content-Type': 'application/json' });
      const res = await post(port, makeBody());
      expect(res.status).toBe(429);
      expect(JSON.parse(res.body).error).toBe('error_quota');
    });

    it('AC-upstream-503: Gemini 503 -> client 502 error_upstream', async () => {
      nock(GEMINI_HOST).post(GEMINI_PATH).times(3).reply(503, JSON.stringify({ error: 'unavailable' }), { 'Content-Type': 'application/json' });
      const res = await post(port, makeBody());
      expect(res.status).toBe(502);
      expect(JSON.parse(res.body).error).toBe('error_upstream');
    });
  });

  // DS4-23
  describe('DS4-23 - non-JSON upstream response', () => {
    it('AC-nonjson: HTML error page from upstream -> 502 error_upstream', async () => {
      nock(GEMINI_HOST).post(GEMINI_PATH).reply(200, '<html>Bad Gateway</html>', { 'Content-Type': 'text/html' });
      const res = await post(port, makeBody());
      expect(res.status).toBe(502);
      expect(JSON.parse(res.body).error).toBe('error_upstream');
    });
  });

  // GP55-008A
  describe('GP55-008A - safety block handling', () => {
    it('AC-safety: promptFeedback.blockReason -> 200 error_safety', async () => {
      const blocked = JSON.stringify({
        promptFeedback: { blockReason: 'SAFETY' },
      });
      nock(GEMINI_HOST).post(GEMINI_PATH).reply(200, blocked, { 'Content-Type': 'application/json' });
      const res = await post(port, makeBody());
      expect(res.status).toBe(200);
      expect(JSON.parse(res.body).error).toBe('error_safety');
    });

    it('AC-success: valid generation response passes through', async () => {
      const success = JSON.stringify({
        candidates: [{ content: { parts: [{ inlineData: { mimeType: 'image/png', data: 'abc' } }] } }],
      });
      nock(GEMINI_HOST).post(GEMINI_PATH).reply(200, success, { 'Content-Type': 'application/json' });
      const res = await post(port, makeBody());
      expect(res.status).toBe(200);
      const parsed = JSON.parse(res.body);
      expect(parsed.error).toBeUndefined();
      expect(parsed.candidates).toBeDefined();
    });
  });

  // CO4-011
  describe('CO4-011 - retry on 5xx', () => {
    it('AC-retry-success: 5xx then 200 -> success on retry', async () => {
      const success = JSON.stringify({
        candidates: [{ content: { parts: [{ inlineData: { mimeType: 'image/png', data: 'abc' } }] } }],
      });
      nock(GEMINI_HOST).post(GEMINI_PATH).reply(503, '{}', { 'Content-Type': 'application/json' });
      nock(GEMINI_HOST).post(GEMINI_PATH).reply(200, success, { 'Content-Type': 'application/json' });
      const res = await post(port, makeBody());
      expect(res.status).toBe(200);
      expect(JSON.parse(res.body).candidates).toBeDefined();
    });

    it('AC-retry-exhaust: 3x 5xx -> 502 error_upstream', async () => {
      nock(GEMINI_HOST).post(GEMINI_PATH).times(3).reply(503, '{}', { 'Content-Type': 'application/json' });
      const res = await post(port, makeBody());
      expect(res.status).toBe(502);
      expect(JSON.parse(res.body).error).toBe('error_upstream');
    });
  });
});
