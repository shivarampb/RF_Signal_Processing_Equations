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
npm run outline        # writes presentation/outline.md
npm run build          # writes presentation/RF_Signal_Processing.pptx
npm run app            # writes app/index.html from app/rf-signal-lab.html
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

## Presenting tips

- Dark slides are section openers, recaps and the appendix; white slides carry content.
- If the room is mostly beginners, lean on the teal "Think of it like this" cards and the examples; skip the equations' captions.
- If the room is mostly engineers, the speaker notes hold a "For the experts" paragraph on every slide, and the appendix collects them.
- Slide 45 (the equation sheet) is the one to leave on screen during questions.
