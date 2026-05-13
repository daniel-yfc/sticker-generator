// @vitest-environment node
'use strict';

const http = require('http');
const { describe, it, expect, beforeAll, afterAll } = require('vitest');

const VALID_PNG_BASE64 = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108020000009001' +
  '2e00000000c4944415478016360f8cfc00000000200015e331de00000000049454e44ae426082',
  'hex'
).toString('base64');

const BASE_BODY = JSON.stringify({
  imageBase64: VALID_PNG_BASE64,
  styleId: 'chibi-anime',
  variationId: 'default',
  captchaToken: 'test-token',
});

function post(port, body, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
      ...extraHeaders,
    };
    const req = http.request(
      { hostname: '127.0.0.1', port, path: '/api/generate', method: 'POST', headers },
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

describe('GP55-015 — custom header abuse control + IP trust boundary', () => {
  let server;
  let port;

  beforeAll(async () => {
    process.env.GENERATION_ENABLED = 'false';
    process.env.TRUST_PROXY = 'false';
    process.env.RATE_LIMIT_PER_IP = '100';
    const { createApp } = require('../server.cjs');
    server = createApp();
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    port = server.address().port;
  });

  afterAll(async () => {
    await new Promise(r => server.close(r));
  });

  it('AC3a — x-forwarded-for ignored when TRUST_PROXY=false; no IP leaked in response', async () => {
    const res = await post(port, BASE_BODY, { 'x-forwarded-for': '1.2.3.4' });
    expect([200, 400, 403, 429, 503]).toContain(res.status);
    expect(res.body).not.toContain('127.0.0.1');
    expect(res.body).not.toContain('::1');
  });

  it('AC3b — unknown custom headers silently ignored (not 400, not echoed)', async () => {
    const res = await post(port, BASE_BODY, {
      'x-custom-attack': 'injection-attempt',
      'x-override-model': 'gemini-2.5-pro',
      'x-admin': 'true',
    });
    expect(res.status).not.toBe(400);
    expect(res.body).not.toContain('injection-attempt');
    expect(res.body).not.toContain('gemini-2.5-pro');
  });

  it('AC3c — Content-Type other than application/json returns 400', async () => {
    const res = await post(port, BASE_BODY, { 'Content-Type': 'text/plain' });
    expect(res.status).toBe(400);
  });
});
