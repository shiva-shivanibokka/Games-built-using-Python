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
        # Clamp to the range that generates quickly and reliably; larger boards
        # can exceed the serverless time budget or exhaust the generator's retries.
        size = max(4, min(9, size))

        # Generation can (rarely) exhaust its retry cap and raise; retry with a
        # fresh seed a few times, then fail gracefully instead of 500-ing hard.
        result = None
        for _ in range(4):
            try:
                result = generate(seed=seed, size=size)
                break
            except Exception:
                seed = None
        if result is None:
            body = json.dumps({"error": "could not generate a board, try again"}).encode()
            self.send_response(503)
            self.send_header("Content-Type", "application/json")
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(body)
            return

        payload = json.dumps(result).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(payload)
