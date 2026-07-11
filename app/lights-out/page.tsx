"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import GameShell from "../components/GameShell";
import Scoreboard from "../components/Scoreboard";

const GRAD = "linear-gradient(135deg,#eab308,#84cc16)";
const LIT = "#eab308";

type Puzzle = { size: number; board: number[]; solution: number[] };

export default function LightsOut() {
  const [size, setSize] = useState(5);
  const [cells, setCells] = useState<number[]>([]);
  const [solution, setSolution] = useState<number[]>([]);
  const [pressed, setPressed] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [loading, setLoading] = useState(true);
  const [solved, setSolved] = useState(0);
  const [hint, setHint] = useState<number | null>(null);

  useEffect(() => {
    const s = localStorage.getItem("lightsout-solved");
    if (s) setSolved(parseInt(s, 10) || 0);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setHint(null);
    try {
      const seed = Math.floor(Math.random() * 1e9);
      const res = await fetch(`/api/lights-out?seed=${seed}&size=5`);
      const data: Puzzle = await res.json();
      setSize(data.size);
      setCells(data.board);
      setSolution(data.solution);
      setPressed(new Array(data.board.length).fill(0));
      setMoves(0);
    } catch {
      // API unreachable — leave prior board; user can retry New game.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const won = cells.length > 0 && cells.every((c) => c === 0);

  // Award a solve exactly once when the board goes fully dark.
  const wonRef = useRef(false);
  useEffect(() => {
    if (won && !wonRef.current) {
      wonRef.current = true;
      setSolved((s) => {
        const next = s + 1;
        localStorage.setItem("lightsout-solved", String(next));
        return next;
      });
    } else if (!won) {
      wonRef.current = false;
    }
  }, [won]);

  const press = useCallback(
    (i: number) => {
      if (won || loading) return;
      setHint(null);
      setMoves((m) => m + 1);
      setPressed((p) => {
        const n = [...p];
        n[i] ^= 1;
        return n;
      });
      setCells((prev) => {
        const next = [...prev];
        const r = Math.floor(i / size);
        const c = i % size;
        const toggle = (rr: number, cc: number) => {
          if (rr < 0 || rr >= size || cc < 0 || cc >= size) return;
          const j = rr * size + cc;
          next[j] = next[j] ? 0 : 1;
        };
        toggle(r, c);
        toggle(r - 1, c);
        toggle(r + 1, c);
        toggle(r, c - 1);
        toggle(r, c + 1);
        return next;
      });
    },
    [won, loading, size]
  );

  // Hint: a cell that still needs pressing to finish. Over GF(2) the remaining
  // press set is solution XOR the presses made so far, so this stays correct
  // no matter what order (or how many extra) moves the player has made.
  const showHint = useCallback(() => {
    const target = solution.findIndex((p, i) => (p ^ (pressed[i] ?? 0)) === 1);
    setHint(target);
  }, [solution, pressed]);

  const status = won
    ? "All dark! 🎉 Nicely done."
    : loading
      ? "Wiring up the grid…"
      : "Turn every light off";

  return (
    <GameShell slug="lights-out">
      <Scoreboard
        stats={[
          { label: "Solved", value: solved, color: LIT },
          { label: "Moves", value: moves, color: "#84cc16" },
        ]}
        onClear={() => {
          setSolved(0);
          localStorage.removeItem("lightsout-solved");
        }}
      />

      <div className="mt-5">
        <span className="font-display text-lg font-bold" aria-live="polite">
          {status}
        </span>
      </div>

      <div
        role="grid"
        aria-label="Lights Out board"
        className="pop-card mt-4 grid gap-2 p-3 aspect-square"
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
      >
        {cells.map((on, i) => {
          const isHint = hint === i;
          return (
            <button
              key={i}
              role="gridcell"
              onClick={() => press(i)}
              disabled={won || loading}
              aria-label={`row ${Math.floor(i / size) + 1}, column ${
                (i % size) + 1
              }, ${on ? "on" : "off"}`}
              aria-pressed={on === 1}
              className="rounded-xl transition-all duration-150 enabled:hover:scale-105 enabled:active:scale-95 disabled:cursor-not-allowed"
              style={{
                aspectRatio: "1",
                background: on ? GRAD : "rgba(120,120,120,0.1)",
                boxShadow: on
                  ? "0 0 26px 1px rgba(234,179,8,0.65), inset 0 0 14px rgba(255,255,255,0.35)"
                  : "inset 0 0 0 1px var(--border)",
                outline: isHint ? `3px solid ${LIT}` : undefined,
                outlineOffset: isHint ? "2px" : undefined,
              }}
            />
          );
        })}
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={load}
          className="rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105"
          style={{ backgroundImage: GRAD }}
        >
          New game
        </button>
        <button
          onClick={showHint}
          disabled={won || loading}
          className="rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:border-foreground/30 disabled:opacity-50"
        >
          Hint
        </button>
      </div>
    </GameShell>
  );
}
