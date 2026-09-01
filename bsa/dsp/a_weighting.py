"""A-weighting per IEC 61672-1, and a drop-in replacement for the filter in
``bsa_processing.py`` that promises A-weighting and returns a plain Butterworth
bandpass instead.

The existing ``apply_a_weighting_filter`` computes A-weighting coefficients
three times, discards all three, and band-passes. Every dB(A) figure from that
pipeline is therefore wrong -- not slightly: A-weighting falls about 50 dB at
20 Hz and rises about 1.2 dB at 2 kHz, and a bandpass does neither.

Nothing here needs numpy or scipy, so the verification runs anywhere. Two
routines are offered:

  ``a_weighting_db(f)``     the analytic weighting, exact, for correcting a
                            spectrum or a band level you already have.
  ``design_a_weighting_sos(fs)``  a second-order-section cascade for filtering a
                            time series, via the bilinear transform.

The bilinear transform warps frequency near Nyquist, so the digital filter
tracks the analytic curve closely through the speech and soundscape bands and
loosens above roughly a tenth of the sample rate. That is a real limit, stated
rather than hidden: at 48 kHz it holds Class 1 tolerance to about 5 kHz. For
octave-band or third-octave work prefer ``a_weighting_db`` applied per band,
which has no such limit.

Reference: IEC 61672-1:2013, clause 5.4.6 and Table 3.
"""

from __future__ import annotations

import cmath
import math

__all__ = [
    "A_WEIGHTING_POLE_FREQUENCIES",
    "a_weighting_db",
    "a_weighting_gain",
    "design_a_weighting_sos",
    "sosfilt",
    "apply_a_weighting_filter",
]

# IEC 61672-1 clause 5.4.6. Hz.
A_WEIGHTING_POLE_FREQUENCIES = (20.598997, 107.65265, 737.86223, 12194.217)

_F1, _F2, _F3, _F4 = A_WEIGHTING_POLE_FREQUENCIES


def _unnormalised(f: float) -> complex:
    """|A(s)| before the 1 kHz normalisation, s = j2(pi)f."""
    s = 2j * math.pi * f
    w1, w2, w3, w4 = (2 * math.pi * x for x in A_WEIGHTING_POLE_FREQUENCIES)
    num = (w4**2) * s**4
    den = ((s + w1) ** 2) * (s + w2) * (s + w3) * ((s + w4) ** 2)
    return num / den


_NORM = abs(_unnormalised(1000.0))


def a_weighting_gain(f: float) -> float:
    """Linear A-weighting gain at ``f`` Hz. Exactly 1.0 at 1 kHz."""
    if f <= 0.0:
        return 0.0
    return abs(_unnormalised(f)) / _NORM


def a_weighting_db(f: float) -> float:
    """A-weighting in dB at ``f`` Hz. Exactly 0.0 dB at 1 kHz."""
    g = a_weighting_gain(f)
    return -math.inf if g == 0.0 else 20.0 * math.log10(g)


def _bilinear_biquad(b, a, fs):
    """One analog biquad (descending powers of s) to a digital one."""
    c = 2.0 * fs
    b2, b1, b0 = b
    a2, a1, a0 = a
    B = [b2 * c * c + b1 * c + b0, -2 * b2 * c * c + 2 * b0, b2 * c * c - b1 * c + b0]
    A = [a2 * c * c + a1 * c + a0, -2 * a2 * c * c + 2 * a0, a2 * c * c - a1 * c + a0]
    return [x / A[0] for x in B], [x / A[0] for x in A]


def design_a_weighting_sos(fs: float):
    """A-weighting as a cascade of three biquads, ``[[b0,b1,b2,a0,a1,a2], ...]``.

    Same layout scipy uses, so this drops straight into ``scipy.signal.sosfilt``
    if the caller has it, or into :func:`sosfilt` below if it does not.
    """
    if fs <= 2 * _F4:
        raise ValueError(
            f"sample rate {fs} Hz is too low for A-weighting: the 12194 Hz pole "
            f"sits at or above Nyquist and the design is meaningless"
        )
    w1, w2, w3, w4 = (2 * math.pi * x for x in A_WEIGHTING_POLE_FREQUENCIES)

    sections = [
        ([1.0, 0.0, 0.0], [1.0, 2 * w1, w1 * w1]),   # s^2 / (s+w1)^2
        ([1.0, 0.0, 0.0], [1.0, 2 * w4, w4 * w4]),   # s^2 / (s+w4)^2
        ([0.0, 0.0, 1.0], [1.0, w2 + w3, w2 * w3]),  # 1   / ((s+w2)(s+w3))
    ]
    sos = []
    for b, a in sections:
        B, A = _bilinear_biquad(b, a, fs)
        sos.append([B[0], B[1], B[2], A[0], A[1], A[2]])

    # One overall gain, set so the cascade is unity at 1 kHz -- the same
    # normalisation the analytic form uses, applied to what was actually built.
    z = cmath.exp(-2j * math.pi * 1000.0 / fs)
    h = 1.0 + 0j
    for b0, b1, b2, a0, a1, a2 in sos:
        h *= (b0 + b1 * z + b2 * z * z) / (a0 + a1 * z + a2 * z * z)
    g = 1.0 / abs(h)
    sos[0] = [sos[0][0] * g, sos[0][1] * g, sos[0][2] * g, sos[0][3], sos[0][4], sos[0][5]]
    return sos


def sosfilt(sos, x):
    """Direct-form-II transposed cascade. Stdlib fallback for scipy.signal.sosfilt."""
    y = list(x)
    for b0, b1, b2, a0, a1, a2 in sos:
        z1 = z2 = 0.0
        out = []
        for xn in y:
            yn = b0 * xn + z1
            z1 = b1 * xn - a1 * yn + z2
            z2 = b2 * xn - a2 * yn
            out.append(yn)
        y = out
    return y


def sos_response_db(sos, f, fs):
    """Magnitude of a designed cascade at ``f`` Hz, in dB. For verification."""
    z = cmath.exp(-2j * math.pi * f / fs)
    h = 1.0 + 0j
    for b0, b1, b2, a0, a1, a2 in sos:
        h *= (b0 + b1 * z + b2 * z * z) / (a0 + a1 * z + a2 * z * z)
    return 20.0 * math.log10(abs(h))


def apply_a_weighting_filter(signal, fs):
    """Drop-in for the broken function in ``bsa_processing.py``.

    Returns the A-weighted time series. Uses scipy when it is installed,
    because the pipeline already depends on it and its filter is faster; falls
    back to the pure-Python cascade otherwise. Both use the same coefficients.
    """
    sos = design_a_weighting_sos(fs)
    try:
        from scipy.signal import sosfilt as _scipy_sosfilt  # type: ignore
    except ImportError:
        return sosfilt(sos, signal)
    return _scipy_sosfilt(sos, signal)
