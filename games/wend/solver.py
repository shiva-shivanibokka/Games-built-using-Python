"""Verifier for Wend puzzles — used by tests to confirm a generated puzzle is
valid and solvable exactly as its `solution` claims."""

from .words import WORD_SETS


def _adjacent(a, b):
    return abs(a[0] - b[0]) + abs(a[1] - b[1]) == 1


def verify(puzzle):
    size = puzzle["size"]
    walls = {(r, c) for r, c in puzzle["walls"]}
    letters = puzzle["letters"]
    words = puzzle["words"]
    solution = puzzle["solution"]

    open_cells = {(r, c) for r in range(size) for c in range(size)} - walls
    if len(open_cells) != 18:
        return False
    if len(words) != 4 or len(solution) != 4:
        return False
    if [len(w) for w in words] != [3, 4, 5, 6]:
        return False

    seen = set()
    for word, path in zip(words, solution):
        cells = [(r, c) for r, c in path]
        if len(cells) != len(word):
            return False
        if word not in WORD_SETS.get(len(word), ()):
            return False
        for i, cell in enumerate(cells):
            if cell in walls or cell in seen:
                return False  # on a wall, or reused across/within words
            if letters[cell[0]][cell[1]] != word[i]:
                return False  # grid letter must spell the word along the path
            if i > 0 and not _adjacent(cells[i - 1], cell):
                return False
            seen.add(cell)

    return seen == open_cells  # tiles every open cell exactly once
