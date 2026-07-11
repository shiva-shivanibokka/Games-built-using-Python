"""Zip puzzle generator.

Builds a random Hamiltonian path covering every cell of an N x N grid, then
drops numbered checkpoints along it (1 at the start, k at the end, a few in
between). The returned path IS the solution, so a board is always solvable.
"""

import random


def _hamiltonian_path(rng: random.Random, size: int) -> list[list[int]]:
    """Random Hamiltonian path (visits every cell once) via the backbite shuffle.

    Start from a trivial snake path, then repeatedly mutate one end: pick a
    grid-neighbor of the head, and reverse the prefix up to it. Each move keeps
    the path a valid Hamiltonian path, so this never fails and is fast for any N
    (random-restart DFS blows up exponentially by 7x7).
    """
    total = size * size

    def neighbors(cell):
        r, c = cell
        return [
            (r + dr, c + dc)
            for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1))
            if 0 <= r + dr < size and 0 <= c + dc < size
        ]

    # Boustrophedon (snake) seed path — already Hamiltonian.
    path = []
    for r in range(size):
        cols = range(size) if r % 2 == 0 else range(size - 1, -1, -1)
        path.extend((r, c) for c in cols)

    # Backbite: O(total^2) moves mixes thoroughly; each is O(total), so trivial.
    for _ in range(total * total * 4):
        if rng.random() < 0.5:
            path.reverse()  # operate on the other end too
        head = path[0]
        choices = [v for v in neighbors(head) if v != path[1]]
        if not choices:
            continue
        k = path.index(rng.choice(choices))  # chosen neighbor sits at index k>=2
        path[:k] = path[:k][::-1]  # reverse prefix; new head-path[k] edge is valid

    return [[r, c] for r, c in path]


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
