// Builds presentation/ADC_Parameters.pptx from src/adc_content.js.
// Every figure is a native PowerPoint chart or a shape diagram; the numbers come
// from src/adc.js, the same engine the interactive app uses.

const path = require('path');
const pptxgen = require('pptxgenjs');
const A = require('./adc');
const T = require('./theme');
const D = require('./diagrams');
const { PARTS, SLIDES, FAMILIES, ARCH, CHEATSHEET, CHECKLIST } = require('./adc_content');

const { C, F, W, H, M } = T;
const pres = new pptxgen();
pres.layout = 'LAYOUT_16x9';
pres.title = 'Inside the ADC: every parameter on the datasheet';
pres.subject = 'ADC parameters';
pres.company = 'RF_Signal_Processing_Equations';

const CT = pres.ChartType;
const TOP = 1.14;          // content top
const BAND_Y = 4.02;       // analogy / example band
const BAND_H = 1.12;
const LX = M, LW = 4.4;    // left column
const RX = 5.1, RW = 4.4;  // right column

/* ------------------------------------------------------------- chart helpers */

const lineChart = (slide, data, box, opts = {}) =>
  slide.addChart(CT.line, data, Object.assign({ x: box.x, y: box.y, w: box.w, h: box.h }, T.lineChart(data.length, opts)));
const barChart = (slide, data, box, opts = {}) =>
  slide.addChart(CT.bar, data, Object.assign({ x: box.x, y: box.y, w: box.w, h: box.h }, T.barChart(data.length, opts)));

const lab = (arr, d = 2) => arr.map((v) => T.fmt(v, d));
const seq = (n, f) => Array.from({ length: n }, (_, i) => f(i));

function table(slide, rows, box, opts = {}) {
  const cols = rows[0].length;
  const data = rows.map((r, ri) => r.map((cell) => ({
    text: String(cell),
    options: {
      bold: ri === 0 && !opts.noHeader,
      color: ri === 0 && !opts.noHeader ? C.white : opts.dark ? C.white : C.ink,
      fill: { color: ri === 0 && !opts.noHeader ? C.navy : opts.dark ? C.tintDark : ri % 2 ? C.tint : C.white },
      fontFace: F.body, fontSize: opts.fontSize || 10, valign: 'middle',
    },
  })));
  if (opts.mathCol !== undefined) data.forEach((r, ri) => { if (ri > 0 || opts.noHeader) r[opts.mathCol].options.fontFace = F.math; });
  slide.addTable(data, {
    x: box.x, y: box.y, w: box.w, colW: opts.colW,
    rowH: opts.rowH || (box.h ? box.h / rows.length : undefined),
    border: { type: 'solid', pt: 0.5, color: opts.dark ? C.navy : C.grid },
    margin: 0.05, fontFace: F.body, autoPage: false,
  });
}

/** A spectrum plot from a capture, with the tone bin marked. */
function spectrum(slide, box, cap, m, opts = {}) {
  const r = A.acMetrics(cap, m, { amp: opts.amp || 0.9 });
  const N = cap.length, keep = Math.min(N / 2, opts.bins || 512);
  const xs = seq(keep, (k) => (k * (opts.fs || 1)) / N);
  lineChart(slide, T.series(lab(xs, 2), [opts.label || 'spectrum (dBFS)', r.spectrumDb.slice(0, keep)]),
    box, Object.assign({
      valAxisMinVal: opts.valAxisMinVal || -130, valAxisMaxVal: 5, valAxisMajorUnit: opts.step || 25,
      catAxisLabelFrequency: Math.round(keep / 8),
      showCatAxisTitle: true, catAxisTitle: opts.xlabel || 'frequency (fraction of f_s)',
      chartColors: [C.teal], lineSize: 1.25,
    }, opts.chart || {}));
  return r;
}

/* ------------------------------------------------------------------- charts */

const CHARTS = {
  blocks: (s, b) => D.adcBlocks(s, { x: b.x, y: b.y - 0.05, w: b.w, h: b.h }),

  resolution: (s, b) => {
    const bits = [8, 10, 12, 14, 16, 18, 20, 24];
    barChart(s, T.series(bits.map(String), ['ideal SNR (dB)', bits.map(A.idealSnr)]), b, {
      showCatAxisTitle: true, catAxisTitle: 'resolution N (bits)', valAxisHidden: false,
      valAxisMajorUnit: 40, dataLabelFormatCode: '0"dB"', chartColors: [C.teal],
    });
  },

  clipping: (s, b) => {
    const t = seq(200, (i) => i / 199);
    const clean = t.map((v) => 0.9 * Math.sin(2 * Math.PI * 2 * v));
    const clipped = t.map((v) => Math.max(-1, Math.min(1, 1.35 * Math.sin(2 * Math.PI * 2 * v))));
    lineChart(s, T.series(lab(t, 2), ['0.9 × full scale: clean', clean], ['1.35 × full scale: clipped', clipped]), b, {
      valAxisMinVal: -1.5, valAxisMaxVal: 1.5, valAxisMajorUnit: 0.5, catAxisLabelFrequency: 25,
      showCatAxisTitle: true, catAxisTitle: 'time  ·  dashed limits are ±full scale',
      chartColors: [C.teal, C.coral],
    });
  },

  staircase: (s, b) => {
    const v = seq(201, (i) => -1 + (2 * i) / 200);
    lineChart(s, T.series(lab(v, 2), ['input', v], ['3-bit output', v.map((x) => A.quantize(x, 3))]), b, {
      valAxisMinVal: -1, valAxisMaxVal: 1, valAxisMajorUnit: 0.5, catAxisLabelFrequency: 25,
      showCatAxisTitle: true, catAxisTitle: 'input (V) · 2 V range, LSB = 250 mV',
      chartColors: [C.slate, C.teal],
    });
  },

  qerror: (s, b) => {
    const v = seq(201, (i) => -1 + (2 * i) / 200);
    const q = A.lsb(4, 2);
    lineChart(s, T.series(lab(v, 2), ['error (LSB)', v.map((x) => (x - A.quantize(x, 4)) / q)]), b, {
      valAxisMinVal: -0.6, valAxisMaxVal: 0.6, valAxisMajorUnit: 0.25, valAxisLabelFormatCode: '0.00',
      catAxisLabelFrequency: 25, showCatAxisTitle: true,
      catAxisTitle: 'input (V) · error never leaves ±½ LSB', chartColors: [C.coral],
    });
  },

  coding: (s, b) => table(s, [
    ['Input', 'Straight binary', 'Two’s complement'],
    ['+ full scale', '1111 1111', '0111 1111'],
    ['mid-scale', '1000 0000', '0000 0000'],
    ['− full scale', '0000 0000', '1000 0000'],
  ], b, { fontSize: 10.5, rowH: 0.33, colW: [1.3, 1.55, 1.55] }),

  vref: (s, b) => {
    const dT = seq(14, (i) => -40 + i * 10);
    const mk = (ppm) => dT.map((t) => ((t - 25) * ppm * 1e-6) * 65536);
    lineChart(s, T.series(dT.map(String), ['2 ppm/°C', mk(2)], ['10 ppm/°C', mk(10)], ['50 ppm/°C', mk(50)]), b, {
      showCatAxisTitle: true, catAxisTitle: 'temperature (°C)', showValAxisTitle: true,
      valAxisTitle: 'gain error at 16 bits (LSB)', valAxisMajorUnit: 100,
      chartColors: [C.teal, C.amber, C.coral], lineDataSymbol: 'circle', lineDataSymbolSize: 4,
    });
  },

  offset: (s, b) => {
    const v = seq(201, (i) => -1 + (2 * i) / 200), q = A.lsb(4, 2);
    lineChart(s, T.series(lab(v, 2), ['ideal', v.map((x) => A.quantize(x, 4))],
      ['with +2 LSB offset', v.map((x) => A.quantize(x - 2 * q, 4))]), b, {
      valAxisMinVal: -1, valAxisMaxVal: 1, valAxisMajorUnit: 0.5, catAxisLabelFrequency: 25,
      showCatAxisTitle: true, catAxisTitle: 'input (V) · the whole staircase slides sideways',
      chartColors: [C.slate, C.coral],
    });
  },

  gain: (s, b) => {
    const v = seq(201, (i) => -1 + (2 * i) / 200), g = 0.12;
    lineChart(s, T.series(lab(v, 2), ['ideal', v.map((x) => A.quantize(x, 4))],
      ['with +12 % gain error', v.map((x) => A.quantize(x * (1 + g), 4))]), b, {
      valAxisMinVal: -1, valAxisMaxVal: 1, valAxisMajorUnit: 0.5, catAxisLabelFrequency: 25,
      showCatAxisTitle: true, catAxisTitle: 'input (V) · right at zero, worst at the ends',
      chartColors: [C.slate, C.amber],
    });
  },

  dnl: (s, b) => {
    const bits = 6, n = A.codes(bits) - 1, next = A.rng(4);
    const dnl = seq(n, () => 0.45 * A.gaussian(next) * 0.5);
    const L = A.linearity(A.transitions(bits, { dnl }), bits);
    barChart(s, T.series(seq(L.dnl.length, (i) => String(i)), ['DNL (LSB)', L.dnl]), b, {
      showValue: false, barGapWidthPct: 20, valAxisMinVal: -1, valAxisMaxVal: 1, valAxisMajorUnit: 0.5,
      valAxisLabelFormatCode: '0.0', catAxisLabelFrequency: 8,
      showCatAxisTitle: true, catAxisTitle: 'code · each bar is one step’s width error',
      chartColors: [C.teal],
    });
  },

  missing: (s, b) => {
    const bits = 6, n = A.codes(bits) - 1, dnl = new Array(n).fill(0);
    dnl[30] = -1; dnl[31] = 1;
    const L = A.linearity(A.transitions(bits, { dnl }), bits);
    barChart(s, T.series(seq(L.dnl.length, (i) => String(i)), ['DNL (LSB)', L.dnl]), b, {
      showValue: false, barGapWidthPct: 20, valAxisMinVal: -1.2, valAxisMaxVal: 1.2, valAxisMajorUnit: 0.5,
      valAxisLabelFormatCode: '0.0', catAxisLabelFrequency: 8,
      showCatAxisTitle: true, catAxisTitle: 'code · the −1 LSB bar is a code that never appears',
      chartColors: [C.coral],
    });
  },

  inl: (s, b) => {
    const bits = 8, n = A.codes(bits) - 1;
    const bow = seq(n, (i) => 2.2 * Math.sin((Math.PI * i) / n));          // even-order bow
    const ess = seq(n, (i) => 1.8 * Math.sin((2 * Math.PI * i) / n));      // odd-order S
    lineChart(s, T.series(seq(n, (i) => String(i)), ['bowed INL → mostly HD2', bow], ['S-shaped INL → mostly HD3', ess]), b, {
      valAxisMinVal: -2.5, valAxisMaxVal: 2.5, valAxisMajorUnit: 1, catAxisLabelFrequency: 32,
      showCatAxisTitle: true, catAxisTitle: 'code', showValAxisTitle: true, valAxisTitle: 'INL (LSB)',
      chartColors: [C.teal, C.amber],
    });
  },

  tue: (s, b) => barChart(s, T.series(['offset', 'gain', 'INL', 'quantisation', 'RSS total', 'worst case'],
    ['contribution (LSB)', [2, 3, 1.5, 0.5, 3.9, 7]]), b, {
    showValue: true, dataLabelFormatCode: '0.0', valAxisMajorUnit: 2,
    showCatAxisTitle: true, catAxisTitle: 'uncalibrated 12-bit converter', chartColors: [C.teal],
  }),

  drift: (s, b) => {
    const dT = seq(13, (i) => -40 + i * 10);
    lineChart(s, T.series(dT.map(String),
      ['offset drift 1 µV/°C', dT.map((t) => Math.abs(t - 25) * 1 / 30.5)],
      ['gain drift 5 ppm/°C', dT.map((t) => (Math.abs(t - 25) * 5e-6) * 65536)]), b, {
      showCatAxisTitle: true, catAxisTitle: 'temperature (°C) · calibrated at 25 °C',
      showValAxisTitle: true, valAxisTitle: 'error at 16 bits (LSB)', valAxisMajorUnit: 5,
      chartColors: [C.teal, C.coral], lineDataSymbol: 'circle', lineDataSymbolSize: 4,
    });
  },

  psrr: (s, b) => {
    const f = seq(7, (i) => 10 ** (i + 1));
    lineChart(s, T.series(f.map((v) => (v >= 1e6 ? v / 1e6 + ' M' : v >= 1e3 ? v / 1e3 + ' k' : v + ' ')),
      ['PSRR (dB)', f.map((v) => Math.max(20, 90 - 20 * Math.log10(v / 1e3)))]), b, {
      showCatAxisTitle: true, catAxisTitle: 'supply ripple frequency (Hz)',
      showValAxisTitle: true, valAxisTitle: 'rejection (dB)', valAxisMinVal: 0, valAxisMaxVal: 100, valAxisMajorUnit: 25,
      chartColors: [C.teal], lineDataSymbol: 'circle', lineDataSymbolSize: 5,
    });
  },

  snr: (s, b) => {
    const bits = [8, 10, 12, 14, 16, 18];
    lineChart(s, T.series(bits.map(String), ['ideal 6.02N + 1.76', bits.map(A.idealSnr)],
      ['a typical real part', bits.map((n) => A.idealSnr(n) - 2 - 0.35 * (n - 8))]), b, {
      showCatAxisTitle: true, catAxisTitle: 'resolution (bits)', showValAxisTitle: true,
      valAxisTitle: 'SNR (dB)', valAxisMinVal: 40, valAxisMaxVal: 120, valAxisMajorUnit: 20,
      chartColors: [C.teal, C.coral], lineDataSymbol: 'circle', lineDataSymbolSize: 5,
    });
  },

  histogram: (s, b) => {
    const next = A.rng(9), bins = 13, counts = new Array(bins).fill(0);
    for (let i = 0; i < 20000; i++) {
      const code = Math.round(1.9 * A.gaussian(next)) + (bins >> 1);
      if (code >= 0 && code < bins) counts[code]++;
    }
    barChart(s, T.series(seq(bins, (i) => String(i - (bins >> 1))), ['readings per code', counts]), b, {
      showValue: false, barGapWidthPct: 15, showCatAxisTitle: true,
      catAxisTitle: 'output code, input shorted · σ = 1.9 LSB', chartColors: [C.teal],
    });
  },

  thd: (s, b) => {
    const cap = A.capture({ bits: 14, N: 4096, m: 111, amp: 0.9, hd2: -72, hd3: -78, seed: 21 });
    spectrum(s, b, cap, 111, { amp: 0.9, bins: 700, label: 'one tone in, harmonics out', xlabel: 'frequency (fraction of f_s) · HD2 and HD3 marked by the peaks' });
  },

  sinad: (s, b) => barChart(s, T.series(['SNR', 'THD (as a ratio)', 'SINAD'], ['dB', [72, 76, 70.5]]), b, {
    showValue: true, dataLabelFormatCode: '0.0"dB"', valAxisMinVal: 60, valAxisMaxVal: 80, valAxisMajorUnit: 5,
    showCatAxisTitle: true, catAxisTitle: 'SINAD is always below both', chartColors: [C.teal],
  }),

  enob: (s, b) => {
    const f = [1, 5, 10, 20, 50, 70, 100, 150, 200];
    lineChart(s, T.series(f.map(String),
      ['ENOB of a "14-bit" part', f.map((v) => 12.3 - 1.6 * Math.log10(v / 1) * 0.55)],
      ['headline resolution', f.map(() => 14)]), b, {
      showCatAxisTitle: true, catAxisTitle: 'input frequency (MHz)', showValAxisTitle: true,
      valAxisTitle: 'bits', valAxisMinVal: 8, valAxisMaxVal: 15, valAxisMajorUnit: 2,
      chartColors: [C.teal, C.slate], lineDataSymbol: 'circle', lineDataSymbolSize: 5,
    });
  },

  sfdr: (s, b) => {
    const cap = A.capture({ bits: 12, N: 4096, m: 111, amp: 0.9, hd2: -68, hd3: -74, seed: 31 });
    spectrum(s, b, cap, 111, { amp: 0.9, bins: 700, label: 'spectrum (dBFS)', xlabel: 'frequency · SFDR is the gap to the tallest spur' });
  },

  imd: (s, b) => {
    // Two tones through a cubic nonlinearity: the third-order products land in-band.
    const N = 4096, m1 = 400, m2 = 440, x = new Array(N), next = A.rng(17);
    for (let n = 0; n < N; n++) {
      const a = 0.45 * Math.sin((A.TWO_PI * m1 * n) / N) + 0.45 * Math.sin((A.TWO_PI * m2 * n) / N);
      x[n] = A.quantize(a + 0.04 * a * a * a + 2e-5 * A.gaussian(next), 14);
    }
    const p = A.powerSpectrum(x).map((v) => 10 * Math.log10(Math.max(v, 1e-30)));
    const lo = 330, hi = 520;
    lineChart(s, T.series(seq(hi - lo, (i) => String(lo + i)), ['two tones and their products', p.slice(lo, hi)]), b, {
      valAxisMinVal: -120, valAxisMaxVal: 0, valAxisMajorUnit: 30, catAxisLabelFrequency: 24,
      showCatAxisTitle: true, catAxisTitle: 'bin · products at 2f₁−f₂ and 2f₂−f₁ sit beside the tones',
      chartColors: [C.coral], lineSize: 1.25,
    });
  },

  floor: (s, b) => {
    const Ns = [256, 512, 1024, 2048, 4096, 8192];
    barChart(s, T.series(Ns.map((n) => String(n)), ['visible floor (dBFS)', Ns.map((n) => -(A.idealSnr(12) + A.processingGain(n / 2)))]), b, {
      showValue: true, dataLabelFormatCode: '0"dB"', dataLabelPosition: 'inEnd',
      valAxisMinVal: -120, valAxisMaxVal: 0, valAxisMajorUnit: 30, showCatAxisTitle: true,
      catAxisTitle: 'FFT length · the same 12-bit converter every time', chartColors: [C.teal],
    });
  },

  dynrange: (s, b) => {
    const osr = [1, 2, 4, 8, 16, 32, 64, 128];
    lineChart(s, T.series(osr.map(String),
      ['plain oversampling', osr.map((o) => A.idealSnr(12) + A.processingGain(o))],
      ['1st-order shaping', osr.map((o) => A.idealSnr(12) + 9 * Math.log2(o))],
      ['2nd-order shaping', osr.map((o) => A.idealSnr(12) + 15 * Math.log2(o))]), b, {
      showCatAxisTitle: true, catAxisTitle: 'oversampling ratio', showValAxisTitle: true,
      valAxisTitle: 'dynamic range (dB)', valAxisMinVal: 70, valAxisMaxVal: 190, valAxisMajorUnit: 30,
      chartColors: [C.slate, C.teal, C.coral], lineDataSymbol: 'circle', lineDataSymbolSize: 4,
    });
  },

  aliasing: (s, b) => {
    const fs = 100, f = [10, 30, 45, 60, 80, 110, 140];
    barChart(s, T.series(f.map((v) => v + ' MHz'), ['where it appears (MHz)', f.map((v) => {
      const r = v % fs; return Math.min(r, fs - r);
    })]), b, {
      showValue: true, dataLabelFormatCode: '0', valAxisMajorUnit: 10, valAxisMinVal: 0, valAxisMaxVal: 55,
      showCatAxisTitle: true, catAxisTitle: 'input tone, sampled at 100 MSPS · limit is 50 MHz',
      chartColors: [C.coral],
    });
  },

  latency: (s, b) => table(s, [
    ['Architecture', 'Result rate', 'Latency'],
    ['SAR', 'one per N clocks', 'none'],
    ['Pipeline', 'one per clock', '8 – 16 clocks'],
    ['Flash', 'one per clock', '1 clock'],
    ['Delta-sigma', 'one per OSR clocks', 'hundreds of clocks'],
  ], b, { fontSize: 10.5, rowH: 0.36, colW: [1.5, 1.5, 1.4] }),

  apdelay: (s, b) => {
    // Two interleaved converters with a timing mismatch Δt produce a spur whose
    // level follows 20 log₁₀(π f_in Δt).
    const dt = [1, 2, 5, 10, 20, 50, 100, 200];
    const spur = (f) => dt.map((d) => 20 * Math.log10(Math.PI * f * d * 1e-12));
    lineChart(s, T.series(dt.map(String), ['f_in = 100 MHz', spur(100e6)], ['f_in = 500 MHz', spur(500e6)]), b, {
      showCatAxisTitle: true, catAxisTitle: 'delay mismatch between interleaved channels (ps)',
      showValAxisTitle: true, valAxisTitle: 'interleaving spur (dBc)',
      valAxisMinVal: -80, valAxisMaxVal: -20, valAxisMajorUnit: 15,
      chartColors: [C.teal, C.coral], lineDataSymbol: 'circle', lineDataSymbolSize: 5,
    });
  },

  jitter: (s, b) => {
    const f = [1, 3, 10, 30, 100, 300, 1000];
    const mk = (tj) => f.map((v) => A.jitterSnr(v * 1e6, tj));
    lineChart(s, T.series(f.map(String), ['100 fs', mk(100e-15)], ['1 ps', mk(1e-12)], ['10 ps', mk(10e-12)]), b, {
      showCatAxisTitle: true, catAxisTitle: 'input frequency (MHz)', showValAxisTitle: true,
      valAxisTitle: 'SNR limit (dB)', valAxisMinVal: 20, valAxisMaxVal: 120, valAxisMajorUnit: 20,
      chartColors: [C.teal, C.amber, C.coral], lineDataSymbol: 'circle', lineDataSymbolSize: 4,
    });
  },

  settling: (s, b) => {
    const t = seq(80, (i) => (i * 14) / 79);
    lineChart(s, T.series(lab(t, 1), ['settling error (LSB, 16-bit)', t.map((v) => A.settleErrorLsb(v, 1, 16))],
      ['½ LSB target', t.map(() => 0.5)]), b, {
      valAxisMinVal: 0, valAxisMaxVal: 20, valAxisMajorUnit: 5, catAxisLabelFrequency: 10,
      showCatAxisTitle: true, catAxisTitle: 'time constants elapsed · 16 bits needs 11.8',
      chartColors: [C.teal, C.coral],
    });
  },

  slew: (s, b) => {
    const f = [1, 5, 10, 25, 50, 100];
    barChart(s, T.series(f.map((v) => v + ' MHz'), ['slew rate needed (V/µs)', f.map((v) => A.slewNeeded(2, v * 1e6) / 1e6)]), b, {
      showValue: true, dataLabelFormatCode: '0', showCatAxisTitle: true,
      catAxisTitle: 'signal frequency · full-scale sine into a 2 V range', chartColors: [C.amber],
    });
  },

  bandwidth: (s, b) => {
    const f = seq(60, (i) => 10 ** (6 + (i * 3.2) / 59));
    const tau = 1 / (A.TWO_PI * 900e6);
    lineChart(s, T.series(f.map((v) => T.fmt(v / 1e6, 0)), ['input response (dB)', f.map((v) => -10 * Math.log10(1 + (v * A.TWO_PI * tau) ** 2))],
      ['Nyquist, 125 MHz', f.map((v) => (v < 125e6 ? 0 : -60))]), b, {
      valAxisMinVal: -30, valAxisMaxVal: 5, valAxisMajorUnit: 10, catAxisLabelFrequency: 10,
      showCatAxisTitle: true, catAxisTitle: 'frequency (MHz) · −3 dB at 900 MHz, far above Nyquist',
      chartColors: [C.teal, C.slate],
    });
  },

  fpbw: (s, b) => barChart(s, T.series(['small signal −3 dB', 'full power −3 dB', 'full linear (SFDR > 70 dB)'],
    ['MHz', [900, 500, 200]]), b, {
    showValue: true, dataLabelFormatCode: '0"MHz"', showCatAxisTitle: true,
    catAxisTitle: 'three bandwidths for one converter', chartColors: [C.teal],
  }),

  zones: (s, b) => {
    const zones = seq(6, (i) => i + 1);
    barChart(s, T.series(zones.map((z) => 'zone ' + z), ['upper edge (MHz), f_s = 61.44 MSPS', zones.map((z) => (z * 61.44) / 2)]), b, {
      showValue: true, dataLabelFormatCode: '0.0', showCatAxisTitle: true,
      catAxisTitle: 'a 70 MHz IF lives in zone 3 and folds down into zone 1', chartColors: [C.teal],
    });
  },

  osr: (s, b) => {
    const osr = [1, 4, 16, 64, 256, 1024];
    lineChart(s, T.series(osr.map(String), ['plain', osr.map((o) => A.processingGain(o))],
      ['1st order', osr.map((o) => 9 * Math.log2(o))],
      ['2nd order', osr.map((o) => 15 * Math.log2(o))]), b, {
      showCatAxisTitle: true, catAxisTitle: 'oversampling ratio', showValAxisTitle: true,
      valAxisTitle: 'dB gained', valAxisMinVal: 0, valAxisMaxVal: 160, valAxisMajorUnit: 40,
      chartColors: [C.slate, C.teal, C.coral], lineDataSymbol: 'circle', lineDataSymbolSize: 4,
    });
  },

  power: (s, b) => {
    const bits = [8, 10, 12, 14, 16];
    barChart(s, T.series(bits.map((n) => n + ' bit'), ['power at 100 MSPS (mW)', bits.map((n) => 20 * 4 ** ((n - 8) / 2))]), b, {
      showValue: true, dataLabelFormatCode: '0', showCatAxisTitle: true,
      catAxisTitle: 'roughly 4× per extra bit', chartColors: [C.amber],
    });
  },

  walden: (s, b) => {
    const parts = [['8b 1 GSPS', 0.5, 7.5, 1e9], ['12b 100 MSPS', 0.3, 11.5, 1e8],
      ['16b 10 MSPS', 0.12, 14.5, 1e7], ['24b 1 kSPS', 0.002, 21, 1e3]];
    barChart(s, T.series(parts.map((p) => p[0]), ['pJ per conversion step', parts.map((p) => A.waldenFoM(p[1], p[2], p[3]) * 1e12)]), b, {
      showValue: true, dataLabelFormatCode: '0.00', showCatAxisTitle: true,
      catAxisTitle: 'lower is better', chartColors: [C.teal],
    });
  },

  schreier: (s, b) => {
    const parts = [['8b 1 GSPS', 45, 5e8, 0.5], ['12b 100 MSPS', 70.5, 5e7, 0.3],
      ['16b 10 MSPS', 88, 5e6, 0.12], ['24b 1 kSPS', 120, 500, 0.002]];
    barChart(s, T.series(parts.map((p) => p[0]), ['FoM_S (dB)', parts.map((p) => A.schreierFoM(p[1], p[2], p[3]))]), b, {
      showValue: true, dataLabelFormatCode: '0', valAxisMinVal: 120, valAxisMaxVal: 180, valAxisMajorUnit: 15,
      showCatAxisTitle: true, catAxisTitle: 'higher is better', chartColors: [C.teal],
    });
  },

  crosstalk: (s, b) => {
    const f = [10, 100, 1000, 10000, 100000];
    lineChart(s, T.series(f.map((v) => (v >= 1e3 ? v / 1e3 + ' k' : v + ' ')), ['crosstalk (dB)', f.map((v) => -110 + 10 * Math.log10(v / 10))]), b, {
      showCatAxisTitle: true, catAxisTitle: 'frequency (Hz) · isolation always worsens with frequency',
      showValAxisTitle: true, valAxisTitle: 'crosstalk (dB)', valAxisMinVal: -120, valAxisMaxVal: -40, valAxisMajorUnit: 20,
      chartColors: [C.coral], lineDataSymbol: 'circle', lineDataSymbolSize: 5,
    });
  },

  iface: (s, b) => table(s, [
    ['Interface', 'Typical rate', 'Where it fits'],
    ['SPI / I²C', '< 50 Mbit/s', 'Sensors, slow SAR'],
    ['Parallel CMOS', '< 1 Gbit/s', 'Mid-speed, many pins'],
    ['LVDS', '~ 1 Gbit/s per pair', '100s of MSPS'],
    ['JESD204B/C', '12.5 Gbit/s per lane', 'GSPS, synchronised arrays'],
  ], b, { fontSize: 10, rowH: 0.33, colW: [1.35, 1.5, 1.55] }),

  choose: (s, b) => table(s, [
    ['Requirement', 'Value'],
    ['Signal band', '20 MHz at a 70 MHz IF'],
    ['Sample rate', '61.44 MSPS (undersampling zone 3)'],
    ['Analog bandwidth', '> 300 MHz'],
    ['Resolution', '12 bit (74 dB ideal)'],
    ['ENOB at 70 MHz', '> 10.5 bits'],
    ['Jitter budget', '455 fs total'],
    ['SFDR', '> 75 dBc'],
  ], b, { fontSize: 10, rowH: 0.3, colW: [2.1, 2.3] }),
};

/* ----------------------------------------------------------- slide renderers */

function notesFor(s) {
  let n = s.notes || '';
  if (s.what) n = (n ? n + '\n\n' : '') + 'Definition: ' + s.what;
  if (s.analogy) n += '\n\nAnalogy: ' + s.analogy;
  if (s.example) n += `\n\nExample (${s.example.title}): ` + s.example.lines.join('; ') + '.';
  if (s.matters) n += '\n\nWhy it matters: ' + s.matters;
  if (s.expert) n += '\n\nFor the experts: ' + s.expert;
  return n || 'No notes.';
}

function band(slide, s, y = BAND_Y, h = BAND_H) {
  const exSize = (ex) => (Math.max(...ex.lines.map((l) => l.length), ex.title.length) > 56 ? 9 : 10);
  if (s.analogy && s.example) {
    T.analogyCard(slide, s.analogy, { x: LX, y, w: LW, h }, { fontSize: s.analogy.length > 220 ? 10 : 10.5 });
    T.exampleCard(slide, s.example, { x: RX, y, w: RW, h }, { fontSize: exSize(s.example) });
  } else if (s.analogy) {
    T.analogyCard(slide, s.analogy, { x: LX, y, w: W - 2 * M, h }, { fontSize: 10.5 });
  } else if (s.example) {
    T.exampleCard(slide, s.example, { x: LX, y, w: W - 2 * M, h }, { fontSize: exSize(s.example) });
  }
}

/** The chip at the top right of a parameter slide: its symbol and unit. */
/** Width the symbol chip will occupy, so the title can be kept clear of it. */
function chipWidth(s) {
  if (!s.symbol || s.symbol === '—') return 0;
  const text = s.unit && s.unit !== '—' ? s.symbol + '   ·   ' + s.unit : s.symbol;
  return Math.min(3.6, 0.13 * text.length + 0.5);
}

function symbolChip(slide, s) {
  if (!s.symbol || s.symbol === '—') return;
  const text = s.unit && s.unit !== '—' ? s.symbol + '   ·   ' + s.unit : s.symbol;
  const w = chipWidth(s);
  slide.addShape('roundRect', {
    x: W - M - w, y: 0.42, w, h: 0.42,
    fill: { color: C.tint }, line: { color: C.tint }, rectRadius: 0.08,
  });
  slide.addText(text, {
    x: W - M - w, y: 0.42, w, h: 0.42, fontFace: F.math, fontSize: 12, bold: true,
    color: C.navy, align: 'center', valign: 'middle', isTextBox: true, margin: 0,
  });
}

const BOTTOM = 3.88;      // where the left column must stop
const EQ_H = 0.74;        // floor height for an equation card: below this the
                          // caption rides up into the formula
const EQ_GAP = 0.08;

function paramSlide(s, number) {
  const chip = chipWidth(s);
  const slide = T.contentSlide(pres, s.title, {
    section: PARTS[s.part].name, number,
    titleW: W - 2 * M - (chip ? chip + 0.25 : 0),
  });
  symbolChip(slide, s);

  // Left column, top to bottom: definition, equations, then typical values.
  let y = TOP;
  if (s.what) {
    const h = s.what.length > 230 ? 1.32 : s.what.length > 150 ? 1.1 : 0.88;
    slide.addText(s.what, {
      x: LX, y, w: LW, h, fontFace: F.body, fontSize: 11.5, color: C.ink,
      valign: 'top', isTextBox: true, margin: 0,
    });
    y += h + 0.06;
  }
  if (s.bullets) {
    const n = s.bullets.length;
    T.bullets(slide, s.bullets, { x: LX, y, w: LW, h: BOTTOM - y },
      { fontSize: n > 5 ? 10 : 11, gap: n > 5 ? 1 : 3 });
    y = BOTTOM;
  }
  if (s.equations) {
    // Show as many as fit at a readable height; any that do not fit stay in the notes.
    const room = BOTTOM - y;
    const fit = Math.max(1, Math.min(s.equations.length, Math.floor((room + EQ_GAP) / (EQ_H + EQ_GAP))));
    const each = Math.min(0.95, (room - EQ_GAP * (fit - 1)) / fit);
    s.equations.slice(0, fit).forEach((e, i) => {
      T.equation(slide, e.eq, { x: LX, y: y + i * (each + EQ_GAP), w: LW, h: each },
        { caption: e.cap, fontSize: 15 });
    });
    y += fit * each + (fit - 1) * EQ_GAP + 0.1;
  }
  if (s.typical && BOTTOM - y > 0.8) {
    table(slide, [['Typical', 'Value'], ...s.typical], { x: LX, y, w: LW },
      { fontSize: 9.5, rowH: 0.26, colW: [2.3, 2.1] });
  }

  // Right column: the chart, then the one-line warning underneath it.
  const chartH = s.matters ? 2.28 : 2.68;
  if (s.chart && CHARTS[s.chart]) CHARTS[s.chart](slide, { x: RX, y: TOP, w: RW, h: chartH });
  if (s.matters) {
    const short = s.matters.length > 155 ? s.matters.slice(0, 153).replace(/\s+\S*$/, '') + '…' : s.matters;
    T.caption(slide, short, { x: RX, y: TOP + chartH + 0.08, w: RW, h: BOTTOM - (TOP + chartH + 0.08) });
  }

  band(slide, s);
  slide.addNotes(notesFor(s));
}

function titleSlide(s) {
  const slide = T.darkSlide(pres);
  slide.addText(s.title, { x: M, y: 1.25, w: W - 2 * M, h: 1.1, fontFace: F.head, fontSize: 48, bold: true, color: C.white, isTextBox: true, margin: 0 });
  slide.addText(s.subtitle, { x: M, y: 2.35, w: W - 2 * M, h: 0.6, fontFace: F.body, fontSize: 19, color: C.teal, isTextBox: true, margin: 0 });
  slide.addText('Static · Dynamic · Timing · Bandwidth · Power', { x: M, y: 3.0, w: W - 2 * M, h: 0.4, fontFace: F.body, fontSize: 12, color: 'B8C4D6', isTextBox: true, margin: 0 });
  D.adcBlocks(slide, { x: M + 0.3, y: 3.45, w: W - 2 * M - 0.6, h: 1.6 });
  slide.addNotes(notesFor(s));
}

function sectionSlide(s, number) {
  const slide = T.darkSlide(pres);
  const p = PARTS[s.part];
  slide.addText(p.name.split(' · ')[0], { x: M, y: 1.35, w: 6, h: 0.4, fontFace: F.body, fontSize: 14, color: C.teal, bold: true, isTextBox: true, margin: 0 });
  slide.addText(p.name.split(' · ').slice(1).join(' · '), { x: M, y: 1.75, w: W - 2 * M, h: 1.0, fontFace: F.head, fontSize: 38, bold: true, color: C.white, isTextBox: true, margin: 0, valign: 'middle' });
  slide.addText(s.subtitle, { x: M, y: 2.8, w: W - 2 * M, h: 0.5, fontFace: F.body, fontSize: 16, color: 'D7DEE8', isTextBox: true, margin: 0 });
  slide.addText(`${p.minutes} minutes`, { x: M, y: 3.35, w: 4, h: 0.3, fontFace: F.body, fontSize: 11, color: 'B8C4D6', isTextBox: true, margin: 0 });
  slide.addText(String(number), { x: W - M - 1, y: H - 0.38, w: 1, h: 0.25, fontFace: F.body, fontSize: 9, color: '8FA3BF', align: 'right', isTextBox: true, margin: 0 });
  slide.addNotes(notesFor(s));
}

function recapSlide(s, number) {
  const slide = T.darkSlide(pres);
  slide.addText(s.title, { x: M, y: 0.45, w: W - 2 * M, h: 0.7, fontFace: F.head, fontSize: 30, bold: true, color: C.white, isTextBox: true, margin: 0, valign: 'middle' });
  const rowH = Math.min(0.62, (H - 0.55 - 1.3) / s.bullets.length);
  s.bullets.forEach((b, i) => {
    const y = 1.3 + i * rowH;
    slide.addShape('ellipse', { x: M, y: y + 0.09, w: 0.3, h: 0.3, fill: { color: C.teal }, line: { color: C.teal } });
    slide.addText('✓', { x: M, y: y + 0.09, w: 0.3, h: 0.3, fontSize: 12, bold: true, color: C.navy, align: 'center', valign: 'middle', isTextBox: true, margin: 0 });
    slide.addText(b, { x: M + 0.45, y, w: W - 2 * M - 0.45, h: rowH, fontFace: F.body, fontSize: 14.5, color: C.white, valign: 'middle', isTextBox: true, margin: 0 });
  });
  slide.addText(String(number), { x: W - M - 1, y: H - 0.38, w: 1, h: 0.25, fontFace: F.body, fontSize: 9, color: '8FA3BF', align: 'right', isTextBox: true, margin: 0 });
  slide.addNotes(notesFor(s));
}

function mapSlide(s, number) {
  const slide = T.contentSlide(pres, s.title, { section: PARTS[s.part].name, number });
  slide.addText(s.what, { x: M, y: TOP, w: W - 2 * M, h: 0.45, fontFace: F.body, fontSize: 12, color: C.ink, isTextBox: true, margin: 0 });
  const gap = 0.16, cw = (W - 2 * M - 4 * gap) / 5, top = TOP + 0.55, ch = 3.4;
  FAMILIES.forEach((fam, i) => {
    const x = M + i * (cw + gap);
    slide.addShape('roundRect', { x, y: top, w: cw, h: ch, fill: { color: C.tint }, line: { color: C.tint }, rectRadius: 0.08 });
    slide.addShape('roundRect', { x, y: top, w: cw, h: 0.42, fill: { color: C.navy }, line: { color: C.navy }, rectRadius: 0.08 });
    slide.addText(fam.name, { x, y: top, w: cw, h: 0.42, fontFace: F.body, fontSize: 11, bold: true, color: C.white, align: 'center', valign: 'middle', isTextBox: true, margin: 0 });
    slide.addText(fam.when, { x: x + 0.1, y: top + 0.48, w: cw - 0.2, h: 0.5, fontFace: F.body, fontSize: 8.5, italic: true, color: C.slate, isTextBox: true, margin: 0, valign: 'top' });
    T.bullets(slide, fam.params, { x: x + 0.1, y: top + 1.0, w: cw - 0.2, h: ch - 1.1 }, { fontSize: 8.5, gap: 1 });
  });
  slide.addNotes(notesFor(s));
}

function archSlide(s, number) {
  const slide = T.contentSlide(pres, s.title, { section: PARTS[s.part].name, number });
  slide.addText(s.what, { x: M, y: TOP, w: W - 2 * M, h: 0.45, fontFace: F.body, fontSize: 12, color: C.ink, isTextBox: true, margin: 0 });
  table(slide, ARCH, { x: M, y: TOP + 0.55, w: W - 2 * M }, { fontSize: 10, rowH: 0.44, colW: [1.25, 1.5, 1.15, 1.25, 2.3, 1.55] });
  T.caption(slide, 'No architecture wins everywhere. Choosing one is choosing which parameter you are willing to give up.', { x: M, y: 4.55, w: W - 2 * M, h: 0.35 });
  slide.addNotes(notesFor(s));
}

function checklistSlide(s, number) {
  const slide = T.contentSlide(pres, s.title, { section: PARTS[s.part].name, number });
  slide.addText(s.what, { x: M, y: TOP, w: W - 2 * M, h: 0.4, fontFace: F.body, fontSize: 12, color: C.ink, isTextBox: true, margin: 0 });
  const rowH = 0.47, top = TOP + 0.5;
  CHECKLIST.forEach(([n, head, body], i) => {
    const y = top + i * rowH;
    slide.addShape('ellipse', { x: M, y: y + 0.06, w: 0.32, h: 0.32, fill: { color: C.teal }, line: { color: C.teal } });
    slide.addText(n, { x: M, y: y + 0.06, w: 0.32, h: 0.32, fontFace: F.body, fontSize: 11, bold: true, color: C.navy, align: 'center', valign: 'middle', isTextBox: true, margin: 0 });
    slide.addText([
      { text: head + '  ', options: { bold: true, color: C.navy } },
      { text: body, options: { color: C.ink, fontSize: 10 } },
    ], { x: M + 0.45, y, w: W - 2 * M - 0.45, h: rowH, fontFace: F.body, fontSize: 11.5, valign: 'middle', isTextBox: true, margin: 0 });
  });
  slide.addNotes(notesFor(s));
}

function cardsSlide(s, number) {
  const slide = T.contentSlide(pres, s.title, { section: PARTS[s.part].name, number });
  const gap = 0.18, cw = (W - 2 * M - 3 * gap) / 4, ch = 1.7;
  s.cards.forEach(([n, head, body], i) => {
    const row = i < 4 ? 0 : 1, col = i < 4 ? i : i - 4;
    const x = M + col * (cw + gap) + (row === 1 ? (cw + gap) / 2 : 0);
    const y = TOP + row * (ch + 0.2);
    T.card(slide, head, body, { x, y, w: cw, h: ch }, { icon: n, iconColor: C.coral, headSize: 10.5, bodySize: 9.5 });
  });
  slide.addNotes(notesFor(s));
}

function cheatSlide(s, number) {
  const slide = T.darkSlide(pres);
  slide.addText(s.title, { x: M, y: 0.32, w: W - 2 * M, h: 0.55, fontFace: F.head, fontSize: 27, bold: true, color: C.white, isTextBox: true, margin: 0, valign: 'middle' });
  const half = Math.ceil(CHEATSHEET.length / 2);
  table(slide, CHEATSHEET.slice(0, half), { x: M, y: 0.95, w: 4.45 }, { noHeader: true, dark: true, fontSize: 8.5, mathCol: 1, rowH: 0.44, colW: [1.25, 3.2] });
  table(slide, CHEATSHEET.slice(half), { x: 5.05, y: 0.95, w: 4.45 }, { noHeader: true, dark: true, fontSize: 8.5, mathCol: 1, rowH: 0.44, colW: [1.25, 3.2] });
  slide.addText(String(number), { x: W - M - 1, y: H - 0.38, w: 1, h: 0.25, fontFace: F.body, fontSize: 9, color: '8FA3BF', align: 'right', isTextBox: true, margin: 0 });
  slide.addNotes(notesFor(s));
}

function endSlide(s, number) {
  const slide = T.darkSlide(pres);
  slide.addText(s.title, { x: M, y: 0.85, w: W - 2 * M, h: 1.0, fontFace: F.head, fontSize: 46, bold: true, color: C.white, isTextBox: true, margin: 0 });
  slide.addText('Further reading', { x: M, y: 2.1, w: 5, h: 0.35, fontFace: F.body, fontSize: 12, bold: true, color: C.teal, isTextBox: true, margin: 0 });
  T.bullets(slide, s.references, { x: M, y: 2.5, w: W - 2 * M, h: 2.1 }, { color: 'D7DEE8', fontSize: 11.5, gap: 5 });
  slide.addText(String(number), { x: W - M - 1, y: H - 0.38, w: 1, h: 0.25, fontFace: F.body, fontSize: 9, color: '8FA3BF', align: 'right', isTextBox: true, margin: 0 });
  slide.addNotes(notesFor(s));
}

/* ------------------------------------------------------------------ assemble */

const RENDER = {
  title: titleSlide, section: sectionSlide, param: paramSlide, recap: recapSlide,
  map: mapSlide, archtable: archSlide, checklist: checklistSlide, cards: cardsSlide,
  cheatsheet: cheatSlide, end: endSlide,
};

let number = 0;
for (const s of SLIDES) {
  number += 1;
  const fn = RENDER[s.kind];
  if (!fn) throw new Error('No renderer for slide kind "' + s.kind + '" (' + s.id + ')');
  fn(s, number);
}

const dest = path.join(__dirname, '..', 'presentation', 'ADC_Parameters.pptx');
pres.writeFile({ fileName: dest }).then((f) => console.log(`Wrote ${f} (${number} slides)`));
