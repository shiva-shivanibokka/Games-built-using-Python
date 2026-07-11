# Repo Bug Audit — Games-built-using-Python

Whole-repo audit across TypeScript pages, shared UI/utilities, Python
generators/solvers, API handlers, tests, and config. Run via three parallel
read-only passes, then fixes applied and verified (`npm run build` green,
`641 pytest` green).

## Verdict

The codebase is in good shape. Win/solve detection, win-glow gating,
per-difficulty best times, difficulty reloads, and every page↔API field
contract were verified correct. Generators are deterministic and terminate for
all supported inputs; Sudoku/Tango/Queens/Lights-Out enforce unique solutions.
CI, `vercel.json`, and `requirements.txt` are correct. Findings below were real
but mostly low-severity; all confirmed bugs are fixed except one documented
design gap.

## Fixed

| # | Sev | Location | Issue | Fix |
|---|-----|----------|-------|-----|
| 1 | Med | `api/queens.py` | Size clamped to 4–12 but only ≤9 generates within budget; sizes 10–12 could time out → 500, and a rare seed could raise `RuntimeError` unhandled. | Clamp to 4–9; wrap `generate()` in a retry loop, return 503 JSON instead of crashing. |
| 2 | Med | `app/lib/timer.ts` | `stop()` mutated a ref + called `setMs` inside a `setRunning` updater; React StrictMode double-invokes updaters, doubling recorded time in dev. | Moved side effects out of the updater, guarded by a `runningRef`. |
| 3 | Low | `app/lib/timer.ts` | `readBest` returned `NaN` on corrupted storage → badge showed "best NaN:NaN". | Guard with `Number.isFinite`; return `null`. |
| 4 | Low | `app/lib/timer.ts` | `localStorage` calls could throw (privacy mode) and break render/solve. | Wrapped reads/writes in try/catch; `formatMs` clamps negatives. |
| 5 | Low | `app/tic-tac-toe/page.tsx` | Timer never started on the first game (only `reset()` started it). | Added a mount effect calling `timer.restart()`. |
| 6 | Low | `app/sudoku/page.tsx` | A digit retired after 9 *total* placements incl. wrong ones → could soft-lock a digit until you erased a mistake. | Count only *correct* placements (cell matches the solution). |
| 7 | Low | `app/wend/page.tsx` | Progressive hint collapsed a fully-revealed lone word back to one letter. | Only jump to a new word when another unfound word exists; otherwise leave it revealed. |
| 8 | Low | `app/zip/page.tsx`, `app/wend/page.tsx` | Difficulty tabs stayed enabled during the async reload → a fast double-switch could race two fetches. | Added a `loading` guard that disables the tabs while a board is loading. |
| 9 | Low | `app/globals.css` | Win-glow used `color-mix()` with no fallback → no glow on older browsers. | Added a static `box-shadow` fallback before the animated one. |

## Deferred (design gap, not a crash) — needs a decision

**Zip puzzles are not uniquely solvable.** `games/zip/generator.py` builds one
Hamiltonian path and drops checkpoints without verifying the checkpoints force a
single solution — many boards have multiple valid paths. This does **not** break
gameplay (the module only claims "always solvable", and the client accepts any
valid path as a win), so it is left as-is. Enforcing uniqueness (as Sudoku/
Tango/Queens do) would require an added path solver that counts solutions and a
prune loop, and would slow generation. Recommend leaving unless you want Zip to
match LinkedIn's unique-solution guarantee — say the word and it's a scoped
follow-up.

## Verified clean (no findings)

Python: sudoku, tango, queens (solver), lights_out (GF(2)), wend, brain_teasers,
tic_tac_toe — all correct, deterministic, and terminating; tests re-verify
invariants and uniqueness. Shared UI: GameShell (`won` glow, how-to-play),
GameControls, Scoreboard, NavBar (active tab, no overflow leak), layout, gallery.
Registry ↔ routes ↔ APIs: full parity for all 8 games. Config: `vercel.json`
`includeFiles`, `requirements.txt` (stdlib-only functions), CI (real pytest +
build gates), `.gitignore`.
