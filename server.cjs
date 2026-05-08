const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

/**
 * Simple environment variable loader for .env and .env.local files
 */
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

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.warn('Warning: GEMINI_API_KEY not found in environment. Proxy may fail.');
}

const server = http.createServer((req, res) => {
  // CORS headers for development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/api/generate') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const model = payload.model || 'gemini-2.5-flash-image';

        const googlePayload = JSON.stringify({
          contents: payload.contents,
          generationConfig: payload.generationConfig
        });

        const options = {
          hostname: 'generativelanguage.googleapis.com',
          port: 443,
          path: `/v1beta/models/${model}:generateContent?key=${API_KEY}`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(googlePayload)
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
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
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
});
