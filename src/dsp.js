// Pure-JavaScript DSP helpers used to generate every chart in the deck.
// No dependencies. Run `node src/dsp.js` to execute the self-checks.

const TWO_PI = 2 * Math.PI;

/** Evenly spaced values from a to b (inclusive), n points. */
function linspace(a, b, n) {
  const out = new Array(n);
  for (let i = 0; i < n; i++) out[i] = a + ((b - a) * i) / (n - 1);
  return out;
}

/** x(t) = A cos(2π f t + φ) evaluated on array t. */
function sine(t, f, A = 1, phi = 0) {
  return t.map((ti) => A * Math.cos(TWO_PI * f * ti + phi));
}

/** Sample a continuous function fn(t) at rate fs for n samples. Returns {t, x}. */
function sample(fn, fs, n) {
  const t = [];
  const x = [];
  for (let i = 0; i < n; i++) {
    const ti = i / fs;
    t.push(ti);
    x.push(fn(ti));
  }
  return { t, x };
}

/** Apparent (aliased) frequency of tone f sampled at fs. */
function aliasFrequency(f, fs) {
  const r = f % fs;
  return Math.min(r, fs - r);
}

/** Mid-tread uniform quantizer over [-vfs/2, +vfs/2] with `bits` bits. Returns quantised value. */
function quantize(v, bits, vfs = 2) {
  const lsb = vfs / Math.pow(2, bits);
  const maxCode = Math.pow(2, bits - 1) - 1;
  const minCode = -Math.pow(2, bits - 1);
  let code = Math.round(v / lsb);
  code = Math.max(minCode, Math.min(maxCode, code));
  return code * lsb;
}

/** Ideal SNR of an N-bit ADC for a full-scale sine, dB. */
function snrBits(bits) {
  return 6.02 * bits + 1.76;
}

/** ENOB from measured SINAD (dB). */
function enob(sinadDb) {
  return (sinadDb - 1.76) / 6.02;
}

/** SNR limit caused by aperture jitter tj (s) at input frequency f (Hz), dB. */
function jitterSnr(f, tj) {
  return -20 * Math.log10(TWO_PI * f * tj);
}

/** Successive-approximation steps for input vin in [0, vref). Returns DAC voltage after each cycle. */
function sarSteps(vin, bits, vref = 1) {
  const steps = [];
  let code = 0;
  for (let b = bits - 1; b >= 0; b--) {
    const trial = code | (1 << b);
    const vdac = (trial / Math.pow(2, bits)) * vref;
    steps.push({ cycle: bits - b, trial: vdac, keep: vin >= vdac });
    if (vin >= vdac) code = trial;
  }
  return { steps, code, vout: (code / Math.pow(2, bits)) * vref };
}

/** Direct DFT: X[k] = Σ x[n] e^{-j2πkn/N}. Inputs re, im arrays. O(N²). */
function dft(re, im) {
  const N = re.length;
  const outRe = new Array(N).fill(0);
  const outIm = new Array(N).fill(0);
  for (let k = 0; k < N; k++) {
    let sr = 0;
    let si = 0;
    for (let n = 0; n < N; n++) {
      const ang = (-TWO_PI * k * n) / N;
      const c = Math.cos(ang);
      const s = Math.sin(ang);
      sr += re[n] * c - im[n] * s;
      si += re[n] * s + im[n] * c;
    }
    outRe[k] = sr;
    outIm[k] = si;
  }
  return { re: outRe, im: outIm };
}

/** Bit-reversal permutation index for n bits. */
function bitReverse(i, bits) {
  let r = 0;
  for (let b = 0; b < bits; b++) {
    r = (r << 1) | (i & 1);
    i >>= 1;
  }
  return r;
}

/** Radix-2 decimation-in-time FFT. N must be a power of two. Returns {re, im}. */
function fft(reIn, imIn) {
  const N = reIn.length;
  if (N & (N - 1)) throw new Error('fft: N must be a power of two, got ' + N);
  const bits = Math.log2(N);
  const re = new Array(N);
  const im = new Array(N);
  for (let i = 0; i < N; i++) {
    const j = bitReverse(i, bits);
    re[j] = reIn[i];
    im[j] = imIn ? imIn[i] : 0;
  }
  for (let size = 2; size <= N; size <<= 1) {
    const half = size >> 1;
    const step = -TWO_PI / size;
    for (let start = 0; start < N; start += size) {
      for (let k = 0; k < half; k++) {
        const ang = step * k;
        const wr = Math.cos(ang);
        const wi = Math.sin(ang);
        const i1 = start + k;
        const i2 = i1 + half;
        const tr = re[i2] * wr - im[i2] * wi;
        const ti = re[i2] * wi + im[i2] * wr;
        re[i2] = re[i1] - tr;
        im[i2] = im[i1] - ti;
        re[i1] += tr;
        im[i1] += ti;
      }
    }
  }
  return { re, im };
}

/** Inverse FFT via the conjugate trick: x = conj(FFT(conj(X))) / N. */
function ifft(re, im) {
  const N = re.length;
  const conjIm = im.map((v) => -v);
  const y = fft(re, conjIm);
  return { re: y.re.map((v) => v / N), im: y.im.map((v) => -v / N) };
}

/** Magnitude of complex arrays. */
function magnitude(re, im) {
  return re.map((r, i) => Math.hypot(r, im[i]));
}

/** Magnitude in dB relative to a reference (default: max of the array). */
function magDb(re, im, ref) {
  const m = magnitude(re, im);
  const r = ref !== undefined ? ref : Math.max(...m);
  return m.map((v) => 20 * Math.log10(Math.max(v, 1e-12) / r));
}

/** Hann window of length N (periodic form, standard for FFT analysis). */
function hann(N) {
  const w = new Array(N);
  for (let n = 0; n < N; n++) w[n] = 0.5 * (1 - Math.cos((TWO_PI * n) / N));
  return w;
}

/** Bin index of frequency f for sample rate fs and length N. */
function binOf(f, fs, N) {
  return Math.round((f / fs) * N);
}

/** Frequency resolution Δf = fs / N. */
function resolution(fs, N) {
  return fs / N;
}

/** Operation counts: direct DFT (N²) vs radix-2 FFT butterflies ((N/2) log2 N). */
function costs(N) {
  return { dft: N * N, fft: (N / 2) * Math.log2(N) };
}

/** Deterministic pseudo-random generator (mulberry32) so charts are reproducible. */
function rng(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Approximate Gaussian noise via sum of uniforms. */
function gaussian(next) {
  let s = 0;
  for (let i = 0; i < 12; i++) s += next();
  return s - 6;
}

/**
 * Build one OFDM symbol: map QPSK symbols onto `used` subcarriers of an N-point IFFT.
 * Returns {tx: {re, im}, time: {re, im}, rx: {re, im}, subcarriers}.
 */
function ofdmSymbol(N, used, seed = 7) {
  const next = rng(seed);
  const txRe = new Array(N).fill(0);
  const txIm = new Array(N).fill(0);
  const subcarriers = [];
  const half = used / 2;
  for (let k = -half; k <= half; k++) {
    if (k === 0) continue;
    const idx = (k + N) % N;
    const i = next() < 0.5 ? -1 : 1;
    const q = next() < 0.5 ? -1 : 1;
    txRe[idx] = i;
    txIm[idx] = q;
    subcarriers.push({ k, idx, i, q });
  }
  const time = ifft(txRe, txIm);
  const rx = fft(time.re, time.im);
  return { tx: { re: txRe, im: txIm }, time, rx, subcarriers };
}

module.exports = {
  TWO_PI,
  linspace,
  sine,
  sample,
  aliasFrequency,
  quantize,
  snrBits,
  enob,
  jitterSnr,
  sarSteps,
  dft,
  fft,
  ifft,
  magnitude,
  magDb,
  hann,
  binOf,
  resolution,
  costs,
  rng,
  gaussian,
  ofdmSymbol,
  bitReverse,
};

// ---------------------------------------------------------------------------
// Self-checks: `node src/dsp.js`
// ---------------------------------------------------------------------------
if (require.main === module) {
  const assert = require('assert');
  const results = [];
  const check = (name, fn) => {
    try {
      fn();
      results.push(`PASS  ${name}`);
    } catch (e) {
      results.push(`FAIL  ${name}: ${e.message}`);
      process.exitCode = 1;
    }
  };

  check('fft matches direct dft (N=64, |err|<1e-9)', () => {
    const next = rng(1);
    const N = 64;
    const re = Array.from({ length: N }, () => next() - 0.5);
    const im = Array.from({ length: N }, () => next() - 0.5);
    const a = dft(re, im);
    const b = fft(re, im);
    let err = 0;
    for (let k = 0; k < N; k++) err = Math.max(err, Math.abs(a.re[k] - b.re[k]), Math.abs(a.im[k] - b.im[k]));
    assert(err < 1e-9, 'max error ' + err);
  });

  check('ifft(fft(x)) round trip (N=1024, |err|<1e-12)', () => {
    const next = rng(2);
    const N = 1024;
    const re = Array.from({ length: N }, () => next() - 0.5);
    const im = new Array(N).fill(0);
    const y = ifft(...Object.values(fft(re, im)));
    let err = 0;
    for (let n = 0; n < N; n++) err = Math.max(err, Math.abs(y.re[n] - re[n]), Math.abs(y.im[n]));
    assert(err < 1e-12, 'max error ' + err);
  });

  check('snrBits(12) ≈ 74.0 dB', () => {
    assert(Math.abs(snrBits(12) - 74.0) < 0.01, String(snrBits(12)));
  });

  check('10 MHz tone @ 40 MSPS, N=1024 peaks in bin 256', () => {
    const fs = 40e6;
    const N = 1024;
    const { x } = sample((t) => Math.cos(TWO_PI * 10e6 * t), fs, N);
    const X = fft(x, new Array(N).fill(0));
    const mag = magnitude(X.re, X.im).slice(0, N / 2);
    const peak = mag.indexOf(Math.max(...mag));
    assert.strictEqual(peak, 256);
    assert.strictEqual(binOf(10e6, fs, N), 256);
    assert(Math.abs(resolution(fs, N) - 39062.5) < 1e-6);
  });

  check('aliasFrequency(9 kHz @ 8 kSPS) = 1 kHz', () => {
    assert(Math.abs(aliasFrequency(9e3, 8e3) - 1e3) < 1e-9);
  });

  check('quantizer LSB and range (3-bit, VFS=2)', () => {
    assert(Math.abs(quantize(0.26, 3) - 0.25) < 1e-12);
    assert(Math.abs(quantize(0.99, 3) - 0.75) < 1e-12); // clipped to max code 3 * 0.25
    assert(Math.abs(quantize(-0.99, 3) + 1.0) < 1e-12); // min code -4 * 0.25
  });

  check('SAR converges: 0.7 V, 8 bits, Vref 1 V -> code 179', () => {
    const r = sarSteps(0.7, 8, 1);
    assert.strictEqual(r.code, 179);
    assert.strictEqual(r.steps.length, 8);
  });

  check('OFDM: FFT recovers transmitted QPSK symbols exactly', () => {
    const o = ofdmSymbol(64, 52);
    let err = 0;
    for (let k = 0; k < 64; k++) err = Math.max(err, Math.abs(o.rx.re[k] - o.tx.re[k]), Math.abs(o.rx.im[k] - o.tx.im[k]));
    assert(err < 1e-12, 'max error ' + err);
  });

  check('costs(1024): DFT 1,048,576 vs FFT 5,120', () => {
    const c = costs(1024);
    assert.strictEqual(c.dft, 1048576);
    assert.strictEqual(c.fft, 5120);
  });

  console.log(results.join('\n'));
  console.log(process.exitCode ? '\nSome checks FAILED' : '\nAll DSP self-checks passed');
}
