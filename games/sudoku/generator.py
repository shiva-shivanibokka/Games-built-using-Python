"""Generate a uniquely-solvable Sudoku puzzle from a seed."""

import random

from .solver import count_solutions, _candidates

_GIVENS = {"easy": 40, "medium": 32, "hard": 26}


def _full_grid(rng: random.Random) -> list[int]:
    """Build a complete valid grid via randomized backtracking."""
    grid = [0] * 81

    def fill(pos: int) -> bool:
        if pos == 81:
            return True
        cands = _candidates(grid, pos)
        rng.shuffle(cands)
        for n in cands:
            grid[pos] = n
            if fill(pos + 1):
                return True
        grid[pos] = 0
        return False

    fill(0)
    return grid


def _to_str(grid: list[int]) -> str:
    return "".join(str(n) if n else "." for n in grid)


def generate(seed=None, difficulty: str = "medium") -> dict:
    if seed is None:
        seed = random.SystemRandom().randrange(1_000_000_000)
    rng = random.Random(seed)
    target_givens = _GIVENS.get(difficulty, _GIVENS["medium"])

    solution = _full_grid(rng)
    puzzle = solution[:]

    # Remove cells in random order while the solution stays unique.
    order = list(range(81))
    rng.shuffle(order)
    givens = 81
    for pos in order:
        if givens <= target_givens:
            break
        saved = puzzle[pos]
        puzzle[pos] = 0
        if count_solutions(puzzle[:], cap=2) == 1:
            givens -= 1
        else:
            puzzle[pos] = saved  # keep it — removal broke uniqueness

    return {
        "puzzle": _to_str(puzzle),
        "solution": _to_str(solution),
        "difficulty": difficulty,
        "seed": seed,
    }
