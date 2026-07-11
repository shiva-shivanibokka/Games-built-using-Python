"""Vercel Python serverless function: Lights Out board generator.

GET /api/lights-out?seed=<int optional>&size=<int optional>

Response JSON: { size, board, solution, seed }
  board:    length size*size list of 0/1 (1 = light ON), row-major starting position
  solution: length size*size list of 0/1 press pattern that turns every light off
"""

import json
import os
import sys
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# Make the shared `games` package importable (repo root is this file's grandparent).
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from games.lights_out import generate  # noqa: E402


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        params = parse_qs(urlparse(self.path).query)
        raw_seed = params.get("seed", [None])[0]
        try:
            seed = int(raw_seed) if raw_seed is not None else None
        except ValueError:
            seed = None
        try:
            size = int(params.get("size", ["5"])[0])
        except ValueError:
            size = 5
        if size < 2 or size > 10:
            size = 5

        result = generate(seed=seed, size=size)
        payload = json.dumps(result).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(payload)
