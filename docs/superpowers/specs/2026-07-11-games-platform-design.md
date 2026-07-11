# Games Platform — Design Spec

**Date:** 2026-07-11
**Status:** Approved for planning

## Goal

Turn this repo (currently one Tic-Tac-Toe notebook) into a portfolio-grade
collection of playable browser games, backed by real Python algorithms, live on
Vercel. Each game is fully separated (its own Python module, notebook, route,
and UI). Boards regenerate uniquely every play. Free tier only.

## Architecture

**One Vercel project, two runtimes.** Next.js serves the site; Python
serverless functions generate boards. The same Python modules power the API, the
showcase notebooks, and the tests — one source of truth.

- **Python does the thinking:** generate puzzles, solve them, prove uniqueness,
  compute perfect AI. Runs as free Vercel serverless functions.
- **Browser does the playing:** clicks, timers, hints, win-checks — instant,
  client-side TypeScript.
- **They connect over JSON:** an endpoint returns `{board, solution, meta}`; the
  browser plays against the loaded solution offline. Only "new board" and (for
  Tic-Tac-Toe) "AI move" touch the network.
- **No database.** Seeded generation replaces one (see below).

### Request flow

```
click "New Game"
  → GET /api/<game>?seed=<s>&difficulty=<d>
  → Python generator returns { board, solution, meta }
  → TS renders board; all gameplay runs client-side vs. loaded solution
```

Tic-Tac-Toe differs: `GET /api/tic-tac-toe?board=<state>` returns the optimal
minimax move. Player moves are instant client-side; only the AI reply is a call.

### Seed mechanics (replaces a database)

One seeded generator unlocks three features for free:

- `seed = <YYYY-MM-DD>` → **daily puzzle** (same board for everyone that day).
- `seed` carried in the URL → **shareable exact board** ("play what I played").
- random `seed` → **infinite unique boards**.

Progress (best times, win streaks) lives in **localStorage**. A Wordle-style
emoji share card is generated client-side. None of this needs a server.

## Repo layout

```
Games-built-using-Python/
├─ api/                     # Vercel Python serverless fns (thin handlers)
│  ├─ tic-tac-toe.py        # → best move (minimax)
│  ├─ sudoku.py  tango.py  zip.py   # → {board, solution, meta}
├─ games/                   # Python logic — imported by api/, notebooks, tests
│  ├─ tic_tac_toe/ai.py
│  ├─ sudoku/     generator.py  solver.py
│  ├─ tango/      generator.py  solver.py
│  └─ zip/        generator.py  solver.py
├─ notebooks/    <game>.ipynb      # one showcase notebook per game
├─ tests/        test_<game>.py    # pytest per game
├─ app/                     # Next.js App Router
│  ├─ layout.tsx (tab nav)  page.tsx (gallery)
│  ├─ tic-tac-toe/  sudoku/  tango/  zip/   # one route per game
│  └─ components/           # per-game boards + shared UI
├─ requirements.txt  package.json  next.config.*  tsconfig.json
└─ README.md
```

Each game = its own Python module + notebook + route + component. Adding a game
never touches an existing one.

## Stack (all free tier)

- **Frontend:** Next.js (App Router) + TypeScript + Tailwind + shadcn/ui.
- **API:** Vercel Python serverless functions (`/api/*.py`), deps in
  `requirements.txt`.
- **Python logic:** plain importable `.py` modules + one demo notebook per game.
- **Tests:** `pytest` — each generator test produces N boards and asserts each is
  uniquely solvable and that the returned solution actually solves it.
- **Hosting:** single Vercel project (free tier).

## Per-game notes

- **Tic-Tac-Toe:** minimax → optimal move endpoint. Unbeatable AI, no game-AI in
  the browser. (Existing `tic_tac_toe.ipynb` is the starting point.)
- **Sudoku / Tango / Zip:** generator produces a unique-solution board at a
  chosen difficulty, returns it with its solution. TS renders + validates.

## Known integration risk — de-risk first

Vercel bundles `/api` functions narrowly, so a function importing the shared
`games/` package can fail to find it in the deployment. **First implementation
step is a spike:** one `/api` function importing one shared `games/` module,
deployed green on Vercel, before building the four games on top of it. This
proves the whole architecture cheaply.

## Scope

- **v1 (this plan):** scaffold + **Tic-Tac-Toe, Sudoku, Tango, Zip**, live on
  Vercel, with seeded/daily/shareable boards and localStorage stats.
- **Batch 2 (same template, later):** Queens, WEND (word-path tiling), and
  brain-teasers (e.g. 2048, Lights Out).
- **Deferred until wanted:** Supabase for accounts / global leaderboards.
  Everything in v1 needs no database.

## Success criteria

- Site is live on Vercel; four games are playable end to end.
- Each game: click "New Game" yields a fresh, uniquely-solvable board from the
  Python API; daily and shareable seeds work; win detection + hints work.
- `pytest` passes for all four generators/solvers.
- Each game has a showcase notebook explaining its algorithm.
