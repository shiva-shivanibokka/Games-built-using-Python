"use client";

import { formatMs } from "../lib/timer";

export type Difficulty = "easy" | "medium" | "hard";
export const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

/** Easy / Medium / Hard pill selector, themed with the game's accent. */
export function DifficultyTabs({
  value,
  onChange,
  accent,
  disabled,
}: {
  value: Difficulty;
  onChange: (d: Difficulty) => void;
  accent: string;
  disabled?: boolean;
}) {
  return (
    <div className="inline-flex rounded-full border border-border p-0.5 text-sm">
      {DIFFICULTIES.map((d) => {
        const active = d === value;
        return (
          <button
            key={d}
            onClick={() => onChange(d)}
            disabled={disabled}
            aria-pressed={active}
            className={`rounded-full px-3 py-1 font-medium capitalize transition-colors disabled:opacity-50 ${
              active ? "text-white" : "text-muted hover:text-foreground"
            }`}
            style={active ? { background: accent } : undefined}
          >
            {d}
          </button>
        );
      })}
    </div>
  );
}

/** Live elapsed time + best time for the current game/difficulty. */
export function TimerBadge({ ms, best }: { ms: number; best: number | null }) {
  return (
    <div className="flex items-center gap-2 font-mono text-sm tabular-nums">
      <span aria-label="elapsed time">⏱ {formatMs(ms)}</span>
      {best != null && <span className="text-muted">best {formatMs(best)}</span>}
    </div>
  );
}
