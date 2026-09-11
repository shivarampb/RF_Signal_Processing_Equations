# RF Signal Processing, and Inside the ADC

Two self-contained presentations, each with a PowerPoint deck and a matching interactive web app:

| Talk | Deck | App | Covers |
|---|---|---|---|
| **RF Signal Processing** | `presentation/RF_Signal_Processing.pptx` (51 slides) | `app/index.html` | Antenna to bits: waves, dB, I/Q, sampling, the ADC, the FFT and IFFT |
| **Inside the ADC** | `presentation/ADC_Parameters.pptx` (58 slides) | `app/adc.html` | Every parameter a datasheet quotes, one slide and one lab each |

---

# RF Signal Processing: how a radio wave becomes numbers

A 90-minute presentation for a mixed audience of RF engineers and complete newcomers.
Every content slide follows the same recipe:

1. a picture or a native chart,
2. the idea in plain words,
3. an everyday comparison (**Think of it like this**),
4. a small **Example** with real numbers (Wi-Fi, CD audio, a phone, a datasheet),
5. and only then the equation.

Expert-level detail is not on the slides. It lives in the speaker notes of each slide and in five
appendix slides at the end, so the RF engineers still get the derivations and trade-offs.

There is also an **interactive web app**, `app/`, where every idea in the talk becomes a slider you
can move: change the sample rate and watch a wave get disguised, step a SAR converter one clock tick
at a time, switch off an FFT bucket and see the hum disappear. Open `app/index.html` in any browser,
or run it during the talk instead of clicking through slides.

**Six interface themes**, switchable from the swatches at the top of the sidebar (or the <kbd>T</kbd> key):

| Theme | Character |
|---|---|
| Instrument lab | Calibration blue on paper. The only theme that follows the device's light or dark setting |
| Benchtop | The front panel of a rack instrument: square corners, dense rows, phosphor green |
| Studio | Bone and charcoal chrome with generous spacing, so the only colour on screen is data |
| Blueprint | A drawing sheet: navy ground, a real grid behind the page, condensed drafting labels |
| Daylight | Biggest type, roundest corners, most air. Easiest to read from the back of a room |
| Chalkboard | The lecture-room look: green board, chalk yellow, handwritten headings |

**Built for presenting**: <kbd>P</kbd> enters presentation mode (sidebar hidden, type enlarged),
<kbd>←</kbd> <kbd>→</kbd> move between labs, and a ▶ button beside the important sliders sweeps them
end to end on their own so the room can watch the effect rather than watch you drag.

| File | What it is |
|---|---|
| `app/index.html` | **The interactive app**: 13 labs and a quiz, everything computed live in the browser. Open it directly — no server, no build, no dependencies |
| `app/rf-signal-lab.html` | Source of the app (page body only, the form the artifact host expects) |
| `app/build_standalone.js` | Wraps that source into the standalone `app/index.html` |
| `presentation/RF_Signal_Processing.pptx` | The deck: 51 slides (45 presented + 5 appendix + closing), speaker notes on every slide, 23 native editable PowerPoint charts |
| `presentation/outline.md` | Slide-by-slide outline: bullets, analogies, examples, equations, expert notes, speaker notes, timing |
| `src/content.js` | Single source of truth for all slide text. Edit here, then rebuild both outputs |
| `src/dsp.js` | Dependency-free DSP maths that generates every chart: sampling, quantiser, SAR, DFT, FFT, IFFT, Hann window, OFDM |
| `src/build_deck.js` | pptxgenjs generator (layouts, charts, diagrams, notes) |
| `src/diagrams.js` | Shape-drawn diagrams: receive chain, ADC blocks, sample-and-hold, flash ADC, butterfly, 8-point FFT, OFDM chain |
| `src/theme.js` | Palette, fonts, chart defaults, slide scaffolds, analogy and example cards |
| `src/build_outline.js` | Generates `presentation/outline.md` from `content.js` |

No Python is used anywhere. All figures are real PowerPoint charts whose data is computed in
JavaScript at build time, so they can be restyled or inspected inside PowerPoint.

## Rebuild

```bash
npm install            # installs pptxgenjs only
npm run check          # DSP self-checks: FFT = DFT, IFFT round trip, SNR(12 bit) = 74 dB, bucket arithmetic
npm run check-adc      # ADC self-checks: DNL/INL, SNR, ENOB, harmonics, jitter, settling, figures of merit
npm run outline        # writes presentation/outline.md
npm run build          # writes presentation/RF_Signal_Processing.pptx
npm run build-adc      # writes presentation/ADC_Parameters.pptx
npm run app            # writes both app/index.html and app/adc.html
```

The app needs nothing installed: it is one self-contained HTML file. `npm install` is only for
rebuilding the PowerPoint deck.

## The interactive labs

| # | Lab | What you can play with |
|---:|---|---|
| 1 | The wave | Height, frequency and starting point of a sine wave |
| 2 | Decibels | Transmit power and a chain of gains and losses, in dBm |
| 3 | I and Q | Drag the (I, Q) point, or pick a QPSK symbol, and watch the wave it makes |
| 4 | Noise & link budget | Distance, band, channel width, noise figure → does the link close? |
| 5 | Sampling & aliasing | Wave frequency against sample rate; watch a fast tone disguise itself |
| 6 | Quantisation & bits | Bits and signal height; the staircase, the error, and the measured SNR |
| 7 | SAR: the guessing game | Step the converter one clock tick at a time and watch the bits land |
| 8 | Timing wobble | Input frequency against clock jitter; how many bits survive |
| 9 | FFT explorer | Two tones plus hiss, record length, and the Hann window |
| 10 | Why the FFT is fast | Slide N and compare N² against (N/2)·log₂N |
| 11 | IFFT: build a filter | Switch FFT buckets off and watch the hum vanish from the rebuilt signal |
| 12 | OFDM in Wi-Fi | Subcarrier count; the transmitted waveform and the recovered symbols |
| 13 | Design calculator | A whole receiver: frequency, sample rate, bits, FFT size, jitter |

Every chart is drawn from the same FFT, quantiser and SAR code in `src/dsp.js` that generated the
slide deck, so the app and the slides can never disagree.

## Talk structure (about 90 minutes)

| Part | Minutes | Content |
|---|---:|---|
| Opening | 6 | Agenda, outcomes, the receive chain, eight words we will use all the time |
| 1 · What an RF signal is | 15 | The fast wave and its three knobs, dB as counting zeros, putting information on the wave, I and Q, noise, link budget |
| 2 · Sampling | 12 | Readings every T_s, "twice the highest frequency", the anti-alias bouncer, redrawing the wave |
| 3 · Inside the ADC | 20 | Hold, compare, write down; sample-and-hold; timing wobble; the ruler with 2ᴺ marks; 6 dB per bit; flash, SAR and sigma-delta; reading a datasheet |
| 4 · FFT and IFFT | 25 | Why frequencies, one idea three versions, what k, n and N mean, comparing with test waves, the butterfly, an 8-point FFT, windowing, IFFT |
| 5 · Putting it together | 12 | One complete example (2.4 GHz tone to FFT bucket 256), Wi-Fi and 5G, five classic mistakes, the equation sheet |
| Appendix | 0 | Expert notes collected by topic; not presented |

---

# Inside the ADC: every parameter on the datasheet

A 90-minute companion talk that takes the one component the first talk treats as a black box and
opens it up. Each parameter gets the same treatment: what it means in plain words, the equation, a
chart, a real number, and what goes wrong when you ignore it.

**Deck:** `presentation/ADC_Parameters.pptx` — 58 slides, speaker notes on every slide, 35 native
editable charts, 7 tables and shape-drawn diagrams.
**App:** `app/adc.html` — 12 labs plus a searchable reference to all 49 parameters.

| Part | Minutes | Parameters covered |
|---|---:|---|
| Opening | 4 | What an ADC does; the parameter map: five families |
| 1 · Resolution and the transfer function | 12 | Resolution, full-scale range, LSB, quantisation error, output coding, reference and its drift |
| 2 · Static accuracy (DC) | 16 | Offset, gain, DNL, missing codes, monotonicity, INL, TUE, temperature drift, PSRR, CMRR |
| 3 · Dynamic performance (AC) | 20 | SNR, input-referred noise, noise-free bits, THD, HD2/HD3, SINAD, ENOB, SFDR, IMD, FFT noise floor, dynamic range |
| 4 · Speed and timing | 14 | Sample rate, conversion time, latency, aperture delay, aperture jitter, acquisition, settling, slew rate, overvoltage recovery |
| 5 · Bandwidth and sampling | 10 | Analog bandwidth, full-power and full-linear bandwidth, undersampling, Nyquist zones, oversampling ratio, decimation |
| 6 · Power, interface and figures of merit | 8 | Power dissipation, Walden FoM, Schreier FoM, crosstalk, digital interface |
| 7 · Architectures and the datasheet | 12 | Flash, SAR, pipeline, delta-sigma, dual-slope; how to read a datasheet in the right order; a worked choice |

## The ADC labs

| # | Lab | What you can play with |
|---:|---|---|
| 1 | Transfer function | Bend one staircase with offset, gain, DNL and INL; missing codes, monotonicity and TUE decide themselves |
| 2 | Quantisation & SNR | Bits and amplitude against the measured SNR, and where 6.02N + 1.76 comes from |
| 3 | Noise & real bits | Input-referred noise, noise-free bits, effective resolution |
| 4 | Spectrum | One capture; SNR, THD, SINAD, ENOB and SFDR all measured live as you add distortion, noise and jitter |
| 5 | Aperture jitter | Input frequency against clock jitter, and the bits that survive |
| 6 | Acquisition & settling | The bandwidth your driving amplifier must actually have |
| 7 | Bandwidth & Nyquist zones | Where a tone lands when you undersample, and whether the front end can reach it |
| 8 | Oversampling | OSR and noise shaping against dynamic range |
| 9 | Power & figures of merit | Walden and Schreier, on your own numbers, against four reference parts |
| 10 | Which architecture? | Enter speed, resolution and latency; see which of the five survive |
| 11 | Every parameter | All 49, searchable, with symbol, unit, meaning and why it matters |
| 12 | Quiz | Eight questions with the reasoning and a link to the lab |

`src/adc.js` holds the maths for both — transfer functions with real static errors, DNL and INL,
coherent-sampling FFT metrics, jitter, settling and both figures of merit — with 14 self-checks
(`npm run check-adc`) that pin it to known values: 12-bit SNR of 74.0 dB, an injected −60 dBc
harmonic measured back at −60 dBc, and a −1 LSB DNL step reported as a missing code.

## Presenting tips

- Dark slides are section openers, recaps and the appendix; white slides carry content.
- If the room is mostly beginners, lean on the teal "Think of it like this" cards and the examples; skip the equations' captions.
- If the room is mostly engineers, the speaker notes hold a "For the experts" paragraph on every slide, and the appendix collects them.
- Slide 45 (the equation sheet) is the one to leave on screen during questions.
