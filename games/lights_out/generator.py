"""Lights Out board generator.

Solvability is guaranteed by construction: start from all-OFF and apply a random
non-empty set of presses. Any board reachable this way is solvable (press the
same set again to undo). The solver then recovers a canonical press solution.
"""

import random

from .solver import apply_presses, solve


def generate(seed=None, size=5):
    if seed is None:
        seed = random.randrange(2**31)
    rng = random.Random(seed)
    n = size * size

    # Random non-empty press set; retry the rare case that lands back on all-off.
    board = [0] * n
    while not any(board):
        presses = [rng.randint(0, 1) for _ in range(n)]
        board = apply_presses([0] * n, presses, size)

    solution = solve(board, size)
    return {
        "size": size,
        "board": board,
        "solution": solution,
        "seed": seed,
    }
