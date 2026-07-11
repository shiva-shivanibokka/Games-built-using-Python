"use client";

export type Stat = { label: string; value: number | string; color?: string };

export default function Scoreboard({
  stats,
  onClear,
}: {
  stats: Stat[];
  onClear?: () => void;
}) {
  return (
    <div className="pop-card flex items-center gap-2 p-2">
      {stats.map((s) => (
        <div key={s.label} className="flex-1 rounded-xl px-3 py-2 text-center">
          <div
            className="font-display text-2xl font-extrabold tabular-nums"
            style={s.color ? { color: s.color } : undefined}
          >
            {s.value}
          </div>
          <div className="text-[11px] uppercase tracking-wider text-muted">{s.label}</div>
        </div>
      ))}
      {onClear && (
        <button
          onClick={onClear}
          className="ml-1 shrink-0 rounded-xl border border-border px-3 py-2 text-xs font-medium text-muted transition-colors hover:text-foreground hover:border-foreground/30"
        >
          Clear
        </button>
      )}
    </div>
  );
}
