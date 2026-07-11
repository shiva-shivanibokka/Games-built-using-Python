import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from games.lights_out import apply_presses, generate, solve


SEEDS = [0, 1, 2, 7, 42, 123, 999, 2024]


def test_board_not_all_off():
    for s in SEEDS:
        g = generate(seed=s, size=5)
        assert any(g["board"]), f"seed {s} produced an all-off board"


def test_solution_clears_board():
    for s in SEEDS:
        g = generate(seed=s, size=5)
        result = apply_presses(g["board"], g["solution"], g["size"])
        assert result == [0] * (g["size"] ** 2), f"solution failed for seed {s}"


def test_solver_valid():
    for s in SEEDS:
        g = generate(seed=s, size=5)
        presses = solve(g["board"], g["size"])
        assert presses is not None
        assert apply_presses(g["board"], presses, g["size"]) == [0] * 25


def test_deterministic():
    for s in SEEDS:
        assert generate(seed=s, size=5) == generate(seed=s, size=5)
