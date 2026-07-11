"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import GameShell from "../components/GameShell";
import Scoreboard from "../components/Scoreboard";
import { DifficultyTabs, TimerBadge, type Difficulty } from "../components/GameControls";
import { useTimer, readBest, saveBest } from "../lib/timer";

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
// One color per word slot (up to 5 words per puzzle).
const SLOT_COLORS = ["#0ea5e9", "#6366f1", "#22c55e", "#f59e0b", "#ec4899"];

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
  // Progressive hint: which word slot is being revealed, and how many of its
  // letters (path cells) are shown so far. hintStep 0 == no active hint.
  const [hintWord, setHintWord] = useState<number | null>(null);
  const [hintStep, setHintStep] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [best, setBest] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const timer = useTimer();
  const drawing = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem("wend-solved");
    if (saved) setSolved(parseInt(saved, 10) || 0);
  }, []);

  useEffect(() => {
    setBest(readBest("wend", difficulty));
  }, [difficulty]);

  const load = useCallback(
    async (seed?: number) => {
      const s = seed ?? Math.floor(Math.random() * 2 ** 31);
      setTrace([]);
      setFound([]);
      setWon(false);
      setHintWord(null);
      setHintStep(0);
      setLoading(true);
      try {
        const res = await fetch(`/api/wend?seed=${s}&difficulty=${difficulty}`);
        setBoard(await res.json());
        timer.restart();
      } catch {
        // API unreachable — keep current board.
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [difficulty]
  );

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

  // Win when every word is found (they tile every open cell by construction).
  useEffect(() => {
    if (!board || won) return;
    if (found.length === board.words.length) {
      setWon(true);
      timer.stop();
      setBest(saveBest("wend", timer.ms, difficulty));
      setSolved((s) => {
        const next = s + 1;
        localStorage.setItem("wend-solved", String(next));
        return next;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [found, board, won]);

  // Progressive hint: each press reveals the next letter along the SAME word's
  // solution path. When a word is fully revealed (or gets found), the next
  // press advances to another still-unfound word.
  const showHint = useCallback(() => {
    if (!board || won) return;
    const foundWords = new Set(found.map((f) => f.word));
    const unfound = board.words
      .map((_, i) => i)
      .filter((i) => !foundWords.has(board.words[i]));
    if (unfound.length === 0) return;
    // Advance within the current word, or jump to another unfound word.
    if (hintWord != null && unfound.includes(hintWord)) {
      if (hintStep < board.words[hintWord].length) {
        setHintStep((s) => s + 1); // reveal the next letter
      } else if (unfound.length > 1) {
        const start = unfound.indexOf(hintWord);
        setHintWord(unfound[(start + 1) % unfound.length]);
        setHintStep(1);
      }
      // else: the only unfound word is already fully shown — leave it revealed.
      return;
    }
    // No active hint (or its word was found): start on the first unfound word.
    setHintWord(unfound[0]);
    setHintStep(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, won, found, hintWord, hintStep]);

  // Drop the active hint once its word has been found.
  useEffect(() => {
    if (hintWord != null && found.some((f) => f.word === board?.words[hintWord])) {
      setHintWord(null);
      setHintStep(0);
    }
  }, [found, hintWord, board]);

  // Grid cells currently revealed by the active hint (path prefix of the word).
  const hintSet = new Set(
    hintWord != null && board
      ? board.solution[hintWord].slice(0, hintStep).map(([r, c]) => r * size + c)
      : []
  );

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
        : `${found.length} / ${board.words.length} words found`;

  return (
    <GameShell slug="wend" won={won}>
      <Scoreboard
        stats={[{ label: "Solved", value: solved, color: SKY }]}
        onClear={() => {
          setSolved(0);
          localStorage.removeItem("wend-solved");
        }}
      />

      <div className="mt-5 flex items-center justify-between">
        <DifficultyTabs value={difficulty} onChange={setDifficulty} accent={SKY} disabled={loading} />
        <TimerBadge ms={timer.ms} best={best} />
      </div>

      <div className="mt-5 flex items-center justify-between">
        <span className="font-display text-lg font-bold" aria-live="polite">
          {status}
        </span>
        <span className="text-sm text-muted">
          Tile <b style={{ color: INDIGO }}>every</b> open cell
        </span>
      </div>

      {/* Letter boxes — one row per word, one square tile per letter, so each
          word's length is obvious. Empty until found; revealed letters (found
          or hinted) fill with the sky→indigo accent. */}
      <div className="mt-4 flex flex-col gap-1.5">
        {(board?.words ?? []).map((word, slot) => {
          const hit = found.find((f) => f.word === word);
          const hinting = hintWord === slot;
          return (
            <div key={slot} className="flex flex-wrap gap-1.5">
              {Array.from({ length: word.length }, (_, i) => {
                const revealed = !!hit || (hinting && i < hintStep);
                const isTip = hinting && !hit && i === hintStep - 1;
                return (
                  <div
                    key={i}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-sm font-display font-extrabold sm:h-9 sm:w-9"
                    style={{
                      background: revealed ? GRADIENT : "var(--card)",
                      color: revealed ? "#fff" : undefined,
                      border: revealed ? "none" : "1px solid var(--border)",
                      boxShadow: isTip ? `0 0 0 2px ${INDIGO}` : undefined,
                    }}
                  >
                    {revealed ? word[i] : ""}
                  </div>
                );
              })}
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
          const isHint = hintSet.has(idx);
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
                boxShadow: isHead
                  ? `0 0 0 3px ${SKY}`
                  : isHint
                    ? `0 0 0 3px ${INDIGO}`
                    : undefined,
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
          onClick={showHint}
          disabled={won || !board || found.length === board.words.length}
          className="rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:border-foreground/30 disabled:opacity-50"
        >
          Hint
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
            setHintWord(null);
            setHintStep(0);
          }}
          className="rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:border-foreground/30"
        >
          Reset
        </button>
      </div>
    </GameShell>
  );
}
