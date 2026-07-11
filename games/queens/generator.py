"""Generate a uniquely-solvable Queens puzzle from a seed.

1. Pick a random valid crown placement (permutation of columns, consecutive rows'
   columns differ by >= 2 so no two crowns touch).
2. Grow `size` contiguous color regions by randomized multi-source flood fill,
   each seeded on one crown cell (so every region holds exactly its crown).
3. Verify the puzzle has exactly one solution; if not, regrow / replace placement.
"""

import random

from .solver import count_solutions


def _neighbors4(idx, size):
    r, c = divmod(idx, size)
    out = []
    if r > 0:
        out.append(idx - size)
    if r < size - 1:
        out.append(idx + size)
    if c > 0:
        out.append(idx - 1)
    if c < size - 1:
        out.append(idx + 1)
    return out


def _random_placement(rng, size):
    """Randomized backtracking -> one crown per row/col, adjacent rows' cols differ >= 2."""
    cols = [-1] * size
    used = [False] * size

    def place(row):
        if row == size:
            return True
        order = list(range(size))
        rng.shuffle(order)
        for c in order:
            if used[c]:
                continue
            if row > 0 and abs(c - cols[row - 1]) <= 1:
                continue
            used[c] = True
            cols[row] = c
            if place(row + 1):
                return True
            used[c] = False
            cols[row] = -1
        return False

    place(0)
    return [(r, cols[r]) for r in range(size)]


def _grow_regions(rng, crowns, size):
    """Multi-source randomized flood fill; region i is seeded on crown i's cell."""
    assign = [-1] * (size * size)
    frontier = []  # (cell_index, region_id)
    for ri, (r, c) in enumerate(crowns):
        idx = r * size + c
        assign[idx] = ri
        for nb in _neighbors4(idx, size):
            frontier.append((nb, ri))
    while frontier:
        j = rng.randrange(len(frontier))
        cell, reg = frontier[j]
        frontier[j] = frontier[-1]
        frontier.pop()
        if assign[cell] != -1:
            continue
        assign[cell] = reg
        for nb in _neighbors4(cell, size):
            if assign[nb] == -1:
                frontier.append((nb, reg))
    return assign


def generate(seed=None, size=8) -> dict:
    if seed is None:
        seed = random.SystemRandom().randrange(1_000_000_000)
    rng = random.Random(seed)

    # Random flood-fill only yields a unique puzzle ~0.2% of the time, so we retry
    # with a fresh placement + regions each round. Average is a few hundred rounds
    # (well under a second); the cap only guards against a pathological seed.
    # ponytail: brute retry, not a clever unique-by-construction scheme; add refinement
    # if generation latency ever matters.
    for _ in range(100000):
        crowns = _random_placement(rng, size)
        regions = _grow_regions(rng, crowns, size)
        if count_solutions(regions, size, cap=2) == 1:
            return {
                "size": size,
                "regions": regions,
                "solution": [[r, c] for (r, c) in crowns],
                "seed": seed,
            }

    raise RuntimeError(f"could not generate a unique Queens puzzle for seed {seed}")
