"""Backtracking Tango solver.

A board is a 36-element list, row-major, each 'S' (sun), 'M' (moon), or None.
Rules enforced:
  - never three of the same symbol in a row horizontally or vertically
  - each row and column holds exactly 3 S and 3 M
  - edge constraints: "=" adjacent cells equal, "x" adjacent cells opposite

`solve` returns a 36-char solution string (or None); `count_solutions` counts
solutions up to `cap` for uniqueness checks.
"""

SIZE = 6
HALF = 3


def _edge_map(edges):
    """Map each cell (r, c) -> list of (neighbor_cell, type)."""
    m = {}
    for e in edges:
        a, b, t = (e["r1"], e["c1"]), (e["r2"], e["c2"]), e["type"]
        m.setdefault(a, []).append((b, t))
        m.setdefault(b, []).append((a, t))
    return m


def _board_from_givens(givens):
    board = [None] * (SIZE * SIZE)
    for g in givens:
        board[g["r"] * SIZE + g["c"]] = g["val"]
    return board


def _valid_at(board, pos, edge_map):
    """Check the rules touching cell `pos` (already set). Only looks at filled cells."""
    r, c = divmod(pos, SIZE)
    v = board[pos]

    # No three-in-a-row through this cell — horizontal, then vertical.
    for s in (c - 2, c - 1, c):
        if 0 <= s and s + 2 < SIZE:
            a, b, d = board[r * SIZE + s], board[r * SIZE + s + 1], board[r * SIZE + s + 2]
            if a is not None and a == b == d:
                return False
    for s in (r - 2, r - 1, r):
        if 0 <= s and s + 2 < SIZE:
            a, b, d = board[s * SIZE + c], board[(s + 1) * SIZE + c], board[(s + 2) * SIZE + c]
            if a is not None and a == b == d:
                return False

    # Row / column balance can't overshoot 3 of a symbol.
    if sum(1 for j in range(SIZE) if board[r * SIZE + j] == v) > HALF:
        return False
    if sum(1 for i in range(SIZE) if board[i * SIZE + c] == v) > HALF:
        return False

    # Edge constraints against already-filled neighbors.
    for (nr, nc), t in edge_map.get((r, c), []):
        nv = board[nr * SIZE + nc]
        if nv is not None:
            if t == "=" and nv != v:
                return False
            if t == "x" and nv == v:
                return False
    return True


def _search(board, empties, idx, edge_map, cap, found):
    if idx == len(empties):
        found[0] += 1
        found[1] = "".join(board)
        return
    pos = empties[idx]
    for v in ("S", "M"):
        board[pos] = v
        if _valid_at(board, pos, edge_map):
            _search(board, empties, idx + 1, edge_map, cap, found)
            if found[0] >= cap:
                board[pos] = None
                return
        board[pos] = None


def count_solutions(givens, edges, cap=2):
    """Count solutions, stopping once `cap` is reached."""
    board = _board_from_givens(givens)
    empties = [i for i in range(SIZE * SIZE) if board[i] is None]
    found = [0, None]  # [count, last_solution]
    _search(board, empties, 0, _edge_map(edges), cap, found)
    return found[0]


def solve(givens, edges):
    """Return the first solution as a 36-char string, or None if unsolvable."""
    board = _board_from_givens(givens)
    empties = [i for i in range(SIZE * SIZE) if board[i] is None]
    found = [0, None]
    _search(board, empties, 0, _edge_map(edges), 1, found)
    return found[1]
