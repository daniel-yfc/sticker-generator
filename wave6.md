

**do not implement Wave 6 as one large PR unless the diff stays small**. Treat it as one “wave” but split into **3 smaller PRs** if needed:

1. **PR-6A:** Canvas export quality fix.
2. **PR-6B:** Sticker-set partial failure UX.
3. **PR-6C:** README drift + prompt invariant tests.

## 2. Context and assumptions

**Wave 6 — Paid-Call UX & Quality**
  - Fix paid input quality pollution.
  - Preserve partial sticker-set results when some generations fail.
  - Correct README drift.
  - Add prompt invariant/snapshot tests.

contains:
| ID | Issue | Files |
|---|---|---|
| GP55-011 | Display canvas overlays exported to Gemini | `components/ImageEditor.tsx` |
| DS4-8 / GP55-021 | `Promise.all` aborts whole sticker set on one failure | `services/geminiService.ts`, `hooks/useAppState.ts` |
| GP55-012 | README factual drift | `README.md`, `README_zh.md` |
| CO4-025 | No prompt invariant tests | new `utils/promptBuilder.test.ts` or equivalent |

**Recommended.**

| PR | Scope | Why |
|---|---|---|
| PR-6A | GP55-011 export canvas fix | Highest paid-call quality impact; isolated to `ImageEditor.tsx` |
| PR-6B | DS4-8 / GP55-021 partial sticker-set failure UX | Async state + retry behavior deserves separate review |
| PR-6C | GP55-012 README + CO4-025 prompt tests | Docs/tests are low coupling but good to land before Wave 7 |

--
# Wave 6 implementation plan

---

## PR-6A — Fix exported image quality pollution

### Scope

Backlog item:

- **GP55-011** — `ImageEditor.tsx` exports the display canvas, which includes:
  - transparent checkerboard grid
  - dashed guide circle
  - UI overlays

### Goal

When the user confirms the crop/edit, the base64 image sent to Gemini must contain **only the transformed source image**, not editor UI artifacts.

### Files

Primary:

- `components/ImageEditor.tsx`

Possible helper if needed:

- `utils/imageUtils.ts`

Avoid touching unrelated files.

---

### Implementation steps

#### Step 1 — Identify current drawing paths

Find where `ImageEditor.tsx` currently does something like:

```ts
canvas.toDataURL(...)
```

or:

```ts
displayCanvasRef.current?.toDataURL(...)
```

Separate the code mentally into:

1. **Display rendering path**
   - Grid.
   - Guide circle.
   - Handles.
   - Any editor-only visuals.

2. **Export rendering path**
   - Source image only.
   - Same transform/crop as display.
   - No visual aids.

---

#### Step 2 — Add off-screen export canvas

Create an off-screen canvas inside `handleConfirm()` or a small helper.

Example shape:

```ts
const exportCanvas = document.createElement('canvas');
exportCanvas.width = EXPORT_SIZE;
exportCanvas.height = EXPORT_SIZE;

const ctx = exportCanvas.getContext('2d');
if (!ctx) {
  // Use existing error behavior; do not invent new broad error handling.
  return;
}
```

Use the same source image and transform values as the display canvas:

- scale
- rotation
- translation / position
- crop area
- output size

But do **not** draw:

- transparent grid
- dashed guide circle
- editor handles
- UI overlays
- background pattern

Important: if the current display canvas intentionally fills a white background, decide deliberately whether export should be transparent or white. For sticker generation, I’d default to **transparent PNG** unless current product behavior expects white.

---

#### Step 3 — Preserve current visual behavior

The visible editor should look unchanged.

This PR should only change the **exported base64**.

Do not refactor editor UI unless absolutely required.

---

#### Step 4 — Export PNG from off-screen canvas

Use:

```ts
const dataUrl = exportCanvas.toDataURL('image/png');
onConfirm(dataUrl);
```

Avoid JPEG because transparency matters for sticker workflows.

---

### Validation

Manual validation is important here because canvas tests can be brittle.

Minimum validation:

1. Upload a source image.
2. In the editor, zoom/rotate/move it.
3. Confirm.
4. Decode or inspect the generated base64 PNG before Gemini call.
5. Confirm:
   - no checkerboard grid
   - no dashed circle
   - no editor handles
   - transformation matches what user saw

Add a temporary local-only debug if needed, but do **not** commit debug artifacts.

Recommended automated test if practical:

- Test the export helper if you extract one.
- Assert that export path does not call `drawTransparentGrid()` or overlay drawing functions.
- If using canvas mocks, keep the test narrow.

### Exit criteria

- Exported PNG contains only the transformed image.
- Existing editor UI is visually unchanged.
- Single sticker generation still works.
- Sticker-set generation still works.
- CI green:
  - `npm run typecheck`
  - `npm test`
  - `npm run build`

### Weakest assumption

The same transform math used for display can be reused cleanly for export. If display math is coupled to canvas dimensions or overlay layout, this may take longer than expected.

### Stop/split criterion

If the fix requires major editor refactoring, stop and split:

- PR-6A1: extract pure transform/export helper.
- PR-6A2: switch `handleConfirm()` to use it.

---

## PR-6B — Partial success for sticker-set generation

### Scope

Backlog item:

- **DS4-8 / GP55-021** — `generateStickerSet` uses `Promise.all`, so one failed variation discards the entire set.

### Goal

If 4 sticker variations are requested and 1 fails:

- User still sees the 3 successful images.
- Failed tile is visibly marked as failed.
- User can retry only the failed tile.
- No successful paid generation is lost.
- Errors use the structured error protocol from Wave 5.

### Files

Primary:

- `services/geminiService.ts`
- `hooks/useAppState.ts`
- `components/StickerSetView.tsx`

Possible:

- `types.ts`
- `constants.ts` for translation keys
- `components/ProcessingView.tsx` if showing per-item progress

---

### Data model

Add or adapt a type similar to:

```ts
type StickerTileStatus = 'pending' | 'done' | 'failed';

type StickerSetTile = {
  variationId: VariationId;
  status: StickerTileStatus;
  imageUrl?: string;
  errorPublicKey?: string;
  retryable?: boolean;
};
```

If a similar type already exists, extend it instead of creating a parallel model.

Avoid generic `any[]` results.

---

### Implementation steps

#### Step 1 — Replace `Promise.all` with settled behavior

Current anti-pattern:

```ts
const results = await Promise.all(promises);
```

Replace with either:

```ts
const results = await Promise.allSettled(promises);
```

or a progressive approach where each promise updates its tile when it settles.

Minimum acceptable behavior:

- `Promise.allSettled`
- successful results returned
- failed variation IDs returned
- UI shows partial success after all settle

Better behavior:

- initialize all tiles as `pending`
- update each tile to `done` or `failed` as soon as it settles
- show progress while generation continues

Given the backlog explicitly mentions per-tile state, I recommend the better behavior if the code allows it without a large refactor.

---

#### Step 2 — Preserve generation guards from Wave 5

When updating tile state, respect:

- current `generationIdRef`
- abort status
- reset state

Each async completion should check:

```ts
if (generationId !== generationIdRef.current) return;
```

Do not let a stale sticker-set promise mutate state after reset or a new generation.

---

#### Step 3 — UI partial success state

In `StickerSetView.tsx`, support:

1. `pending` tile
   - show spinner/skeleton
   - optional text: “Generating…”

2. `done` tile
   - show image
   - allow download/share behavior as today

3. `failed` tile
   - show localized error
   - show retry button if `retryable === true`
   - if not retryable, show disabled retry or no retry button

Add translation keys if needed:

- `sticker_tile_failed`
- `btn_retry_variation`
- `sticker_partial_success`
- `sticker_generating_variation`

Keep copy simple.

---

#### Step 4 — Per-tile retry

Retry should call generation for only the failed `variationId`.

Important CAPTCHA/quota decision:

- Treat retry as a new paid generation.
- Require a fresh Turnstile token if the backend requires CAPTCHA per generation.
- Retry should count against server quotas.
- UI should not imply retries are free.

Implementation options:

**Option 1 — Simple retry through existing `handleGenerate` path**

- Easier but may regenerate whole set unless carefully parameterized.
- Not recommended if it causes more paid calls.

**Option 2 — Add `retryStickerSetTile(variationId)`**

Recommended.

Behavior:

1. Tile status becomes `pending`.
2. Request/generate new CAPTCHA token if required.
3. Call `generateSticker(imageBase64, styleId, variationId, captchaToken)`.
4. On success, replace only that tile.
5. On failure, keep tile failed and update `errorPublicKey`.

---

#### Step 5 — History behavior

Decide how partial sets are stored.

Recommended:

- Store successful tiles.
- Preserve failed tile metadata only in active UI state.
- Do not store failed image placeholders in permanent sticker history unless history already supports non-image entries.

If history currently expects a complete set, avoid forcing partial failed states into it. Instead:

- Active result view shows partial state.
- History stores available successful outputs.

Document this in code comments only if non-obvious.

---

### Tests

Add tests around the service and hook layer if possible.

Minimum test cases:

1. **All variations succeed**
   - returns 4 done tiles.

2. **One variation fails**
   - returns 3 done, 1 failed.
   - no successful result is discarded.

3. **All variations fail**
   - returns 4 failed or a clean top-level error state, depending on UI design.
   - no raw upstream error text.

4. **Retry one failed variation**
   - only that variation is regenerated.
   - successful existing tiles remain unchanged.

5. **Stale generation ignored**
   - simulate generation ID mismatch.
   - tile state does not update.

6. **Abort/reset**
   - reset while promises are pending.
   - no stale success flips UI back to result state.

### Exit criteria

- Forced mock failure of 1 out of 4 variations shows 3 images + 1 failed tile.
- Retry only calls one variation.
- Retry requires a valid CAPTCHA token if backend enforces it.
- No raw error string rendered.
- Reset during sticker-set generation does not resurrect stale UI.
- CI green.

### Weakest assumption

The current app state model can represent per-tile state without a broad refactor. If current state only supports “single final sticker set”, this PR may grow.

### Stop/split criterion

If `useAppState.ts` changes exceed roughly **250–300 LOC**, split:

- PR-6B1: service returns settled results.
- PR-6B2: UI per-tile state and retry.

---

## PR-6C — README drift + prompt invariant tests

### Scope

Backlog items:

- **GP55-012** — README factual drift.
- **CO4-025** — No prompt invariant/snapshot tests.

### Files

Likely:

- `README.md`
- `README_zh.md`
- `server.cjs`
- new `server/promptBuilder.test.mjs` or equivalent
- possibly new `server/promptBuilder.cjs`
- possibly `constants.ts` / `types.ts`

---

## Part A — README factual drift

### Required README corrections

From backlog:

1. Correct sticker-set count:
   - README says “3 stickers per set”.
   - Code generates 4.
   - Either update README to 4 or change code to 3.
   - Recommendation: **update README to 4** unless product wants 3.

2. Remove unverified `512×512 verified` claim.
   - Replace with a softer factual claim, e.g.:
     - “Exports PNG stickers suitable for download.”
     - Do not claim specific verified dimensions unless there is a test.

3. Fix obsolete env-var mapping.
   - Remove old `GEMINI_API_KEY → process.env.API_KEY` wording.
   - Document current env variables:
     - `GEMINI_API_KEY`
     - `BACKEND_PORT`
     - `FRONTEND_ORIGIN`
     - `GENERATION_ENABLED`
     - Turnstile vars from Wave 5:
       - `TURNSTILE_SECRET_KEY`
       - `VITE_TURNSTILE_SITE_KEY`
     - quota/rate-limit vars if already added in Waves 1–3.

4. Update proxy behavior:
   - Frontend calls backend proxy.
   - Backend calls Gemini.
   - Client does not send model/prompt payload directly anymore.

5. Avoid making privacy claims not yet verified.
   - Do not claim “EXIF is stripped” unless Wave 7 verifies it.
   - If mentioning image processing, say images are sent to Google Gemini for generation.

### Validation

- README and README_zh agree.
- Setup instructions work from a clean clone.
- No outdated `process.env.API_KEY` reference remains.
- No unverified “512×512 verified” claim remains.

---

## Part B — Prompt invariant tests

### Important design decision

Because Wave 2 moved prompt construction server-side, do **not** create tests against obsolete client-side prompt code.

Recommended approach:

1. If prompt construction is already in a testable module:
   - Add tests there.

2. If prompt construction is embedded in `server.cjs`:
   - Extract only prompt-related constants/functions into:
     - `server/promptBuilder.cjs`
   - Import from `server.cjs`.
   - Test `server/promptBuilder.cjs`.

Avoid a large server refactor.

---

### What to test

Backlog requires:

1. Snapshot every style’s rendered prompt.
2. Assert all 12 rendered prompts contain guardrail substrings.
3. Schema assertion:
   - every style has `basePrompt`
   - every style has `modifiers.person`

But because the prompt table may have changed after server-side relocation, adapt the schema assertion to the actual canonical data shape.

### Required invariant strings

At minimum, assert rendered prompts include:

- `sticker`
- `WHITE BORDER`
- `DO NOT produce a realistic photo`

If Wave 4 / Wave 6 added or preserved anti-photorealism language, include that too.

Possible invariant list:

```ts
const REQUIRED_GUARDRAILS = [
  'sticker',
  'WHITE BORDER',
  'DO NOT produce a realistic photo',
];
```

Be careful with casing. Either require exact casing if intentional, or normalize case where casing is not semantically important. For `WHITE BORDER`, exact casing may be part of the prompt strategy, so exact is fine.

---

### Test cases

1. **All style IDs render**
   - For every style ID, `buildPrompt(styleId, 'thumbs_up')` returns non-empty string.

2. **All variation IDs render**
   - For every variation ID, prompt renders successfully.

3. **Guardrails exist**
   - Every rendered style prompt contains required substrings.

4. **Unknown style rejected**
   - Unknown `styleId` throws or returns validation error.

5. **Unknown variation rejected**
   - Unknown `variationId` throws or returns validation error.

6. **Snapshot prompts**
   - Snapshot canonical prompts.
   - If prompts change later, reviewer must intentionally approve.

### Exit criteria

- Removing `WHITE BORDER` from one style causes test failure.
- Removing anti-realistic-photo guardrail causes test failure.
- Unknown style/variation fails safely.
- README drift fixed in both languages.
- CI green.

### Weakest assumption

Prompt construction can be extracted/tested without destabilizing `server.cjs`.

### Stop/split criterion

If extracting prompt code forces large server changes, split:

- PR-6C1: README drift only.
- PR-6C2: prompt builder extraction + tests.

---

# Wave 6 final acceptance checklist

Before marking Wave 6 done:

- [ ] Exported base64 image has no grid/checkerboard/guide-circle artifacts.
- [ ] Single generation still works.
- [ ] Sticker-set generation handles partial failures.
- [ ] Failed tile retry regenerates only that tile.
- [ ] Retry uses fresh CAPTCHA token if required.
- [ ] No raw upstream error strings render.
- [ ] README and README_zh are factually aligned with code.
- [ ] Prompt invariant tests exist and fail on guardrail removal.
- [ ] CI green on `main`.

---


2. For sticker-set failed-tile retry, should the UX require the user to pass Turnstile again, or should the app silently request a fresh token if possible?

3. For Wave 7, do you want to prioritize **portfolio polish** first — accessibility, README, license, cleanup — or **production hardening** first — observability, CSP, storage, E2E?
