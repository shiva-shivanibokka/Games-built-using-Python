"""Vercel Python serverless function: Tango puzzle generator.

GET /api/tango?seed=<int optional>

Response JSON: { size, givens, edges, solution, seed }
  size:     6
  givens:   [{ r, c, val: "S"|"M" }]  pre-filled cells
  edges:    [{ r1, c1, r2, c2, type: "="|"x" }]  adjacency constraints
  solution: 36-char string, row-major 'S'/'M', the unique solved grid
"""

import json
import os
import sys
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# Make the shared `games` package importable (repo root is this file's grandparent).
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from games.tango import generate  # noqa: E402


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
