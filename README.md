# RF Signal Processing: equations, ADC internals, FFT and IFFT

A 90-minute presentation for a mixed audience of RF engineers and newcomers. Every topic goes
intuition first, then the equation, then an *expert corner* with the deeper detail. Each part ends
with a recap slide so newcomers can check they are still following.

| File | What it is |
|---|---|
| `presentation/RF_Signal_Processing.pptx` | The deck: 44 slides, speaker notes on every slide, 23 native (editable) PowerPoint charts |
| `presentation/outline.md` | Slide-by-slide outline: bullets, equations, expert corners, speaker notes, timing |
| `src/content.js` | Single source of truth for all slide text. Edit here, then rebuild both outputs |
| `src/dsp.js` | Dependency-free DSP maths that generates every chart: sampling, quantiser, SAR, DFT, FFT, IFFT, Hann window, OFDM |
| `src/build_deck.js` | pptxgenjs generator (layouts, charts, diagrams, notes) |
| `src/diagrams.js` | Shape-drawn diagrams: receive chain, ADC blocks, sample-and-hold, flash ADC, butterfly, 8-point FFT, OFDM chain |
| `src/theme.js` | Palette, fonts, chart defaults, slide scaffolds |
| `src/build_outline.js` | Generates `presentation/outline.md` from `content.js` |

No Python is used anywhere. All figures are real PowerPoint charts whose data is computed in
JavaScript at build time, so they can be restyled or inspected inside PowerPoint.

## Rebuild

```bash
npm install            # installs pptxgenjs only
npm run check          # DSP self-checks: FFT = DFT, IFFT round trip, SNR(12 bit) = 74 dB, bin arithmetic
node src/build_outline.js
npm run build          # writes presentation/RF_Signal_Processing.pptx
```

## Talk structure (about 90 minutes)

| Part | Minutes | Content |
|---|---:|---|
| Opening | 5 | Agenda, outcomes, the receive chain (antenna → LNA → mixer → filter → ADC → DSP) |
| 1 · RF fundamentals | 15 | `A cos(2πft + φ)`, dB and dBm, modulation as `I cos ωt − Q sin ωt`, complex baseband, thermal noise and Friis, link budget |
| 2 · Sampling | 12 | `x[n] = x(nT_s)`, Nyquist and aliasing, anti-alias filter and bandpass sampling, sinc reconstruction |
| 3 · Inside the ADC | 20 | Sample-and-hold and aperture jitter, quantisation and `LSB²/12`, derivation of `6.02N + 1.76 dB`, flash, SAR, sigma-delta, datasheet terms |
| 4 · DFT, FFT, IFFT | 25 | Fourier lineage, `X[k] = Σ x[n] e^{−j2πkn/N}`, bins and resolution, DFT as correlation, butterfly and `(N/2) log₂N`, 8-point FFT walkthrough, windowing, IFFT |
| 5 · Putting it together | 13 | Worked example (2.4 GHz → 10 MHz IF → 40 MSPS, 12 bit → 1024-point FFT → bin 256), OFDM, five classic mistakes, equation sheet |

## Presenting tips

- Dark slides are section openers and recaps; white slides carry content.
- The amber ★ boxes are the expert corners. Skip them when the room is mostly beginners.
- Slide 43 (the equation sheet) is the one to leave on screen during questions.
- Speaker notes contain a beginner analogy and an expert aside for every slide.
