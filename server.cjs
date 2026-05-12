const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Environment loader
// ---------------------------------------------------------------------------
function loadEnv() {
  const envFiles = ['.env', '.env.local'];
  envFiles.forEach(file => {
    const envPath = path.join(__dirname, file);
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, 'utf-8');
        content.split('\n').forEach(line => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const match = trimmed.match(/^([^=]+)=(.*)$/);
            if (match) {
              const key = match[1].trim();
              let value = match[2].trim();
              if ((value.startsWith('"') && value.endsWith('"')) ||
                  (value.startsWith("'") && value.endsWith("'"))) {
                value = value.substring(1, value.length - 1);
              }
              process.env[key] = value;
            }
          }
        });
      } catch (err) {
        console.error(`Error reading ${file}:`, err);
      }
    }
  });
}

loadEnv();

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.warn('Warning: GEMINI_API_KEY not found in environment. Proxy will fail.');
}

// GP55-007: kill-switch — set GENERATION_ENABLED=false to block all generation
const generationEnabled = () => process.env.GENERATION_ENABLED !== 'false';

// GP55-007: in-memory daily quota counter (resets at midnight UTC)
// Tune DAILY_QUOTA_LIMIT via env; default 200 calls/day
const DAILY_QUOTA_LIMIT = parseInt(process.env.DAILY_QUOTA_LIMIT || '200', 10);
let dailyCount = 0;
let dailyWindowStart = todayUTCKey();

function todayUTCKey() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
}

function checkAndIncrementDailyQuota() {
  const today = todayUTCKey();
  if (today !== dailyWindowStart) {
    dailyWindowStart = today;
    dailyCount = 0;
  }
  if (dailyCount >= DAILY_QUOTA_LIMIT) return false;
  dailyCount++;
  return true;
}

// CO4-003: CORS allow-list — read from FRONTEND_ORIGIN env
// Multiple origins can be comma-separated: http://localhost:5173,https://myapp.com
const ALLOWED_ORIGINS = (process.env.FRONTEND_ORIGIN || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

function isOriginAllowed(origin) {
  if (!origin) return false;
  return ALLOWED_ORIGINS.includes(origin);
}

// GP55-003: maximum request body size (15 MB)
const MAX_BODY_BYTES = 15 * 1024 * 1024;

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------
const server = http.createServer((req, res) => {
  const origin = req.headers['origin'];

  // CO4-003: only echo allowed origins; reject everything else
  if (isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  } else if (origin) {
    // Origin present but not allowed — reject preflight immediately
    if (req.method === 'OPTIONS') {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    // For non-preflight cross-origin requests: continue but no CORS header
    // (browser will block the response)
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/api/generate') {
    // GP55-007: kill-switch check (re-read env at request time)
    if (!generationEnabled()) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'error_process', detail: 'Generation is currently disabled.' }));
      return;
    }

    // GP55-007: daily quota check
    if (!checkAndIncrementDailyQuota()) {
      res.writeHead(429, { 'Content-Type': 'application/json', 'Retry-After': '3600' });
      res.end(JSON.stringify({ error: 'error_quota', detail: 'Daily generation limit reached.' }));
      return;
    }

    // GP55-003: enforce body size limit
    let body = '';
    let bodyBytes = 0;

    req.on('data', chunk => {
      bodyBytes += chunk.length;
      if (bodyBytes > MAX_BODY_BYTES) {
        req.destroy();
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'error_payload', detail: 'Request body too large.' }));
        return;
      }
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const payload = JSON.parse(body);

        // Wave 2 will lock down model/contents/generationConfig fully.
        // For now: enforce model allow-list as a first gate.
        const MODEL_ALLOWLIST = new Set(['gemini-2.5-flash-image']);
        const model = MODEL_ALLOWLIST.has(payload.model) ? payload.model : 'gemini-2.5-flash-image';

        const googlePayload = JSON.stringify({
          contents: payload.contents,
          generationConfig: payload.generationConfig
        });

        // GP55-004: API key in header, not URL query string
        const options = {
          hostname: 'generativelanguage.googleapis.com',
          port: 443,
          path: `/v1beta/models/${model}:generateContent`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(googlePayload),
            'x-goog-api-key': API_KEY
          }
        };

        const googleReq = https.request(options, (googleRes) => {
          res.writeHead(googleRes.statusCode, { 'Content-Type': 'application/json' });
          googleRes.pipe(res);
        });

        googleReq.on('error', (e) => {
          console.error('Google API Request Error:', e);
          res.writeHead(500);
          res.end(JSON.stringify({ error: 'error_process' }));
        });

        googleReq.write(googlePayload);
        googleReq.end();
      } catch (e) {
        console.error('Error parsing request body:', e);
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'error_payload', detail: 'Invalid JSON.' }));
      }
    });
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

const PORT = process.env.BACKEND_PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend proxy server running on http://0.0.0.0:${PORT}`);
  console.log(`Generation enabled: ${generationEnabled()}`);
  console.log(`Daily quota limit: ${DAILY_QUOTA_LIMIT}`);
  console.log(`Allowed origins: ${ALLOWED_ORIGINS.join(', ') || '(none — set FRONTEND_ORIGIN env)'}`);
});
