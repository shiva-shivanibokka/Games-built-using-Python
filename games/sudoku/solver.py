"""Backtracking Sudoku solver.

Grids are 81-element lists of ints 0-9 (0 = blank), row-major.
`solve` fills the first solution in place; `count_solutions` counts up to a cap.
"""


def _candidates(grid: list[int], pos: int) -> list[int]:
    row, col = divmod(pos, 9)
    box = (row // 3) * 3 + col // 3
    used = set()
    for i in range(9):
        used.add(grid[row * 9 + i])          # row
        used.add(grid[i * 9 + col])          # col
    br, bc = (box // 3) * 3, (box % 3) * 3
    for r in range(br, br + 3):
        for c in range(bc, bc + 3):
            used.add(grid[r * 9 + c])        # box
    return [n for n in range(1, 10) if n not in used]


def _first_blank(grid: list[int]) -> int:
    try:
        return grid.index(0)
    except ValueError:
        return -1


def solve(grid: list[int]) -> bool:
    """Fill `grid` (in place) with the first solution found. Returns True on success."""
    pos = _first_blank(grid)
    if pos == -1:
        return True
    for n in _candidates(grid, pos):
        grid[pos] = n
        if solve(grid):
            return True
    grid[pos] = 0
    return False


def count_solutions(grid: list[int], cap: int = 2) -> int:
    """Count solutions, stopping once `cap` is reached (used for uniqueness checks)."""
    pos = _first_blank(grid)
    if pos == -1:
        return 1
    total = 0
    for n in _candidates(grid, pos):
        grid[pos] = n
        total += count_solutions(grid, cap)
        if total >= cap:
            grid[pos] = 0
            return total
    grid[pos] = 0
    return total
