"""Vercel Python serverless function: Tic-Tac-Toe AI move.

GET /api/tic-tac-toe?board=XO---X---&ai=O
  board: 9 chars, one per cell (0-8, row-major); X / O / any other char = empty
  ai:    which mark the AI plays (default O)

Response JSON: { move, winner, done, board }
  move:   index 0-8 the AI plays, or null if the game is already over
  winner: "X" | "O" | null
  done:   true if the game is over after the AI's move
"""

import json
import os
import sys
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# Make the shared `games` package importable (repo root is this file's grandparent).
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from games.tic_tac_toe import move as ai_move, winner, is_full  # noqa: E402


def _decode(raw: str) -> list[str]:
    cells = list((raw or "").ljust(9)[:9])
    return [c if c in ("X", "O") else "" for c in cells]


def compute(board_raw: str, ai: str, level: str = "hard") -> dict:
    board = _decode(board_raw)
    ai = ai if ai in ("X", "O") else "O"
    level = level if level in ("easy", "medium", "hard") else "hard"
    move = ai_move(board, ai, level)
    if move is not None:
        board[move] = ai
    return {
        "move": move,
        "winner": winner(board),
        "done": winner(board) is not None or is_full(board),
        "board": "".join(c or "-" for c in board),
    }


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        params = parse_qs(urlparse(self.path).query)
        result = compute(
            params.get("board", [""])[0],
            params.get("ai", ["O"])[0],
            params.get("level", ["hard"])[0],
        )
        payload = json.dumps(result).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(payload)
