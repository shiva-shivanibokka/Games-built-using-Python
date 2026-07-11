"""Tango generator/solver invariants across several seeds."""

from games.tango import generate, count_solutions

SIZE = 6
SEEDS = [1, 7, 42, 123, 2024, 999999]
DIFFICULTIES = ["easy", "medium", "hard"]


def _rules_ok(sol: str) -> bool:
    assert len(sol) == SIZE * SIZE
    g = [[sol[r * SIZE + c] for c in range(SIZE)] for r in range(SIZE)]
    for i in range(SIZE):
        row = g[i]
        col = [g[r][i] for r in range(SIZE)]
        for line in (row, col):
            if line.count("S") != SIZE // 2 or line.count("M") != SIZE // 2:
                return False
            for j in range(SIZE - 2):
                if line[j] == line[j + 1] == line[j + 2]:
                    return False
    return True


def _edges_ok(sol, edges):
    for e in edges:
        a = sol[e["r1"] * SIZE + e["c1"]]
        b = sol[e["r2"] * SIZE + e["c2"]]
        if e["type"] == "=" and a != b:
            return False
        if e["type"] == "x" and a == b:
            return False
    return True


def test_solution_satisfies_all_rules():
    for seed in SEEDS:
        p = generate(seed=seed)
        assert p["size"] == SIZE
        assert _rules_ok(p["solution"])
        assert _edges_ok(p["solution"], p["edges"])
        for gv in p["givens"]:
            assert p["solution"][gv["r"] * SIZE + gv["c"]] == gv["val"]


def test_puzzle_is_uniquely_solvable():
    for seed in SEEDS:
        p = generate(seed=seed)
        assert count_solutions(p["givens"], p["edges"], cap=2) == 1


def test_determinism():
    for seed in SEEDS:
        assert generate(seed=seed) == generate(seed=seed)


def test_each_difficulty_valid_and_unique():
    for difficulty in DIFFICULTIES:
        for seed in SEEDS:
            p = generate(seed=seed, difficulty=difficulty)
            assert _rules_ok(p["solution"])
            assert _edges_ok(p["solution"], p["edges"])
            for gv in p["givens"]:
                assert p["solution"][gv["r"] * SIZE + gv["c"]] == gv["val"]
            assert count_solutions(p["givens"], p["edges"], cap=2) == 1
