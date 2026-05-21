## Goal

Develop Temir AI into a fully capable in-app coach that (a) reliably answers ANY question (including off-topic ones like "teach me math") while staying anchored as a checkers tutor, (b) visually shows moves and forced lines on a board, (c) hardens the optional OpenAI layer so quota/API errors never reach the user, and (d) is covered by automated tests. No other parts of the webapp are touched.

## Scope (only Temir AI)

Files edited / created:
- `src/lib/temir-ai-brain.ts` — smarter intent + scoring + general-knowledge fallback
- `src/lib/temir-ai-types.ts` — add forced-capture metadata to teaching board
- `src/lib/temir-ai-demos.ts` — render forced captures (multiple highlights, capture path)
- `src/lib/temir-ai-server.ts` — tightened OpenAI wrapper config
- `api/temir-ai.ts` — mirror brain hardening for Vercel route
- `src/components/ui/glowing-ai-chat-assistant.tsx` — show forced-capture banner + multi-move highlight
- `src/components/game/Board.tsx` — optional `highlightedSquares` prop (purely additive, no behavior change)
- `src/lib/__tests__/temir-ai-brain.test.ts` — new vitest suite

No routes, auth, DB, styling system, or other features touched.

## 1. General-purpose answering (so "teach me math" works)

In `runTemirLocalBrain`, add a new intent layer BEFORE the generic fallback:

- `wantsGeneralKnowledge` — detected when the message has no checkers/app intent but contains a question/teach/explain verb.
- When detected AND OpenAI is available → delegate full answer to the model (system prompt: "You are Temir AI, a checkers coach inside Checker.com. You can also answer general questions briefly, then gently offer to return to checkers training.").
- When detected AND OpenAI is unavailable → produce an honest local reply: "I'm Temir, primarily a checkers coach. I can give a short take on '{topic}', but for deep '{topic}' help you may want a dedicated tool. Want me to bring it back to a checkers angle?" — never a broken silence.

`maybeEnhanceWithOpenAi` gets a second mode `mode: "enhance" | "answer"`:
- `enhance` (current behavior) — only refine wording, keep move/route/demo.
- `answer` — model produces the full answer text for general knowledge queries; move/route/demo still come from the local brain (always null in this branch).

## 2. Forced-move highlighting

Extend `TemirVisualBoard`:
```ts
type TemirVisualBoard = {
  board, currentTurn, selectedPiece, validMoves, lastMove, caption,
  forcedCapture?: boolean,           // NEW
  highlightedSquares?: Position[],   // NEW — captured pieces + landing path
  alternativeMoves?: Move[],         // NEW — other forced jumps, dimmed
};
```

In `getTemirBoardDemo` and in the live-board recommendation path:
- Compute all legal moves; if any capture exists, set `forcedCapture = true`.
- `highlightedSquares` = squares of each captured piece along the chosen move + each intermediate landing square.
- `alternativeMoves` = other capture moves not chosen (rendered dimmer).

`Board.tsx` gets an optional `highlightedSquares?: Position[]` prop that paints a soft amber ring on those squares — additive only, no impact on game routes that don't pass it.

`glowing-ai-chat-assistant.tsx`:
- When `visualBoard.forcedCapture` is true, render a small banner above the board: "Forced capture — under mandatory-jump rules, Red must play one of these."
- Pass `highlightedSquares` through to `<Board>`.

## 3. Smarter local move scoring

Rewrite `scoreMove` so ranking is correct in all forced-capture positions:

- Captures: `score += 1000 + captures*200 + (anyKingCaptured ? 150 : 0)`.
- Promotion via this move: `+300` (was 80) — promoting mid-jump is usually winning.
- "Safe capture": +60 if landing square is not attackable next ply (cheap check: any opponent piece one diagonal away that has an empty square behind us).
- King activity: +20 long diagonal, +10 if move extends current diagonal length.
- Center: +8 (rows 3–4, cols 2–5).
- Edge penalty: −5 on outer files unless capture.
- Quiet move sacrifice avoidance: −150 if landing square gives opponent an immediate capture (cheap one-ply lookahead).

`recommendedMoveIndex` is taken from `top.move.index`, which IS the index in the request's `moves[]`, then re-validated in `sanitizeResponse` (already validates range). Add an extra check: if `recommendedMoveIndex` is non-null but `moves[idx]` doesn't match `top.move.notation`, fall back to scanning `moves` for matching `from`/`to` — guarantees index always points at a legal move actually present in the request.

## 4. OpenAI hardening (silent fallback)

In both `src/lib/temir-ai-brain.ts` and `api/temir-ai.ts`:
- Lower timeout to 5s (was 6s); also add hard 8s overall budget via `Promise.race`.
- Catch ALL of: `AbortError`, `TypeError` (network), non-2xx, JSON parse errors, missing fields → return `draft` unchanged.
- Never log the API key; logs use `[Temir AI] enhancement skipped (reason)` only at `console.info` level (not `warn`) to avoid noisy red banners in browser network/devtools when quota is normal.
- Always run `sanitizeResponse` AFTER enhancement so a malformed model reply can never break the contract (already happens; add defensive `try/catch` around the whole enhancement call in the server entry too).
- `api/temir-ai.ts` handler wraps the entire pipeline in `try/catch` and on ANY throw returns a valid local-brain response with HTTP 200 (not 500) — the user always sees an answer, never an error toast.

## 5. Automated tests

New file `src/lib/__tests__/temir-ai-brain.test.ts` (vitest). Covers:

1. `runTemirLocalBrain` returns a valid `TemirAssistantResponse` shape for: empty message, greeting, "best move?" with a synthetic board, "explain backward capture", "open friend rooms", "teach me math".
2. `recommendedMoveIndex` is always either null or an integer index of an entry in `currentBoard.moves`.
3. When a capture exists in `currentBoard.moves`, the recommended move IS a capture (mandatory captures correctly ranked).
4. `navigate.path` is always a member of `TEMIR_ROUTE_TARGETS` or null.
5. `boardDemoId` is always a member of `TEMIR_BOARD_DEMO_IDS` or null.
6. `sanitizeResponse` clamps an out-of-range `recommendedMoveIndex` to null and strips an unknown route/demo.
7. `maybeEnhanceWithOpenAi(_, draft, null)` returns the draft unchanged (no key path).
8. `maybeEnhanceWithOpenAi` with a stubbed `fetch` returning 429 returns the draft unchanged and does not throw.
9. `maybeEnhanceWithOpenAi` with a stubbed `fetch` that times out (AbortError) returns the draft unchanged.
10. `getTemirBoardDemo("mandatory-capture")` returns `forcedCapture === true` and at least one `highlightedSquares` entry.

Tests are pure unit tests with no network — `global.fetch` is stubbed per case.

## Out of scope

- All other routes, layouts, auth, Supabase, styling tokens, and copy.
- No edits to the AppShell, game store, or game engine logic (Board.tsx gets one additive optional prop only).
- No model swap for the live game's AI opponent.

## Acceptance

- "Hi" → friendly coach reply, no errors.
- "Teach me derivatives" → coherent answer (via OpenAI if available, gentle local fallback otherwise), never silent.
- "Explain backward capture" → rule text + teaching board with the backward jump highlighted.
- "Best move?" on `/play/ai` mid-game → reply names a move that exists in `moves[]`, highlights it on the board, and shows forced-capture banner when mandatory.
- Invalid `OPENAI_API_KEY`, 429 quota, or network error → user sees the local answer with no error UI, no red toast, status 200.
- `bunx vitest run src/lib/__tests__/temir-ai-brain.test.ts` passes all cases.
