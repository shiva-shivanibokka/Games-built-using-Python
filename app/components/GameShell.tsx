import { gameBySlug, gradientOf } from "../games";

/** Consistent themed header + "How to play" for a game page. */
export default function GameShell({
  slug,
  children,
}: {
  slug: string;
  children: React.ReactNode;
}) {
  const game = gameBySlug(slug);
  return (
    <div className="max-w-lg mx-auto">
      <header className="mb-4">
        <h1
          className="font-display text-4xl font-extrabold tracking-tight gradient-text w-fit"
          style={game ? { backgroundImage: gradientOf(game) } : undefined}
        >
          {game?.emoji} {game?.name}
        </h1>
        {game && <p className="mt-1 text-muted">{game.tagline}</p>}
      </header>

      {game && game.rules.length > 0 && (
        <details className="pop-card mb-6 p-4 [&_svg]:open:rotate-90">
          <summary className="flex cursor-pointer list-none items-center gap-2 font-display font-bold">
            <svg
              className="h-4 w-4 shrink-0 text-muted transition-transform"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden
            >
              <path d="M7 5l6 5-6 5V5z" />
            </svg>
            How to play
          </summary>
          <ul className="mt-3 space-y-1.5 text-sm text-muted">
            {game.rules.map((rule, i) => (
              <li key={i} className="flex gap-2">
                <span
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: game.gradient[0] }}
                />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {children}
    </div>
  );
}
