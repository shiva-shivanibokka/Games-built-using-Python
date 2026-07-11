"""Sudoku generator/solver invariants across several seeds."""

from games.sudoku import generate, count_solutions


def _to_grid(s: str) -> list[int]:
    return [0 if c == "." else int(c) for c in s]


def _is_complete_valid(grid: list[int]) -> bool:
    if len(grid) != 81 or any(n < 1 or n > 9 for n in grid):
        return False
    full = set(range(1, 10))
    for i in range(9):
        row = {grid[i * 9 + j] for j in range(9)}
        col = {grid[j * 9 + i] for j in range(9)}
        br, bc = (i // 3) * 3, (i % 3) * 3
        box = {grid[(br + r) * 9 + (bc + c)] for r in range(3) for c in range(3)}
        if row != full or col != full or box != full:
            return False
    return True


SEEDS = [1, 7, 42, 123, 2024, 999999]


def test_puzzle_has_unique_solution():
    for seed in SEEDS:
        p = generate(seed=seed, difficulty="medium")
        assert count_solutions(_to_grid(p["puzzle"]), cap=2) == 1


def test_solution_is_valid_and_solves_puzzle():
    for seed in SEEDS:
        p = generate(seed=seed, difficulty="easy")
        puzzle, solution = p["puzzle"], p["solution"]
        assert _is_complete_valid(_to_grid(solution))
        # every given in the puzzle matches the solution
        for i, c in enumerate(puzzle):
            if c != ".":
                assert c == solution[i]


def test_determinism():
    for seed in SEEDS:
        a = generate(seed=seed, difficulty="hard")
        b = generate(seed=seed, difficulty="hard")
        assert a == b


def test_difficulty_given_counts():
    counts = {}
    for diff in ("easy", "medium", "hard"):
        p = generate(seed=42, difficulty=diff)
        counts[diff] = sum(1 for c in p["puzzle"] if c != ".")
    assert counts["easy"] >= counts["medium"] >= counts["hard"]
