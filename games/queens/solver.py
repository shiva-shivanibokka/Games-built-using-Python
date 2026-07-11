"""Queens solver: one crown per row/column/region, none touching (incl. diagonally).

`regions` is a length size*size list of region ids (0..size-1), row-major.

Since there is exactly one crown per row, two crowns can only touch if they sit
in adjacent rows, so the no-touch rule reduces to: consecutive rows' columns
must differ by at least 2.
"""


def count_solutions(regions, size, cap=2):
    """Count solutions, stopping once `cap` is reached."""
    used_cols = [False] * size
    used_regions = [False] * size
    count = 0

    def place(row, prev_col):
        nonlocal count
        if count >= cap:
            return
        if row == size:
            count += 1
            return
        base = row * size
        for col in range(size):
            if used_cols[col]:
                continue
            reg = regions[base + col]
            if used_regions[reg]:
                continue
            if prev_col is not None and abs(col - prev_col) <= 1:
                continue
            used_cols[col] = True
            used_regions[reg] = True
            place(row + 1, col)
            used_cols[col] = False
            used_regions[reg] = False

    place(0, None)
    return count


def solve(regions, size):
    """Return one solution as a list of [row, col] (one per row), or None."""
    used_cols = [False] * size
    used_regions = [False] * size
    solution = []

    def place(row, prev_col):
        if row == size:
            return True
        base = row * size
        for col in range(size):
            if used_cols[col]:
                continue
            reg = regions[base + col]
            if used_regions[reg]:
                continue
            if prev_col is not None and abs(col - prev_col) <= 1:
                continue
            used_cols[col] = True
            used_regions[reg] = True
            solution.append([row, col])
            if place(row + 1, col):
                return True
            solution.pop()
            used_cols[col] = False
            used_regions[reg] = False
        return False

    return solution if place(0, None) else None
