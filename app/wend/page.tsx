"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import GameShell from "../components/GameShell";
import Scoreboard from "../components/Scoreboard";

type Board = {
  size: number;
  walls: [number, number][];
  letters: string[][];
  words: string[];
  solution: [number, number][][];
  seed: number;
};

type Found = { word: string; cells: number[]; color: string };

const SKY = "#0ea5e9";
const INDIGO = "#6366f1";
const GRADIENT = "linear-gradient(135deg,#0ea5e9,#6366f1)";
// One color per word slot (lengths 3 / 4 / 5 / 6).
const SLOT_COLORS = ["#0ea5e9", "#6366f1", "#22c55e", "#f59e0b"];

const rc = (idx: number, size: number) => [Math.floor(idx / size), idx % size];
const adjacent = (a: number, b: number, size: number) => {
  const [ar, ac] = rc(a, size);
  const [br, bc] = rc(b, size);
  return Math.abs(ar - br) + Math.abs(ac - bc) === 1;
};

export default function Wend() {
  const [board, setBoard] = useState<Board | null>(null);
  const [trace, setTrace] = useState<number[]>([]);
  const [found, setFound] = useState<Found[]>([]);
  const [solved, setSolved] = useState(0);
  const [won, setWon] = useState(false);
  const drawing = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem("wend-solved");
    if (saved) setSolved(parseInt(saved, 10) || 0);
  }, []);

  const load = useCallback(async (seed?: number) => {
    const s = seed ?? Math.floor(Math.random() * 2 ** 31);
    setTrace([]);
    setFound([]);
    setWon(false);
    try {
      const res = await fetch(`/api/wend?seed=${s}`);
      setBoard(await res.json());
    } catch {
      // API unreachable — keep current board.
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const size = board?.size ?? 5;
  const wallSet = new Set((board?.walls ?? []).map(([r, c]) => r * size + c));
  const usedSet = new Set(found.flatMap((f) => f.cells));
  const letterAt = (idx: number) => {
    const [r, c] = rc(idx, size);
    return board?.letters[r]?.[c] ?? "";
  };

  const extend = useCallback(
    (idx: number) => {
      if (!board || won) return;
      if (wallSet.has(idx) || usedSet.has(idx)) return; // walls / locked cells
      setTrace((p) => {
        if (p.length === 0) return [idx];
        const last = p[p.length - 1];
        if (idx === last) return p;
        if (p.length >= 2 && idx === p[p.length - 2]) return p.slice(0, -1); // backtrack
        if (!p.includes(idx) && adjacent(idx, last, size)) return [...p, idx];
        return p;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [board, won, found]
  );

  // Lift finger: if the trace spells an unfound target word (either direction), lock it.
  const commit = useCallback(() => {
    drawing.current = false;
    if (!board) return;
    setTrace((p) => {
      if (p.length >= 3) {
        const spelled = p.map(letterAt).join("");
        const reversed = [...spelled].reverse().join("");
        const foundWords = new Set(found.map((f) => f.word));
        const match = board.words.find(
          (w) => !foundWords.has(w) && (w === spelled || w === reversed)
        );
        if (match) {
          const slot = board.words.indexOf(match);
          const cells = match === reversed ? [...p].reverse() : p;
          setFound((fs) => [...fs, { word: match, cells, color: SLOT_COLORS[slot] }]);
        }
      }
      return [];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, found]);

  // Win when all four words are found (they tile every open cell by construction).
  useEffect(() => {
    if (!board || won) return;
    if (found.length === 4) {
      setWon(true);
      setSolved((s) => {
        const next = s + 1;
        localStorage.setItem("wend-solved", String(next));
        return next;
      });
    }
  }, [found, board, won]);

  const cellFromPoint = (x: number, y: number): number | null => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    const idx = el?.closest("[data-idx]")?.getAttribute("data-idx");
    return idx == null ? null : parseInt(idx, 10);
  };
  const onPointerDown = (e: React.PointerEvent, idx: number) => {
    e.preventDefault();
    drawing.current = true;
    extend(idx);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const idx = cellFromPoint(e.clientX, e.clientY);
    if (idx != null) extend(idx);
  };

  const traceSet = new Set(trace);
  const colorOf = (idx: number): string | undefined =>
    found.find((f) => f.cells.includes(idx))?.color;

  const status = !board
    ? "Loading…"
    : won
      ? "Solved! Every word placed. 🎉"
      : found.length === 0
        ? "Drag across letters to trace a hidden word."
        : `${found.length} / 4 words found`;

  return (
    <GameShell slug="wend">
      <Scoreboard
        stats={[{ label: "Solved", value: solved, color: SKY }]}
        onClear={() => {
          setSolved(0);
          localStorage.removeItem("wend-solved");
        }}
      />

      <div className="mt-5 flex items-center justify-between">
        <span className="font-display text-lg font-bold" aria-live="polite">
          {status}
        </span>
        <span className="text-sm text-muted">
          Tile <b style={{ color: INDIGO }}>every</b> open cell
        </span>
      </div>

      {/* Word-length slots */}
      <div className="mt-4 flex flex-wrap gap-2">
        {[3, 4, 5, 6].map((len, slot) => {
          const hit = found.find((f) => f.word.length === len);
          return (
            <div
              key={len}
              className="pop-card flex items-center gap-1 px-3 py-1.5"
              style={hit ? { borderColor: SLOT_COLORS[slot] } : undefined}
            >
              {hit ? (
                <span
                  className="font-display font-extrabold tracking-widest"
                  style={{ color: SLOT_COLORS[slot] }}
                >
                  {hit.word}
                </span>
              ) : (
                <span className="font-display tracking-widest text-muted">
                  {"·".repeat(len)}
                </span>
              )}
              <span className="ml-1 text-[10px] text-muted">{len}</span>
            </div>
          );
        })}
      </div>

      <div
        onPointerMove={onPointerMove}
        onPointerUp={commit}
        onPointerLeave={commit}
        onPointerCancel={commit}
        className="relative mt-4 grid aspect-square touch-none select-none gap-2"
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: size * size }, (_, idx) => {
          const isWall = wallSet.has(idx);
          const locked = colorOf(idx);
          const inTrace = traceSet.has(idx);
          const isHead = trace[trace.length - 1] === idx;
          return (
            <button
              key={idx}
              data-idx={idx}
              disabled={isWall}
              onPointerDown={(e) => !isWall && onPointerDown(e, idx)}
              aria-label={
                isWall ? "wall" : `letter ${letterAt(idx)}${locked ? ", found" : ""}`
              }
              className="pop-card relative flex items-center justify-center text-2xl font-display font-extrabold transition-transform"
              style={{
                color: isWall ? undefined : locked ? "#fff" : inTrace ? "#fff" : INDIGO,
                background: isWall
                  ? "#1e293b"
                  : locked
                    ? locked
                    : inTrace
                      ? GRADIENT
                      : undefined,
                boxShadow: isHead ? `0 0 0 3px ${SKY}` : undefined,
                cursor: isWall ? "default" : "pointer",
              }}
            >
              {isWall ? "" : letterAt(idx)}
            </button>
          );
        })}
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
          onClick={() => setTrace([])}
          className="rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:border-foreground/30"
        >
          Clear trace
        </button>
        <button
          onClick={() => {
            setFound([]);
            setTrace([]);
            setWon(false);
          }}
          className="rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:border-foreground/30"
        >
          Reset
        </button>
      </div>
    </GameShell>
  );
}
