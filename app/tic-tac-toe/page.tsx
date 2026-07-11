"use client";

import { useCallback, useEffect, useState } from "react";

type Cell = "X" | "O" | "";
const EMPTY: Cell[] = Array(9).fill("");
const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

const HUMAN: Cell = "X";
const AI: Cell = "O";

function winner(b: Cell[]): Cell | null {
  for (const [a, c, d] of LINES) {
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
  }
  return null;
}
const isFull = (b: Cell[]) => b.every((c) => c);

export default function TicTacToe() {
  const [board, setBoard] = useState<Cell[]>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [record, setRecord] = useState({ w: 0, l: 0, d: 0 });

  useEffect(() => {
    const saved = localStorage.getItem("ttt-record");
    if (saved) setRecord(JSON.parse(saved));
  }, []);

  const bumpRecord = useCallback((key: "w" | "l" | "d") => {
    setRecord((r) => {
      const next = { ...r, [key]: r[key] + 1 };
      localStorage.setItem("ttt-record", JSON.stringify(next));
      return next;
    });
  }, []);

  const win = winner(board);
  const draw = !win && isFull(board);
  const over = !!win || draw;

  // Ask the Python API for the AI's move and apply it.
  const aiMove = useCallback(
    async (current: Cell[]) => {
      setBusy(true);
      try {
        const encoded = current.map((c) => c || "-").join("");
        const res = await fetch(`/api/tic-tac-toe?board=${encoded}&ai=${AI}`);
        const data: { move: number | null } = await res.json();
        if (data.move != null) {
          setBoard((b) => {
            if (b[data.move!] || winner(b)) return b;
            const next = [...b];
            next[data.move!] = AI;
            return next;
          });
        }
      } catch {
        // Network/API error — leave the board; status line will still be usable.
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  // Record the result once, when the game ends.
  useEffect(() => {
    if (win === HUMAN) bumpRecord("w");
    else if (win === AI) bumpRecord("l");
    else if (draw) bumpRecord("d");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [over]);

  function play(i: number) {
    if (board[i] || over || busy) return;
    const next = [...board];
    next[i] = HUMAN;
    setBoard(next);
    if (!winner(next) && !isFull(next)) aiMove(next);
  }

  function reset(aiFirst = false) {
    setBoard(EMPTY);
    if (aiFirst) aiMove(EMPTY);
  }

  const status = win
    ? win === HUMAN
      ? "You win! 🎉"
      : "The AI wins."
    : draw
      ? "Draw."
      : busy
        ? "AI thinking…"
        : "Your move (X)";

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-semibold tracking-tight">Tic-Tac-Toe</h1>
      <p className="mt-1 text-muted">
        You are <b>X</b>. The <b>O</b> moves come from a minimax AI running on the
        Python API — it is unbeatable, so aim for a draw.
      </p>

      <div className="mt-6 flex items-center justify-between">
        <span className="font-medium" aria-live="polite">{status}</span>
        <span className="text-sm text-muted font-mono">
          W {record.w} · L {record.l} · D {record.d}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 aspect-square">
        {board.map((c, i) => (
          <button
            key={i}
            onClick={() => play(i)}
            disabled={!!c || over || busy}
            aria-label={`cell ${i + 1}${c ? `, ${c}` : ""}`}
            className={`rounded-lg border border-border bg-card text-4xl font-mono font-bold
              flex items-center justify-center transition-colors
              disabled:cursor-not-allowed enabled:hover:bg-border/40
              ${c === "X" ? "text-accent" : "text-foreground"}`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-6 flex gap-2">
        <button
          onClick={() => reset(false)}
          className="rounded-md bg-accent text-accent-fg px-4 py-2 text-sm font-medium"
        >
          New game
        </button>
        <button
          onClick={() => reset(true)}
          disabled={busy}
          className="rounded-md border border-border px-4 py-2 text-sm"
        >
          Let AI start
        </button>
      </div>
    </div>
  );
}
