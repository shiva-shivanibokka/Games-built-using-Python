"""Queens generator/solver invariants across several seeds and supported sizes."""

import time

import pytest

from games.queens import generate, count_solutions, solve

SEEDS = [1, 7, 42, 123, 2024, 999999]
# Difficulty grid sizes exposed by the UI: easy=7, medium=8, hard=9.
SIZES = [7, 8, 9]


def _regions_are_n_contiguous(regions, size):
    # Exactly `size` region ids, each a single connected 4-neighbor group, covering all cells.
    assert len(regions) == size * size
    assert set(regions) == set(range(size))
    for reg in range(size):
        cells = [i for i, r in enumerate(regions) if r == reg]
        assert cells, f"region {reg} empty"
        seen = {cells[0]}
        stack = [cells[0]]
        while stack:
            idx = stack.pop()
            r, c = divmod(idx, size)
            for nr, nc in ((r - 1, c), (r + 1, c), (r, c - 1), (r, c + 1)):
                if 0 <= nr < size and 0 <= nc < size:
                    nb = nr * size + nc
                    if regions[nb] == reg and nb not in seen:
                        seen.add(nb)
                        stack.append(nb)
        assert seen == set(cells), f"region {reg} not contiguous"


def _placement_is_valid(solution, regions, size):
    assert len(solution) == size
    rows = {r for r, _ in solution}
    cols = {c for _, c in solution}
    regs = {regions[r * size + c] for r, c in solution}
    assert rows == set(range(size))
    assert cols == set(range(size))
    assert regs == set(range(size))
    # No two crowns touch (Chebyshev distance >= 2).
    for i in range(size):
        for j in range(i + 1, size):
            r1, c1 = solution[i]
            r2, c2 = solution[j]
            assert max(abs(r1 - r2), abs(c1 - c2)) >= 2


@pytest.mark.parametrize("size", SIZES)
def test_regions_contiguous_and_cover(size):
    for seed in SEEDS:
        p = generate(seed=seed, size=size)
        _regions_are_n_contiguous(p["regions"], p["size"])


@pytest.mark.parametrize("size", SIZES)
def test_solution_valid(size):
    for seed in SEEDS:
        p = generate(seed=seed, size=size)
        _placement_is_valid(p["solution"], p["regions"], p["size"])


@pytest.mark.parametrize("size", SIZES)
def test_unique_solution(size):
    for seed in SEEDS:
        p = generate(seed=seed, size=size)
        assert count_solutions(p["regions"], p["size"], cap=2) == 1
        # the unique solution the solver finds must match the reported one
        assert solve(p["regions"], p["size"]) == p["solution"]


@pytest.mark.parametrize("size", SIZES)
def test_determinism(size):
    for seed in SEEDS:
        assert generate(seed=seed, size=size) == generate(seed=seed, size=size)


def test_hard_generation_is_fast():
    """Hard (size 9) must generate well under the ~3s serverless budget per seed."""
    for seed in SEEDS:
        start = time.time()
        generate(seed=seed, size=9)
        assert time.time() - start < 3.0, f"size 9 seed {seed} too slow"
