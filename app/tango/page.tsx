"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import GameShell from "../components/GameShell";
import Scoreboard from "../components/Scoreboard";
import { DifficultyTabs, TimerBadge, type Difficulty } from "../components/GameControls";
import { useTimer, readBest, saveBest } from "../lib/timer";

type Val = "S" | "M" | "";
type Given = { r: number; c: number; val: "S" | "M" };
type Edge = { r1: number; c1: number; r2: number; c2: number; type: "=" | "x" };
type Puzzle = {
  size: number;
  givens: Given[];
  edges: Edge[];
  solution: string;
  seed: number;
};

const SIZE = 6;
const HALF = SIZE / 2;
const SUN = "#f59e0b";
const MOON = "#6366f1";
const GRADIENT = "linear-gradient(135deg,#f59e0b,#ef4444)";
const ICON: Record<"S" | "M", string> = { S: "☀️", M: "🌙" };

function boardFromGivens(givens: Given[]): Val[] {
  const b: Val[] = Array(SIZE * SIZE).fill("");
  for (const g of givens) b[g.r * SIZE + g.c] = g.val;
  return b;
}

/** Indices of cells that break a rule, for live red highlighting. */
function violations(board: Val[], edges: Edge[]): Set<number> {
  const bad = new Set<number>();
  const at = (r: number, c: number) => board[r * SIZE + c];

  for (let i = 0; i < SIZE; i++) {
    // three-in-a-row + overspill, per row and per column
    for (const line of [
      Array.from({ length: SIZE }, (_, j) => i * SIZE + j), // row i
      Array.from({ length: SIZE }, (_, j) => j * SIZE + i), // col i
    ]) {
      for (let j = 0; j < SIZE - 2; j++) {
        const [a, b, c] = [line[j], line[j + 1], line[j + 2]];
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
          bad.add(a);
          bad.add(b);
          bad.add(c);
        }
      }
      for (const sym of ["S", "M"] as const) {
        if (line.filter((k) => board[k] === sym).length > HALF)
          line.filter((k) => board[k] === sym).forEach((k) => bad.add(k));
      }
    }
  }

  for (const e of edges) {
    const a = at(e.r1, e.c1);
    const b = at(e.r2, e.c2);
    if (!a || !b) continue;
    if ((e.type === "=" && a !== b) || (e.type === "x" && a === b)) {
      bad.add(e.r1 * SIZE + e.c1);
      bad.add(e.r2 * SIZE + e.c2);
    }
  }
  return bad;
}

export default function Tango() {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [board, setBoard] = useState<Val[]>([]);
  const [solved, setSolved] = useState(0);
  const [won, setWon] = useState(false);
  const [hint, setHint] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [best, setBest] = useState<number | null>(null);
  const timer = useTimer();

  useEffect(() => {
    const saved = localStorage.getItem("tango-solved");
    if (saved) setSolved(parseInt(saved, 10) || 0);
  }, []);

  useEffect(() => {
    setBest(readBest("tango", difficulty));
  }, [difficulty]);

  const load = useCallback(
    async (seed: number) => {
      setPuzzle(null);
      setWon(false);
      setHint(null);
      try {
        const res = await fetch(`/api/tango?seed=${seed}&difficulty=${difficulty}`);
        const data: Puzzle = await res.json();
        setPuzzle(data);
        setBoard(boardFromGivens(data.givens));
        timer.restart();
      } catch {
        // API unreachable — leave the loading state; "New game" can retry.
      }
    },
    [difficulty, timer],
  );

  useEffect(() => {
    load(Math.floor(Math.random() * 1_000_000_000));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty]);

  const givenSet = useMemo(
    () => new Set((puzzle?.givens ?? []).map((g) => g.r * SIZE + g.c)),
    [puzzle],
  );
  const bad = useMemo(
    () => violations(board, puzzle?.edges ?? []),
    [board, puzzle],
  );

  const full = board.length > 0 && board.every((v) => v);
  const win = full && bad.size === 0 && board.join("") === puzzle?.solution;

  useEffect(() => {
    if (win && !won) {
      setWon(true);
      timer.stop();
      setBest(saveBest("tango", timer.ms, difficulty));
      setSolved((s) => {
        const next = s + 1;
        localStorage.setItem("tango-solved", String(next));
        return next;
      });
    }
  }, [win, won, timer, difficulty]);

  function play(i: number) {
    if (won || givenSet.has(i)) return;
    setHint(null);
    setBoard((b) => {
      const next = [...b];
      next[i] = next[i] === "" ? "S" : next[i] === "S" ? "M" : "";
      return next;
    });
  }

  // Hint: reveal one correct non-given cell (empty or wrong).
  function showHint() {
    if (!puzzle || won) return;
    const target = board.findIndex(
      (v, i) => !givenSet.has(i) && v !== (puzzle.solution[i] as Val),
    );
    if (target < 0) return;
    setBoard((b) => {
      const next = [...b];
      next[target] = puzzle.solution[target] as Val;
      return next;
    });
    setHint(target);
  }

  const status = win
    ? "Solved! ☀️🌙 Beautifully balanced."
    : !puzzle
      ? "Dealing a fresh grid…"
      : full
        ? "Every cell filled — fix the red ones."
        : "Fill the grid: 3 suns, 3 moons per line.";

  return (
    <GameShell slug="tango" won={won}>
      <Scoreboard
        stats={[{ label: "Solved", value: solved, color: SUN }]}
        onClear={() => {
          setSolved(0);
          localStorage.removeItem("tango-solved");
        }}
      />

      <div className="mt-5 flex items-center justify-between gap-3">
        <DifficultyTabs
          value={difficulty}
          onChange={setDifficulty}
          accent={SUN}
          disabled={!puzzle}
        />
        <TimerBadge ms={timer.ms} best={best} />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="font-display text-lg font-bold" aria-live="polite">
          {status}
        </span>
        <span className="text-sm text-muted">
          <b style={{ color: SUN }}>☀️</b> = <b style={{ color: MOON }}>🌙</b>{" "}
          balance
        </span>
      </div>

      <div className="pop-card mt-4 p-3 sm:p-4">
        <div className="relative aspect-square w-full">
          <div className="grid h-full w-full grid-cols-6 grid-rows-6">
            {Array.from({ length: SIZE * SIZE }, (_, i) => {
              const fixed = givenSet.has(i);
              const v = board[i] ?? "";
              const wrong = bad.has(i);
              return (
                <button
                  key={i}
                  onClick={() => play(i)}
                  disabled={fixed || won}
                  aria-label={`row ${Math.floor(i / SIZE) + 1} column ${
                    (i % SIZE) + 1
                  }${v ? `, ${v === "S" ? "sun" : "moon"}` : ", empty"}${
                    fixed ? ", fixed" : ""
                  }`}
                  className="flex items-center justify-center border border-border text-2xl transition-all duration-150 enabled:hover:brightness-125 sm:text-3xl"
                  style={{
                    background: wrong
                      ? "rgba(239,68,68,0.22)"
                      : fixed
                        ? "rgba(255,255,255,0.06)"
                        : "transparent",
                    boxShadow: wrong ? "inset 0 0 0 2px #ef4444" : undefined,
                    outline: hint === i ? `3px solid ${SUN}` : undefined,
                    outlineOffset: hint === i ? "2px" : undefined,
                    cursor: fixed || won ? "default" : "pointer",
                  }}
                >
                  <span style={{ opacity: fixed ? 1 : 0.95 }}>
                    {v ? ICON[v] : ""}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Constraint badges centered on the shared border of each pair. */}
          {(puzzle?.edges ?? []).map((e, k) => {
            const horiz = e.r1 === e.r2;
            const left = horiz ? (e.c1 + 1) / SIZE : (e.c1 + 0.5) / SIZE;
            const top = horiz ? (e.r1 + 0.5) / SIZE : (e.r1 + 1) / SIZE;
            return (
              <span
                key={k}
                aria-hidden
                className="pointer-events-none absolute flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-xs font-bold text-white shadow"
                style={{
                  left: `${left * 100}%`,
                  top: `${top * 100}%`,
                  backgroundImage: GRADIENT,
                }}
              >
                {e.type === "=" ? "=" : "×"}
              </span>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={() => load(Math.floor(Math.random() * 1_000_000_000))}
          className="rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105"
          style={{ backgroundImage: GRADIENT }}
        >
          New game
        </button>
        <button
          onClick={showHint}
          disabled={!puzzle || won}
          className="rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:border-foreground/30 disabled:opacity-50"
        >
          Hint
        </button>
        <button
          onClick={() => {
            if (!puzzle) return;
            setHint(null);
            setBoard(boardFromGivens(puzzle.givens));
          }}
          disabled={!puzzle || won}
          className="rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:border-foreground/30 disabled:opacity-50"
        >
          Reset
        </button>
      </div>
    </GameShell>
  );
}
