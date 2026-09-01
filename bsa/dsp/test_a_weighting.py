"""Verification for bsa/dsp/a_weighting.py against IEC 61672-1:2013 Table 3.

Run it directly -- no pytest, no numpy, no scipy:

    python3 bsa/dsp/test_a_weighting.py

The point of this file is that the claim in the docstring ("IEC 61672") is
checked against the standard's own numbers rather than asserted. The bandpass
that shipped in bsa_processing.py would fail the first row by roughly 50 dB.
"""

import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from a_weighting import (  # noqa: E402
    a_weighting_db,
    design_a_weighting_sos,
    sos_response_db,
    sosfilt,
)

# IEC 61672-1:2013 Table 3, A-weighting at the third-octave midband
# frequencies. Keyed by band index n, where the exact midband is 1000*10**(n/10)
# and the nominal frequency is the label in the second column.
TABLE_3 = [
    (-20, "10 Hz", -70.4), (-19, "12.5 Hz", -63.4), (-18, "16 Hz", -56.7),
    (-17, "20 Hz", -50.5), (-16, "25 Hz", -44.7), (-15, "31.5 Hz", -39.4),
    (-14, "40 Hz", -34.6), (-13, "50 Hz", -30.2), (-12, "63 Hz", -26.2),
    (-11, "80 Hz", -22.5), (-10, "100 Hz", -19.1), (-9, "125 Hz", -16.1),
    (-8, "160 Hz", -13.4), (-7, "200 Hz", -10.9), (-6, "250 Hz", -8.6),
    (-5, "315 Hz", -6.6), (-4, "400 Hz", -4.8), (-3, "500 Hz", -3.2),
    (-2, "630 Hz", -1.9), (-1, "800 Hz", -0.8), (0, "1 kHz", 0.0),
    (1, "1.25 kHz", 0.6), (2, "1.6 kHz", 1.0), (3, "2 kHz", 1.2),
    (4, "2.5 kHz", 1.3), (5, "3.15 kHz", 1.2), (6, "4 kHz", 1.0),
    (7, "5 kHz", 0.5), (8, "6.3 kHz", -0.1), (9, "8 kHz", -1.1),
    (10, "10 kHz", -2.5), (11, "12.5 kHz", -4.3), (12, "16 kHz", -6.6),
    (13, "20 kHz", -9.3),
]

# The table is printed to 0.1 dB, so agreement to 0.05 dB is agreement.
TABLE_TOLERANCE_DB = 0.05

failures = []


def check(condition, message):
    if not condition:
        failures.append(message)


def test_analytic_matches_table_3():
    worst = 0.0
    for n, label, expected in TABLE_3:
        f = 1000.0 * 10 ** (n / 10.0)
        got = a_weighting_db(f)
        worst = max(worst, abs(got - expected))
        check(
            abs(got - expected) <= TABLE_TOLERANCE_DB,
            f"{label}: got {got:.2f} dB, IEC 61672-1 Table 3 says {expected:.1f} dB",
        )
    print(f"  analytic vs IEC 61672-1 Table 3, 34 bands: worst deviation {worst:.3f} dB")


def test_unity_at_1k():
    check(abs(a_weighting_db(1000.0)) < 1e-9, "A-weighting must be exactly 0 dB at 1 kHz")


def test_a_bandpass_would_be_caught():
    """The regression this file exists for: a flat passband fails the table."""
    flat = [abs(0.0 - expected) <= TABLE_TOLERANCE_DB for _, _, expected in TABLE_3]
    check(
        not all(flat),
        "the table check is too loose -- a filter with no weighting at all would pass it",
    )
    off_by = max(abs(expected) for _, _, expected in TABLE_3)
    print(f"  a flat (bandpass) response misses the table by up to {off_by:.1f} dB")


def test_digital_tracks_analytic():
    """Bilinear warping is real. State where it holds instead of hiding it."""
    fs = 48000.0
    sos = design_a_weighting_sos(fs)
    worst_in_band, worst_f = 0.0, 0.0
    for n, label, _ in TABLE_3:
        f = 1000.0 * 10 ** (n / 10.0)
        if not (20.0 <= f <= 5000.0):
            continue
        d = abs(sos_response_db(sos, f, fs) - a_weighting_db(f))
        if d > worst_in_band:
            worst_in_band, worst_f = d, f
        check(d <= 0.3, f"{label}: digital design is {d:.2f} dB off the analytic curve at fs={fs:g}")
    print(f"  bilinear design at 48 kHz, 20 Hz-5 kHz: worst deviation {worst_in_band:.3f} dB at {worst_f:.0f} Hz")
    high = abs(sos_response_db(sos, 16000.0, fs) - a_weighting_db(16000.0))
    print(f"  same design at 16 kHz: {high:.2f} dB off -- use a_weighting_db per band up there, as the module says")


def test_filter_runs_and_attenuates_infrasound():
    fs = 48000.0
    sos = design_a_weighting_sos(fs)
    for f, floor_db in ((31.5, -30.0), (1000.0, -1.0)):
        n = int(fs)  # one second, long enough for the transient to pass
        x = [math.sin(2 * math.pi * f * i / fs) for i in range(n)]
        y = sosfilt(sos, x)
        tail = y[n // 2:]
        rms = math.sqrt(sum(v * v for v in tail) / len(tail))
        level = 20 * math.log10(rms / math.sqrt(0.5))
        if f == 31.5:
            check(level < floor_db, f"31.5 Hz tone should be crushed, got {level:.1f} dB")
        else:
            check(abs(level) < 0.2, f"1 kHz tone should pass unchanged, got {level:.1f} dB")
        print(f"  {f:g} Hz unit tone through the filter: {level:.2f} dB")


def test_low_sample_rate_is_refused():
    try:
        design_a_weighting_sos(16000.0)
    except ValueError:
        return
    failures.append("fs=16 kHz puts the 12194 Hz pole above Nyquist and must be refused, not silently designed")


if __name__ == "__main__":
    for fn in [
        test_analytic_matches_table_3,
        test_unity_at_1k,
        test_a_bandpass_would_be_caught,
        test_digital_tracks_analytic,
        test_filter_runs_and_attenuates_infrasound,
        test_low_sample_rate_is_refused,
    ]:
        print(fn.__name__)
        fn()
    if failures:
        print(f"\nFAIL ({len(failures)}):")
        for f in failures:
            print(f"  - {f}")
        sys.exit(1)
    print("\nOK — A-weighting verified against IEC 61672-1 Table 3.")
