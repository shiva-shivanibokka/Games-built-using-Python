import { gameBySlug, gradientOf } from "../games";

/** Consistent themed header for a game page. */
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
      <header className="mb-6">
        <h1
          className="font-display text-4xl font-extrabold tracking-tight gradient-text w-fit"
          style={game ? { backgroundImage: gradientOf(game) } : undefined}
        >
          {game?.emoji} {game?.name}
        </h1>
        {game && <p className="mt-1 text-muted">{game.tagline}</p>}
      </header>
      {children}
    </div>
  );
}
