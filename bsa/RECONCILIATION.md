# BSA notation app — reconciliation

Four builds, one backend, and the versions disagree with each other. This
directory holds the decision about which side of each disagreement wins, a
check that reads the builds and reports whether it held, and the one backend
fix that could be closed without the files.

## What is here

| Path | What it is |
| --- | --- |
| `reconciliation.json` | The contract. Canonical base, four divergences with resolutions, ten rows of the definition of done. Declared data, never inferred at runtime. |
| `../scripts/bsa-reconcile.mjs` | Reads a directory of builds, extracts what each actually does, reports divergences, runs the automated rows. |
| `../test/bsa-reconcile.test.mjs` | Proves the extractor discriminates, on fixtures, before the real files arrive. |
| `dsp/a_weighting.py` | Correct IEC 61672-1 A-weighting. Drop-in for `apply_a_weighting_filter`. |
| `dsp/test_a_weighting.py` | Verifies it against IEC 61672-1 Table 3. 34 bands, worst deviation 0.05 dB. |

## Running it

```sh
mkdir -p bsa/builds                 # then put the four .html builds in it
npm run bsa:reconcile               # or: -- --dir <path> --canonical <file>
python3 bsa/dsp/test_a_weighting.py
npm test                            # includes the extractor's own tests
```

With no builds present the check says so and exits 2. A check with nothing to
check is not a pass.

## The decisions

**Canonical base: `BSA_App_v2.html`.** Eight symbols matching the published
copy, the interval map the pedagogy requires, the only holder of the Pulse Map
and the Archive, and the only build already honest about itself.

**Symbols are keyed on intervals, not absolute pitch.** The Translators map C to
Adinkrahene always; the App and v2 map relative to the tonic. The builds' own
pedagogy text settles it — *the Adinkra system centers on relationships
(intervals) rather than absolute pitches* — and so does transposition: move a
melody and the Adinkra reading has to survive. Under a pitch-class map it does
not. The Translators' table is dropped, not merged.

**Eight symbols, not six.** Including Akoma Ntoso and Boa Me, matching the
website copy.

**No live-capture claim without a live capture.** v1.0 said *Simulated Live
Capture* over a `Math.sin` generator. v2.0 removed the fake exports and marked
its figures *not field data yet*. The newest Translator says *Live Audio
Capture — Real-Time Transcription… the app listens* over the same generator.
The label came off while the code stayed put, so restoring it is not new work.
The rule the checker enforces: a build may claim live capture only if it holds
a real input path (`getUserMedia`, `MediaRecorder`, `createMediaStreamSource`,
`AudioWorklet`), and a build that synthesises its signal must say so where the
signal is shown.

**Song Examples and the PreK–21 ladder come across** into the canonical file,
leaving the pitch-class map they currently sit beside behind.

## The A-weighting bug

`apply_a_weighting_filter` computed A-weighting coefficients three times, threw
all three away, and returned a plain Butterworth bandpass. The docstring
promised IEC 61672; the code did not deliver it, so every dB(A) figure out of
that pipeline is wrong — not marginally. A flat passband misses the standard's
own table by up to **70.4 dB** at the bottom of the range.

`dsp/a_weighting.py` replaces it, in pure stdlib so the verification runs
anywhere, using scipy's `sosfilt` when the pipeline's scipy is present.
Measured against IEC 61672-1:2013 Table 3:

- analytic weighting, all 34 third-octave bands: worst deviation **0.05 dB**
  (the table itself is printed to 0.1 dB)
- exactly 0.00 dB at 1 kHz
- bilinear IIR design at 48 kHz, 20 Hz–5 kHz: worst deviation **0.037 dB**
- the same design at 16 kHz is 6.4 dB off — bilinear warping near Nyquist is
  real, so the module says to weight per band with `a_weighting_db` up there
  rather than pretending the IIR holds
- a sample rate that puts the 12194 Hz pole above Nyquist is refused, not
  silently designed

Fix this before any number goes into the URACE paper or a grant.

## What is blocked, and on what

Two backend rows cannot be closed from a session that has not read the files:

- **DOD-9** — the setup guide's §4C tells you to run `bsa_schema.sql`, which is
  not in the project, so anyone following the guide stops there. Writing that
  schema means declaring the PostGIS tables `bsa_processing.py` writes to.
  Inventing them would be worse than leaving the gap.
- **DOD-10** — the psycopg2 parameter embedded inside a SQL string literal in
  the report generator. It needs the line.

One app row is not automatable as static text:

- **DOD-4** — transposition invariance. It wants a browser harness driving the
  real file: read a melody, transpose it by each of the twelve intervals,
  assert the Adinkra reading is unchanged. That is the check that would have
  caught the pitch-class map on its own, without anyone noticing the
  contradiction in the prose.

## What this session did not establish

Named plainly in `reconciliation.json` under `not_established_here`, so nothing
here gets mistaken for a reading of the files:

- the five symbol names beyond Adinkrahene, Akoma Ntoso and Boa Me
- which interval each symbol is assigned to
- the pedagogy text, the Song Examples and the PreK–21 ladder verbatim
- the PostGIS table definitions

The fixtures in `test/bsa-reconcile.test.mjs` use filler names drawn from the
general Adinkra vocabulary purely to exercise the counter. They are labelled as
such in the file. They are not a claim about the app.
