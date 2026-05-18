# Backlog of 'Sticker-Generator"
**Date: 2026-05-19**

## Severity Definitions
| Severity | Definition |
|---|---|
| 🔴 **Critical** | P0 launch gate. Must be resolved before the app is reachable on the public internet. Includes both proven high-impact issues and "unbounded risk + cheap fix + public deployment" cases. |
| 🟠 **High** | Significant impact on cost, security, UX, or correctness. Must be resolved before launch, or immediately after in a fast-follow sprint. |
| 🟡 **Medium** | Design quality, maintainability, or operational gaps. Post-launch hardening. |
| 🔵 **Low** | Monitoring, documentation, polish, or long-term maintenance. |

## Launch Blocker Subset Summary

| Tier | Count | Action |
|---|---|---|
| 🔴 Critical (Launch Blocker = Y) | 10 | Must close before any public deploy |
| 🟠 High (Launch Blocker = Y) | 16 | Must close before launch or immediately after |
| **Launch Blocker total** | **26** | |
| 🟡 Medium | 28 | Post-launch hardening |
| 🔵 Low | 15 | Long-term maintenance |
| **Grand total** | **69** | |

## Calibration Notes 
** Transparency on three-round disagreements **, which **CO4** is 'Claude Opus 4.7', **DS4** is 'DeepSeek Pro V4' and **GP55** is ChatGPT 5.5.

- **CO4-013** is rated Critical under the **P0-launch-gate** definition. Under a strict impact-severity definition (GP55's preferred framing), it would be High. The substantive controls and fix priority are identical either way; only the label differs. If this backlog is merged with one using strict impact severity, downgrade to High.
- **CO4-002** severity is conditional on GP55-002 (server-side limiter) shipping in the same sprint. If GP55-002 slips, escalate CO4-002 to High.
- **GP55-011** is rated High but carries an upgrade trigger: if the post-fix A/B test shows materially degraded Gemini output, future similar "generation input pollution" bugs should be classified Critical.
- **DS4-12** (prompt-level safety prefix) is retained as Medium, but the layered model (GP55-008A + GP55-008B + GP55-006) is the actual safety control; the prompt prefix is one cheap layer, not the boundary.

## Full Backlog
** Frozen. ** 
No further revisions to severity, scope, or wording without explicit user direction.
This list is the authoritative backlog output of the five-round CO4 / DS4 / GP55 review dialogue.

| # | Severity | Launch Blocker | Issue | Files | Action | Rationale |
|---|---|---|---|---|---|---|
| GP55-001 | 🔴 Critical | Y | Backend is a thin unauthenticated proxy that trusts client-provided `model`, `contents`, and `generationConfig`. Client can swap to a more expensive model or inject arbitrary prompt content | `server.cjs`, `services/geminiService.ts` | Redesign proxy contract: backend accepts only `{ imageBase64, styleId, variationId }`, validates server-side, builds prompts server-side, enforces a model allow-list (`new Set(['gemini-2.5-flash-image'])`) | Root-cause item identified by all three reviewers. Fixing this absorbs the threats behind CO4-001, CO4-008, GP55-006, and GP55-009 |
| GP55-002 | 🔴 Critical | Y | No server-side rate limiting. The `localStorage`-based limiter can be bypassed via incognito, storage clear, or direct proxy calls | `server.cjs`, `utils/rateLimit.ts` | Add per-IP token bucket on the server (suggested: 5/min, 50/day). In-memory `Map<IP, {count, windowStart}>` is sufficient for single instance. Return 429 + `Retry-After`. Keep client limiter as UX hint only | Under public deployment, this is the direct Gemini quota theft vector |
| GP55-003 | 🔴 Critical | Y | No request body size limit on proxy. `body += chunk.toString()` accumulates without bound → memory exhaustion DoS | `server.cjs` | Cap body at ~15 MB. On overflow: `req.destroy()` and return 413 | Same attack surface as GP55-002 (unauthenticated paid endpoint), different vector (resource exhaustion vs. quota theft) |
| GP55-004 (= CO4-028, DS4-2) | 🔴 Critical | Y | API key is sent as `?key=${API_KEY}` in the URL query string. Can leak through logs, traces, proxies, monitoring tools, and error reports — not over the wire under TLS, but at every observability hop | `server.cjs` | Use `headers: { 'x-goog-api-key': API_KEY }` and strip `?key=` from the request path. If historical logs may have captured prior URLs, rotate the key | Initially rated Medium in Round 1; GP55 corrected the leak-channel wording in Round 2. One-line fix, unbounded blast radius if missed |
| GP55-005 (= CO4-006) | 🔴 Critical | Y | `.gitignore` does not explicitly exclude `.env` (only `*.local`), but `server.cjs`'s `loadEnv()` reads `.env`. A contributor accidentally committing `.env` would leak the API key | `.gitignore`, `.env.example` (new) | Add `.env`, `.env.*`, and `!.env.example` rules. Ship `.env.example` with `GEMINI_API_KEY=` and `BACKEND_PORT=3001`. Run a secret scan on git history; rotate if any prior leak found | A committed key is unrecoverable — rotation is the only remedy |
| GP55-007 | 🔴 Critical | Y | No hard cost controls. Cloud billing alerts are detection lag, not enforcement | `server.cjs`, deployment env | Three-layer protection: (a) server-side daily/global quota — reject with 429 when exceeded; (b) `GENERATION_ENABLED=false` env kill switch readable at request time; (c) Google Cloud API key quota as the upstream backstop | GP55 in Round 2 correctly noted that alerts are notifications, not caps. All three layers are required |
| GP55-008A | 🔴 Critical | Y | `safetySettings` is not sent to Gemini, and `promptFeedback.blockReason` is not inspected. The app relies on Gemini defaults (which may be too permissive) and shows only a generic "blocked" message to users | `server.cjs`, `services/geminiService.ts`, `hooks/useAppState.ts` | (a) Explicit `safetySettings` in the request, setting thresholds per `HARM_CATEGORY_*`. (b) Parse `promptFeedback.blockReason` and map to specific i18n keys (e.g. `error_safety_sexual`, `error_safety_violence`) with a safe generic fallback | DS4 in Round 3 correctly split the original GP55-008 into blocking-path (this item) and monitoring-path (GP55-008B). This item determines whether harmful content is generated and whether users get accurate rejection feedback |
| GP55-011 | 🟠 High *(upgrade trigger present)* | Y | `ImageEditor.tsx`'s `handleConfirm()` calls `toDataURL` on the **display canvas**, which includes the `transparent-grid` checkerboard background and the dashed indigo guide circle. These UI artifacts are base64-encoded and sent to Gemini on every paid call | `components/ImageEditor.tsx` | (1) **Immediately** separate display canvas from export canvas: create an off-screen canvas drawing only the transformed source image — no grid, no overlay. (2) After the fix, run a 5–10 image before/after A/B to quantify output quality difference. (3) If the A/B shows material output pollution, classify future "generation input pollution" bugs as Critical. **A/B does not block the fix.** | DS4 in Round 3 verified the bug by reading the file. GP55 in Round 4 corrected the "cost amplification" wording (image APIs are not priced linearly on visual noise). GP55 in Round 5 corrected the sequencing (don't gate the fix on A/B) |
| CO4-013 | 🔴 Critical *(P0-gate definition; strict-impact = High — see Calibration Notes)* | Y | `setErrorMessage(t(error.message))` passes raw upstream error strings through `t()`. When no translation key matches, `t()` returns the input verbatim, rendering arbitrary upstream text directly in the DOM. Root cause: using `Error.message` as a protocol field is wrong design | `hooks/useAppState.ts`, `services/geminiService.ts`, `server.cjs`, `constants.ts` | **Short term (immediate)**: allow-list lookup — `const KNOWN = new Set(['error_invalid_input','error_rate_limit','error_quota','error_auth','error_safety','error_timeout','error_upstream','error_no_image','error_process']); const key = KNOWN.has(error.message) ? error.message : 'error_process';`. **Medium term (same sprint as GP55-013 / GP55-013A)**: backend returns `{ code, publicKey, retryable, requestId }`; frontend renders only `t(error.publicKey \|\| 'error_process')`. Stop using `error.message` as a protocol field entirely | GP55 in Round 4 required removing the unverifiable "Gemini errors have leaked secrets" claim. Rated Critical under P0-launch-gate definition: (a) attack surface fully outside app control, (b) one-line short-term fix, (c) converges with GP55-013 / GP55-013A as one structural refactor. Methodological dissent (GP55 prefers High under strict impact severity) is disclosed in the Calibration Notes |
| CO4-003 (= DS4-7) | 🔴 Critical | Y | Proxy uses wildcard CORS (`Access-Control-Allow-Origin: *`). Under independent-host deployment, any website can trigger paid calls from the user's browser | `server.cjs` | Read `FRONTEND_ORIGIN` from env. Echo only listed origins; reject unlisted preflight requests | Deployment target confirmed as independent host, so Critical is unconditional |
| GP55-001 (sub) / DS4-10 | 🟠 High | Y | `validateImageDimensions()` is defined but never called. A 16000×16000 PNG can flow into the canvas editor (freezing the browser tab via OOM) and then to Gemini, wasting a paid call | `hooks/useAppState.ts`, `utils/validation.ts` | In `handleFileSelect`, after `FileReader` loads the image, call `validateImageDimensions(reader.result)`. Reject with a user-facing error if dimensions exceed 4096px. Server-side validation (GP55-006) is the authoritative layer | DS4 in Round 1 found the dead-validation issue. DS4 in Round 5 added the browser-OOM context. High is correct — GP55-006 backstops it from being Critical |
| GP55-006 | 🟠 High | Y | Backend does not validate image MIME, base64, dimensions, or magic bytes. Frontend validation is insufficient under the "client cannot be trusted" principle | `server.cjs` | Server-side: decode base64, verify PNG/JPEG/WebP magic bytes, check size and dimensions, reject malformed payloads before calling Gemini | Same architectural fix lineage as GP55-001. Without it, a hostile client can send arbitrary binary to Gemini |
| DS4-8 (= GP55-021) | 🟠 High | Y | `generateStickerSet` ends with `Promise.all(results)`. If any single variation fails, the whole set is discarded — user paid for 1–3 successful generations and sees nothing | `services/geminiService.ts`, `hooks/useAppState.ts`, `components/StickerSetView.tsx` | Replace with `Promise.allSettled`. Return successful results + indices of failures. UI shows partial success with retry option for failed variations | CO4 missed this entirely in Round 1. User-visible UX + cost issue |
| CO4-008 | 🟠 High | Y | An unauthenticated paid endpoint is callable cross-origin by any site. Framing is "cross-origin abuse of an unauthenticated paid endpoint" — not classical CSRF (there is no session/cookie auth to abuse) | `server.cjs` | Pair with CO4-003: require a custom header (e.g. `X-Requested-With: sticker-maker`) and reject requests without it. CAPTCHA is handled by GP55-015 | GP55 in Round 2 corrected the CSRF framing. Controls are the same (origin check + custom header + rate limit), but the mental model must be right to avoid useless "CSRF token" fixes |
| CO4-012 | 🟠 High | Y | Race condition in `handleGenerate`: after `generateSticker` resolves, an `Image()` is created to validate the data URL via `onload`/`onerror`. If the user clicks Reset before decode completes, the stale `onload` still fires and flips status back to SUCCESS | `hooks/useAppState.ts` | Introduce a `generationIdRef` or `AbortController`. On `onload`, compare the captured id with the current ref; ignore if mismatched | Identified in Round 1, no disagreement |
| CO4-014 (= DS4-6, GP55-023) | 🟠 High | Y | No CI. `.github/workflows/` does not exist. PRs and pushes run no automated lint, typecheck, test, or build | `.github/workflows/ci.yml` (new) | Workflow: `npm ci` → lint → `tsc --noEmit` → `vitest run` → `vite build`. Enable Dependabot | Baseline requirement for any project beyond solo localhost |
| GP55-012 | 🟠 High | Y | README claims do not match code: "3 stickers per set" but code generates 4; "512×512 verified" is not actually verified; the obsolete `GEMINI_API_KEY → process.env.API_KEY` mapping note contradicts current `vite.config.ts` | `README.md`, `README_zh.md`, `hooks/useAppState.ts` or `constants.ts` | Correct three places: align the set-size claim (4 in code, or shrink code to 3); remove the unverified 512×512 claim; rewrite the env-var section to match reality | Credibility issue for portfolio; onboarding trap for contributors |
| GP55-013 | 🟠 High | Y | Error handling lacks operational taxonomy. No internal error code, retryability flag, request ID, or localized public message mapping | `server.cjs`, `services/geminiService.ts`, `hooks/useAppState.ts`, `constants.ts`, `types.ts` | Define error taxonomy: `{ code, retryable, requestId, publicKey }`. Frontend uses `publicKey` for i18n. Backend uses `code` for retry/log/alert routing | Pairs with CO4-013 (negative — prevent raw leak) and GP55-013A (positive — populate the structure). Converges with CO4-013 medium-term fix |
| GP55-013A | 🟠 High | Y | `server.cjs` flattens all upstream errors to `500 + {error: 'error_process'}`. Upstream 401/429/503 distinctions are lost, so client cannot distinguish auth failure from quota exhaustion from upstream degradation | `server.cjs` | In the `googleRes` callback, read `statusCode` and map: 401→`error_auth`, 403→`error_auth`, 429→`error_quota`, 408/504→`error_timeout`, 5xx→`error_upstream`, default→`error_process`. Return mapped code alongside status | DS4 in Round 5 identified this concrete implementation gap. Prerequisite for CO4-013's allow-list to be meaningful — without status mapping, all errors are `error_process` and the i18n surface collapses |
| GP55-014 | 🟠 High | Y | Proxy has no upstream timeout/cancellation. Client may disconnect, but server keeps paying for the upstream call | `server.cjs` | Wrap upstream `https.request` with `AbortController` and a 60s timeout. On timeout, return 504. Detect `req.on('close')` from the client and abort the upstream request | CO4 in Round 1 found only the client-side timeout; missed server-side |
| GP55-015 | 🟠 High | Y | Public deployment has no auth, no CAPTCHA, no abuse friction. Any visitor can trigger sticker-set generation (4× cost per click) | `server.cjs`, frontend, deployment | Add Cloudflare Turnstile (or equivalent lightweight CAPTCHA) before generation, especially before sticker-set generation. Consider basic OAuth or session if user history matters | Deployment confirmed as independent host, so unconditionally High. Pairs with GP55-002 and CO4-003 to close the unauthenticated-endpoint attack surface |
| CO4-025 (= GP55-009 test subset) | 🟠 High | Y | The 12 styles' prompts have no invariant/snapshot tests. A developer editing `constants.ts` can silently break required guardrail clauses ("sticker", "WHITE BORDER", "DO NOT produce a realistic photo") | `utils/promptBuilder.test.ts`, `constants.test.ts` | (a) Snapshot every style's rendered prompt. (b) Assert all 12 rendered prompts contain required guardrail substrings. (c) Schema assertion: every style has `basePrompt` and `modifiers.person` | DS4 in Round 3 correctly identified that this is the right drift-detection mechanism for GP55-009, without requiring server-side prompt assembly |
| CO4-009 (= GP55-010) | 🟡 Medium | N | `variationPrompt: string` parameter type is too loose. No user input flows into it today, but there is no structural barrier preventing a future contributor from wiring free-text input into the variation parameter | `types.ts`, `utils/promptBuilder.ts`, `services/geminiService.ts`, `hooks/useAppState.ts` | Change to `type VariationId = 'thumbs_up' \| 'laughing' \| 'surprised' \| 'cool'`. `buildStickerPrompt` maps the ID to a canonical fragment internally | DS4 in Round 3 correctly downgraded to Medium — prerequisite for GP55-001's backend variation-ID validation, not a standalone threat |
| GP55-008B | 🟡 Medium | N | `safetyRatings` per-category probability scores are not logged. No aggregate trend monitoring possible | `server.cjs`, observability | Structured JSON log per call recording the four `HARM_CATEGORY_*` ratings. Forward to log aggregator for dashboards. Do **not** use ratings as blocking signals (LOW/MEDIUM ratings are normal for human-subject generations) | DS4 in Round 3 correctly separated this from the blocking path (GP55-008A). Monitoring concern, not user-facing logic |
| GP55-009 (architectural part) | 🟡 Medium | N | Prompt assembly is client-side. No prompt-versioning mechanism — A/B testing or hot-fixing prompts requires SPA redeploy + cache invalidation | Move `utils/promptBuilder.ts` to server | Eventually move prompt assembly to the server, add a `promptVersion` field | DS4 in Round 3 correctly noted this is product-agility, not security. CO4-025 (snapshot tests) is the actual security/drift solution |
| GP55-016 | 🟡 Medium | N | `validateFile()` is called in FileUpload but `handleFileSelect` does not re-validate. Validation usage is inconsistent across the upload flow | `components/FileUpload.tsx`, `hooks/useAppState.ts`, `utils/validation.ts` | Unify validation entry at `handleFileSelect`: call both `validateFile` and `validateImageDimensions`. Client is UX; server (GP55-001/006) is enforcement | Complements GP55-001/006 — client catches early, server is authoritative |
| GP55-017 | 🟡 Medium | N | `localStorage` stores full base64 sticker history. 5MB quota is exhausted quickly | `hooks/useAppState.ts`, `components/StickerHistory.tsx` | (a) Cap history count (e.g. 50 entries). (b) Catch `QuotaExceededError` and trim oldest. (c) Consider IndexedDB for blobs, keep thumbnails only in `localStorage` | All three reviewers agreed in Round 1 |
| CO4-022 (= GP55-018) | 🟡 Medium | N | `validateLocalStorageData()` exists but the `useAppState` write path never calls it | `hooks/useAppState.ts`, `utils/validation.ts` | Call the validator before each `setItem`. On failure, trim oldest entries and retry | Same pattern as DS4-10 — validator exists but is not wired |
| GP55-019 | 🟡 Medium | N | CSP `connect-src` still allows direct browser connections to Gemini, but the proxy is the intended path. Weak defense-in-depth | `index.html` | Remove `https://generativelanguage.googleapis.com` from `connect-src`. Browser should only connect to the proxy | An XSS that escapes `script-src` would otherwise be able to exfil to Google directly |
| GP55-020 | 🟡 Medium | N | No privacy/consent notice before uploading face photos. GDPR and general ethics gap | `App.tsx`, `components/FileUpload.tsx`, `README.md` | Pre-upload notice: images are sent to Google Gemini for processing; service does not retain. Link to privacy details | Independent host deployment may face GDPR exposure for EU visitors |
| GP55-022 | 🟡 Medium | N | No cancel button during generation. Users can only wait for the 70s UI timeout | `hooks/useAppState.ts`, `services/geminiService.ts`, `components/ProcessingView.tsx` | Wire `AbortController` from frontend through proxy. Show "Cancel" button in `ProcessingView` | Shares `AbortController` infrastructure with GP55-014 |
| CO4-011 (= DS4-21) | 🟡 Medium | N | No retry/backoff — any 5xx is terminal. If retry is added without coordinating timeouts across the layers, the server will keep paying while the client has already disconnected | `server.cjs` (preferred), with coordinated changes in `services/geminiService.ts` and `hooks/useAppState.ts` | (1) Server-side retry: max 1–2 attempts, only for 5xx and 429-with-`Retry-After`. Jittered backoff 200ms → 400ms. (2) **Timeout budget coordination**: server's upstream call 25s × max 2 attempts + backoff ≤ 50s total. Client `withTimeout` 60s (covers server total + network). UI timeout 70s (covers client + render buffer). (3) On `req.on('close')`, abort the upstream retry loop | GP55 in Round 2 cautioned that retries on paid calls can amplify cost. DS4 in Round 5 identified the timeout-coordination gap. Without coordination, retries themselves become a cost vector |
| CO4-019 (= DS4-5, GP55-024) | 🟡 Medium | N | `build` and `test` scripts do not include `tsc --noEmit`. TypeScript errors can ship silently | `package.json`, `tsconfig.json` | Add `"typecheck": "tsc --noEmit"`. Change `"build": "tsc --noEmit && vite build"`. Enforce in CI | All three reviewers agreed |
| CO4-029 (= DS4-18, GP55-028) | 🟡 Medium | N | No ESLint, no Prettier, no automated `npm audit` | `eslint.config.js` (new), `.prettierrc` (new), `package.json` | Adopt `@typescript-eslint` + `eslint-plugin-react` recommended. Wire into CI (CO4-014) | All three reviewers agreed |
| GP55-025 | 🟡 Medium | N | TypeScript `strict` is not enabled | `tsconfig.json` | Enable incrementally: `noImplicitAny` → `strictNullChecks` → full `strict`. Schedule the cleanup; do not do it in one PR | Flipping all flags at once surfaces 50+ errors in a project this size |
| CO4-015 (= GP55-027) | 🟡 Medium | N | The entire `coverage/` directory is committed | `coverage/`, `.gitignore` | `git rm -r --cached coverage/`. Add `coverage/` to `.gitignore`. Generate in CI instead | All three reviewers agreed. Committed build artifacts are an anti-pattern |
| CO4-016 (= DS4-9, GP55-026) | 🟡 Medium | N | `@playwright/test` is in `dependencies`. Production installs pull ~150MB Chromium and expand the dependency attack surface | `package.json` | Move to `devDependencies` | GP55 in Round 2 corrected the "bundle bloat" framing — Vite tree-shakes; the real harm is install bloat and Chromium download |
| CO4-017 | 🟡 Medium | N | `dev` script uses POSIX-only `&`. Breaks on Windows. No `start` script for production | `package.json` | Use `concurrently` or `npm-run-all -p`. Add `"start": "node server.cjs"` | Identified in Round 1, no disagreement |
| CO4-018 | 🟡 Medium | N | No `engines` field. README says Node 18+, but it is not enforced | `package.json` | Add `"engines": { "node": ">=18.18" }` | Identified in Round 1, no disagreement |
| CO4-020 | 🟡 Medium | N (but parallel to Critical fixes) | No Dockerfile / platform deployment config. `vite preview` does not start the proxy. Production deployment path is undefined | `Dockerfile` (new) | Multi-stage build: build SPA → Node serving static `dist` + `/api/*` proxy. **DS4 in Round 5 correctly noted: this should run in parallel with Critical fixes, not after, since none of the Critical fixes can be deployed without it** | Severity reflects risk; sequencing puts it in parallel with the Critical sprint |
| CO4-023 | 🟡 Medium | N | Agent-residue files in repo root: `fix-tests.cjs`, `plan_step_complete.cjs`, `run_submit.js`, `test_canvas.cjs/js`, `test-canvas.html`, `test-canvas-perf.js`, `measure_canvas_pattern.ts`, and 12 `verify_style*.py` files under `verification/` | repo root, `verification/` | Move to `scripts/` or delete. These signal AI-agent provenance | Tell-tales for portfolio review |
| CO4-026 | 🟡 Medium | N | `server.cjs` has zero test coverage despite carrying all cost/security logic | `server.test.cjs` (new) | Test: body-size limit, model allow-list, CORS, rate limit, error propagation, AbortController behavior | Once added, becomes a CI gate |
| CO4-027 | 🟡 Medium | N | `@playwright/test` is declared but no E2E tests exist | `e2e/` (new) | At least one happy-path E2E: upload → edit → generate → download (with mocked proxy) | Pairs with CO4-016 |
| CO4-031 (= DS4-16) | 🟡 Medium | N | `FileUpload.tsx` uses `alert()` for file-too-large errors — jarring against the rest of the UI. Also: hardcoded Chinese string in `ProcessingView.tsx` bypasses translations | `components/FileUpload.tsx`, `constants.ts` (translations), `components/ProcessingView.tsx` | Inline error state. Move the `ProcessingView` Chinese string into `TRANSLATIONS` under a new key | Handles two i18n/UX issues together |
| CO4-033 (= DS4-15) | 🟡 Medium | N | Icon-only buttons lack `aria-label`. History/gallery `<img>` tags lack `alt`. Accessibility gap | `components/FileUpload.tsx`, `components/StickerHistory.tsx`, `components/Gallery.tsx`, `components/ImageEditor.tsx`, `components/ResultDisplay.tsx`, `App.tsx` | Add `aria-label` to every icon-only button. Add descriptive `alt` to every `<img>`. Add axe-core to CI | All three reviewers agreed |
| DS4-11 (conditional) | 🟡 Medium | N | No style anchoring across sticker-set variations. Visual consistency across the set is not guaranteed | `utils/promptBuilder.ts` | First land CO4-025 snapshot tests and GP55-010 stable variation IDs. Then verify whether `gemini-2.5-flash-image` actually supports a seed parameter before committing to seed-based consistency | GP55 in Round 2 correctly cautioned against feeding the first generated image back as a reference (cost doubling, bad-first-result contagion). Seed support requires empirical verification |
| DS4-17 | 🟡 Medium | N | CSP includes `'unsafe-inline'` for scripts in production | `index.html`, hosting config | Production options: (a) accept `'unsafe-inline'` for `style-src` only, keep `script-src` strict with hashes; (b) nonce-based approach with `vite-plugin-csp`; (c) document the trade-off explicitly. Tailwind 4's inline-style usage makes a fully strict CSP impractical | DS4 in Round 5 added the implementation-context detail. Trade-off must be documented either way |
| CO4-032 (= GP55-029) | 🟡 Medium | N | Multiple hardcoded English strings in `App.tsx` (`GO! (Single)`, `Editing`, `Processing`, `Result`, `Preview`, `Popular Styles`, `View All`) bypass i18n | `App.tsx`, `constants.ts` | Extract all to `TRANSLATIONS`. Provide all three locales | All three reviewers agreed |
| DS4-12 | 🟡 Medium | N | Prompt does not include an anti-photorealism system prefix | `utils/promptBuilder.ts` | Add prefix: `"Generate stylized, non-photorealistic sticker illustrations; do not output realistic photos."` Treat as one cheap layer, not the safety boundary | GP55 in Round 2 corrected the wording (original "reject realistic human depiction" conflicted with app purpose). The actual safety controls are GP55-008A + GP55-006 |
| CO4-002 | 🟡 Medium *(escalate to High if GP55-002 slips)* | N | `RateLimiter.check()` has outer try/catch, but on `localStorage` failure (`QuotaExceededError`, Safari ITP private mode, disabled storage) it fails open — returns `allowed: true`, letting requests bypass the client-side throttle | `utils/rateLimit.ts` | On `localStorage` failure, fall back to a module-level in-memory `Map` limiter. `logger.warn` the degradation event; **do not surface to the user** (avoids Safari private-mode users seeing a confusing "service degraded" message; avoids exposing internal control state) | GP55 in Round 4 corrected the wording (try/catch exists; the issue is fail-open). GP55 in Round 5 corrected the fix choice (in-memory fallback + silent log, not fail-closed + user-visible). server-side limiter (GP55-002) is the actual security boundary |
| CO4-005 | 🔵 Low | N | No Google Cloud billing alerts configured | Google Cloud Console | Set alerts at $5 / $10 / $20 thresholds. Alerts are a late-detection layer, not enforcement | GP55-007 already covers the enforcement layer (quotas + kill switch). This is the monitoring complement |
| CO4-021 | 🔵 Low | N | `server.cjs` uses hand-rolled `https.request`. Will rot as Gemini API shapes evolve | `server.cjs`, `package.json` | After all Critical/High items close and the proxy contract stabilizes, migrate to the `@google/genai` SDK | All three reviewers converged in Round 3: SDK migration is a maintenance concern, not a security control. Should not block launch if the raw REST path is properly hardened |
| CO4-024 | 🔵 Low | N | No LICENSE file. Repository is technically not redistributable | `LICENSE` (new) | Add MIT (or chosen OSS license). Reference in README | GP55 in Round 2 correctly noted this is not a runtime/security item. Still matters for portfolio |
| CO4-030 (= GP55-030) | 🔵 Low | N | Default language hardcoded to `zh-TW`. Does not detect browser locale | `hooks/useAppState.ts` | Match against supported locales via `navigator.language`, fallback `zh-TW`. Persist user override to `localStorage` | UX polish |
| CO4-034 (= GP55-021 sub) | 🔵 Low | N | Sticker set generation gives no per-item progress (1/4, 2/4, …). User waits ~4× single-generation time blind | `services/geminiService.ts`, `hooks/useAppState.ts`, `components/ProcessingView.tsx` | `throttledMap` yields per-image. UI updates incrementally | Shares infrastructure with DS4-8 / GP55-021's partial-failure handling |
| CO4-035 (narrowed) | 🔵 Low | N | `StickerHistory.tsx` downloads use filename `sticker-${id}.png` — lacks style/timestamp metadata. (Single-result downloads in `ResultDisplay` already include these) | `utils/download.ts`, `components/StickerHistory.tsx` | Change to `sticker-pro-${styleId}-${timestamp}.png`, consistent with single-result downloads | GP55 in Round 2 correctly narrowed my Round-1 over-broad claim |
| CO4-036 | 🔵 Low | N | CSP is delivered via `<meta>` tag. Cannot enforce `frame-ancestors` or `report-uri` | `index.html`, hosting config | In production, deliver CSP via HTTP header from the hosting layer | GP55 in Round 2 correctly placed this as hardening, not launch blocker |
| CO4-037 | 🔵 Low | N | `validateAndExtractImageData` only validates the first 100 base64 characters — security theatre | `services/geminiService.ts` | Either full-string validation (length divisible by 4, allowed charset, non-quadratic), or remove the partial check and rely on the upstream | Partial validation produces false confidence |
| CO4-038 | 🔵 Low | N | No "report bad result" UI. Prompt drift in production is invisible | `components/ResultDisplay.tsx` | Thumbs-down + comment field. Log `styleId` + `variationId` of bad results | GP55 in Round 2 correctly placed this as product improvement, not readiness |
| CO4-039 | 🔵 Low | N | `modifiers.object` and `modifiers.landscape` are defined for every style but never used. Only `.person` is referenced in `promptBuilder` | `constants.ts`, `types.ts`, `utils/promptBuilder.ts` | Either delete the unused modifiers or wire them up via a subject-type selector. Do not leave dormant | Dead modifiers are a refactor trap |
| CO4-040 | 🔵 Low | N | README makes no statement on EXIF handling. Canvas re-encode probably strips EXIF but this is not verified | `utils/imageUtils.ts`, `README.md` | Test image with known EXIF → run through ImageEditor export path → inspect output. Once verified, document in README's privacy section | GP55 in Round 2 correctly required evidence-based privacy claims |
| DS4-19 | 🔵 Low | N | Proxy has no structured request logging | `server.cjs` | JSON log per call: timestamp, IP hash, status, latency, endpoint. Output to stdout for cloud log collection. **Never log API key or full image payload** | Complements GP55-013's error taxonomy on the observability side |
| DS4-20 (= CO4-010) | 🔵 Low | N | Network errors (DNS, timeout, 5xx) all map to generic `error_process`. UI cannot distinguish | `services/geminiService.ts` | Check `error.name === 'TypeError'` (fetch network failure) vs. others. Map to `error_network`, `error_server`, `error_process` | Subsumed under GP55-013's taxonomy work |
| DS4-22 | 🔵 Low | N | "Magic Wand" button name is misleading — the operation is a white-pixel-to-alpha filter, not AI | `components/ResultDisplay.tsx`, translation keys in `constants.ts` | Rename translation keys from `btn_magic_wand` to `btn_remove_bg` or `btn_clean_edges`. Update all three locales | Marketing-honesty fix |
| DS4-23 | 🔵 Low | N | `server.cjs`'s `googleRes.pipe(res)` does not validate the upstream `Content-Type`. If Google returns an HTML error page (e.g., 502 from frontend LB), the client's `response.json()` throws a `SyntaxError` instead of producing a structured error | `server.cjs` | Before piping, check `googleRes.headers['content-type']?.includes('application/json')`. If not, read the body and wrap as `{error: 'error_upstream', detail: 'non-JSON response'}` | DS4 in Round 5 found this edge case. Same callback as GP55-013A. Low probability, bad debug experience |
| GP55-031 | 🔵 Low | N | Custom `.env` parser in `server.cjs` is fragile on edge cases | `server.cjs`, `package.json` | Use `dotenv`, or rely entirely on deploy-platform env injection and remove the loader | Maintenance overhead |
| GP55-032 | 🔵 Low | N | README setup/architecture documentation is out of sync with the implementation | `README.md`, `README_zh.md` | Update setup, env handling, proxy behavior, rate-limit caveat, safety handling, and production deployment warnings | Complements GP55-012 — that one is factual errors; this one is coverage gaps |

---

## Execution Plan — Dependency-Ranked (Frozen)

**Principle**: Severity tells *what hurts*; dependency order tells *what to ship first*. A Critical fix landed without its prerequisites is either un-mergeable or instantly regressed by the next PR.

### Wave 0 — Foundation (PR-0)
*Purpose: make subsequent fixes shippable, reviewable, and reversible.*

| ID | Issue | Files |
|---|---|---|
| GP55-005 | `.env` not gitignored; no `.env.example` | `.gitignore`, `.env.example` |
| CO4-014 | No CI workflow | `.github/workflows/ci.yml` |
| CO4-020 | No Dockerfile / deploy artifact | `Dockerfile`, `.dockerignore` |

**Exit criteria**: `npm ci && npm test && npm run build && tsc --noEmit` green in CI; `docker build .` succeeds; secret scan clean on history (rotate `GEMINI_API_KEY` if it was ever committed).

**Why first**: Every later PR needs CI to gate it and a deploy target to validate it. Secret rotation must precede any public exposure of the proxy.

### Status: Fixed with PR#98
GP55-005: .env / .env.* 加入 .gitignore；ship .env.example template
CO4-014: 新增 .github/workflows/ci.yml（npm ci → typecheck → lint → test → build）
CO4-020: 多階段 Dockerfile + .dockerignore

---

### Wave 1 — Stop the Bleeding (PR-1)
*Purpose: close the highest-leverage public-abuse vectors with surgical patches before the larger contract redesign.*

| ID | Issue | Files |
|---|---|---|
| GP55-004 | API key in URL query string | `server.cjs` |
| GP55-003 | Unbounded request body | `server.cjs` |
| CO4-003 | Wildcard CORS | `server.cjs` |
| GP55-007 | No hard cost cap / kill switch | `server.cjs`, env |

**Validation**:
- `curl` with `Origin: https://evil.example` → CORS rejected.
- `curl` with 20 MB body → 413.
- `GENERATION_ENABLED=false` → 503 on `/api/generate`.
- Proxy egress traffic capture confirms `x-goog-api-key` header, no `?key=` in URL or logs.

**Why before Wave 2**: These are one-file patches that immediately reduce attack surface. They are independent of the contract redesign and de-risk the longer Wave 2 PR.

### Status: Fixed with PR#99
GP55-004: API key 從 URL ?key= 移到 x-goog-api-key header
GP55-003: Request body cap 15MB；413 on overflow；修 bodyTooLarge race condition
CO4-003: Wildcard CORS 改為 FRONTEND_ORIGIN allowlist
GP55-007: GENERATION_ENABLED kill-switch + in-memory daily quota counter；修 getUTCMonth() off-by-one

---

### Wave 2 — Proxy Contract Redesign (PR-2)
*Purpose: make the backend authoritative for what gets sent to Gemini. This is the root-cause fix that retires several downstream items.*

| ID | Issue | Files |
|---|---|---|
| GP55-001 | Proxy trusts client model/contents | `server.cjs`, `services/geminiService.ts` |
| GP55-006 | No server-side image validation (MIME, dims, size) | `server.cjs` |
| CO4-009 | `variationPrompt` is free-text | `utils/promptBuilder.ts`, `services/geminiService.ts`, `hooks/useAppState.ts` |
| GP55-009 | Prompt drift / no canonical IDs | `utils/promptBuilder.ts`, `constants.ts` |

**New contract**: `POST /api/generate` accepts only `{ imageBase64: string, styleId: StyleId, variationId: VariationId }`. Backend constructs the Gemini payload, enforces model allow-list (`gemini-2.5-flash-image`), validates image (MIME sniff, dimension check, ≤10 MB decoded), and looks up prompt fragments from a server-owned table.

**Exit criteria**: Posting `{ model: 'gemini-2.5-pro' }` is ignored. Posting `variationId: 'arbitrary-string'` returns 400. Existing happy-path E2E still passes.

### Status: Fixed with PR#100 & PR#102
GP55-001: Backend 只接受 {imageBase64, styleId, variationId}；prompt 改由 server 組裝；model allowlist 強制
GP55-006: Server 驗證 image magic bytes (PNG/JPEG/WebP)、decoded size ≤10MB、dimensions ≤4096px
CO4-009: VariationId 從 free string 改為 strict union type
GP55-009: Prompt fragments + style table 移到 server.cjs，client 不再組裝 prompt

---

### Wave 3 — Backend Abuse Controls (PR-3)
*Depends on Wave 2: rate-limiting a malformed-input endpoint is wasted work.*

| ID | Issue | Files |
|---|---|---|
| GP55-002 | No server-side rate limit | `server.cjs`, new `server/rateLimit.js` |
| CO4-008 | Unauthenticated cross-origin abuse | `server.cjs`, `services/geminiService.ts` |
| GP55-015 | No auth / CAPTCHA on public endpoint | `server.cjs`, frontend integration |
| CO4-002 | Client limiter has no fallback | `utils/rateLimit.ts` |

**Implementation notes**:
- Per-IP token bucket: 5/min, 50/day (tune after first week of telemetry).
- Custom header `X-Requested-With: sticker-generator` required; rejects naive cross-origin scripts.
- Independent host = GP55-015 stays **High** (was conditional). Recommend lightweight Turnstile/hCaptcha rather than full auth; revisit if abuse observed.
- CO4-002 fallback: module-level `Map` limiter when `localStorage` throws; silent `logger.warn`.

### Status: Fixed with PR#101 & PR#103
GP55-002: Per-IP rate limiting（in-memory Map，env-configurable window/limit）
CO4-008: Turnstile CAPTCHA server-side verification（verifyCaptcha()）+ CO4-002 replay guard（usedCaptchaTokens Set）
GP55-015: Security headers（CORS allowlist enforcement on OPTIONS）
測試基礎建設：server.rate-limit.test.mjs、server.captcha.test.mjs、server.header.test.mjs

---

### Wave 4 — Gemini Call Hardening (PR-4)
*Depends on Wave 2 (backend owns the call) and Wave 3 (retries must respect quota).*

| ID | Issue | Files |
|---|---|---|
| GP55-008A | Missing `safetySettings` + `promptFeedback.blockReason` handling | `server.cjs`, `services/geminiService.ts` |
| GP55-014 | Upstream `Content-Type` not validated | `server.cjs` |
| GP55-013A | Upstream status codes not propagated | `server.cjs` |
| DS4-23 | No upstream timeout/abort | `server.cjs` |
| CO4-011 | No bounded retry/backoff | `server.cjs` |

**Retry budget**: 2 retries on 5xx and selected 429 only; jittered backoff 200ms + 400ms. Total upstream budget ≤55s to leave headroom under the 60s API timeout. **Each retry counts against the per-IP quota** (Wave 3 limiter wraps the whole call, not each attempt — confirm in implementation).

**Client timeout reconciliation**: Current UI 70s is too tight if backend uses full 55s + retry budget. Raise UI timeout to ≥125s or shorten backend total budget to ≤50s. Pick one in PR-4 and document.

### Status: Fixed, with PR#104
GP55-008A: safetySettings 注入每次 Gemini request；promptFeedback.blockReason → error_safety
GP55-013A: Upstream 401/429/5xx 映射為 structured error codes
DS4-23: Content-Type 驗證在讀 upstream body 之前
GP55-014: AbortController 20s timeout per attempt；client close 中斷 upstream
CO4-011: callGeminiWithRetry() 最多 2 retries on 5xx，jittered backoff 200+400ms；7 tests via injectable fake HTTP server

---

### Wave 5 — Frontend Error Protocol (PR-5)
*Depends on Wave 4: the structured error response must exist before the frontend can consume it.*

| ID | Issue | Files |
|---|---|---|
| CO4-013 | Raw upstream errors rendered in DOM | `hooks/useAppState.ts`, `services/geminiService.ts`, `server.cjs`, `constants.ts` |
| GP55-013 | No error taxonomy | same |
| CO4-012 | Stale generation race | `hooks/useAppState.ts` |
| CO4-004 (re-scoped) | No double-click guard on generate | `App.tsx`, `hooks/useAppState.ts` |
| GP55-001 sub / DS4-10 | `validateImageDimensions` declared but never called | `hooks/useAppState.ts`, `components/FileUpload.tsx` |

**Backend response shape**:
```ts
type AppErrorResponse = {
  error: { code: string; publicKey: string; retryable: boolean; requestId: string }
};
```
Frontend renders only `t(error.publicKey)`. `KNOWN_ERROR_KEYS` enumerates: `error_safety`, `error_quota`, `error_timeout`, `error_upstream`, `error_no_image`, `error_auth`, `error_payload`, `error_process` (fallback).

**Stale-generation guard**: `AbortController` + monotonic `generationId` ref. Resolved promises whose id ≠ current are discarded.

### Status: PR#108 is submitted
| 檔案 | 改動 |
|---|---|
| `server.cjs` | `usedCaptchaTokens Set` → `Map` 5-min TTL；全部 error 路徑改 `{ error: { code, publicKey, retryable, requestId } }` |
| `services/geminiService.ts` | `API_TIMEOUT_MS` 60s→75s；`captchaToken` 參數；讀新 `error.publicKey` shape |
| `hooks/useAppState.ts` | UI timeout 70s→85s；`captchaTokenRef`；`generationIdRef` 防 stale；double-click guard；`validateImageDimensions` |
| `components/TurnstileWidget.tsx` | 新建，載入 CF Turnstile script，callback → `onToken` |
| `App.tsx` | 引入 `TurnstileWidget`，傳 `captchaTokenRef`，按鈕加 `disabled` |
| `.env.example` | 加 `TURNSTILE_SECRET_KEY` + `VITE_TURNSTILE_SITE_KEY` |

---

### Wave 6 — Paid-Call UX & Quality (PR-6)
*All gates beyond this point assume the security perimeter is closed.*

| ID | Issue | Files |
|---|---|---|
| GP55-011 | Display canvas overlays exported to Gemini | `components/ImageEditor.tsx` |
| DS4-8 / GP55-021 | `Promise.all` aborts whole sticker set on one failure | `services/geminiService.ts`, `hooks/useAppState.ts` |
| GP55-012 | README factual drift | `README.md`, `README_zh.md` |
| CO4-025 | No prompt invariant tests | new `utils/promptBuilder.test.ts` |

**GP55-011 A/B**: After off-screen export canvas lands, generate 5–10 stickers pre/post fix at fixed seed (if available) or same source images, compare qualitatively. Document outcome; if quality delta is material, escalate similar canvas-export bugs to Critical in future reviews.

**Partial-failure UX**: `Promise.allSettled` + per-tile state (`pending|done|failed`) + per-tile retry button. Failed tiles do not consume the user's daily quota retry on the user's next click — they should, document the tradeoff explicitly.

---

### Wave 7 — Post-Launch Hardening
Remaining 28 Medium + 15 Low items: observability (DS4-19), monitoring alerts (CO4-005), CSP header (move from `<meta>`), accessibility audit, SDK migration (CO4-021), licensing (CO4-024), commit `coverage/` cleanup, ESLint/Prettier, Playwright E2E happy path, etc. Schedule in 2-week batches by theme, not severity.

---

## Launch Gate Checklist

Before flipping `GENERATION_ENABLED=true` on the independent host:

- All Wave 0–5 PRs merged, CI green on `main`.
- `curl` smoke tests pass for: oversize body (413), cross-origin (CORS reject), missing custom header (403), rate limit (429 after N requests), kill switch (503), malformed payload (400), unknown styleId (400).
- Gemini key rotated post-merge; old key revoked in Google Cloud console.
- `safetySettings` confirmed in outbound payload via proxy log inspection at INFO level (redact image bytes).
- One end-to-end run through UI succeeds; one deliberately-blocked prompt surfaces `error_safety` (no raw upstream string).
- Cost cap configured at provider level (API key quota) AND in `server.cjs` (daily counter) — defense in depth.
- Wave 6 GP55-011 fix verified by inspecting one exported base64 (decoded) — no grid pattern visible.

---

## Risks & Open Items Not Closed by This Plan

1. **Quota accounting for retries** — confirm in PR-4 whether retries count against per-IP daily limit or only per-call rate limit. Different choices have different cost/UX tradeoffs.
2. **Timeout reconciliation** — explicit decision needed in PR-4: extend UI timeout to ≥125s, or shorten backend budget. Don't ship both unchanged.
3. **CAPTCHA UX friction on independent host** — Turnstile invisible mode preferred; if abuse remains, escalate to interactive challenge.
4. **EXIF stripping verification** — canvas re-encode path is assumed to strip EXIF; not yet tested. Add a test in Wave 7 before claiming privacy compliance publicly.
5. **AbortController vs. generationId** — both have edge cases. Recommend `AbortController` for the in-flight fetch + `generationId` for the post-fetch state merge. Don't rely on either alone.
6. **GP55-001 is large** — if PR-2 grows beyond ~400 LOC diff, split into PR-2a (contract + validation) and PR-2b (prompt table relocation). Don't merge a 1000-line refactor.

---
