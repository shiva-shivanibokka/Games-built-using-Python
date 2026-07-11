"""Zip path validation."""


def is_valid_path(path, size, numbers) -> bool:
    """True iff path covers every cell once, moves only to adjacent cells, and
    visits the numbered checkpoints in ascending order."""
    total = size * size
    cells = [tuple(cell) for cell in path]

    # Covers every cell exactly once.
    if len(cells) != total or len(set(cells)) != total:
        return False
    if any(not (0 <= r < size and 0 <= c < size) for r, c in cells):
        return False

    # Only orthogonally-adjacent moves.
    for (r1, c1), (r2, c2) in zip(cells, cells[1:]):
        if abs(r1 - r2) + abs(c1 - c2) != 1:
            return False

    # Checkpoints appear in ascending n order along the path.
    index = {cell: i for i, cell in enumerate(cells)}
    ordered = sorted(numbers, key=lambda x: x["n"])
    path_positions = [index[(cp["r"], cp["c"])] for cp in ordered]
    return path_positions == sorted(path_positions)
