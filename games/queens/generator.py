"""Generate a uniquely-solvable Queens puzzle from a seed.

1. Pick a random valid crown placement (permutation of columns, consecutive rows'
   columns differ by >= 2 so no two crowns touch).
2. Grow `size` contiguous color regions by randomized multi-source flood fill,
   each seeded on one crown cell (so every region holds exactly its crown).
3. Carve toward uniqueness: while a second solution exists, reassign one boundary
   cell that the alternate solution relies on to a neighbouring region (never a
   crown cell, and only when the donor region stays contiguous). Each carve kills
   at least the current alternate, so uniqueness is reached in a handful of steps
   instead of the ~1/20000 blind-retry lottery that made size 9 take >10s.
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


def _find_alt(regions, size, intended):
    """First valid solution whose per-row columns differ from `intended`, or None."""
    used_cols = [False] * size
    used_regions = [False] * size
    sol = [-1] * size
    found = [None]

    def place(row, prev_col):
        if found[0] is not None:
            return
        if row == size:
            if sol != intended:
                found[0] = sol[:]
            return
        base = row * size
        for col in range(size):
            if used_cols[col]:
                continue
            reg = regions[base + col]
            if used_regions[reg]:
                continue
            if prev_col is not None and abs(col - prev_col) <= 1:
                continue
            used_cols[col] = used_regions[reg] = True
            sol[row] = col
            place(row + 1, col)
            used_cols[col] = used_regions[reg] = False

    place(0, None)
    return found[0]


def _region_stays_contiguous(regions, size, reg, without):
    """True if region `reg` remains one connected group after removing cell `without`."""
    cells = [i for i, r in enumerate(regions) if r == reg and i != without]
    if not cells:
        return False
    cellset = set(cells)
    seen = {cells[0]}
    stack = [cells[0]]
    while stack:
        for nb in _neighbors4(stack.pop(), size):
            if nb in cellset and nb not in seen:
                seen.add(nb)
                stack.append(nb)
    return len(seen) == len(cells)


def generate(seed=None, size=8) -> dict:
    if seed is None:
        seed = random.SystemRandom().randrange(1_000_000_000)
    rng = random.Random(seed)

    for _ in range(2000):
        crowns = _random_placement(rng, size)
        intended = [c for (_r, c) in crowns]
        crown_cells = {r * size + c for r, c in crowns}
        regions = _grow_regions(rng, crowns, size)

        # ponytail: 3*size carve steps per placement, then a fresh placement.
        # Convergence normally takes ~size steps; a placement that stalls past
        # this is a dud, and restarting beats carving it 300 more times.
        for _ in range(3 * size):
            if count_solutions(regions, size, cap=2) == 1:
                return {
                    "size": size,
                    "regions": regions,
                    "solution": [[r, c] for (r, c) in crowns],
                    "seed": seed,
                }
            alt = _find_alt(regions, size, intended)
            if alt is None:
                break  # no alternate to kill but not counted unique -> regrow
            rows = [r for r in range(size) if alt[r] != intended[r]]
            rng.shuffle(rows)
            carved = False
            for r in rows:
                cell = r * size + alt[r]
                if cell in crown_cells:
                    continue
                reg = regions[cell]
                donors = list(
                    {regions[nb] for nb in _neighbors4(cell, size) if regions[nb] != reg}
                )
                rng.shuffle(donors)
                if donors and _region_stays_contiguous(regions, size, reg, cell):
                    regions[cell] = donors[0]
                    carved = True
                    break
            if not carved:
                break  # stuck -> fresh placement

    raise RuntimeError(f"could not generate a unique Queens puzzle for seed {seed}")
