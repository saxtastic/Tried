#!/usr/bin/env python3
"""Render the ayeyoty.co venue mark to PNG.

No third-party dependencies: a signed-distance-field rasteriser plus a
minimal PNG encoder from the standard library. Geometry here is the same
geometry used by public/icons/favicon.svg and mask-icon.svg -- if you change
one, change both.

Usage:  python3 scripts/make-icons.py
"""

import math
import os
import struct
import zlib

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "icons")

BG_TOP = (0x14, 0x12, 0x1F)
BG_BOTTOM = (0x0B, 0x0C, 0x10)
GLYPH_TOP = (0xA7, 0x8B, 0xFA)
GLYPH_BOTTOM = (0x7C, 0x5C, 0xFF)


def write_png(path, size, pixels):
    """pixels: flat list of (r, g, b) tuples, row-major, length size*size."""
    raw = bytearray()
    for y in range(size):
        raw.append(0)  # filter type 0 (None)
        row = pixels[y * size:(y + 1) * size]
        for r, g, b in row:
            raw += bytes((r, g, b))

    def chunk(tag, data):
        return (struct.pack(">I", len(data)) + tag + data
                + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF))

    ihdr = struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0)  # 8-bit truecolour
    png = (b"\x89PNG\r\n\x1a\n"
           + chunk(b"IHDR", ihdr)
           + chunk(b"IDAT", zlib.compress(bytes(raw), 9))
           + chunk(b"IEND", b""))
    with open(path, "wb") as fh:
        fh.write(png)
    return len(png)


def sd_segment(px, py, ax, ay, bx, by):
    pax, pay = px - ax, py - ay
    bax, bay = bx - ax, by - ay
    denom = bax * bax + bay * bay
    h = 0.0 if denom == 0 else max(0.0, min(1.0, (pax * bax + pay * bay) / denom))
    dx, dy = pax - bax * h, pay - bay * h
    return math.hypot(dx, dy)


def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def render(size, content_scale=1.0):
    """Full-bleed background, arch glyph scaled by content_scale.

    content_scale < 1 reserves the maskable-icon safe zone.
    """
    s = float(size)
    c = s * content_scale
    cx = s / 2.0

    radius = 0.23 * c              # arch half-width == arc radius
    stroke = 0.10 * c
    y_arc = s / 2.0 - 0.16 * c     # arc centre
    y_foot = s / 2.0 + 0.20 * c    # where the legs stop
    y_base = s / 2.0 + 0.30 * c    # the floor line
    base_half = 0.40 * c
    base_stroke = 0.09 * c

    pixels = []
    for y in range(size):
        py = y + 0.5
        bg = lerp(BG_TOP, BG_BOTTOM, py / s)
        for x in range(size):
            px = x + 0.5

            # arch centreline: arc above y_arc, two legs below it
            d = min(
                sd_segment(px, py, cx - radius, y_arc, cx - radius, y_foot),
                sd_segment(px, py, cx + radius, y_arc, cx + radius, y_foot),
            )
            if py <= y_arc:
                d = min(d, abs(math.hypot(px - cx, py - y_arc) - radius))
            d -= stroke / 2.0

            # floor line
            d = min(d, sd_segment(px, py, cx - base_half, y_base, cx + base_half, y_base)
                    - base_stroke / 2.0)

            cov = max(0.0, min(1.0, 0.5 - d))
            if cov <= 0.0:
                pixels.append(bg)
            else:
                fg = lerp(GLYPH_TOP, GLYPH_BOTTOM, py / s)
                pixels.append(tuple(round(bg[i] + (fg[i] - bg[i]) * cov) for i in range(3)))
    return pixels


TARGETS = [
    ("apple-touch-icon.png", 180, 0.82),   # iOS / iPadOS Home Screen, macOS Dock
    ("icon-192.png", 192, 0.82),
    ("icon-512.png", 512, 0.82),
    ("icon-512-maskable.png", 512, 0.60),  # safe zone for maskable
]

if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for name, size, scale in TARGETS:
        n = write_png(os.path.join(OUT, name), size, render(size, scale))
        print("%-26s %4dpx  %6d bytes" % (name, size, n))
