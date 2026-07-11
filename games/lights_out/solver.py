"""Lights Out solver via GF(2) linear algebra.

Clicking a cell toggles it and its orthogonal neighbors. Over the field with
two elements this is a linear system A x = b (mod 2), where column j of A is the
toggle mask of pressing cell j, b is the starting board, and x is the press
pattern that turns every light off. We solve it with mod-2 Gaussian elimination.
"""


def _toggle_mask(cell: int, size: int) -> int:
    """Bitmask of cells toggled by pressing `cell` (self + orthogonal neighbors)."""
    r, c = divmod(cell, size)
    mask = 1 << cell
    if r > 0:
        mask |= 1 << (cell - size)
    if r < size - 1:
        mask |= 1 << (cell + size)
    if c > 0:
        mask |= 1 << (cell - 1)
    if c < size - 1:
        mask |= 1 << (cell + 1)
    return mask


def solve(board, size):
    """Return a length size*size 0/1 press pattern turning `board` all off.

    `board` is a row-major 0/1 list (1 = light ON). Returns None if unsolvable.
    """
    n = size * size
    # Each row of the augmented matrix packs one equation as bits: columns 0..n-1
    # are the toggle coefficients, bit n is the RHS (target = board value).
    # Equation i: sum over presses j that toggle cell i == board[i] (mod 2).
    rows = []
    for i in range(n):
        eq = 0
        for j in range(n):
            if _toggle_mask(j, size) & (1 << i):
                eq |= 1 << j
        if board[i]:
            eq |= 1 << n
        rows.append(eq)

    # Gaussian elimination over GF(2).
    pivot_col = [-1] * n  # pivot_col[r] = column pivoted on in row r
    r = 0
    for col in range(n):
        # Find a row at/below r with a 1 in this column.
        sel = next((k for k in range(r, n) if rows[k] & (1 << col)), None)
        if sel is None:
            continue
        rows[r], rows[sel] = rows[sel], rows[r]
        for k in range(n):
            if k != r and rows[k] & (1 << col):
                rows[k] ^= rows[r]
        pivot_col[r] = col
        r += 1

    # Any all-zero-coeff row with RHS 1 means no solution.
    for k in range(r, n):
        if rows[k] & (1 << n):
            return None

    x = [0] * n
    for k in range(r):
        col = pivot_col[k]
        if rows[k] & (1 << n):
            x[col] = 1
    return x


def apply_presses(board, presses, size):
    """Toggle `board` (0/1 list) by every pressed cell; return the new board."""
    out = list(board)
    for j, p in enumerate(presses):
        if not p:
            continue
        mask = _toggle_mask(j, size)
        for i in range(size * size):
            if mask & (1 << i):
                out[i] ^= 1
    return out
