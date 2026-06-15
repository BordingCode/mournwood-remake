#!/usr/bin/env python3
"""Scan assets/ for valid WebP files and write assets/manifest.json — the allow-list
the game uses to decide which art to load (everything else falls back). PIL-validates
each file so a half-written/corrupt image never ships. Run from repo root:

    python3 tools/build_manifest.py
"""
import os, json
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = os.path.join(ROOT, "assets")

ok = []
for dirpath, _dirs, files in os.walk(A):
    for f in files:
        low = f.lower()
        full = os.path.join(dirpath, f)
        rel = "assets/" + os.path.relpath(full, A).replace(os.sep, "/")
        try:
            if low.endswith(".svg"):
                txt = open(full).read(400)
                if "<svg" not in txt:
                    print("  skip (not svg):", rel); continue
                ok.append(rel)
            elif low.endswith(".webp"):
                if os.path.getsize(full) < 2000:
                    print("  skip (too small):", rel); continue
                Image.open(full).verify()
                ok.append(rel)
        except Exception as e:
            print("  skip (invalid):", rel, e)

ok.sort()
with open(os.path.join(A, "manifest.json"), "w") as fh:
    json.dump(ok, fh, indent=0)
print(f"manifest.json written: {len(ok)} assets")
