"""Perfect-play Tic-Tac-Toe AI via minimax.

Board is a flat list of 9 cells, indices 0-8 (row-major):

    0 | 1 | 2
    3 | 4 | 5
    6 | 7 | 8

Each cell is "X", "O", or "" (empty). The AI is unbeatable — it wins when it
can and forces a draw otherwise.
"""

from __future__ import annotations

import random

WINS = (
    (0, 1, 2), (3, 4, 5), (6, 7, 8),  # rows
    (0, 3, 6), (1, 4, 7), (2, 5, 8),  # cols
    (0, 4, 8), (2, 4, 6),             # diagonals
)


def winner(board: list[str]) -> str | None:
    """Return "X" or "O" if that player has three in a row, else None."""
    for a, b, c in WINS:
        if board[a] and board[a] == board[b] == board[c]:
            return board[a]
    return None


def is_full(board: list[str]) -> bool:
    return all(cell for cell in board)


def _other(player: str) -> str:
    return "O" if player == "X" else "X"


def _minimax(board: list[str], ai: str, to_move: str) -> tuple[int, int | None]:
    """Return (score, move) for `ai` with `to_move` to play.

    score: +10 - depth-ish preference is skipped; we use +1 win / -1 loss / 0
    draw and prefer faster wins by subtracting search depth via move count.
    """
    win = winner(board)
    if win == ai:
        return 1, None
    if win == _other(ai):
        return -1, None
    if is_full(board):
        return 0, None

    best_score = -2 if to_move == ai else 2
    best_move_idx: int | None = None
    for i in range(9):
        if board[i]:
            continue
        board[i] = to_move
        score, _ = _minimax(board, ai, _other(to_move))
        board[i] = ""
        if to_move == ai:
            if score > best_score:
                best_score, best_move_idx = score, i
        else:
            if score < best_score:
                best_score, best_move_idx = score, i
    return best_score, best_move_idx


def best_move(board: list[str], ai: str = "O") -> int | None:
    """Return the index of the AI's optimal move, or None if the board is full
    or already won."""
    if winner(board) or is_full(board):
        return None
    _, move = _minimax(list(board), ai, ai)
    return move


def _wins_at(board: list[str], i: int, player: str) -> bool:
    board[i] = player
    won = winner(board) == player
    board[i] = ""
    return won


def move(board: list[str], ai: str = "O", level: str = "hard") -> int | None:
    """AI move at the given difficulty. easy=random, medium=win/block/random,
    hard=perfect minimax. Falls back to hard for unknown levels."""
    if winner(board) or is_full(board):
        return None
    empties = [i for i, c in enumerate(board) if not c]
    if level == "easy":
        return random.choice(empties)
    if level == "medium":
        for i in empties:  # win if we can
            if _wins_at(board, i, ai):
                return i
        opp = _other(ai)
        for i in empties:  # else block the opponent
            if _wins_at(board, i, opp):
                return i
        return random.choice(empties)
    return best_move(board, ai)  # hard


if __name__ == "__main__":
    # Self-check: AI takes an immediate win, and blocks an immediate loss.
    win_now = ["O", "O", "", "X", "X", "", "", "", ""]
    assert best_move(win_now, "O") == 2, "AI must complete its own row"
    must_block = ["X", "X", "", "O", "", "", "", "", ""]
    assert best_move(must_block, "O") == 2, "AI must block X's winning move"
    assert best_move(["X"] * 9, "O") is None, "no move on a full board"
    print("ok")
