"""Wend puzzle generator (variable shapes).

A puzzle is an NxN grid (N in 4/5/6) with some walls. The open cells are tiled
by 3-5 words whose lengths (each 3-6) sum to the open-cell count. Each word
traces a self-avoiding path through orthogonally-adjacent open cells, and the
paths together cover every open cell exactly once.

Strategy: from the seeded rng pick a size, a wall count, and a set of word
lengths that sum to the open cells. Grow the paths directly on an empty grid
(longest first) with a randomized backtracking walk; whatever cells the walks
don't cover become the walls. Drop a real word of the matching length onto each
path. Retry (re-picking the shape) until every step succeeds — bounded, and in
practice it lands within a handful of attempts.
"""

import random

SIZES = (4, 5, 6)
_DIFFICULTY_SIZE = {"easy": 4, "medium": 5, "hard": 6}
MINLEN, MAXLEN = 3, 6  # words.py provides these lengths
_DIRS = ((-1, 0), (1, 0), (0, -1), (0, 1))


def _pick_shape(rng, size=None):
    """Pick (size, lengths) — lengths in [3,6], count 3-5, summing to open cells.
    `size` fixes the grid dimension (from difficulty); None picks one at random."""
    if size is None:
        size = rng.choice(SIZES)
    cells = size * size
    walls = rng.randint(max(2, round(cells * 0.16)), round(cells * 0.34))
    open_cells = cells - walls

    # word count k so average length stays in [MINLEN, MAXLEN]; then clamp to 3-5.
    kmin = -(-open_cells // MAXLEN)  # ceil(open / MAXLEN)
    kmax = open_cells // MINLEN
    lo, hi = max(3, kmin), min(5, kmax)
    if lo > hi:  # infeasible against the 3-5 preference — fall back to raw bounds
        lo, hi = kmin, kmax
    k = rng.randint(lo, hi)

    lengths = [MINLEN] * k
    caps = [MAXLEN - MINLEN] * k
    extra = open_cells - MINLEN * k
    while extra > 0:
        pool = [i for i in range(k) if caps[i] > 0]
        i = rng.choice(pool)
        lengths[i] += 1
        caps[i] -= 1
        extra -= 1
    lengths.sort(reverse=True)  # place longest first — least room to fail
    return size, lengths


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


def _layout(rng, size, lengths):
    """One attempt: return list of paths (longest→shortest) tiling the open cells, or None."""
    available = {(r, c) for r in range(size) for c in range(size)}
    paths = []
    for length in lengths:
        path = _walk(rng, available, length)
        if path is None:
            return None
        for cell in path:
            available.discard(cell)
        paths.append(path)
    return paths


def generate(seed=None, difficulty=None):
    from .words import WORDS

    if seed is None:
        seed = random.randrange(2 ** 31)
    rng = random.Random(seed)

    fixed_size = _DIFFICULTY_SIZE.get(difficulty)  # None => auto-random size

    size = paths = None
    for _ in range(20000):
        size, lengths = _pick_shape(rng, fixed_size)
        paths = _layout(rng, size, lengths)
        if paths is not None:
            break
    if paths is None:  # pragma: no cover - astronomically unlikely
        raise RuntimeError("Wend: failed to lay out a puzzle")

    # Pair each path with a distinct real word, then sort entries by length.
    letters = [["" for _ in range(size)] for _ in range(size)]
    entries = []
    used_words = set()
    for path in paths:
        choices = WORDS[len(path)]
        word = rng.choice(choices)
        while word in used_words:
            word = rng.choice(choices)
        used_words.add(word)
        for (r, c), ch in zip(path, word):
            letters[r][c] = ch
        entries.append((word, path))
    entries.sort(key=lambda e: len(e[0]))

    covered = {cell for path in paths for cell in path}
    walls = sorted([r, c] for r in range(size) for c in range(size)
                   if (r, c) not in covered)

    return {
        "size": size,
        "walls": walls,
        "letters": letters,
        "words": [w for w, _ in entries],
        "solution": [[[r, c] for (r, c) in path] for _, path in entries],
        "seed": seed,
    }
