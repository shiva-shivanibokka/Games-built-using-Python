import Link from "next/link";
import { GAMES } from "./games";

export default function Home() {
  return (
    <div>
      <section className="mb-10">
        <h1 className="text-4xl font-semibold tracking-tight">Games built with Python</h1>
        <p className="mt-3 text-lg text-muted max-w-2xl">
          Playable browser games whose boards and opponents come from real Python
          algorithms running live on the server. Every puzzle is generated fresh and
          uniquely solvable — no two games the same.
        </p>
      </section>

      <ul className="grid gap-4 sm:grid-cols-2">
        {GAMES.map((g) => {
          const card = (
            <div className="h-full rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-3xl">{g.emoji}</span>
                {g.status === "soon" && (
                  <span className="text-xs rounded-full border border-border px-2 py-0.5 text-muted">
                    coming soon
                  </span>
                )}
              </div>
              <h2 className="mt-3 text-xl font-medium">{g.name}</h2>
              <p className="mt-1 text-sm text-muted">{g.tagline}</p>
            </div>
          );
          return (
            <li key={g.slug}>
              {g.status === "live" ? (
                <Link href={`/${g.slug}`}>{card}</Link>
              ) : (
                <div className="opacity-60 cursor-default">{card}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
