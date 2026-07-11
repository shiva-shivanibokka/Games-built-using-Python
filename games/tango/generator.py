"""Generate a uniquely-solvable Tango puzzle from a seed.

Build a full valid solution grid, take all cells as givens and all adjacent
pairs as edge constraints, then greedily drop clues while the puzzle stays
uniquely solvable. Pure standard library.
"""

import random

from .solver import SIZE, count_solutions, _valid_at


def _full_grid(rng: random.Random) -> list:
    """A complete valid Tango grid via randomized backtracking."""
    board = [None] * (SIZE * SIZE)

    def fill(pos: int) -> bool:
        if pos == SIZE * SIZE:
            return True
        vals = ["S", "M"]
        rng.shuffle(vals)
        for v in vals:
            board[pos] = v
            if _valid_at(board, pos, {}) and fill(pos + 1):
                return True
            board[pos] = None
        return False

    fill(0)
    return board


def _all_edges(grid: list) -> list:
    """Every orthogonal adjacency, labelled by its true relation in the solution."""
    edges = []
    for r in range(SIZE):
        for c in range(SIZE):
            v = grid[r * SIZE + c]
            if c + 1 < SIZE:
                nv = grid[r * SIZE + c + 1]
                edges.append({"r1": r, "c1": c, "r2": r, "c2": c + 1, "type": "=" if v == nv else "x"})
            if r + 1 < SIZE:
                nv = grid[(r + 1) * SIZE + c]
                edges.append({"r1": r, "c1": c, "r2": r + 1, "c2": c, "type": "=" if v == nv else "x"})
    return edges


def generate(seed=None) -> dict:
    if seed is None:
        seed = random.SystemRandom().randrange(1_000_000_000)
    rng = random.Random(seed)

    grid = _full_grid(rng)
    solution = "".join(grid)

    givens = [{"r": r, "c": c, "val": grid[r * SIZE + c]} for r in range(SIZE) for c in range(SIZE)]
    edges = _all_edges(grid)
    rng.shuffle(givens)
    rng.shuffle(edges)

    # Drop givens (all edges present) then edges — keep only clues that carry
    # uniqueness. Starting from the full grid the puzzle is always unique, so
    # every removal is guarded and generation always terminates uniquely.
    # Keep a floor of prefilled cells so the board feels like a real Tango
    # (several givens + a few signs) rather than an all-edges puzzle.
    floor_givens = 6
    for g in list(givens):
        if len(givens) <= floor_givens:
            break
        trial = [x for x in givens if x is not g]
        if count_solutions(trial, edges, cap=2) == 1:
            givens = trial
    for e in list(edges):
        trial = [x for x in edges if x is not e]
        if count_solutions(givens, trial, cap=2) == 1:
            edges = trial

    return {
        "size": SIZE,
        "givens": givens,
        "edges": edges,
        "solution": solution,
        "seed": seed,
    }
