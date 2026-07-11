"use client";

import { useCallback, useEffect, useState } from "react";
import GameShell from "../components/GameShell";
import Scoreboard from "../components/Scoreboard";
import { DifficultyTabs, TimerBadge, type Difficulty } from "../components/GameControls";
import { useTimer } from "../lib/timer";

const GRAD = "linear-gradient(135deg,#a855f7,#6366f1)";
const PURPLE = "#a855f7";
const INDIGO = "#6366f1";
const GREEN = "#22c55e";
const RED = "#ef4444";

type Teaser = {
  type: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
  seed: number;
  kind: string;
};

const KIND_LABEL: Record<string, string> = {
  sequences: "Sequence",
  cryptarithm: "Cryptarithm",
  logic: "Logic",
  oddoneout: "Odd one out",
};

export default function BrainTeasers() {
  const [teaser, setTeaser] = useState<Teaser | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);
  const [eliminated, setEliminated] = useState<number[]>([]);
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const { ms, stop, restart } = useTimer();

  useEffect(() => {
    setCorrect(parseInt(localStorage.getItem("teasers-correct") || "0", 10) || 0);
    setStreak(parseInt(localStorage.getItem("teasers-streak") || "0", 10) || 0);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setSelected(null);
    setEliminated([]);
    try {
      const seed = Math.floor(Math.random() * 1e9);
      const res = await fetch(`/api/brain-teasers?seed=${seed}&difficulty=${difficulty}`);
      setTeaser(await res.json());
      restart(); // fresh teaser -> restart the per-teaser clock
    } catch {
      // API unreachable — keep the prior teaser; user can retry New teaser.
    } finally {
      setLoading(false);
    }
  }, [difficulty, restart]);

  useEffect(() => {
    load();
  }, [load]);

  const locked = selected !== null;

  const choose = (i: number) => {
    if (locked || loading || !teaser || eliminated.includes(i)) return;
    stop(); // answered -> freeze the clock
    setSelected(i);
    const right = i === teaser.answer;
    setCorrect((c) => {
      const next = right ? c + 1 : c;
      localStorage.setItem("teasers-correct", String(next));
      return next;
    });
    setStreak((s) => {
      const next = right ? s + 1 : 0;
      localStorage.setItem("teasers-streak", String(next));
      return next;
    });
  };

  const useHint = () => {
    if (locked || loading || !teaser) return;
    const maxElim = teaser.options.length - 2; // leave answer + one wrong
    if (eliminated.length >= maxElim) return;
    const wrong = teaser.options
      .map((_, i) => i)
      .filter((i) => i !== teaser.answer && !eliminated.includes(i));
    if (wrong.length === 0) return;
    setEliminated((e) => [...e, wrong[Math.floor(Math.random() * wrong.length)]]);
  };

  const status = loading
    ? "Dreaming up a puzzle…"
    : locked
      ? selected === teaser?.answer
        ? "Correct! 🎉"
        : "Not quite."
      : "Pick the answer";

  return (
    <GameShell slug="brain-teasers">
      <Scoreboard
        stats={[
          { label: "Correct", value: correct, color: PURPLE },
          { label: "Streak", value: streak, color: INDIGO },
        ]}
        onClear={() => {
          setCorrect(0);
          setStreak(0);
          localStorage.removeItem("teasers-correct");
          localStorage.removeItem("teasers-streak");
        }}
      />

      <div className="mt-4 flex items-center justify-between">
        <DifficultyTabs
          value={difficulty}
          onChange={setDifficulty}
          accent={PURPLE}
          disabled={loading}
        />
        <TimerBadge ms={ms} best={null} />
      </div>

      <div className="mt-5 flex items-center justify-between">
        <span className="font-display text-lg font-bold" aria-live="polite">
          {status}
        </span>
        {teaser && !loading && (
          <span className="text-sm text-muted">{KIND_LABEL[teaser.kind] ?? teaser.kind}</span>
        )}
      </div>

      <div className="pop-card mt-4 p-5">
        <p className="font-display text-xl font-bold whitespace-pre-line leading-relaxed">
          {loading || !teaser ? "…" : teaser.prompt}
        </p>
      </div>

      <div className="mt-4 grid gap-3" role="group" aria-label="Answer options">
        {(teaser?.options ?? ["", "", "", ""]).map((opt, i) => {
          const isAnswer = locked && i === teaser?.answer;
          const isWrongPick = locked && i === selected && i !== teaser?.answer;
          const isElim = eliminated.includes(i);
          let ring: string | undefined;
          let bg: string | undefined;
          if (isAnswer) {
            ring = GREEN;
            bg = "rgba(34,197,94,0.14)";
          } else if (isWrongPick) {
            ring = RED;
            bg = "rgba(239,68,68,0.14)";
          }
          return (
            <button
              key={i}
              onClick={() => choose(i)}
              disabled={locked || loading || isElim}
              aria-label={`Option ${i + 1}: ${opt}`}
              className={`pop-card flex items-center gap-3 p-4 text-left font-display text-lg font-semibold
                transition-all duration-150 enabled:hover:scale-[1.02] enabled:hover:brightness-125
                disabled:cursor-not-allowed ${isElim ? "opacity-40 line-through" : ""}`}
              style={{
                background: bg,
                boxShadow: ring ? `0 0 0 2px ${ring}, 0 12px 40px -12px ${ring}` : undefined,
              }}
            >
              <span
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-sm font-bold"
                style={{ background: "rgba(120,120,140,0.18)" }}
                aria-hidden
              >
                {String.fromCharCode(65 + i)}
              </span>
              <span>{opt || "…"}</span>
            </button>
          );
        })}
      </div>

      {locked && teaser && (
        <p className="mt-4 text-sm text-muted" aria-live="polite">
          {teaser.explanation}
        </p>
      )}

      <div className="mt-6 flex gap-3">
        <button
          onClick={load}
          className="rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105"
          style={{ backgroundImage: GRAD }}
        >
          New teaser
        </button>
        <button
          onClick={useHint}
          disabled={
            locked ||
            loading ||
            !teaser ||
            eliminated.length >= (teaser ? teaser.options.length - 2 : 0)
          }
          className="rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:border-foreground/30 disabled:opacity-50"
        >
          Hint (50/50)
        </button>
      </div>
    </GameShell>
  );
}
