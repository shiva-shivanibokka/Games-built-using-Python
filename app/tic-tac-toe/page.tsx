"use client";

import { useCallback, useEffect, useState } from "react";
import GameShell from "../components/GameShell";
import Scoreboard from "../components/Scoreboard";
import { DifficultyTabs, TimerBadge, type Difficulty } from "../components/GameControls";
import { useTimer } from "../lib/timer";

type Cell = "X" | "O" | "";
const EMPTY: Cell[] = Array(9).fill("");
const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];
const HUMAN: Cell = "X";
const AI: Cell = "O";
const X_COLOR = "#a78bff";
const O_COLOR = "#ec4899";
const BLANK = { w: 0, l: 0, d: 0 };

function winLine(b: Cell[]): number[] | null {
  for (const line of LINES) {
    const [a, c, d] = line;
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return line;
  }
  return null;
}
const isFull = (b: Cell[]) => b.every((c) => c);

export default function TicTacToe() {
  const [board, setBoard] = useState<Cell[]>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [record, setRecord] = useState(BLANK);
  const [hint, setHint] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("hard");
  const timer = useTimer();

  useEffect(() => {
    const saved = localStorage.getItem("ttt-record");
    if (saved) setRecord(JSON.parse(saved));
  }, []);

  const bump = useCallback((key: "w" | "l" | "d") => {
    setRecord((r) => {
      const next = { ...r, [key]: r[key] + 1 };
      localStorage.setItem("ttt-record", JSON.stringify(next));
      return next;
    });
  }, []);

  const line = winLine(board);
  const win: Cell | null = line ? board[line[0]] : null;
  const draw = !win && isFull(board);
  const over = !!win || draw;

  const aiMove = useCallback(async (current: Cell[]) => {
    setBusy(true);
    try {
      const encoded = current.map((c) => c || "-").join("");
      const res = await fetch(`/api/tic-tac-toe?board=${encoded}&ai=${AI}&level=${difficulty}`);
      const data: { move: number | null } = await res.json();
      if (data.move != null) {
        setBoard((b) => {
          if (b[data.move!] || winLine(b)) return b;
          const next = [...b];
          next[data.move!] = AI;
          return next;
        });
      }
    } catch {
      // API unreachable — board stays; player can start a new game.
    } finally {
      setBusy(false);
    }
  }, [difficulty]);

  useEffect(() => {
    if (win === HUMAN) bump("w");
    else if (win === AI) bump("l");
    else if (draw) bump("d");
    if (over) timer.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [over]);

  function play(i: number) {
    if (board[i] || over || busy) return;
    setHint(null);
    const next = [...board];
    next[i] = HUMAN;
    setBoard(next);
    if (!winLine(next) && !isFull(next)) aiMove(next);
  }

  function reset(aiFirst = false) {
    setHint(null);
    setBoard(EMPTY);
    timer.restart();
    if (aiFirst) aiMove(EMPTY);
  }

  // Hint: ask the API for X's optimal move and highlight it (don't auto-play).
  const showHint = useCallback(async () => {
    if (over || busy) return;
    try {
      const encoded = board.map((c) => c || "-").join("");
      const res = await fetch(`/api/tic-tac-toe?board=${encoded}&ai=${HUMAN}`);
      const data: { move: number | null } = await res.json();
      if (data.move != null) setHint(data.move);
    } catch {
      // API unreachable — no hint.
    }
  }, [board, over, busy]);

  const status = win
    ? win === HUMAN
      ? "You win! 🎉"
      : "The AI takes it."
    : draw
      ? "Draw — the only way to survive."
      : busy
        ? "AI thinking…"
        : "Your move";

  return (
    <GameShell slug="tic-tac-toe">
      <Scoreboard
        stats={[
          { label: "You", value: record.w, color: X_COLOR },
          { label: "AI", value: record.l, color: O_COLOR },
          { label: "Draws", value: record.d },
        ]}
        onClear={() => {
          setRecord(BLANK);
          localStorage.removeItem("ttt-record");
        }}
      />

      <div className="mt-5 flex items-center justify-between">
        <span className="font-display text-lg font-bold" aria-live="polite">
          {status}
        </span>
        <span className="text-sm text-muted">
          You’re <b style={{ color: X_COLOR }}>X</b> · AI is{" "}
          <b style={{ color: O_COLOR }}>O</b>
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <DifficultyTabs
          value={difficulty}
          onChange={(d) => {
            setDifficulty(d);
            reset(false);
          }}
          accent="#7c3aed"
          disabled={busy}
        />
        <TimerBadge ms={timer.ms} best={null} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 aspect-square">
        {board.map((c, i) => {
          const winning = line?.includes(i);
          return (
            <button
              key={i}
              onClick={() => play(i)}
              disabled={!!c || over || busy}
              aria-label={`cell ${i + 1}${c ? `, ${c}` : ", empty"}`}
              className={`pop-card flex items-center justify-center text-5xl font-display font-extrabold
                transition-all duration-150 enabled:hover:scale-[1.03] enabled:hover:brightness-125
                disabled:cursor-not-allowed ${winning ? "scale-[1.03]" : ""}`}
              style={{
                color: c === "X" ? X_COLOR : O_COLOR,
                outline: hint === i ? `3px solid ${X_COLOR}` : undefined,
                outlineOffset: hint === i ? "2px" : undefined,
                boxShadow: winning
                  ? `0 0 0 2px ${c === "X" ? X_COLOR : O_COLOR}, 0 12px 40px -10px ${
                      c === "X" ? X_COLOR : O_COLOR
                    }`
                  : undefined,
              }}
            >
              {c}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={() => reset(false)}
          className="rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105"
          style={{ backgroundImage: "linear-gradient(135deg,#7c3aed,#ec4899)" }}
        >
          New game
        </button>
        <button
          onClick={showHint}
          disabled={over || busy}
          className="rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:border-foreground/30 disabled:opacity-50"
        >
          Hint
        </button>
        <button
          onClick={() => reset(true)}
          disabled={busy}
          className="rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:border-foreground/30 disabled:opacity-50"
        >
          Let AI start
        </button>
      </div>
    </GameShell>
  );
}
