"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import GameShell from "../components/GameShell";
import Scoreboard from "../components/Scoreboard";
import { DifficultyTabs, TimerBadge, type Difficulty } from "../components/GameControls";
import { useTimer, readBest, saveBest } from "../lib/timer";

const GRAD = "linear-gradient(135deg,#06b6d4,#3b82f6)";
const ACCENT = "#06b6d4";

type Puzzle = { puzzle: string; solution: string };

// Indices sharing a row/col/box with `i` (for conflict + peer highlighting).
function peers(i: number): number[] {
  const r = Math.floor(i / 9);
  const c = i % 9;
  const br = Math.floor(r / 3) * 3;
  const bc = Math.floor(c / 3) * 3;
  const set = new Set<number>();
  for (let k = 0; k < 9; k++) {
    set.add(r * 9 + k);
    set.add(k * 9 + c);
  }
  for (let rr = br; rr < br + 3; rr++)
    for (let cc = bc; cc < bc + 3; cc++) set.add(rr * 9 + cc);
  set.delete(i);
  return [...set];
}

export default function Sudoku() {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [given, setGiven] = useState<boolean[]>([]);
  const [values, setValues] = useState<string[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [loading, setLoading] = useState(true);
  const [solved, setSolved] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [hint, setHint] = useState<number | null>(null);
  const [best, setBest] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const timer = useTimer();

  useEffect(() => {
    const s = localStorage.getItem("sudoku-solved");
    if (s) setSolved(parseInt(s, 10) || 0);
  }, []);

  const load = useCallback(
    async (diff: Difficulty) => {
      setLoading(true);
      setSelected(null);
      try {
        const seed = Math.floor(Math.random() * 1e9);
        const res = await fetch(`/api/sudoku?difficulty=${diff}&seed=${seed}`);
        const data: Puzzle = await res.json();
        setPuzzle(data);
        setGiven([...data.puzzle].map((c) => c !== "."));
        setValues([...data.puzzle].map((c) => (c === "." ? "" : c)));
        setMistakes(0);
        setBest(readBest("sudoku", diff));
        timer.restart();
      } catch {
        // API unreachable — leave prior board; user can retry New game.
      } finally {
        setLoading(false);
      }
    },
    [timer.restart]
  );

  useEffect(() => {
    load("easy");
  }, [load]);

  const won =
    !!puzzle &&
    values.length === 81 &&
    values.every((v, i) => v === puzzle.solution[i]);

  // Award a solve exactly once when the board becomes correct.
  const wonRef = useRef(false);
  useEffect(() => {
    if (won && !wonRef.current) {
      wonRef.current = true;
      timer.stop();
      setBest(saveBest("sudoku", timer.ms, difficulty));
      setSolved((s) => {
        const next = s + 1;
        localStorage.setItem("sudoku-solved", String(next));
        return next;
      });
    } else if (!won) {
      wonRef.current = false;
    }
  }, [won, timer.stop, timer.ms, difficulty]);

  const setCell = useCallback(
    (i: number, digit: string) => {
      if (given[i] || won) return;
      setValues((prev) => {
        const next = [...prev];
        next[i] = digit;
        return next;
      });
      if (puzzle && digit && digit !== puzzle.solution[i]) {
        setMistakes((m) => m + 1);
      }
    },
    [given, won, puzzle]
  );

  // Hint: fill one correct cell — the selected empty/wrong one, else the first
  // empty cell. Uses the solution digit so it never counts as a mistake.
  const showHint = useCallback(() => {
    if (!puzzle || won || loading) return;
    let target = selected;
    if (target == null || given[target] || values[target] === puzzle.solution[target]) {
      target = values.findIndex((v, i) => !given[i] && v === "");
    }
    if (target == null || target < 0) return;
    setCell(target, puzzle.solution[target]);
    setHint(target);
    const t = target;
    setTimeout(() => setHint((h) => (h === t ? null : h)), 1200);
  }, [puzzle, won, loading, selected, given, values, setCell]);

  const move = useCallback(
    (i: number, dr: number, dc: number) => {
      const r = Math.floor(i / 9) + dr;
      const c = (i % 9) + dc;
      if (r < 0 || r > 8 || c < 0 || c > 8) return;
      setSelected(r * 9 + c);
    },
    []
  );

  // Digits placed 9 times are complete and get retired from entry.
  const digitCounts: Record<string, number> = {};
  for (const v of values) if (v) digitCounts[v] = (digitCounts[v] || 0) + 1;
  const isComplete = (d: string) => (digitCounts[d] || 0) >= 9;

  const onKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (selected == null) return;
      const k = e.key;
      if (k >= "1" && k <= "9") {
        if (values.filter((v) => v === k).length < 9) setCell(selected, k);
        e.preventDefault();
      } else if (k === "Backspace" || k === "Delete" || k === "0") {
        setCell(selected, "");
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
    [selected, setCell, move, values]
  );

  // Conflict set: cells whose value duplicates a peer's value.
  const conflicts = new Set<number>();
  for (let i = 0; i < 81; i++) {
    if (!values[i]) continue;
    for (const p of peers(i)) {
      if (values[p] === values[i]) {
        conflicts.add(i);
        break;
      }
    }
  }

  const selDigit = selected != null ? values[selected] : "";
  const peerSet = selected != null ? new Set(peers(selected)) : new Set<number>();

  const status = won
    ? "Solved! 🎉 Beautiful."
    : loading
      ? "Dealing a fresh grid…"
      : "Fill every row, column, and box with 1–9";

  return (
    <GameShell slug="sudoku" won={won}>
      <Scoreboard
        stats={[
          { label: "Solved", value: solved, color: ACCENT },
          { label: "Mistakes", value: mistakes, color: "#ef4444" },
        ]}
        onClear={() => {
          setSolved(0);
          setMistakes(0);
          localStorage.removeItem("sudoku-solved");
        }}
      />

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <span className="font-display text-lg font-bold" aria-live="polite">
          {status}
        </span>
        <div className="flex items-center gap-3">
          <TimerBadge ms={timer.ms} best={best} />
          <DifficultyTabs
            value={difficulty}
            onChange={(d) => {
              setDifficulty(d);
              load(d);
            }}
            accent={ACCENT}
          />
        </div>
      </div>

      <div
        ref={gridRef}
        tabIndex={0}
        onKeyDown={onKey}
        role="grid"
        aria-label="Sudoku board"
        className="pop-card mt-4 grid grid-cols-9 gap-0 overflow-hidden p-2 aspect-square outline-none"
      >
        {Array.from({ length: 81 }, (_, i) => {
          const r = Math.floor(i / 9);
          const c = i % 9;
          const isGiven = given[i];
          const val = values[i] || "";
          const isSel = selected === i;
          const isConflict = conflicts.has(i);
          const isPeer = peerSet.has(i);
          const sameDigit = !!val && selDigit === val && !isSel;
          return (
            <button
              key={i}
              role="gridcell"
              onClick={() => setSelected(i)}
              aria-label={`row ${r + 1}, column ${c + 1}${val ? `, ${val}` : ", empty"}`}
              className="relative flex items-center justify-center font-display text-lg font-bold transition-colors sm:text-2xl"
              style={{
                aspectRatio: "1",
                color: isConflict
                  ? "#ef4444"
                  : isGiven
                    ? "var(--foreground)"
                    : ACCENT,
                background: isSel
                  ? "rgba(6,182,212,0.28)"
                  : isConflict
                    ? "rgba(239,68,68,0.15)"
                    : sameDigit
                      ? "rgba(6,182,212,0.16)"
                      : isPeer
                        ? "rgba(6,182,212,0.07)"
                        : "transparent",
                borderRight:
                  c % 3 === 2 && c !== 8
                    ? "2px solid var(--foreground)"
                    : "1px solid var(--border)",
                borderBottom:
                  r % 3 === 2 && r !== 8
                    ? "2px solid var(--foreground)"
                    : "1px solid var(--border)",
                outline: hint === i ? `3px solid ${ACCENT}` : undefined,
                outlineOffset: hint === i ? "2px" : undefined,
              }}
            >
              {val}
            </button>
          );
        })}
      </div>

      {/* On-screen number pad */}
      <div className="mt-4 grid grid-cols-9 gap-1.5">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button
            key={d}
            onClick={() => selected != null && !isComplete(d) && setCell(selected, d)}
            disabled={
              isComplete(d) ||
              selected == null ||
              (selected != null && given[selected])
            }
            className="pop-card flex items-center justify-center py-2 font-display text-lg font-bold transition-transform enabled:hover:scale-105 disabled:opacity-40"
            style={{ color: ACCENT }}
          >
            {d}
          </button>
        ))}
      </div>

      <div className="mt-4 flex gap-3">
        <button
          onClick={() => load(difficulty)}
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
        <button
          onClick={() => selected != null && setCell(selected, "")}
          disabled={selected == null}
          className="rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:border-foreground/30 disabled:opacity-50"
        >
          Erase
        </button>
      </div>
    </GameShell>
  );
}
