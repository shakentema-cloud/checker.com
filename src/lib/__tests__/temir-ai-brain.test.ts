import { describe, expect, it, vi, afterEach } from "vitest";
import {
  runTemirLocalBrain,
  sanitizeResponse,
  maybeEnhanceWithOpenAi,
} from "../temir-ai-brain";
import { getTemirBoardDemo } from "../temir-ai-demos";
import {
  TEMIR_BOARD_DEMO_IDS,
  TEMIR_ROUTE_TARGETS,
  type TemirAssistantRequest,
  type TemirAssistantResponse,
  type TemirCurrentBoardContext,
} from "../temir-ai-types";

function emptyBoard() {
  return Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => null));
}

function makeReq(message: string, currentBoard: TemirCurrentBoardContext | null = null): TemirAssistantRequest {
  return { message, history: [], currentPath: "/", currentBoard };
}

function makeBoardWithCapture(): TemirCurrentBoardContext {
  const board = emptyBoard() as TemirCurrentBoardContext["board"];
  board[5][2] = { color: "red", type: "man", id: "r1" };
  board[4][3] = { color: "black", type: "man", id: "b1" };
  board[5][6] = { color: "red", type: "man", id: "r2" };
  return {
    board,
    currentTurn: "red",
    moves: [
      { index: 0, notation: "f3-e4", from: { row: 5, col: 6 }, to: { row: 4, col: 5 }, captures: 0, promotesToKing: false },
      { index: 1, notation: "c3xe5", from: { row: 5, col: 2 }, to: { row: 3, col: 4 }, captures: 1, promotesToKing: false },
    ],
  };
}

function assertValid(r: TemirAssistantResponse, board: TemirCurrentBoardContext | null = null) {
  expect(typeof r.answer).toBe("string");
  expect(r.answer.length).toBeGreaterThan(0);
  if (r.navigate) expect(TEMIR_ROUTE_TARGETS).toContain(r.navigate.path);
  if (r.boardDemoId) expect(TEMIR_BOARD_DEMO_IDS).toContain(r.boardDemoId);
  if (r.recommendedMoveIndex !== null) {
    expect(Number.isInteger(r.recommendedMoveIndex)).toBe(true);
    if (board) {
      expect(r.recommendedMoveIndex).toBeGreaterThanOrEqual(0);
      expect(r.recommendedMoveIndex).toBeLessThan(board.moves.length);
    }
  }
}

afterEach(() => vi.restoreAllMocks());

describe("runTemirLocalBrain", () => {
  it("returns valid shape for greeting / empty / general / rule / nav", () => {
    for (const msg of ["", "hi", "teach me derivatives", "explain backward capture", "open friend rooms"]) {
      assertValid(runTemirLocalBrain(makeReq(msg)));
    }
  });

  it("picks the mandatory capture when one is available", () => {
    const board = makeBoardWithCapture();
    const r = runTemirLocalBrain(makeReq("what's the best move?", board));
    assertValid(r, board);
    expect(r.recommendedMoveIndex).toBe(1);
    expect(board.moves[r.recommendedMoveIndex!].captures).toBeGreaterThan(0);
  });

  it("navigate target for 'open friend rooms' is /play/friend", () => {
    const r = runTemirLocalBrain(makeReq("open friend rooms"));
    expect(r.navigate?.path).toBe("/play/friend");
  });

  it("backward capture rule returns demo id", () => {
    const r = runTemirLocalBrain(makeReq("explain backward capture"));
    expect(r.boardDemoId).toBe("backward-capture");
  });
});

describe("sanitizeResponse", () => {
  it("strips invalid route and demo and clamps out-of-range move index", () => {
    const board = makeBoardWithCapture();
    const out = sanitizeResponse(
      {
        answer: "hi",
        navigate: { path: "/nope" as any, label: "x", reason: "x", autoOpen: false },
        boardDemoId: "nope" as any,
        recommendedMoveIndex: 99,
        followUpPrompt: null,
      },
      board,
    );
    expect(out.navigate).toBeNull();
    expect(out.boardDemoId).toBeNull();
    expect(out.recommendedMoveIndex).toBeNull();
  });
});

describe("maybeEnhanceWithOpenAi", () => {
  const draft: TemirAssistantResponse = {
    answer: "local answer",
    navigate: null,
    boardDemoId: null,
    recommendedMoveIndex: null,
    followUpPrompt: null,
  };

  it("returns draft when no config", async () => {
    const r = await maybeEnhanceWithOpenAi(makeReq("hi"), draft, null);
    expect(r).toEqual(draft);
  });

  it("returns draft on 429 quota response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("rate limited", { status: 429 })),
    );
    const r = await maybeEnhanceWithOpenAi(makeReq("hi"), draft, { apiKey: "sk-x", timeoutMs: 100 });
    expect(r.answer).toBe("local answer");
  });

  it("returns draft on AbortError / network failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        const err = new Error("aborted");
        err.name = "AbortError";
        throw err;
      }),
    );
    const r = await maybeEnhanceWithOpenAi(makeReq("hi"), draft, { apiKey: "sk-x", timeoutMs: 100 });
    expect(r.answer).toBe("local answer");
  });
});

describe("getTemirBoardDemo", () => {
  it("mandatory-capture demo flags forcedCapture and includes highlights", () => {
    const demo = getTemirBoardDemo("mandatory-capture");
    expect(demo.forcedCapture).toBe(true);
    expect((demo.highlightedSquares ?? []).length).toBeGreaterThan(0);
  });
});
