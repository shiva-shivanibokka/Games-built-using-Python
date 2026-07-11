"""Vercel Python serverless function: Wend puzzle generator.

GET /api/wend?seed=<int optional>

Response JSON: { size, walls, letters, words, solution, seed }
  size:     5
  walls:    7 [r, c] blocked cells
  letters:  5x5 grid of single uppercase letters ("" on walls)
  words:    the four solution words, sorted by length (3, 4, 5, 6)
  solution: four paths ([r, c] per letter), same order as words
"""

import json
import os
import sys
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# Make the shared `games` package importable (repo root is this file's grandparent).
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from games.wend import generate  # noqa: E402


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        params = parse_qs(urlparse(self.path).query)
        raw_seed = params.get("seed", [None])[0]
        try:
            seed = int(raw_seed) if raw_seed is not None else None
        except ValueError:
            seed = None

        result = generate(seed=seed)
        payload = json.dumps(result).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(payload)
