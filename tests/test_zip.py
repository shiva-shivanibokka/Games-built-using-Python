"""Zip generator invariants across several seeds."""

from games.zip import generate, is_valid_path

SEEDS = [1, 7, 42, 123, 2024, 999999]


def test_solution_is_a_valid_path():
    for seed in SEEDS:
        p = generate(seed=seed, size=6)
        assert is_valid_path(p["solution"], p["size"], p["numbers"])


def test_first_and_last_checkpoints_are_path_ends():
    for seed in SEEDS:
        p = generate(seed=seed, size=6)
        nums = p["numbers"]
        path = p["solution"]
        first = min(nums, key=lambda x: x["n"])
        last = max(nums, key=lambda x: x["n"])
        assert first["n"] == 1
        assert [first["r"], first["c"]] == path[0]
        assert [last["r"], last["c"]] == path[-1]


def test_checkpoint_count_reasonable():
    for seed in SEEDS:
        p = generate(seed=seed, size=6)
        assert 6 <= len(p["numbers"]) <= 8


def test_determinism():
    for seed in SEEDS:
        assert generate(seed=seed, size=6) == generate(seed=seed, size=6)
