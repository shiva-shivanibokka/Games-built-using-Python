"""Wend puzzle generator.

A 5x5 grid with 7 walls leaves 18 open cells. Four words of lengths 3, 4, 5, 6
(3+4+5+6 = 18) each trace a self-avoiding path through orthogonally-adjacent
open cells, and together the four paths tile every open cell.

Strategy: grow the four paths directly on an empty grid (longest first) with a
randomized backtracking walk. Whatever cells the walks don't cover become the
7 walls. Then drop a real word of the matching length onto each path. Retry the
whole layout with the same seeded RNG until every step succeeds — bounded, and
in practice it lands within a handful of attempts.
"""

import random

SIZE = 5
LENGTHS = (6, 5, 4, 3)  # place longest first — it has the least room to fail
_DIRS = ((-1, 0), (1, 0), (0, -1), (0, 1))


def _walk(rng, available, length):
    """Randomized backtracking self-avoiding walk of exactly `length` cells,
    drawn from the set `available`. Returns a list of (r, c) or None."""
    starts = list(available)
    rng.shuffle(starts)
    for start in starts:
        path = [start]
        used = {start}

        def extend():
            if len(path) == length:
                return True
            r, c = path[-1]
            nbrs = [(r + dr, c + dc) for dr, dc in _DIRS]
            rng.shuffle(nbrs)
            for nb in nbrs:
                if nb in available and nb not in used:
                    path.append(nb)
                    used.add(nb)
                    if extend():
                        return True
                    path.pop()
                    used.remove(nb)
            return False

        if extend():
            return path
    return None


def _layout(rng):
    """One attempt: return list of paths (longest→shortest) tiling 18 cells, or None."""
    available = {(r, c) for r in range(SIZE) for c in range(SIZE)}
    paths = []
    for length in LENGTHS:
        path = _walk(rng, available, length)
        if path is None:
            return None
        for cell in path:
            available.discard(cell)
        paths.append(path)
    return paths


def generate(seed=None):
    from .words import WORDS

    if seed is None:
        seed = random.randrange(2 ** 31)
    rng = random.Random(seed)

    paths = None
    for _ in range(10000):
        paths = _layout(rng)
        if paths is not None:
            break
    if paths is None:  # pragma: no cover - astronomically unlikely
        raise RuntimeError("Wend: failed to lay out a puzzle")

    # paths came out longest→shortest; pair each with a word and sort 3,4,5,6.
    letters = [["" for _ in range(SIZE)] for _ in range(SIZE)]
    entries = []
    for path in paths:
        word = rng.choice(WORDS[len(path)])
        for (r, c), ch in zip(path, word):
            letters[r][c] = ch
        entries.append((word, path))
    entries.sort(key=lambda e: len(e[0]))

    covered = {cell for path in paths for cell in path}
    walls = sorted([r, c] for r in range(SIZE) for c in range(SIZE)
                   if (r, c) not in covered)

    return {
        "size": SIZE,
        "walls": walls,
        "letters": letters,
        "words": [w for w, _ in entries],
        "solution": [[[r, c] for (r, c) in path] for _, path in entries],
        "seed": seed,
    }
