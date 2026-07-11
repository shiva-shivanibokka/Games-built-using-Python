// Single source of truth for the game catalog.
// Add a game here + create app/<slug>/page.tsx — nav, gallery, and the
// "How to play" panel update themselves.

export type Game = {
  slug: string;
  name: string;
  tagline: string;
  emoji: string;
  status: "live" | "soon";
  /** Two-stop gradient [from, to] — the game's signature color. */
  gradient: [string, string];
  /** Short "how to play" bullets, rendered by GameShell. */
  rules: string[];
};

export const GAMES: Game[] = [
  {
    slug: "tic-tac-toe",
    name: "Tic-Tac-Toe",
    tagline: "Beat the AI on Easy — or just try to draw perfect play on Hard.",
    emoji: "⭕",
    status: "live",
    gradient: ["#7c3aed", "#ec4899"],
    rules: [
      "You are X; the AI is O. Tap an empty cell to place your mark.",
      "Get three in a row — across, down, or diagonally — to win.",
      "Easy and Medium are beatable; Hard plays perfect minimax, so aim for a draw.",
      "Hint always outlines the perfect move.",
    ],
  },
  {
    slug: "sudoku",
    name: "Sudoku",
    tagline: "A fresh, uniquely-solvable grid every single time.",
    emoji: "🔢",
    status: "live",
    gradient: ["#06b6d4", "#3b82f6"],
    rules: [
      "Fill every row, column, and 3×3 box with the digits 1–9, no repeats.",
      "Tap a cell, then type a number or use the on-screen pad.",
      "Clashing digits flash red; a digit used all nine times retires.",
      "Hint fills one correct cell.",
    ],
  },
  {
    slug: "tango",
    name: "Tango",
    tagline: "Suns and moons — balance every row, never three in a line.",
    emoji: "☀️",
    status: "live",
    gradient: ["#f59e0b", "#ef4444"],
    rules: [
      "Fill the grid with suns ☀️ and moons 🌙; tap a cell to cycle.",
      "Each row and column needs an equal number of each.",
      "Never three of the same symbol in a row or column.",
      "= links two equal cells; × links opposites. Hint reveals one cell.",
    ],
  },
  {
    slug: "zip",
    name: "Zip",
    tagline: "One unbroken path through every cell, in order.",
    emoji: "🔗",
    status: "live",
    gradient: ["#22c55e", "#14b8a6"],
    rules: [
      "Draw one continuous line through every cell, exactly once.",
      "Pass the numbered cells in order: 1, then 2, then 3…",
      "Drag across adjacent cells; drag back to erase.",
      "Hint highlights your next step.",
    ],
  },
  {
    slug: "queens",
    name: "Queens",
    tagline: "One crown per row, column, and color — none touching.",
    emoji: "👑",
    status: "live",
    gradient: ["#f43f5e", "#a21caf"],
    rules: [
      "Place exactly one crown 👑 in each row, column, and color region.",
      "No two crowns may touch — not even diagonally.",
      "Tap a cell to cycle: mark ✕ (a note), then 👑, then clear.",
      "Hint reveals one correct crown.",
    ],
  },
  {
    slug: "wend",
    name: "Wend",
    tagline: "Trace the hidden words that tile the whole grid.",
    emoji: "🔤",
    status: "live",
    gradient: ["#0ea5e9", "#6366f1"],
    rules: [
      "Hidden words fill the grid — the count, lengths, and size vary each game.",
      "Drag across adjacent letters to spell a word.",
      "Every open cell belongs to exactly one word; walls are blocked.",
      "Hint reveals where an unfound word begins.",
    ],
  },
  {
    slug: "lights-out",
    name: "Lights Out",
    tagline: "Flip the grid dark. Every tap toggles its neighbors.",
    emoji: "💡",
    status: "live",
    gradient: ["#eab308", "#84cc16"],
    rules: [
      "Turn every light off.",
      "Tapping a cell toggles it and its four orthogonal neighbors.",
      "Lit cells glow; dark cells are done.",
      "Hint shows a helpful next tap.",
    ],
  },
  {
    slug: "brain-teasers",
    name: "Brain Teasers",
    tagline: "Sequences, cryptarithms, logic — one right answer, generated fresh.",
    emoji: "🧠",
    status: "live",
    gradient: ["#a855f7", "#6366f1"],
    rules: [
      "Read the teaser and pick the correct answer from four options.",
      "A short explanation follows every answer.",
      "Chain correct answers to build a streak.",
      "Hint removes one wrong option.",
    ],
  },
];

export const gameBySlug = (slug: string) => GAMES.find((g) => g.slug === slug);

/** Inline style helper for a game's gradient. */
export const gradientOf = (g: Game) =>
  `linear-gradient(135deg, ${g.gradient[0]}, ${g.gradient[1]})`;
