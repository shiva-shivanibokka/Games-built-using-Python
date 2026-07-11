"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import GameShell from "../components/GameShell";
import Scoreboard from "../components/Scoreboard";
import { DifficultyTabs, TimerBadge, type Difficulty } from "../components/GameControls";
import { useTimer, readBest, saveBest } from "../lib/timer";

type Num = { r: number; c: number; n: number };
type Board = { size: number; numbers: Num[]; solution: number[][]; seed: number };

const GREEN = "#22c55e";
const TEAL = "#14b8a6";
const GRADIENT = "linear-gradient(135deg,#22c55e,#14b8a6)";

// easy / medium / hard → grid size (API clamps to 4..8).
const SIZES: Record<Difficulty, number> = { easy: 5, medium: 6, hard: 7 };

const rc = (idx: number, size: number) => [Math.floor(idx / size), idx % size];
const adjacent = (a: number, b: number, size: number) => {
  const [ar, ac] = rc(a, size);
  const [br, bc] = rc(b, size);
  return Math.abs(ar - br) + Math.abs(ac - bc) === 1;
};

export default function Zip() {
  const [board, setBoard] = useState<Board | null>(null);
  const [path, setPath] = useState<number[]>([]);
  const [solved, setSolved] = useState(0);
  const [won, setWon] = useState(false);
  const [hint, setHint] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [best, setBest] = useState<number | null>(null);

  const timer = useTimer();
  const gridRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const drawing = useRef(false);
  const [points, setPoints] = useState<string>("");
  const [stroke, setStroke] = useState(14);

  useEffect(() => {
    const saved = localStorage.getItem("zip-solved");
    if (saved) setSolved(parseInt(saved, 10) || 0);
  }, []);

  const load = useCallback(async (seed?: number) => {
    const s = seed ?? Math.floor(Math.random() * 2 ** 31);
    setPath([]);
    setWon(false);
    setHint(null);
    try {
      const res = await fetch(`/api/zip?seed=${s}&size=${SIZES[difficulty]}`);
      setBoard(await res.json());
      setBest(readBest("zip", difficulty));
      timer.restart();
    } catch {
      // API unreachable — leave the current board.
    }
  }, [difficulty, timer]);

  // Load a fresh board on mount and whenever the difficulty changes.
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty]);

  // Checkpoint number for a cell index, or undefined.
  const checkAt = (idx: number): number | undefined => {
    if (!board) return undefined;
    const [r, c] = rc(idx, board.size);
    return board.numbers.find((n) => n.r === r && n.c === c)?.n;
  };
  const startIdx = board
    ? (() => {
        const one = board.numbers.find((n) => n.n === 1)!;
        return one.r * board.size + one.c;
      })()
    : -1;
  const maxN = board ? Math.max(...board.numbers.map((n) => n.n)) : 0;

  const extend = useCallback(
    (idx: number) => {
      if (!board || won) return;
      setPath((p) => {
        if (p.length === 0) return idx === startIdx ? [idx] : p;
        const last = p[p.length - 1];
        if (idx === last) return p;
        if (p.length >= 2 && idx === p[p.length - 2]) return p.slice(0, -1); // backtrack
        if (!p.includes(idx) && adjacent(idx, last, board.size)) return [...p, idx];
        return p;
      });
    },
    [board, won, startIdx]
  );

  // Hint: highlight the next cell along the canonical solution — the cell after
  // the longest prefix of the current path that matches the solution.
  const showHint = useCallback(() => {
    if (!board || won) return;
    const sol = board.solution.map(([r, c]) => r * board.size + c);
    let k = 0;
    while (k < path.length && k < sol.length && path[k] === sol[k]) k++;
    setHint(sol[Math.min(k, sol.length - 1)] ?? null);
  }, [board, won, path]);

  // Detect a win: full coverage + checkpoints hit in ascending order.
  useEffect(() => {
    if (!board || won) return;
    if (path.length !== board.size * board.size) return;
    const order = path.map(checkAt).filter((n): n is number => n !== undefined);
    const ok = order.length === board.numbers.length && order.every((n, i) => n === i + 1);
    if (ok) {
      setWon(true);
      timer.stop();
      setBest(saveBest("zip", timer.ms, difficulty));
      setSolved((s) => {
        const next = s + 1;
        localStorage.setItem("zip-solved", String(next));
        return next;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, board, won]);

  // Recompute the trail polyline + stroke width from measured cell geometry.
  useEffect(() => {
    const g = gridRef.current;
    if (!g || path.length === 0) {
      setPoints("");
      return;
    }
    const pts = path
      .map((idx) => {
        const el = cellRefs.current[idx];
        if (!el) return null;
        return `${el.offsetLeft + el.offsetWidth / 2},${el.offsetTop + el.offsetHeight / 2}`;
      })
      .filter(Boolean)
      .join(" ");
    setPoints(pts);
    const sample = cellRefs.current.find(Boolean);
    if (sample) setStroke(Math.max(8, sample.offsetWidth * 0.44));
  }, [path, board]);

  useEffect(() => {
    const onResize = () => setPath((p) => [...p]); // trigger recompute
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Pointer routing: works for mouse and touch (elementFromPoint handles touch drag).
  const cellFromPoint = (x: number, y: number): number | null => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    const idx = el?.closest("[data-idx]")?.getAttribute("data-idx");
    return idx == null ? null : parseInt(idx, 10);
  };
  const onPointerDown = (e: React.PointerEvent, idx: number) => {
    e.preventDefault();
    setHint(null);
    drawing.current = true;
    extend(idx);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const idx = cellFromPoint(e.clientX, e.clientY);
    if (idx != null) extend(idx);
  };
  const stop = () => {
    drawing.current = false;
  };

  const size = board?.size ?? SIZES[difficulty];
  const pathSet = new Set(path);
  const status = !board
    ? "Loading…"
    : won
      ? "Solved! Every cell, in order. 🎉"
      : path.length === 0
        ? "Tap 1, then drag through every cell in order."
        : path.length === size * size
          ? "All cells filled — but checkpoints are out of order."
          : `${path.length} / ${size * size} cells`;

  return (
    <GameShell slug="zip">
      <Scoreboard
        stats={[{ label: "Solved", value: solved, color: GREEN }]}
        onClear={() => {
          setSolved(0);
          localStorage.removeItem("zip-solved");
        }}
      />

      <div className="mt-5 flex items-center justify-between gap-3">
        <DifficultyTabs
          value={difficulty}
          onChange={setDifficulty}
          accent={GREEN}
          disabled={!board}
        />
        <TimerBadge ms={timer.ms} best={best} />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="font-display text-lg font-bold" aria-live="polite">
          {status}
        </span>
        <span className="text-sm text-muted">
          Fill <b style={{ color: TEAL }}>every</b> cell · hit{" "}
          <b style={{ color: GREEN }}>1→{maxN || "k"}</b> in order
        </span>
      </div>

      <div
        ref={gridRef}
        onPointerMove={onPointerMove}
        onPointerUp={stop}
        onPointerLeave={stop}
        onPointerCancel={stop}
        className="relative mt-4 grid aspect-square touch-none select-none gap-2"
        style={{
          gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${size}, minmax(0, 1fr))`,
        }}
      >
        {/* Interactive cell boxes (bottom layer). */}
        {Array.from({ length: size * size }, (_, idx) => {
          const inPath = pathSet.has(idx);
          const isHead = path[path.length - 1] === idx;
          return (
            <button
              key={idx}
              data-idx={idx}
              ref={(el) => {
                cellRefs.current[idx] = el;
              }}
              onPointerDown={(e) => onPointerDown(e, idx)}
              aria-label={`cell ${idx + 1}${checkAt(idx) ? `, checkpoint ${checkAt(idx)}` : ""}${inPath ? ", on path" : ""}`}
              className="pop-card relative transition-transform"
              style={{
                zIndex: 1,
                background: inPath ? "rgba(34,197,94,0.10)" : undefined,
                boxShadow: isHead ? `0 0 0 2px ${GREEN}` : undefined,
                outline: hint === idx ? `3px solid ${GREEN}` : undefined,
                outlineOffset: hint === idx ? "2px" : undefined,
              }}
            />
          );
        })}

        {/* Continuous trail: one thick gradient line through visited centers,
            sitting above the boxes but below the numbers. */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          style={{ zIndex: 2 }}
        >
          <defs>
            <linearGradient id="zip-trail" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={GREEN} />
              <stop offset="100%" stopColor={TEAL} />
            </linearGradient>
          </defs>
          {points && (
            <polyline
              points={points}
              fill="none"
              stroke="url(#zip-trail)"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>

        {/* Checkpoint numbers overlay (top layer), aligned to the same grid. */}
        <div
          className="pointer-events-none absolute inset-0 grid gap-2"
          style={{
            zIndex: 3,
            gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${size}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: size * size }, (_, idx) => {
            const n = checkAt(idx);
            return (
              <div key={idx} className="flex items-center justify-center">
                {n != null && (
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-full text-lg font-display font-extrabold text-white shadow-lg"
                    style={{ backgroundImage: GRADIENT, boxShadow: "0 2px 8px rgba(0,0,0,0.35)" }}
                  >
                    {n}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={() => load()}
          className="rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105"
          style={{ backgroundImage: GRADIENT }}
        >
          New game
        </button>
        <button
          onClick={showHint}
          disabled={!board || won}
          className="rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:border-foreground/30 disabled:opacity-50"
        >
          Hint
        </button>
        <button
          onClick={() => {
            setHint(null);
            setPath([]);
            setWon(false);
          }}
          className="rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:border-foreground/30"
        >
          Reset path
        </button>
      </div>
    </GameShell>
  );
}
