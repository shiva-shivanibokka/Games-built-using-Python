import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from games.lights_out import apply_presses, generate, solve


SEEDS = [0, 1, 2, 7, 42, 123, 999, 2024]
SIZES = [4, 5, 6]  # easy / medium / hard


def test_board_not_all_off():
    for size in SIZES:
        for s in SEEDS:
            g = generate(seed=s, size=size)
            assert g["size"] == size
            assert any(g["board"]), f"size {size} seed {s} produced an all-off board"


def test_solution_clears_board():
    for size in SIZES:
        for s in SEEDS:
            g = generate(seed=s, size=size)
            result = apply_presses(g["board"], g["solution"], g["size"])
            assert result == [0] * (size * size), f"solution failed for size {size} seed {s}"


def test_solver_valid():
    for size in SIZES:
        for s in SEEDS:
            g = generate(seed=s, size=size)
            presses = solve(g["board"], g["size"])
            assert presses is not None
            assert apply_presses(g["board"], presses, g["size"]) == [0] * (size * size)


def test_deterministic():
    for size in SIZES:
        for s in SEEDS:
            assert generate(seed=s, size=size) == generate(seed=s, size=size)
