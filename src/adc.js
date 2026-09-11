// ADC parameter maths, shared by the slide deck and the interactive app.
// No dependencies. Run `node src/adc.js` to execute the self-checks.

const TWO_PI = 2 * Math.PI;

/* ------------------------------------------------------------------ basics */

/** Step size (one LSB) for an N-bit converter over a full-scale range. */
function lsb(bits, fsr = 2) { return fsr / 2 ** bits; }

/** Number of output codes. */
function codes(bits) { return 2 ** bits; }

/** Ideal SNR of an N-bit converter for a full-scale sine, in dB. */
function idealSnr(bits) { return 6.02 * bits + 1.76; }

/** Effective number of bits implied by a measured SINAD (dB). */
function enobFromSinad(sinad, backoffDb = 0) { return (sinad - 1.76 + backoffDb) / 6.02; }

/** Dynamic range of an oversampled converter: ideal SNR plus processing gain. */
function processingGain(osr) { return 10 * Math.log10(osr); }

/** Noise shaping benefit for an L-th order modulator, dB per doubling of OSR. */
function shapingPerOctave(order) { return 6 * order + 3; }

/* ------------------------------------------------- static transfer function */

/**
 * Code transition voltages for a converter carrying static errors.
 * offset and gain are in LSB and fractional units; dnl is an optional array of
 * per-step deviations in LSB (length 2^bits - 1).
 * Returns the input voltage at which the output steps up to each code.
 */
function transitions(bits, { offsetLsb = 0, gainErr = 0, dnl = null } = {}, fsr = 2) {
  const q = lsb(bits, fsr), n = codes(bits) - 1, out = new Array(n);
  let acc = 0;
  for (let k = 0; k < n; k++) {
    const step = 1 + (dnl ? dnl[k] : 0);
    acc += step;
    // The ideal k-th transition sits half an LSB above the k-th code centre.
    out[k] = (offsetLsb + acc - 0.5) * q * (1 + gainErr) - fsr / 2;
  }
  return out;
}

/** Quantise with a given transition list (a real converter's own staircase). */
function quantizeWith(v, trans, bits, fsr = 2) {
  let code = 0;
  // Transitions rise monotonically in the ideal case; a linear scan is exact
  // even when a bad DNL makes them non-monotonic.
  for (let k = 0; k < trans.length; k++) if (v >= trans[k]) code = k + 1;
  return { code, volts: (code - codes(bits) / 2 + 0.5) * lsb(bits, fsr) };
}

/** Ideal mid-tread quantiser. */
function quantize(v, bits, fsr = 2) {
  const q = lsb(bits, fsr), hi = 2 ** (bits - 1) - 1, lo = -(2 ** (bits - 1));
  return Math.max(lo, Math.min(hi, Math.round(v / q))) * q;
}

/**
 * DNL and INL from a transition list, both in LSB.
 * DNL[k] is how much wider or narrower code k+1 is than one ideal LSB.
 * INL is the running sum (endpoint method), so it starts and ends near zero.
 */
function linearity(trans, bits, fsr = 2) {
  const q = lsb(bits, fsr), n = trans.length;
  const widths = new Array(n - 1);
  for (let k = 0; k < n - 1; k++) widths[k] = (trans[k + 1] - trans[k]) / q;
  // Endpoint line: average width across the whole range.
  const avg = (trans[n - 1] - trans[0]) / q / (n - 1);
  const dnl = widths.map((w) => w / avg - 1);
  const inl = [];
  let s = 0;
  for (const d of dnl) { s += d; inl.push(s); }
  return {
    dnl, inl,
    dnlMax: Math.max(...dnl.map(Math.abs)),
    inlMax: Math.max(...inl.map(Math.abs)),
    missing: dnl.some((d) => d <= -0.999),
    monotonic: widths.every((w) => w > 0),
  };
}

/* ------------------------------------------------------------- FFT + metrics */

function bitReverse(i, bits) { let r = 0; for (let b = 0; b < bits; b++) { r = (r << 1) | (i & 1); i >>= 1; } return r; }

function fft(reIn, imIn) {
  const N = reIn.length, bits = Math.log2(N), re = new Array(N), im = new Array(N);
  for (let i = 0; i < N; i++) { const j = bitReverse(i, bits); re[j] = reIn[i]; im[j] = imIn ? imIn[i] : 0; }
  for (let size = 2; size <= N; size <<= 1) {
    const half = size >> 1, step = -TWO_PI / size;
    for (let start = 0; start < N; start += size) for (let k = 0; k < half; k++) {
      const wr = Math.cos(step * k), wi = Math.sin(step * k), i1 = start + k, i2 = i1 + half;
      const tr = re[i2] * wr - im[i2] * wi, ti = re[i2] * wi + im[i2] * wr;
      re[i2] = re[i1] - tr; im[i2] = im[i1] - ti; re[i1] += tr; im[i1] += ti;
    }
  }
  return { re, im };
}

/** Power in every bin of the first half, normalised so a full-scale sine totals 1. */
function powerSpectrum(x) {
  const N = x.length, X = fft(x, new Array(N).fill(0)), p = new Array(N / 2);
  for (let k = 0; k < N / 2; k++) p[k] = (X.re[k] ** 2 + X.im[k] ** 2) / (N * N / 4);
  return p;
}

/** Where harmonic h of a tone in bin m lands after folding around f_s/2. */
function harmonicBin(m, h, N) {
  let b = (m * h) % N;
  if (b > N / 2) b = N - b;
  return b;
}

/**
 * Every AC figure of merit from one coherently sampled record.
 * `m` is the signal bin (integer, so no window and no leakage), `amp` the tone
 * amplitude as a fraction of full scale, used for the full-scale back-off.
 */
function acMetrics(x, m, { amp = 1, harmonics = 9 } = {}) {
  const N = x.length, p = powerSpectrum(x), skirt = 1; // bins either side counted as signal
  const isSig = (k) => Math.abs(k - m) <= skirt;
  const hBins = new Set();
  for (let h = 2; h <= harmonics; h++) {
    const b = harmonicBin(m, h, N);
    if (b > skirt && !isSig(b)) for (let d = -skirt; d <= skirt; d++) hBins.add(b + d);
  }
  let pSig = 0, pHarm = 0, pNoise = 0, worstSpur = 0, worstBin = -1;
  for (let k = 1; k < N / 2; k++) {          // bin 0 is DC: excluded from every figure
    if (isSig(k)) { pSig += p[k]; continue; }
    if (hBins.has(k)) { pHarm += p[k]; } else { pNoise += p[k]; }
    if (p[k] > worstSpur) { worstSpur = p[k]; worstBin = k; }
  }
  const db = (r) => 10 * Math.log10(Math.max(r, 1e-30));
  const backoff = -20 * Math.log10(Math.max(amp, 1e-9));   // dB below full scale
  const snr = db(pSig / pNoise);
  const sinad = db(pSig / (pNoise + pHarm));
  const thd = db(pHarm / pSig);                            // negative dB
  const sfdr = db(pSig / worstSpur);
  return {
    snr, sinad, thd, sfdr, worstBin,
    thdPercent: 100 * Math.sqrt(pHarm / pSig),
    enob: enobFromSinad(sinad, backoff),
    snrFs: snr + backoff,
    noiseFloorDb: db(pNoise / (N / 2)) ,                   // average per-bin noise
    harmonicDb: Array.from({ length: harmonics - 1 }, (_, i) => {
      const b = harmonicBin(m, i + 2, N);
      return { h: i + 2, bin: b, db: db((p[b] || 0) / pSig) };
    }),
    spectrumDb: p.map((v) => 10 * Math.log10(Math.max(v, 1e-30))),
  };
}

/* --------------------------------------------------------- signal generation */

function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function gaussian(next) { let s = 0; for (let i = 0; i < 12; i++) s += next(); return s - 6; }

/**
 * One coherently sampled record from a converter carrying the impairments you ask for.
 * m = signal bin, amp = fraction of full scale, jitterRms in seconds, fs in Hz,
 * hd2/hd3 in dBc, noiseLsb = input-referred rms noise in LSB.
 */
function capture({ bits = 12, N = 4096, m = 111, amp = 0.9, fs = 100e6, jitter = 0,
                   hd2 = -Infinity, hd3 = -Infinity, noiseLsb = 0, offsetLsb = 0, gainErr = 0,
                   inlAmp = 0, seed = 7, fsr = 2 } = {}) {
  const next = rng(seed), q = lsb(bits, fsr), fin = m / N * fs, x = new Array(N);
  const a2 = 10 ** (hd2 / 20), a3 = 10 ** (hd3 / 20);
  for (let n = 0; n < N; n++) {
    const tj = jitter ? jitter * gaussian(next) : 0;
    const ph = TWO_PI * fin * (n / fs + tj);
    let v = amp * Math.sin(ph);
    // Static distortion, written as explicit harmonics so hd2/hd3 are exact in dBc.
    if (isFinite(hd2)) v += amp * a2 * Math.sin(2 * ph + 0.4);
    if (isFinite(hd3)) v += amp * a3 * Math.sin(3 * ph + 1.1);
    // A gentle bow in the transfer curve is what INL does to a sine.
    if (inlAmp) v += inlAmp * q * Math.sin(Math.PI * (v + 1) / 2) * Math.cos(Math.PI * (v + 1));
    if (noiseLsb) v += noiseLsb * q * gaussian(next);
    v = v * (1 + gainErr) + offsetLsb * q;
    x[n] = quantize(Math.max(-1, Math.min(0.999999, v)), bits, fsr);
  }
  return x;
}

/* ------------------------------------------------------------ time and speed */

/** Best SNR a sampling clock with t_j rms jitter allows at input frequency f. */
function jitterSnr(f, tj) { return -20 * Math.log10(TWO_PI * f * tj); }

/** The jitter you may spend to keep an N-bit converter's own SNR at frequency f. */
function jitterBudget(f, bits) { return 1 / (TWO_PI * f * 10 ** (idealSnr(bits) / 20)); }

/** Time constants needed to settle to within half an LSB of an N-bit result. */
function settlingTaus(bits) { return Math.log(2 ** (bits + 1)); }

/** Single-pole settling error, in LSB, after t seconds with time constant tau. */
function settleErrorLsb(t, tau, bits) { return 2 ** bits * Math.exp(-t / tau); }

/** −3 dB point of a single-pole input stage. */
function bandwidthOf(tau) { return 1 / (TWO_PI * tau); }

/** Slew rate a full-scale sine demands at frequency f. */
function slewNeeded(fsrVolts, f) { return Math.PI * fsrVolts * f; }

/* -------------------------------------------------------- power and quality */

/** Walden figure of merit: energy per conversion step, joules. Lower is better. */
function waldenFoM(powerW, enob, fs) { return powerW / (2 ** enob * fs); }

/** Schreier figure of merit, dB. Higher is better. */
function schreierFoM(sndrDb, bwHz, powerW) { return sndrDb + 10 * Math.log10(bwHz / powerW); }

/** Codes you can trust once input-referred noise is counted (peak-to-peak, 6.6 sigma). */
function noiseFreeBits(bits, rmsNoiseLsb) {
  if (rmsNoiseLsb <= 0) return bits;
  return Math.log2(codes(bits) / (6.6 * rmsNoiseLsb));
}
/** The same idea with rms noise instead of peak-to-peak. */
function effectiveResolutionBits(bits, rmsNoiseLsb) {
  if (rmsNoiseLsb <= 0) return bits;
  return Math.log2(codes(bits) / rmsNoiseLsb);
}

/** Thermal noise floor of a source resistance, V rms, over a bandwidth. */
function thermalNoiseV(rOhm, bwHz, tK = 300) { return Math.sqrt(4 * 1.380649e-23 * tK * rOhm * bwHz); }

module.exports = {
  TWO_PI, lsb, codes, idealSnr, enobFromSinad, processingGain, shapingPerOctave,
  transitions, quantize, quantizeWith, linearity,
  fft, powerSpectrum, harmonicBin, acMetrics, capture, rng, gaussian,
  jitterSnr, jitterBudget, settlingTaus, settleErrorLsb, bandwidthOf, slewNeeded,
  waldenFoM, schreierFoM, noiseFreeBits, effectiveResolutionBits, thermalNoiseV,
};

/* --------------------------------------------------------------- self-checks */
if (require.main === module) {
  const assert = require('assert');
  const out = [];
  const check = (name, fn) => {
    try { fn(); out.push('PASS  ' + name); }
    catch (e) { out.push('FAIL  ' + name + ': ' + e.message); process.exitCode = 1; }
  };

  check('LSB of a 12-bit converter over 2 V is 488 µV', () => {
    assert(Math.abs(lsb(12, 2) - 488.28125e-6) < 1e-9);
  });

  check('ideal SNR: 8 bit 49.9 dB, 12 bit 74.0 dB, 16 bit 98.1 dB', () => {
    assert(Math.abs(idealSnr(8) - 49.92) < 0.01);
    assert(Math.abs(idealSnr(12) - 74.0) < 0.01);
    assert(Math.abs(idealSnr(16) - 98.08) < 0.01);
  });

  check('a clean 12-bit capture measures close to its ideal SNR', () => {
    const x = capture({ bits: 12, N: 8192, m: 419, amp: 0.999, seed: 3 });
    const r = acMetrics(x, 419, { amp: 0.999 });
    assert(Math.abs(r.snr - idealSnr(12)) < 1.5, 'SNR ' + r.snr.toFixed(2));
    assert(Math.abs(r.enob - 12) < 0.3, 'ENOB ' + r.enob.toFixed(2));
  });

  check('ENOB tracks the full-scale back-off, not just raw SINAD', () => {
    const x = capture({ bits: 12, N: 8192, m: 419, amp: 0.1, seed: 5 });
    const r = acMetrics(x, 419, { amp: 0.1 });
    // 20 dB of back-off costs 20 dB of SINAD but leaves the converter's ENOB alone.
    assert(r.sinad < idealSnr(12) - 15, 'SINAD ' + r.sinad.toFixed(1));
    assert(Math.abs(r.enob - 12) < 0.6, 'ENOB ' + r.enob.toFixed(2));
  });

  check('an injected −60 dBc second harmonic is measured back at −60 dBc', () => {
    const x = capture({ bits: 16, N: 8192, m: 419, amp: 0.8, hd2: -60, seed: 11 });
    const r = acMetrics(x, 419, { amp: 0.8 });
    const h2 = r.harmonicDb.find((h) => h.h === 2).db;
    assert(Math.abs(h2 + 60) < 1.5, 'HD2 measured ' + h2.toFixed(1));
    assert(Math.abs(r.sfdr - 60) < 1.5, 'SFDR ' + r.sfdr.toFixed(1));
  });

  check('SINAD sits below SNR once distortion is present', () => {
    const x = capture({ bits: 14, N: 8192, m: 419, amp: 0.9, hd3: -55, seed: 13 });
    const r = acMetrics(x, 419, { amp: 0.9 });
    assert(r.sinad < r.snr - 1, 'snr ' + r.snr.toFixed(1) + ' sinad ' + r.sinad.toFixed(1));
  });

  check('an ideal staircase has zero DNL and zero INL', () => {
    const t = transitions(8, {});
    const L = linearity(t, 8);
    assert(L.dnlMax < 1e-9 && L.inlMax < 1e-9, 'dnl ' + L.dnlMax + ' inl ' + L.inlMax);
    assert(L.monotonic && !L.missing);
  });

  check('a −1 LSB DNL step is reported as a missing code', () => {
    const n = codes(8) - 1, dnl = new Array(n).fill(0);
    dnl[100] = -1; dnl[101] = 1;              // one code squeezed out, the next takes its width
    const L = linearity(transitions(8, { dnl }), 8);
    assert(L.missing, 'missing code not detected');
  });

  check('offset shifts every transition, gain error stretches them', () => {
    const q = lsb(10, 2);
    const t0 = transitions(10, {}), tOff = transitions(10, { offsetLsb: 3 });
    assert(Math.abs((tOff[0] - t0[0]) / q - 3) < 1e-9, 'offset');
    const tG = transitions(10, { gainErr: 0.01 });
    assert(tG[1000] > t0[1000] && Math.abs(tG[0] - t0[0]) < Math.abs(tG[1000] - t0[1000]), 'gain');
  });

  check('jitter budget and jitter SNR are inverses', () => {
    const tj = jitterBudget(100e6, 12);
    assert(Math.abs(jitterSnr(100e6, tj) - idealSnr(12)) < 0.01);
  });

  check('settling: 12 bits needs about 9 time constants', () => {
    const taus = settlingTaus(12);
    assert(taus > 8.9 && taus < 9.1, String(taus));
    assert(settleErrorLsb(taus, 1, 12) < 0.5001);
  });

  check('oversampling: every doubling of OSR is 3 dB, 15 dB with 2nd-order shaping', () => {
    assert(Math.abs(processingGain(2) - 3.01) < 0.01);
    assert(shapingPerOctave(2) === 15);
  });

  check('noise-free bits fall below resolution once noise exceeds a third of an LSB', () => {
    assert(Math.abs(noiseFreeBits(16, 0) - 16) < 1e-9);
    const nf = noiseFreeBits(16, 1);
    assert(nf > 13.2 && nf < 13.3, String(nf));
  });

  check('figures of merit on a real part: 12 bit, 100 MSPS, 300 mW', () => {
    const w = waldenFoM(0.3, 11.5, 100e6);
    assert(w > 1.0e-12 && w < 1.1e-12, w.toExponential(3));
    const s = schreierFoM(71, 50e6, 0.3);
    assert(Math.abs(s - 153.2) < 0.5, String(s));
  });

  console.log(out.join('\n'));
  console.log(process.exitCode ? '\nSome checks FAILED' : '\nAll ADC self-checks passed');
}
