"""Vercel Python serverless function: Sudoku puzzle generator.

GET /api/sudoku?seed=<int optional>&difficulty=easy|medium|hard

Response JSON: { puzzle, solution, difficulty, seed }
  puzzle:   81-char string, row-major, '1'-'9' givens and '.' blanks
  solution: 81-char string, the unique completed grid
"""

import json
import os
import sys
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# Make the shared `games` package importable (repo root is this file's grandparent).
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from games.sudoku import generate  # noqa: E402


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        params = parse_qs(urlparse(self.path).query)
        difficulty = params.get("difficulty", ["medium"])[0]
        if difficulty not in ("easy", "medium", "hard"):
            difficulty = "medium"
        raw_seed = params.get("seed", [None])[0]
        try:
            seed = int(raw_seed) if raw_seed is not None else None
        except ValueError:
            seed = None

        result = generate(seed=seed, difficulty=difficulty)
        payload = json.dumps(result).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(payload)
