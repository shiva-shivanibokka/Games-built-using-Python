"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import GameShell from "../components/GameShell";
import Scoreboard from "../components/Scoreboard";
import { DifficultyTabs, TimerBadge, type Difficulty } from "../components/GameControls";
import { useTimer, readBest, saveBest } from "../lib/timer";

const GRAD = "linear-gradient(135deg,#f43f5e,#a21caf)";
const ACCENT = "#f43f5e";

// Grid size per difficulty. Hard=9 stays fast thanks to the generator's carve step.
const SIZES: Record<Difficulty, number> = { easy: 7, medium: 8, hard: 9 };

type Puzzle = { size: number; regions: number[]; solution: number[][]; seed: number };
// Cell states: 0 empty, 1 X-mark (note), 2 crown.
type Mark = 0 | 1 | 2;

const regionColor = (id: number, n: number) => `hsl(${(id * 360) / n}, 65%, 65%)`;

export default function Queens() {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [solved, setSolved] = useState(0);
  const [hint, setHint] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [best, setBest] = useState<number | null>(null);
  const timer = useTimer();
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const s = localStorage.getItem("queens-solved");
    if (s) setSolved(parseInt(s, 10) || 0);
  }, []);

  useEffect(() => {
    setBest(readBest("queens", difficulty));
  }, [difficulty]);

  const load = useCallback(async () => {
    setLoading(true);
    setSelected(null);
    setHint(null);
    try {
      const seed = Math.floor(Math.random() * 1e9);
      const res = await fetch(`/api/queens?seed=${seed}&size=${SIZES[difficulty]}`);
      const data: Puzzle = await res.json();
      setPuzzle(data);
      setMarks(new Array(data.size * data.size).fill(0) as Mark[]);
      timer.restart();
    } catch {
      // API unreachable — keep prior board; user can retry New game.
    } finally {
      setLoading(false);
    }
  }, [difficulty, timer.restart]);

  useEffect(() => {
    load();
  }, [load]);

  const n = puzzle?.size ?? 8;

  const cycle = useCallback(
    (i: number) => {
      if (!puzzle) return;
      setHint(null);
      setMarks((prev) => {
        const next = [...prev];
        next[i] = ((prev[i] + 1) % 3) as Mark;
        return next;
      });
    },
    [puzzle]
  );

  // Hint: place a crown on one correct solution cell that isn't crowned yet.
  const showHint = useCallback(() => {
    if (!puzzle || loading) return;
    const target = puzzle.solution
      .map(([r, c]) => r * n + c)
      .find((idx) => marks[idx] !== 2);
    if (target == null) return;
    setMarks((prev) => {
      const next = [...prev];
      next[target] = 2 as Mark;
      return next;
    });
    setHint(target);
  }, [puzzle, loading, n, marks]);

  // Crowns and which of them break a rule (row/col/region/touch).
  const crowns: number[] = [];
  for (let i = 0; i < marks.length; i++) if (marks[i] === 2) crowns.push(i);

  const bad = new Set<number>();
  if (puzzle) {
    for (let a = 0; a < crowns.length; a++) {
      for (let b = a + 1; b < crowns.length; b++) {
        const i = crowns[a];
        const j = crowns[b];
        const ri = Math.floor(i / n);
        const ci = i % n;
        const rj = Math.floor(j / n);
        const cj = j % n;
        const touch = Math.abs(ri - rj) <= 1 && Math.abs(ci - cj) <= 1;
        if (
          ri === rj ||
          ci === cj ||
          puzzle.regions[i] === puzzle.regions[j] ||
          touch
        ) {
          bad.add(i);
          bad.add(j);
        }
      }
    }
  }

  const won = !!puzzle && crowns.length === n && bad.size === 0;

  const wonRef = useRef(false);
  useEffect(() => {
    if (won && !wonRef.current) {
      wonRef.current = true;
      timer.stop();
      setBest(saveBest("queens", timer.ms, difficulty));
      setSolved((s) => {
        const next = s + 1;
        localStorage.setItem("queens-solved", String(next));
        return next;
      });
    } else if (!won) {
      wonRef.current = false;
    }
  }, [won, difficulty, timer.stop, timer.ms]);

  const move = useCallback(
    (i: number, dr: number, dc: number) => {
      const r = Math.floor(i / n) + dr;
      const c = (i % n) + dc;
      if (r < 0 || r >= n || c < 0 || c >= n) return;
      setSelected(r * n + c);
    },
    [n]
  );

  const onKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (selected == null) return;
      const k = e.key;
      if (k === "Enter" || k === " ") {
        cycle(selected);
        e.preventDefault();
      } else if (k === "ArrowUp") {
        move(selected, -1, 0);
        e.preventDefault();
      } else if (k === "ArrowDown") {
        move(selected, 1, 0);
        e.preventDefault();
      } else if (k === "ArrowLeft") {
        move(selected, 0, -1);
        e.preventDefault();
      } else if (k === "ArrowRight") {
        move(selected, 0, 1);
        e.preventDefault();
      }
    },
    [selected, cycle, move]
  );

  const status = won
    ? "Solved! 👑 Every crown in its place."
    : loading
      ? "Growing a fresh kingdom…"
      : `Place ${n} crowns — one per row, column & color, none touching.`;

  return (
    <GameShell slug="queens" won={won}>
      <Scoreboard
        stats={[{ label: "Solved", value: solved, color: ACCENT }]}
        onClear={() => {
          setSolved(0);
          localStorage.removeItem("queens-solved");
        }}
      />

      <div className="mt-5 flex items-center justify-between gap-3">
        <DifficultyTabs
          value={difficulty}
          onChange={setDifficulty}
          accent={ACCENT}
          disabled={loading}
        />
        <TimerBadge ms={timer.ms} best={best} />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="font-display text-lg font-bold" aria-live="polite">
          {status}
        </span>
        <span className="shrink-0 text-xs text-muted">
          {crowns.length}/{n} crowns
        </span>
      </div>

      <div
        ref={gridRef}
        tabIndex={0}
        onKeyDown={onKey}
        role="grid"
        aria-label="Queens board"
        className="pop-card mt-4 grid gap-0 overflow-hidden p-2 aspect-square outline-none"
        style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
      >
        {puzzle &&
          marks.map((m, i) => {
            const r = Math.floor(i / n);
            const c = i % n;
            const region = puzzle.regions[i];
            const isSel = selected === i;
            const isBad = bad.has(i);
            return (
              <button
                key={i}
                role="gridcell"
                onClick={() => {
                  setSelected(i);
                  cycle(i);
                }}
                aria-label={`row ${r + 1}, column ${c + 1}, ${
                  m === 2 ? "crown" : m === 1 ? "marked" : "empty"
                }`}
                className="relative flex items-center justify-center text-lg font-bold transition-transform sm:text-2xl"
                style={{
                  aspectRatio: "1",
                  background: regionColor(region, n),
                  boxShadow: isSel ? "inset 0 0 0 3px var(--foreground)" : undefined,
                  outline: hint === i ? `3px solid ${ACCENT}` : undefined,
                  outlineOffset: hint === i ? "2px" : undefined,
                  borderRight:
                    c !== n - 1 && puzzle.regions[i + 1] !== region
                      ? "2px solid rgba(0,0,0,0.55)"
                      : "1px solid rgba(0,0,0,0.12)",
                  borderBottom:
                    r !== n - 1 && puzzle.regions[i + n] !== region
                      ? "2px solid rgba(0,0,0,0.55)"
                      : "1px solid rgba(0,0,0,0.12)",
                }}
              >
                {m === 2 ? (
                  <span
                    style={{
                      filter: isBad
                        ? "drop-shadow(0 0 3px #dc2626) drop-shadow(0 0 3px #dc2626)"
                        : undefined,
                    }}
                  >
                    👑
                  </span>
                ) : m === 1 ? (
                  <span style={{ color: "rgba(0,0,0,0.6)" }}>✕</span>
                ) : null}
                {isBad && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{ boxShadow: "inset 0 0 0 3px #dc2626" }}
                  />
                )}
              </button>
            );
          })}
      </div>

      <p className="mt-3 text-center text-xs text-muted">
        Tap a cell to cycle: empty → ✕ note → 👑 crown. Invalid crowns glow red.
      </p>

      <div className="mt-4 flex gap-3">
        <button
          onClick={load}
          className="rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105"
          style={{ backgroundImage: GRAD }}
        >
          New game
        </button>
        <button
          onClick={showHint}
          disabled={!puzzle || loading || won}
          className="rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:border-foreground/30 disabled:opacity-50"
        >
          Hint
        </button>
        <button
          onClick={() => {
            if (!puzzle) return;
            setHint(null);
            setMarks(new Array(n * n).fill(0) as Mark[]);
          }}
          className="rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:border-foreground/30"
        >
          Reset board
        </button>
      </div>
    </GameShell>
  );
}
