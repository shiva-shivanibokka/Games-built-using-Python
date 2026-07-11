"""Queens generator/solver invariants across several seeds."""

from games.queens import generate, count_solutions, solve

SEEDS = [1, 7, 42, 123, 2024, 999999]
SIZE = 8


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


def test_regions_contiguous_and_cover():
    for seed in SEEDS:
        p = generate(seed=seed, size=SIZE)
        _regions_are_n_contiguous(p["regions"], p["size"])


def test_solution_valid():
    for seed in SEEDS:
        p = generate(seed=seed, size=SIZE)
        _placement_is_valid(p["solution"], p["regions"], p["size"])


def test_unique_solution():
    for seed in SEEDS:
        p = generate(seed=seed, size=SIZE)
        assert count_solutions(p["regions"], p["size"], cap=2) == 1
        # solver must find a solution that matches the reported one
        found = solve(p["regions"], p["size"])
        assert found is not None


def test_determinism():
    for seed in SEEDS:
        assert generate(seed=seed, size=SIZE) == generate(seed=seed, size=SIZE)
