"""Zip puzzle generator.

Builds a random Hamiltonian path covering every cell of an N x N grid, then
drops numbered checkpoints along it (1 at the start, k at the end, a few in
between). The returned path IS the solution, so a board is always solvable.
"""

import random

# ponytail: randomized-restart backtracking. 6x6 solves in a handful of tries;
# bump attempts if you ever raise N much higher.
_MAX_ATTEMPTS = 200


def _hamiltonian_path(rng: random.Random, size: int) -> list[list[int]]:
    """Random path visiting every cell once, via randomized DFS with backtracking."""
    total = size * size
    for _ in range(_MAX_ATTEMPTS):
        start = (rng.randrange(size), rng.randrange(size))
        visited = {start}
        path = [start]

        def dfs(r: int, c: int) -> bool:
            if len(path) == total:
                return True
            neighbors = [
                (r + dr, c + dc)
                for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1))
                if 0 <= r + dr < size and 0 <= c + dc < size
            ]
            rng.shuffle(neighbors)
            for nr, nc in neighbors:
                if (nr, nc) not in visited:
                    visited.add((nr, nc))
                    path.append((nr, nc))
                    if dfs(nr, nc):
                        return True
                    path.pop()
                    visited.discard((nr, nc))
            return False

        if dfs(*start):
            return [[r, c] for r, c in path]
    raise RuntimeError(f"failed to build Hamiltonian path for size {size}")


def generate(seed=None, size=6) -> dict:
    if seed is None:
        seed = random.randrange(2**31)
    rng = random.Random(seed)

    path = _hamiltonian_path(rng, size)
    total = len(path)

    # ~6-8 checkpoints: always start (1) and end (k), plus a few interior ones
    # at strictly increasing path positions.
    k = rng.randint(6, 8)
    interior = sorted(rng.sample(range(1, total - 1), k - 2))
    positions = [0] + interior + [total - 1]

    numbers = [
        {"r": path[p][0], "c": path[p][1], "n": i + 1}
        for i, p in enumerate(positions)
    ]

    return {"size": size, "numbers": numbers, "solution": path, "seed": seed}
