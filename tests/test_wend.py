"""Wend generator invariants across several seeds."""

from games.wend import generate, verify

SEEDS = [1, 7, 42, 123, 2024, 55555, 999999]


def test_generated_puzzles_are_valid():
    for seed in SEEDS:
        assert verify(generate(seed=seed)), f"invalid puzzle for seed {seed}"


def test_shape_invariants():
    for seed in SEEDS:
        p = generate(seed=seed)
        assert p["size"] == 5
        assert len(p["walls"]) == 7
        assert [len(w) for w in p["words"]] == [3, 4, 5, 6]
        # 18 open cells covered exactly once by the four solution paths.
        cells = [tuple(c) for path in p["solution"] for c in path]
        assert len(cells) == 18
        assert len(set(cells)) == 18


def test_determinism():
    for seed in SEEDS:
        assert generate(seed=seed) == generate(seed=seed)


def test_random_seed_is_valid():
    # No seed -> still always a valid, solvable puzzle.
    for _ in range(20):
        assert verify(generate())
