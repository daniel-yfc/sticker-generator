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

const generationEnabled = () => process.env.GENERATION_ENABLED !== 'false';

const DAILY_QUOTA_LIMIT = parseInt(process.env.DAILY_QUOTA_LIMIT || '200', 10);
let dailyCount = 0;
let dailyWindowStart = todayUTCKey();

function todayUTCKey() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
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

const ALLOWED_ORIGINS = (process.env.FRONTEND_ORIGIN || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

function isOriginAllowed(origin) {
  if (!origin) return false;
  return ALLOWED_ORIGINS.includes(origin);
}

const MAX_BODY_BYTES = 15 * 1024 * 1024;

// ---------------------------------------------------------------------------
// GP55-001 / GP55-009: Server-owned model allowlist and prompt table
// ---------------------------------------------------------------------------
const DEFAULT_MODEL = 'gemini-2.5-flash-image';

const VARIATION_FRAGMENTS = {
  thumbs_up: 'Expression/Action: giving a thumbs up, cheerful.',
  laughing:  'Expression/Action: laughing heartily, mouth open, joyful.',
  surprised: 'Expression/Action: eyes wide open, surprised expression.',
  cool:      'Expression/Action: cool and confident, slight smirk.',
  default:   'Expression: Expressive and charismatic.',
};

const VALID_VARIATION_IDS = new Set(Object.keys(VARIATION_FRAGMENTS));

const STYLE_PROMPTS = {
  'chibi-anime':    { base: 'Chibi anime style, big expressive eyes, simplified cute proportions, vibrant colors', person: 'adorable chibi character' },
  'pixar-3d':       { base: 'Pixar/Disney 3D animation style, smooth surfaces, expressive face, warm lighting', person: 'charming 3D animated character' },
  'flat-vector':    { base: 'Flat vector illustration, bold outlines, minimal shading, clean geometric shapes', person: 'stylized flat vector person' },
  'watercolor':     { base: 'Watercolor painting style, soft edges, translucent washes, artistic brushwork', person: 'watercolor portrait character' },
  'comic-book':     { base: 'Comic book style, bold ink outlines, halftone shading, dynamic composition', person: 'comic book hero character' },
  'sticker-pop':    { base: 'Bold pop-art sticker style, high contrast colors, thick outlines, playful energy', person: 'pop-art sticker character' },
  'sketch':         { base: 'Hand-drawn pencil sketch style, expressive lines, cross-hatching, artistic texture', person: 'sketched portrait character' },
  'neon-cyberpunk': { base: 'Neon cyberpunk style, glowing edges, dark background elements, futuristic details', person: 'cyberpunk character with neon accents' },
  'minimalist':     { base: 'Minimalist style, simple clean lines, limited color palette, essential details only', person: 'minimalist stylized person' },
  'retro-cartoon':  { base: 'Retro cartoon style, vintage animation aesthetic, bold lines, classic cartoon proportions', person: 'retro cartoon character' },
  'oil-painting':   { base: 'Oil painting style, rich textured brushstrokes, classical portrait composition, depth', person: 'oil painted portrait character' },
  'emoji-style':    { base: 'Emoji/emoticon style, simple expressive face, bold outlines, bright flat colors', person: 'emoji-style face character' },
};

const VALID_STYLE_IDS = new Set(Object.keys(STYLE_PROMPTS));

function buildPrompt(styleId, variationId) {
  const style = STYLE_PROMPTS[styleId];
  const variationFragment = VARIATION_FRAGMENTS[variationId] || VARIATION_FRAGMENTS.default;
  const styleDescription = `${style.base}, depicting a ${style.person}`;

  return `Generate a high-quality die-cut sticker of the person in the provided image.

ART STYLE: ${styleDescription}.

CRITICAL INSTRUCTIONS:
1. TRANSFORM the subject into a stylistic illustration matching the Art Style.
2. DO NOT produce a realistic photo. The result must look like a drawing, painting, or 3D render.
3. SIMPLIFY details to match the sticker aesthetic.
4. Add a thick, clean WHITE BORDER surrounding the subject (die-cut style).
5. Use a solid white background.

${variationFragment}`;
}

// ---------------------------------------------------------------------------
// GP55-006: Server-side image validation (magic bytes, size, dimensions)
// ---------------------------------------------------------------------------
const MAX_IMAGE_BYTES_DECODED = 10 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 4096;

function detectMimeFromBytes(buf) {
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return 'image/png';
  if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return 'image/jpeg';
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
      buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) return 'image/webp';
  return null;
}

function getImageDimensions(buf, mimeType) {
  try {
    if (mimeType === 'image/png') {
      return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
    }
    if (mimeType === 'image/jpeg') {
      let i = 2;
      while (i < buf.length - 8) {
        if (buf[i] !== 0xFF) break;
        const marker = buf[i + 1];
        const len = buf.readUInt16BE(i + 2);
        if (len < 2) break;
        if ((marker >= 0xC0 && marker <= 0xC3) || (marker >= 0xC5 && marker <= 0xC7) ||
            (marker >= 0xC9 && marker <= 0xCB) || (marker >= 0xCD && marker <= 0xCF)) {
          return { width: buf.readUInt16BE(i + 7), height: buf.readUInt16BE(i + 5) };
        }
        i += 2 + len;
      }
    }
    return { width: 0, height: 0 };
  } catch {
    return { width: 0, height: 0 };
  }
}

function validateImage(base64Data) {
  let buf;
  try {
    buf = Buffer.from(base64Data, 'base64');
  } catch {
    throw { status: 400, code: 'error_payload', detail: 'Invalid base64 image data.' };
  }

  if (buf.length < 12) {
    throw { status: 400, code: 'error_payload', detail: 'Image data too short to be valid.' };
  }
  if (buf.length > MAX_IMAGE_BYTES_DECODED) {
    throw { status: 413, code: 'error_payload', detail: `Image too large. Max ${MAX_IMAGE_BYTES_DECODED / 1024 / 1024} MB decoded.` };
  }

  const mimeType = detectMimeFromBytes(buf);
  if (!mimeType) {
    throw { status: 400, code: 'error_payload', detail: 'Unsupported image format. Use PNG, JPEG, or WebP.' };
  }

  const { width, height } = getImageDimensions(buf, mimeType);
  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    throw { status: 400, code: 'error_payload', detail: `Image dimensions too large. Max ${MAX_IMAGE_DIMENSION}px per side.` };
  }

  return { mimeType };
}

// ---------------------------------------------------------------------------
// Server factory — exported for test harness
// ---------------------------------------------------------------------------
function createApp() {
  return http.createServer((req, res) => {
    const origin = req.headers['origin'];

    if (isOriginAllowed(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    } else if (origin) {
      if (req.method === 'OPTIONS') {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }
    }

    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method === 'POST' && req.url === '/api/generate') {
      if (!generationEnabled()) {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'error_process', detail: 'Generation is currently disabled.' }));
        return;
      }

      if (!checkAndIncrementDailyQuota()) {
        res.writeHead(429, { 'Content-Type': 'application/json', 'Retry-After': '3600' });
        res.end(JSON.stringify({ error: 'error_quota', detail: 'Daily generation limit reached.' }));
        return;
      }

      let body = '';
      let bodyBytes = 0;
      let bodyTooLarge = false;

      req.on('data', chunk => {
        if (bodyTooLarge) return;
        bodyBytes += chunk.length;
        if (bodyBytes > MAX_BODY_BYTES) {
          bodyTooLarge = true;
          res.writeHead(413, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'error_payload', detail: 'Request body too large.' }));
          req.destroy();
          return;
        }
        body += chunk.toString();
      });

      req.on('end', () => {
        if (bodyTooLarge) return;

        try {
          const payload = JSON.parse(body);
          const { imageBase64, styleId, variationId } = payload;

          if (!imageBase64 || typeof imageBase64 !== 'string') {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'error_payload', detail: 'Missing imageBase64.' }));
            return;
          }

          if (!styleId || !VALID_STYLE_IDS.has(styleId)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'error_payload', detail: `Unknown styleId: ${styleId}` }));
            return;
          }

          const safeVariationId = VALID_VARIATION_IDS.has(variationId) ? variationId : 'default';

          let validatedMimeType;
          let cleanBase64;
          try {
            cleanBase64 = imageBase64.startsWith('data:')
              ? imageBase64.slice(imageBase64.indexOf(',') + 1)
              : imageBase64;
            const result = validateImage(cleanBase64);
            validatedMimeType = result.mimeType;
          } catch (validationError) {
            res.writeHead(validationError.status || 400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: validationError.code || 'error_payload', detail: validationError.detail }));
            return;
          }

          const prompt = buildPrompt(styleId, safeVariationId);

          const googlePayload = JSON.stringify({
            contents: {
              parts: [
                { text: prompt },
                { inlineData: { mimeType: validatedMimeType, data: cleanBase64 } }
              ]
            },
            generationConfig: { imageConfig: { aspectRatio: '1:1' } }
          });

          const options = {
            hostname: 'generativelanguage.googleapis.com',
            port: 443,
            path: `/v1beta/models/${DEFAULT_MODEL}:generateContent`,
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
            if (!res.headersSent) {
              res.writeHead(500);
              res.end(JSON.stringify({ error: 'error_process' }));
            }
          });

          googleReq.write(googlePayload);
          googleReq.end();

        } catch (e) {
          console.error('Error parsing request body:', e);
          if (!res.headersSent) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'error_payload', detail: 'Invalid JSON.' }));
          }
        }
      });
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });
}

// Allow test harness to import without triggering listen
if (require.main === module) {
  const PORT = process.env.BACKEND_PORT || 3001;
  const server = createApp();
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend proxy server running on http://0.0.0.0:${PORT}`);
    console.log(`Generation enabled: ${generationEnabled()}`);
    console.log(`Daily quota limit: ${DAILY_QUOTA_LIMIT}`);
    console.log(`Allowed origins: ${ALLOWED_ORIGINS.join(', ') || '(none — set FRONTEND_ORIGIN env)'}`);
    console.log(`Valid styles: ${[...VALID_STYLE_IDS].join(', ')}`);
  });
}

module.exports = { createApp };
