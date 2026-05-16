// @vitest-environment node
import http from 'http';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createApp } from '../server.cjs';

const VALID_PNG_BASE64 = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108020000009001' +
  '2e00000000c4944415478016360f8cfc00000000200015e331de00000000049454e44ae426082',
  'hex'
).toString('base64');

function makeBody(captchaToken) {
  return JSON.stringify({
    imageBase64: VALID_PNG_BASE64,
    styleId: 'chibi-anime',
    variationId: 'default',
    ...(captchaToken !== undefined ? { captchaToken } : {}),
  });
}

function post(port, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { hostname: '127.0.0.1', port, path: '/api/generate', method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } },
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

describe('CO4-008 + CO4-002 - CAPTCHA server verification + replay protection', () => {
  let server;
  let port;

  beforeAll(async () => {
    process.env.GENERATION_ENABLED = 'false';
    process.env.RATE_LIMIT_PER_IP = '100';
    process.env.TURNSTILE_SECRET_KEY = '2x0000000000000000000000000000000AA';
    server = createApp();
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    port = server.address().port;
  });

  afterAll(async () => {
    await new Promise(r => server.close(r));
  });

  it('AC2a - missing captchaToken -> 400', async () => {
    const res = await post(port, makeBody(undefined));
    expect(res.status).toBe(400);
    expect(JSON.parse(res.body).error).toBe('error_captcha');
  });

  it('AC2b - empty captchaToken -> 400', async () => {
    const res = await post(port, makeBody(''));
    expect(res.status).toBe(400);
    expect(JSON.parse(res.body).error).toBe('error_captcha');
  });

  it('AC2c - invalid token (always-fail secret) -> 403', async () => {
    const res = await post(port, makeBody('invalid-token-xyz'));
    expect(res.status).toBe(403);
    expect(JSON.parse(res.body).error).toBe('error_captcha');
  });

  it('AC2d - replayed token -> 403 on second use (CO4-002)', async () => {
    process.env.TURNSTILE_SECRET_KEY = '1x0000000000000000000000000000000AA';
    const token = 'replay-test-token-' + Date.now();
    await post(port, makeBody(token));
    const res = await post(port, makeBody(token));
    expect(res.status).toBe(403);
    expect(JSON.parse(res.body).error).toBe('error_captcha');
  });
});
