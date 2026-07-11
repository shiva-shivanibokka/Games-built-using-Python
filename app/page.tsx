import Link from "next/link";
import { GAMES, gradientOf } from "./games";

export default function Home() {
  return (
    <div>
      <section className="mb-12 text-center sm:text-left">
        <p className="text-sm font-mono uppercase tracking-[0.25em] text-muted">
          Python × the browser
        </p>
        <h1 className="mt-3 font-display font-extrabold tracking-tight text-5xl sm:text-7xl leading-[0.95]">
          Pick a game.
          <br />
          <span
            className="gradient-text"
            style={{ backgroundImage: "linear-gradient(100deg,#a78bff,#06b6d4,#22c55e,#f59e0b)" }}
          >
            Play something smart.
          </span>
        </h1>
        <p className="mt-5 text-lg text-muted max-w-xl mx-auto sm:mx-0">
          Every puzzle and opponent here is generated live by real Python running on
          the server — fresh, uniquely solvable, and never the same board twice.
        </p>
      </section>

      <ul className="grid gap-5 sm:grid-cols-2">
        {GAMES.map((g) => {
          const card = (
            <div
              className="group relative h-full overflow-hidden rounded-3xl p-6 text-white shadow-xl transition-transform duration-200 hover:-translate-y-1.5 hover:rotate-[-0.6deg]"
              style={{ backgroundImage: gradientOf(g) }}
            >
              <div className="absolute -right-6 -top-6 text-8xl opacity-25 transition-transform duration-300 group-hover:scale-110">
                {g.emoji}
              </div>
              <div className="relative">
                <h2 className="font-display text-2xl font-extrabold">{g.name}</h2>
                <p className="mt-2 max-w-xs text-sm text-white/90">{g.tagline}</p>
                <span className="mt-6 inline-flex items-center gap-1 rounded-full bg-white/20 px-4 py-1.5 text-sm font-semibold backdrop-blur">
                  {g.status === "live" ? "Play now →" : "Coming soon"}
                </span>
              </div>
            </div>
          );
          return (
            <li key={g.slug}>
              {g.status === "live" ? (
                <Link href={`/${g.slug}`}>{card}</Link>
              ) : (
                <div className="cursor-default opacity-70">{card}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
