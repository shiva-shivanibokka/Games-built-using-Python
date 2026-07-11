"""Wend generator invariants across many seeds (variable shapes)."""

from games.wend import generate, verify

SEEDS = list(range(200))


def test_generated_puzzles_are_valid():
    for seed in SEEDS:
        assert verify(generate(seed=seed)), f"invalid puzzle for seed {seed}"


def test_shape_invariants():
    for seed in SEEDS:
        p = generate(seed=seed)
        size = p["size"]
        assert size in (4, 5, 6)

        walls = {tuple(w) for w in p["walls"]}
        all_cells = {(r, c) for r in range(size) for c in range(size)}
        open_cells = all_cells - walls
        # walls + open partition the grid, no overlap.
        assert len(walls) + len(open_cells) == size * size
        assert walls.isdisjoint(open_cells)

        # variable count of words, each length 3-6.
        assert 3 <= len(p["words"]) <= 5
        assert all(3 <= len(w) <= 6 for w in p["words"])
        # words come sorted by length.
        assert [len(w) for w in p["words"]] == sorted(len(w) for w in p["words"])
        # word lengths sum to the open-cell count.
        assert sum(len(w) for w in p["words"]) == len(open_cells)

        # solution paths tile every open cell exactly once.
        cells = [tuple(c) for path in p["solution"] for c in path]
        assert len(cells) == len(open_cells)
        assert set(cells) == open_cells


def test_determinism():
    for seed in SEEDS:
        assert generate(seed=seed) == generate(seed=seed)


def test_size_variety():
    # Across many seeds we should see more than one grid size.
    sizes = {generate(seed=s)["size"] for s in SEEDS}
    assert len(sizes) >= 2


def test_random_seed_is_valid():
    # No seed -> still always a valid, solvable puzzle.
    for _ in range(20):
        assert verify(generate())
