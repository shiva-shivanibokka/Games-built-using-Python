// Single source of truth for the game catalog.
// Add a game here + create app/<slug>/page.tsx — nav and gallery update themselves.

export type Game = {
  slug: string;
  name: string;
  tagline: string;
  emoji: string;
  status: "live" | "soon";
};

export const GAMES: Game[] = [
  {
    slug: "tic-tac-toe",
    name: "Tic-Tac-Toe",
    tagline: "Beat an unbeatable minimax AI. (You can't.)",
    emoji: "⭕",
    status: "live",
  },
  {
    slug: "sudoku",
    name: "Sudoku",
    tagline: "A fresh, uniquely-solvable grid every time.",
    emoji: "🔢",
    status: "soon",
  },
  {
    slug: "tango",
    name: "Tango",
    tagline: "Fill the grid with suns and moons — no three in a row.",
    emoji: "☀️",
    status: "soon",
  },
  {
    slug: "zip",
    name: "Zip",
    tagline: "Draw one path through every cell, in order.",
    emoji: "🔗",
    status: "soon",
  },
];

export const gameBySlug = (slug: string) => GAMES.find((g) => g.slug === slug);
