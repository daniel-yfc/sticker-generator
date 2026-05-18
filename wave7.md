
# Wave 7 implementation plan

## Wave 7A — Observability, monitoring, and production operations

### Purpose

Make the public deployment observable without leaking secrets or image payloads.

### Items

| ID | Work |
|---|---|
| DS4-19 | Structured request logging |
| GP55-008B | Safety ratings logging |
| CO4-005 | Google Cloud billing alerts |
| CO4-036 | CSP via HTTP header |
| GP55-031 | Replace fragile custom `.env` parser or rely on platform env |

### Implementation steps

#### DS4-19 — structured request logging

Add JSON logs for each request:

```json
{
  "timestamp": "...",
  "requestId": "...",
  "ipHash": "...",
  "method": "POST",
  "path": "/api/generate",
  "status": 200,
  "latencyMs": 1234,
  "errorCode": null
}
```

Rules:

- Never log API key.
- Never log full image base64.
- Never log prompt text if it might contain user-derived content.
- Hash IP with a server-side salt if possible.

#### GP55-008B — safety ratings logs

When Gemini returns `safetyRatings`, log only structured category/probability fields.

Do not use LOW/MEDIUM ratings as blocking signals.

#### CO4-005 — billing alerts

Console task, not code:

- Set alerts at `$5`, `$10`, `$20`.
- Confirm API key quota is configured.
- Document where the alerts live.

#### CO4-036 — CSP header

Move production CSP from meta tag to HTTP header if deployment supports it.

Do not break Vite dev unnecessarily.

#### GP55-031 — env loading

Preferred options:

1. Use deployment platform env only.
2. Or add `dotenv` and remove the custom parser.

For a portfolio app, `dotenv` is acceptable.

### Validation

- Logs appear in stdout.
- Logs include request ID and status.
- Logs do not include API key or image payload.
- Billing alerts configured manually and documented.
- CSP header visible in production response.

---

## Wave 7B — Tooling and repo hygiene

### Purpose

Make future changes safer and clean up repository professionalism issues.

### Items

| ID | Work |
|---|---|
| CO4-019 | Add/enforce `tsc --noEmit` |
| CO4-029 | ESLint, Prettier, npm audit |
| GP55-025 | Incremental TypeScript strictness |
| CO4-015 | Remove committed `coverage/` |
| CO4-016 | Move `@playwright/test` to `devDependencies` |
| CO4-017 | Cross-platform dev script; production `start` script |
| CO4-018 | Add `engines` |
| CO4-023 | Remove/move agent-residue files |

### Recommended order

1. **Repo cleanup**
   - Remove committed coverage from git.
   - Add `coverage/` to `.gitignore`.

2. **Package hygiene**
   - Move Playwright to `devDependencies`.
   - Add `engines`.
   - Add `start`.

3. **Lint/format**
   - Add ESLint config.
   - Add Prettier config.
   - Do not reformat the entire repo unless intentionally doing a formatting-only PR.

4. **TypeScript strictness**
   - Do not enable full `strict` immediately.
   - Start with:
     - `noImplicitAny`
   - Then later:
     - `strictNullChecks`
   - Then full:
     - `strict`

### Validation

- `npm ci`
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- CI passes.
- Production install no longer pulls Playwright unnecessarily.

### Risk

ESLint/Prettier can create noisy diffs. Keep formatting-only changes separate from logic changes.

---

## Wave 7C — UX, privacy, i18n, accessibility

### Purpose

Improve public-facing quality and reduce trust/accessibility gaps.

### Items

| ID | Work |
|---|---|
| GP55-016 | Unify client validation path |
| GP55-017 | Cap localStorage sticker history |
| CO4-022 | Validate localStorage before write |
| GP55-020 | Privacy/consent notice |
| GP55-022 | Cancel button during generation |
| CO4-031 | Replace `alert()` and hardcoded Chinese string |
| CO4-033 | `aria-label` and `alt` coverage |
| CO4-032 | Extract hardcoded App strings |
| CO4-030 | Browser locale detection |
| DS4-22 | Rename “Magic Wand” |
| CO4-034 | Per-item progress for sticker set |

### Recommended order

1. **Validation/storage safety**
   - GP55-016
   - GP55-017
   - CO4-022

2. **User trust**
   - GP55-020 privacy notice
   - Avoid overclaiming data retention unless confirmed.

3. **Generation UX**
   - GP55-022 cancel button
   - CO4-034 per-item progress if not fully solved in Wave 6B

4. **Accessibility/i18n**
   - CO4-031
   - CO4-033
   - CO4-032
   - CO4-030
   - DS4-22

### Specific guidance

#### GP55-017 / CO4-022 — localStorage

Implement:

- cap history count, e.g. 50
- catch `QuotaExceededError`
- trim oldest entries and retry once
- validate data before write

Do not migrate to IndexedDB yet unless localStorage trimming is insufficient.

#### GP55-020 — privacy notice

Show before upload or near upload:

> Images are sent to Google Gemini for processing. This app does not intentionally retain uploaded images on the server.

Be careful: “does not retain” is only true if server logs never include payloads and no storage is configured.

#### GP55-022 — cancel button

Use existing AbortController infrastructure from Waves 4–5.

Cancel should:

- abort frontend fetch
- prevent stale state update
- show neutral canceled state
- not show scary error copy

#### CO4-033 — accessibility

Add:

- `aria-label` to icon-only buttons
- meaningful `alt` text to images
- optional axe-core check later in CI

### Validation

- Safari/private mode localStorage behavior tested.
- Upload privacy notice visible.
- Cancel works during single and set generation.
- Keyboard navigation does not regress.
- No hardcoded user-visible strings remain in touched files.
- Basic screen reader labels exist for icon buttons.

---

## Wave 7D — Testing, security hardening, docs, and long-term maintenance

### Purpose

Close lower-risk but important maintainability and product-quality gaps.

### Items

| ID | Work |
|---|---|
| CO4-026 | Server test coverage |
| CO4-027 | Playwright happy-path E2E |
| GP55-019 | Remove direct Gemini from CSP `connect-src` |
| DS4-17 | Production CSP `'unsafe-inline'` decision |
| DS4-11 | Style anchoring / seed support verification |
| DS4-12 | Anti-photorealism prompt prefix |
| CO4-037 | Full base64 validation or remove partial validation |
| CO4-040 | EXIF stripping verification |
| GP55-032 | README architecture/setup update |
| CO4-024 | LICENSE |
| CO4-021 | Migrate to `@google/genai` SDK |
| CO4-035 | Better history download filenames |
| CO4-038 | Report bad result UI |
| CO4-039 | Unused modifiers cleanup |

### Recommended order

1. **Server coverage**
   - CO4-026
   - This protects everything else.

2. **E2E**
   - CO4-027
   - Mock backend/proxy.
   - Test upload → edit → generate → download.

3. **CSP hardening**
   - GP55-019
   - DS4-17
   - Prefer documentation if fully strict CSP is impractical due to Tailwind/Vite behavior.

4. **Evidence-based privacy**
   - CO4-040 EXIF test
   - Only after test passes, document EXIF stripping.

5. **Prompt/product quality**
   - DS4-11 seed verification
   - DS4-12 prompt prefix
   - CO4-038 report bad result

6. **Maintenance**
   - CO4-024 license
   - CO4-021 SDK migration
   - CO4-039 unused modifiers

### SDK migration caution

Do **not** do CO4-021 early.

Only migrate to `@google/genai` after:

- server contract is stable
- error taxonomy is stable
- tests cover current raw REST behavior

Otherwise the SDK migration can blur whether bugs come from your code or the SDK behavior change.
