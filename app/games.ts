// Single source of truth for the game catalog.
// Add a game here + create app/<slug>/page.tsx — nav and gallery update themselves.

export type Game = {
  slug: string;
  name: string;
  tagline: string;
  emoji: string;
  status: "live" | "soon";
  /** Two-stop gradient [from, to] — the game's signature color. */
  gradient: [string, string];
};

export const GAMES: Game[] = [
  {
    slug: "tic-tac-toe",
    name: "Tic-Tac-Toe",
    tagline: "Face an unbeatable minimax AI. Best you can do is a draw.",
    emoji: "⭕",
    status: "live",
    gradient: ["#7c3aed", "#ec4899"],
  },
  {
    slug: "sudoku",
    name: "Sudoku",
    tagline: "A fresh, uniquely-solvable grid every single time.",
    emoji: "🔢",
    status: "live",
    gradient: ["#06b6d4", "#3b82f6"],
  },
  {
    slug: "tango",
    name: "Tango",
    tagline: "Suns and moons — balance every row, never three in a line.",
    emoji: "☀️",
    status: "live",
    gradient: ["#f59e0b", "#ef4444"],
  },
  {
    slug: "zip",
    name: "Zip",
    tagline: "One unbroken path through every cell, in order.",
    emoji: "🔗",
    status: "live",
    gradient: ["#22c55e", "#14b8a6"],
  },
];

export const gameBySlug = (slug: string) => GAMES.find((g) => g.slug === slug);

/** Inline style helper for a game's gradient. */
export const gradientOf = (g: Game) =>
  `linear-gradient(135deg, ${g.gradient[0]}, ${g.gradient[1]})`;
