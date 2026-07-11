"""Vercel Python serverless function: Queens puzzle generator.

GET /api/queens?seed=<int optional>&size=<int optional>

Response JSON: { size, regions, solution, seed }
  regions:  length size*size list of region ids (0..size-1), row-major
  solution: list of [row, col] crown positions (one per row)
"""

import json
import os
import sys
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# Make the shared `games` package importable (repo root is this file's grandparent).
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from games.queens import generate  # noqa: E402


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        params = parse_qs(urlparse(self.path).query)
        raw_seed = params.get("seed", [None])[0]
        try:
            seed = int(raw_seed) if raw_seed is not None else None
        except ValueError:
            seed = None
        try:
            size = int(params.get("size", ["8"])[0])
        except ValueError:
            size = 8
        if size < 4 or size > 12:
            size = 8

        result = generate(seed=seed, size=size)
        payload = json.dumps(result).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(payload)
