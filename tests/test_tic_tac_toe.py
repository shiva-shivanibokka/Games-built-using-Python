"""The AI must be unbeatable: exhaustively play every game where the human
tries every move, and assert the AI (O) never loses."""

from games.tic_tac_toe import best_move, winner, is_full


def _play_out(board: list[str], human: str, ai: str, to_move: str) -> None:
    w = winner(board)
    if w is not None:
        assert w != human, f"AI lost from {board}"
        return
    if is_full(board):
        return
    if to_move == ai:
        board[best_move(board, ai)] = ai
        _play_out(board, human, ai, human)
    else:
        for i in range(9):
            if not board[i]:
                board[i] = human
                _play_out(board, human, ai, ai)
                board[i] = ""


def test_ai_never_loses_going_first():
    _play_out([""] * 9, human="X", ai="O", to_move="O")


def test_ai_never_loses_going_second():
    _play_out([""] * 9, human="X", ai="O", to_move="X")


def test_takes_immediate_win():
    assert best_move(["O", "O", "", "X", "X", "", "", "", ""], "O") == 2


def test_blocks_immediate_loss():
    assert best_move(["X", "X", "", "O", "", "", "", "", ""], "O") == 2
