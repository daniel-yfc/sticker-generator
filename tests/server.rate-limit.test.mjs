// @vitest-environment node
import http from 'http';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createApp } from '../server.cjs';

const VALID_PNG_BASE64 = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108020000009001' +
  '2e00000000c4944415478016360f8cfc00000000200015e331de00000000049454e44ae426082',
  'hex'
).toString('base64');

const VALID_BODY = JSON.stringify({
  imageBase64: VALID_PNG_BASE64,
  styleId: 'chibi-anime',
  variationId: 'default',
  captchaToken: 'test-token',
});

function post(port, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { hostname: '127.0.0.1', port, path: '/api/generate', method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } },
      (res) => {
        let data = '';
        res.on('data', c => { data += c; });
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

describe('GP55-002 - per-IP rate limiting', () => {
  let server;
  let port;

  beforeAll(async () => {
    process.env.GENERATION_ENABLED = 'false';
    process.env.RATE_LIMIT_PER_IP = '5';
    process.env.RATE_LIMIT_WINDOW_MS = '60000';
    server = createApp();
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    port = server.address().port;
  });

  afterAll(async () => {
    await new Promise(r => server.close(r));
  });

  it('allows requests 1-5 from same IP', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await post(port, VALID_BODY);
      expect(res.status).not.toBe(429);
    }
  });

  it('blocks the 6th request with 429', async () => {
    const res = await post(port, VALID_BODY);
    expect(res.status).toBe(429);
  });

  it('429 includes Retry-After header', async () => {
    const res = await post(port, VALID_BODY);
    expect(res.status).toBe(429);
    expect(res.headers['retry-after']).toBeDefined();
  });

  it('429 body uses error_rate_limit code', async () => {
    const res = await post(port, VALID_BODY);
    expect(res.status).toBe(429);
    const body = JSON.parse(res.body);
    expect(body.error.code).toBe('error_rate_limit');
  });
});
