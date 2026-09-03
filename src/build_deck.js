// Builds presentation/RF_Signal_Processing.pptx from src/content.js.
// Every figure is a native PowerPoint chart whose data comes from src/dsp.js.

const path = require('path');
const pptxgen = require('pptxgenjs');
const dsp = require('./dsp');
const T = require('./theme');
const D = require('./diagrams');
const { PARTS, SLIDES } = require('./content');

const { C, F, W, H, M } = T;
const pres = new pptxgen();
pres.layout = 'LAYOUT_16x9';
pres.title = 'RF Signal Processing: equations, ADC internals, FFT and IFFT';
pres.subject = 'RF signal processing presentation';
pres.company = 'RF_Signal_Processing_Equations';

const CT = pres.ChartType;
const TOP = 1.12; // content area top
const BOTTOM = H - 0.5; // content area bottom (footer below)

// ---------------------------------------------------------------- helpers

function labelsOf(arr, d = 2) {
  return arr.map((v) => T.fmt(v, d));
}

function eqStack(slide, eqs, box, opts = {}) {
  const gap = 0.1;
  const h = (box.h - gap * (eqs.length - 1)) / eqs.length;
  eqs.forEach((e, i) => {
    T.equation(slide, e.eq, { x: box.x, y: box.y + i * (h + gap), w: box.w, h }, { caption: e.cap, fontSize: opts.fontSize || (e.eq.length > 60 ? 14 : e.eq.length > 40 ? 16 : 18), dark: opts.dark });
  });
}

function table(slide, rows, box, opts = {}) {
  const cols = rows[0].length;
  const colW = opts.colW || Array(cols).fill(box.w / cols);
  const data = rows.map((r, ri) =>
    r.map((cell) => ({
      text: String(cell),
      options: {
        bold: ri === 0 && !opts.noHeader,
        color: ri === 0 && !opts.noHeader ? C.white : opts.dark ? C.white : C.ink,
        fill: { color: ri === 0 && !opts.noHeader ? C.navy : opts.dark ? C.tintDark : ri % 2 ? C.tint : C.white },
        fontFace: opts.mathCol === undefined ? F.body : F.body,
        fontSize: opts.fontSize || 10,
        valign: 'middle',
      },
    }))
  );
  if (opts.mathCol !== undefined) data.forEach((r, ri) => { if (ri > 0 || opts.noHeader) r[opts.mathCol].options.fontFace = F.math; });
  slide.addTable(data, {
    x: box.x,
    y: box.y,
    w: box.w,
    colW,
    rowH: opts.rowH || (box.h ? box.h / rows.length : undefined),
    border: { type: 'solid', pt: 0.5, color: opts.dark ? C.navy : C.grid },
    margin: 0.05,
    fontFace: F.body,
    autoPage: false,
  });
}

function lineChart(slide, data, box, opts = {}) {
  slide.addChart(CT.line, data, Object.assign({ x: box.x, y: box.y, w: box.w, h: box.h }, T.lineChart(data.length, opts)));
}

function barChart(slide, data, box, opts = {}) {
  slide.addChart(CT.bar, data, Object.assign({ x: box.x, y: box.y, w: box.w, h: box.h }, T.barChart(data.length, opts)));
}

/** Combo: dense line series plus a stem (bar) series marking sample instants. */
function stemCombo(slide, labels, lines, stems, box, opts = {}) {
  const lineData = lines.map(([name, values]) => ({ name, labels, values }));
  const barData = [{ name: stems.name, labels, values: stems.values }];
  const lineColors = opts.lineColors || [C.teal, C.coral, C.amber];
  slide.addChart(
    [
      { type: CT.bar, data: barData, options: { chartColors: [opts.stemColor || C.navy], barGapWidthPct: 20 } },
      { type: CT.line, data: lineData, options: { chartColors: lineColors, lineSize: 1.5, lineDataSymbol: 'none' } },
    ],
    Object.assign({ x: box.x, y: box.y, w: box.w, h: box.h }, T.chartBase(lines.length + 1, Object.assign({ valAxisCrossesAt: 'autoZero', valAxisLabelFormatCode: '0.0' }, opts)))
  );
}

function notesFor(s) {
  let n = s.notes || '';
  if (s.expert) n += '\n\nExpert corner: ' + s.expert;
  if (s.chartNote) n += '\n\nChart: ' + s.chartNote;
  return n;
}

function meta(s, number) {
  return { section: PARTS[s.part].name, number };
}

// ---------------------------------------------------------------- slide kinds

function titleSlide(s) {
  const slide = T.darkSlide(pres);
  slide.addText(s.title, { x: M, y: 1.3, w: W - 2 * M, h: 1.1, fontFace: F.head, fontSize: 48, bold: true, color: C.white, isTextBox: true, margin: 0 });
  slide.addText(s.subtitle, { x: M, y: 2.4, w: W - 2 * M, h: 0.6, fontFace: F.body, fontSize: 20, color: C.teal, isTextBox: true, margin: 0 });
  slide.addText('Equations · ADC internals · FFT and IFFT  ·  about 90 minutes', { x: M, y: 3.05, w: W - 2 * M, h: 0.4, fontFace: F.body, fontSize: 12, color: 'B8C4D6', isTextBox: true, margin: 0 });
  D.rfChain(slide, { x: M, y: 4.2, w: W - 2 * M, h: 0.55 }, { dark: true, fontSize: 10 });
  slide.addNotes(notesFor(s));
}

function sectionSlide(s, number) {
  const slide = T.darkSlide(pres);
  slide.addText(PARTS[s.part].name.split(' · ')[0], { x: M, y: 1.2, w: 6, h: 0.4, fontFace: F.body, fontSize: 14, color: C.teal, bold: true, isTextBox: true, margin: 0 });
  slide.addText(s.title.split(' · ').slice(1).join(' · ') || s.title, { x: M, y: 1.6, w: W - 2 * M, h: 1.0, fontFace: F.head, fontSize: 40, bold: true, color: C.white, isTextBox: true, margin: 0, valign: 'middle' });
  slide.addText(s.subtitle, { x: M, y: 2.65, w: W - 2 * M, h: 0.5, fontFace: F.body, fontSize: 16, color: 'D7DEE8', isTextBox: true, margin: 0 });
  slide.addText(`${PARTS[s.part].minutes} minutes`, { x: M, y: 3.2, w: 4, h: 0.3, fontFace: F.body, fontSize: 11, color: 'B8C4D6', isTextBox: true, margin: 0 });
  slide.addText('You are here', { x: M, y: 3.95, w: 3, h: 0.25, fontFace: F.body, fontSize: 9, color: 'B8C4D6', italic: true, isTextBox: true, margin: 0 });
  D.rfChain(slide, { x: M, y: 4.2, w: W - 2 * M, h: 0.55 }, { dark: true, highlight: s.focus, fontSize: 10 });
  slide.addText(String(number), { x: W - M - 1, y: H - 0.38, w: 1, h: 0.25, fontFace: F.body, fontSize: 9, color: '8FA3BF', align: 'right', isTextBox: true, margin: 0 });
  slide.addNotes(notesFor(s));
}

function recapSlide(s, number) {
  const slide = T.darkSlide(pres);
  slide.addText(s.title, { x: M, y: 0.45, w: W - 2 * M, h: 0.7, fontFace: F.head, fontSize: 30, bold: true, color: C.white, isTextBox: true, margin: 0, valign: 'middle' });
  if (s.cheatsheet) {
    table(slide, s.cheatsheet, { x: M, y: 1.3, w: W - 2 * M }, { noHeader: true, dark: true, colW: [1.6, W - 2 * M - 1.6], fontSize: 11, mathCol: 1, rowH: 0.34 });
  } else {
    const items = s.bullets;
    const rowH = Math.min(0.62, (BOTTOM - 1.35) / items.length);
    items.forEach((b, i) => {
      const y = 1.35 + i * rowH;
      slide.addShape('ellipse', { x: M, y: y + 0.1, w: 0.3, h: 0.3, fill: { color: C.teal }, line: { color: C.teal } });
      slide.addText('✓', { x: M, y: y + 0.1, w: 0.3, h: 0.3, fontSize: 12, bold: true, color: C.navy, align: 'center', valign: 'middle', isTextBox: true, margin: 0 });
      slide.addText(b, { x: M + 0.45, y, w: W - 2 * M - 0.45, h: rowH, fontFace: F.body, fontSize: 16, color: C.white, valign: 'middle', isTextBox: true, margin: 0 });
    });
  }
  slide.addText(String(number), { x: W - M - 1, y: H - 0.38, w: 1, h: 0.25, fontFace: F.body, fontSize: 9, color: '8FA3BF', align: 'right', isTextBox: true, margin: 0 });
  slide.addNotes(notesFor(s));
}

function endSlide(s, number) {
  const slide = T.darkSlide(pres);
  slide.addText(s.title, { x: M, y: 0.9, w: W - 2 * M, h: 1.0, fontFace: F.head, fontSize: 48, bold: true, color: C.white, isTextBox: true, margin: 0 });
  slide.addText('Further reading', { x: M, y: 2.2, w: 5, h: 0.35, fontFace: F.body, fontSize: 12, bold: true, color: C.teal, isTextBox: true, margin: 0 });
  T.bullets(slide, s.references, { x: M, y: 2.6, w: W - 2 * M, h: 2.0 }, { color: 'D7DEE8', fontSize: 12, gap: 4 });
  slide.addText(String(number), { x: W - M - 1, y: H - 0.38, w: 1, h: 0.25, fontFace: F.body, fontSize: 9, color: '8FA3BF', align: 'right', isTextBox: true, margin: 0 });
  slide.addNotes(notesFor(s));
}

// ---------------------------------------------------------------- per-slide visuals

const build = {};

build.agenda = (s, slide) => {
  const rowH = 0.6;
  s.bullets.forEach((b, i) => {
    const [head, rest] = b.split(': ');
    const y = TOP + i * (rowH + 0.08);
    slide.addShape('ellipse', { x: M, y: y + 0.12, w: 0.36, h: 0.36, fill: { color: C.teal }, line: { color: C.teal } });
    slide.addText(String(i + 1), { x: M, y: y + 0.12, w: 0.36, h: 0.36, fontFace: F.body, fontSize: 12, bold: true, color: C.navy, align: 'center', valign: 'middle', isTextBox: true, margin: 0 });
    slide.addText(
      [
        { text: head.replace(/^Part \d · /, ''), options: { bold: true, color: C.navy, breakLine: true } },
        { text: rest, options: { color: C.ink, fontSize: 11 } },
      ],
      { x: M + 0.5, y, w: 4.3, h: rowH, fontFace: F.body, fontSize: 13, valign: 'middle', isTextBox: true, margin: 0 }
    );
  });
  slide.addShape('roundRect', { x: 5.5, y: TOP, w: 4.0, h: 3.45, fill: { color: C.navy }, line: { color: C.navy }, rectRadius: 0.1 });
  slide.addText('After this talk you will be able to', { x: 5.75, y: TOP + 0.2, w: 3.5, h: 0.4, fontFace: F.body, fontSize: 13, bold: true, color: C.teal, isTextBox: true, margin: 0 });
  T.bullets(slide, s.outcomes, { x: 5.75, y: TOP + 0.7, w: 3.5, h: 2.6 }, { color: C.white, fontSize: 12.5, gap: 8 });
  T.caption(slide, 'Beginner path: intuition → equation → recap.  Expert path: the ★ expert corners.', { x: M, y: 4.62, w: W - 2 * M, h: 0.3 });
};

build.bigpicture = (s, slide) => {
  D.rfChain(slide, { x: M, y: TOP + 0.15, w: W - 2 * M, h: 1.15 }, { sub: true, fontSize: 12 });
  const half = Math.ceil(s.bullets.length / 2);
  T.bullets(slide, s.bullets.slice(0, half), { x: M, y: 2.75, w: 4.3, h: 2.0 }, { fontSize: 12.5, gap: 8 });
  T.bullets(slide, s.bullets.slice(half), { x: 5.2, y: 2.75, w: 4.3, h: 2.0 }, { fontSize: 12.5, gap: 8 });
};

build.sine = (s, slide) => {
  eqStack(slide, s.equations, { x: M, y: TOP, w: 4.4, h: 1.7 });
  T.bullets(slide, s.bullets, { x: M, y: 2.95, w: 4.4, h: 1.3 }, { fontSize: 12 });
  const t = dsp.linspace(0, 2e-3, 201);
  const a = dsp.sine(t, 1000, 1, 0);
  const b = dsp.sine(t, 1000, 0.6, Math.PI / 2);
  lineChart(slide, T.series(labelsOf(t.map((v) => v * 1e3), 2), ['A = 1, φ = 0°', a], ['A = 0.6, φ = 90°', b]), { x: 5.1, y: TOP, w: 4.4, h: 3.0 }, { catAxisLabelFrequency: 25, showCatAxisTitle: true, catAxisTitle: 'time (ms)  ·  f = 1 kHz', showValAxisTitle: true, valAxisTitle: 'x(t)', valAxisMinVal: -1.2, valAxisMaxVal: 1.2, valAxisMajorUnit: 0.4, valAxisLabelFormatCode: '0.0' });
  T.expertCorner(slide, s.expert, { x: M, y: 4.3, w: W - 2 * M, h: 0.72 });
};

build.db = (s, slide) => {
  eqStack(slide, s.equations, { x: M, y: TOP, w: 4.7, h: 1.8 });
  table(slide, s.table, { x: 5.4, y: TOP, w: 4.1 }, { colW: [0.8, 0.9, 2.4], fontSize: 10, rowH: 0.3 });
  const stats = [['×2', '= +3 dB'], ['×10', '= +10 dB'], ['×1000', '= +30 dB']];
  stats.forEach(([v, l], i) => T.stat(slide, v, l, { x: M + i * 1.6, y: 3.15, w: 1.5, h: 0.9 }, { fontSize: 26 }));
  T.caption(slide, 'Three numbers to memorise; everything else is a sum of these.', { x: M, y: 4.1, w: 4.7, h: 0.3 });
  T.expertCorner(slide, 'The 20 log form for voltage assumes equal source and load impedance. Mixing 10 log (power) and 20 log (voltage) is the most common dB mistake in link budgets.', { x: 5.4, y: 3.3, w: 4.1, h: 1.1 });
};

build.modulation = (s, slide) => {
  eqStack(slide, s.equations, { x: M, y: TOP, w: 4.6, h: 1.75 });
  T.bullets(slide, s.bullets, { x: M, y: 3.0, w: 4.6, h: 1.2 }, { fontSize: 12 });
  const t = dsp.linspace(0, 1, 241);
  const I = t.map((v) => Math.cos(2 * Math.PI * 1.0 * v));
  const Q = t.map((v) => 0.8 * Math.sin(2 * Math.PI * 1.5 * v));
  const x = t.map((v, i) => I[i] * Math.cos(2 * Math.PI * 16 * v) - Q[i] * Math.sin(2 * Math.PI * 16 * v));
  lineChart(slide, T.series(labelsOf(t, 2), ['x(t) = I cos ωt − Q sin ωt', x], ['I(t)', I], ['Q(t)', Q]), { x: 5.3, y: TOP, w: 4.2, h: 3.05 }, { chartColors: [C.slate, C.teal, C.coral], lineSize: 1.25, catAxisLabelFrequency: 40, showCatAxisTitle: true, catAxisTitle: 'time (arbitrary units)', valAxisMinVal: -1.5, valAxisMaxVal: 1.5, valAxisMajorUnit: 0.5 });
  T.expertCorner(slide, s.expert, { x: M, y: 4.3, w: W - 2 * M, h: 0.72 });
};

build.iq = (s, slide) => {
  const eqW = (W - 2 * M - 0.2) / 2;
  s.equations.forEach((e, i) => T.equation(slide, e.eq, { x: M + i * (eqW + 0.2), y: TOP, w: eqW, h: 0.85 }, { caption: e.cap, fontSize: 16 }));
  T.bullets(slide, s.bullets, { x: M, y: 2.08, w: W - 2 * M, h: 0.9 }, { fontSize: 11.5, gap: 3 });
  // RF spectrum: AM tone at bin 20 of 64
  const N = 64;
  const n = Array.from({ length: N }, (_, i) => i);
  const x = n.map((i) => (1 + 0.5 * Math.cos((2 * Math.PI * 2 * i) / N)) * Math.cos((2 * Math.PI * 20 * i) / N));
  const X = dsp.fft(x, new Array(N).fill(0));
  const magRf = dsp.magnitude(X.re, X.im).map((v) => v / (N / 2));
  // complex baseband: mix with e^{-j2π20n/N}, ideal low-pass by keeping |k| <= 8
  const sr = n.map((i) => x[i] * Math.cos((2 * Math.PI * 20 * i) / N));
  const si = n.map((i) => -x[i] * Math.sin((2 * Math.PI * 20 * i) / N));
  const S = dsp.fft(sr, si);
  const magBb = dsp.magnitude(S.re, S.im).map((v, k) => {
    const kk = k <= N / 2 ? k : k - N;
    return Math.abs(kk) <= 8 ? v / (N / 2) : 0;
  });
  const shifted = [];
  const shiftedLabels = [];
  for (let k = -N / 2; k < N / 2; k++) {
    shifted.push(magBb[(k + N) % N]);
    shiftedLabels.push(String(k));
  }
  barChart(slide, T.series(n.map(String), ['|X[k]| (RF, real signal)', magRf]), { x: M, y: 3.0, w: 4.4, h: 1.55 }, { showValue: false, catAxisLabelFrequency: 8, showCatAxisTitle: true, catAxisTitle: 'bin  (carrier at 20, mirror at 44)', barGapWidthPct: 30 });
  barChart(slide, T.series(shiftedLabels, ['|S[k]| (complex baseband after I/Q mix + LPF)', shifted]), { x: 5.1, y: 3.0, w: 4.4, h: 1.55 }, { showValue: false, catAxisLabelFrequency: 8, showCatAxisTitle: true, catAxisTitle: 'bin  (negative frequencies are real here)', barGapWidthPct: 30, chartColors: [C.coral] });
  T.caption(slide, s.chartNote, { x: M, y: 4.6, w: W - 2 * M, h: 0.3 });
};

build.noise = (s, slide) => {
  eqStack(slide, s.equations, { x: M, y: TOP, w: 5.3, h: 2.85 }, { fontSize: 15 });
  T.bullets(slide, s.bullets, { x: 6.1, y: TOP, w: 3.4, h: 1.7 }, { fontSize: 12 });
  T.expertCorner(slide, s.expert, { x: 6.1, y: 2.9, w: 3.4, h: 1.75 });
  T.stat(slide, '−174', 'dBm/Hz thermal noise density at 290 K', { x: M, y: 4.1, w: 2.5, h: 0.9 }, { fontSize: 28 });
  T.stat(slide, '−101', 'dBm noise floor in a 20 MHz channel', { x: 3.1, y: 4.1, w: 2.7, h: 0.9 }, { fontSize: 28 });
};

build.linkbudget = (s, slide) => {
  const eqW = (W - 2 * M - 0.2) / 2;
  s.equations.forEach((e, i) => T.equation(slide, e.eq, { x: M + i * (eqW + 0.2), y: TOP, w: eqW, h: 0.85 }, { caption: e.cap, fontSize: 15 }));
  table(slide, s.table, { x: M, y: 2.15, w: 5.9 }, { colW: [1.9, 1.2, 2.8], fontSize: 10, rowH: 0.36 });
  T.stat(slide, '−50 dBm', 'received power at 50 m', { x: 6.6, y: 2.2, w: 2.9, h: 1.0 });
  T.stat(slide, '≈ 51 dB', 'SNR above the −101 dBm thermal floor', { x: 6.6, y: 3.3, w: 2.9, h: 1.0 }, { color: C.teal });
  T.caption(slide, 'FSPL grows 6 dB per doubling of distance or frequency.', { x: 6.6, y: 4.4, w: 2.9, h: 0.4 });
};

build.sampling = (s, slide) => {
  T.equation(slide, s.equations[0].eq, { x: M, y: TOP, w: 4.4, h: 0.95 }, { caption: s.equations[0].cap, fontSize: 18 });
  T.bullets(slide, s.bullets, { x: M, y: 2.2, w: 4.4, h: 1.9 }, { fontSize: 12 });
  const fs = 12e3;
  const f = 1e3;
  const per = 12;
  const nS = 36;
  const pts = nS * per + 1;
  const t = Array.from({ length: pts }, (_, i) => i / (fs * per));
  const cont = t.map((v) => Math.cos(2 * Math.PI * f * v));
  const stems = t.map((v, i) => (i % per === 0 ? cont[i] : 0));
  stemCombo(slide, labelsOf(t.map((v) => v * 1e3), 2), [['x(t): 1 kHz sine', cont]], { name: 'x[n]: samples at 12 kSPS', values: stems }, { x: 5.1, y: TOP, w: 4.4, h: 3.0 }, { catAxisLabelFrequency: per * 6, showCatAxisTitle: true, catAxisTitle: 'time (ms)', valAxisMinVal: -1.2, valAxisMaxVal: 1.2, valAxisMajorUnit: 0.4 });
  T.expertCorner(slide, s.expert, { x: M, y: 4.3, w: W - 2 * M, h: 0.72 });
};

build.nyquist = (s, slide) => {
  eqStack(slide, s.equations, { x: M, y: TOP, w: 4.4, h: 1.75 }, { fontSize: 16 });
  T.bullets(slide, s.bullets, { x: M, y: 3.0, w: 4.4, h: 1.2 }, { fontSize: 12 });
  const fs = 8e3;
  const per = 30;
  const nS = 8;
  const pts = nS * per + 1;
  const t = Array.from({ length: pts }, (_, i) => i / (fs * per));
  const hi = t.map((v) => Math.cos(2 * Math.PI * 9e3 * v));
  const lo = t.map((v) => Math.cos(2 * Math.PI * 1e3 * v));
  const stems = t.map((v, i) => (i % per === 0 ? hi[i] : 0));
  stemCombo(slide, labelsOf(t.map((v) => v * 1e3), 3), [['1 kHz alias', lo], ['9 kHz input', hi]], { name: 'samples at 8 kSPS', values: stems }, { x: 5.1, y: TOP, w: 4.4, h: 3.0 }, { catAxisLabelFrequency: per, showCatAxisTitle: true, catAxisTitle: 'time (ms)', valAxisMinVal: -1.2, valAxisMaxVal: 1.2, valAxisMajorUnit: 0.4, lineColors: [C.teal, C.coral] });
  T.expertCorner(slide, s.expert, { x: M, y: 4.3, w: W - 2 * M, h: 0.72 });
};

build.antialias = (s, slide) => {
  T.bullets(slide, s.bullets, { x: M, y: TOP, w: 4.6, h: 1.6 }, { fontSize: 12.5 });
  T.equation(slide, s.equations[0].eq, { x: M, y: 2.8, w: 4.6, h: 0.95 }, { caption: s.equations[0].cap, fontSize: 14 });
  const fr = dsp.linspace(0, 1, 51);
  const fc = 0.4;
  const butter = fr.map((v) => -10 * Math.log10(1 + Math.pow(v / fc, 10)));
  const brick = fr.map((v) => (v <= 0.5 ? 0 : -80));
  lineChart(slide, T.series(labelsOf(fr, 2), ['5th-order Butterworth, f_c = 0.4 f_s', butter.map((v) => Math.max(v, -80))], ['ideal brick wall at f_s/2', brick]), { x: 5.3, y: TOP, w: 4.2, h: 2.6 }, { catAxisLabelFrequency: 5, showCatAxisTitle: true, catAxisTitle: 'frequency / f_s   (f_s/2 = 0.50)', showValAxisTitle: true, valAxisTitle: '|H| (dB)', valAxisMinVal: -80, valAxisMaxVal: 5, chartColors: [C.teal, C.coral] });
  T.caption(slide, 'Real filters need a transition band, so f_s is chosen above 2 × the signal bandwidth.', { x: 5.3, y: 3.78, w: 4.2, h: 0.3 });
  T.expertCorner(slide, s.expert, { x: M, y: 4.15, w: W - 2 * M, h: 0.9 });
};

build.reconstruction = (s, slide) => {
  T.equation(slide, s.equations[0].eq, { x: M, y: TOP, w: 4.4, h: 0.95 }, { caption: s.equations[0].cap, fontSize: 16 });
  T.bullets(slide, s.bullets, { x: M, y: 2.2, w: 4.4, h: 2.4 }, { fontSize: 12 });
  const fs = 10e3;
  const per = 10;
  const nS = 20;
  const sig = (tt) => Math.cos(2 * Math.PI * 1000 * tt) + 0.5 * Math.cos(2 * Math.PI * 2300 * tt + 1);
  const pts = nS * per + 1;
  const t = Array.from({ length: pts }, (_, i) => i / (fs * per));
  const samples = [];
  for (let k = -40; k <= nS + 40; k++) samples.push({ k, v: sig(k / fs) });
  const sinc = (u) => (Math.abs(u) < 1e-12 ? 1 : Math.sin(Math.PI * u) / (Math.PI * u));
  const recon = t.map((tt) => samples.reduce((a, sm) => a + sm.v * sinc(tt * fs - sm.k), 0));
  const zoh = t.map((tt) => sig(Math.floor(tt * fs + 1e-9) / fs));
  const stems = t.map((tt, i) => (i % per === 0 ? sig(tt) : 0));
  stemCombo(slide, labelsOf(t.map((v) => v * 1e3), 2), [['sinc reconstruction (= original)', recon], ['DAC staircase (zero-order hold)', zoh]], { name: 'samples x[n]', values: stems }, { x: 5.1, y: TOP, w: 4.4, h: 3.0 }, { catAxisLabelFrequency: per * 4, showCatAxisTitle: true, catAxisTitle: 'time (ms)  ·  f_s = 10 kSPS', valAxisMinVal: -1.6, valAxisMaxVal: 1.6, valAxisMajorUnit: 0.8, lineColors: [C.teal, C.amber] });
  T.caption(slide, 'The smooth curve is the unique band-limited signal through every sample.', { x: 5.1, y: 4.2, w: 4.4, h: 0.4 });
};

build.adcblocks = (s, slide) => {
  D.adcBlocks(slide, { x: M + 0.2, y: TOP + 0.1, w: W - 2 * M - 0.4, h: 2.3 });
  T.bullets(slide, s.bullets, { x: M, y: 3.6, w: W - 2 * M, h: 1.4 }, { fontSize: 12.5, gap: 5 });
};

build.sah = (s, slide) => {
  D.sampleHold(slide, { x: M, y: TOP - 0.05, w: W - 2 * M, h: 1.9 });
  T.equation(slide, s.equations[0].eq, { x: M, y: 3.35, w: 3.7, h: 0.78 }, { caption: s.equations[0].cap, fontSize: 15 });
  T.expertCorner(slide, s.expert, { x: M, y: 4.18, w: 3.7, h: 0.9 });
  const fMHz = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];
  const mk = (tj) => fMHz.map((f) => dsp.jitterSnr(f * 1e6, tj));
  lineChart(slide, T.series(fMHz.map(String), ['t_j = 100 fs', mk(100e-15)], ['t_j = 1 ps', mk(1e-12)], ['t_j = 10 ps', mk(10e-12)]), { x: 4.4, y: 3.35, w: 5.1, h: 1.75 }, { lineDataSymbol: 'circle', lineDataSymbolSize: 5, showCatAxisTitle: true, catAxisTitle: 'input frequency (MHz)', showValAxisTitle: true, valAxisTitle: 'SNR limit (dB)', valAxisMinVal: 20, valAxisMaxVal: 120, chartColors: [C.teal, C.amber, C.coral] });
};

build.quant = (s, slide) => {
  eqStack(slide, s.equations, { x: M, y: TOP, w: 4.4, h: 1.75 });
  T.bullets(slide, s.bullets, { x: M, y: 3.0, w: 4.4, h: 1.6 }, { fontSize: 12 });
  const v = dsp.linspace(-1, 1, 201);
  const q = v.map((x) => dsp.quantize(x, 3, 2));
  lineChart(slide, T.series(labelsOf(v, 2), ['analog input (ramp)', v], ['3-bit quantiser output', q]), { x: 5.1, y: TOP, w: 4.4, h: 3.0 }, { catAxisLabelFrequency: 25, showCatAxisTitle: true, catAxisTitle: 'V_in (V)  ·  V_FS = 2 V, LSB = 0.25 V', showValAxisTitle: true, valAxisTitle: 'V (V)', valAxisMinVal: -1, valAxisMaxVal: 1, chartColors: [C.slate, C.teal] });
  T.stat(slide, '8 levels', '3 bits → 2³ steps of 0.25 V', { x: 5.1, y: 4.15, w: 2.1, h: 0.85 }, { fontSize: 20 });
  T.stat(slide, '4096 levels', '12 bits → 488 µV steps', { x: 7.3, y: 4.15, w: 2.2, h: 0.85 }, { fontSize: 20 });
};

build.qerror = (s, slide) => {
  const eqW = (W - 2 * M - 0.2) / 2;
  s.equations.forEach((e, i) => T.equation(slide, e.eq, { x: M + i * (eqW + 0.2), y: TOP, w: eqW, h: 0.85 }, { caption: e.cap, fontSize: 16 }));
  T.bullets(slide, s.bullets, { x: M, y: 2.08, w: W - 2 * M, h: 0.85 }, { fontSize: 11.5, gap: 3 });
  const v = dsp.linspace(-1, 1, 201);
  const err = v.map((x) => x - dsp.quantize(x, 3, 2));
  lineChart(slide, T.series(labelsOf(v, 2), ['error e = V_in − V_q (3-bit)', err]), { x: M, y: 3.0, w: 4.4, h: 1.65 }, { catAxisLabelFrequency: 25, showCatAxisTitle: true, catAxisTitle: 'V_in (V)', valAxisMinVal: -0.15, valAxisMaxVal: 0.15, valAxisMajorUnit: 0.05, valAxisLabelFormatCode: '0.00', chartColors: [C.coral] });
  // histogram of 12-bit error on a busy signal
  const bits = 12;
  const lsb = 2 / Math.pow(2, bits);
  const bins = 10;
  const counts = new Array(bins).fill(0);
  const Ns = 8192;
  for (let i = 0; i < Ns; i++) {
    const x = 0.9 * Math.cos(2 * Math.PI * 0.0137 * i) + 0.05 * Math.cos(2 * Math.PI * 0.21 * i + 0.3);
    const e = x - dsp.quantize(x, bits, 2);
    let b = Math.floor((e + lsb / 2) / lsb * bins);
    b = Math.max(0, Math.min(bins - 1, b));
    counts[b] += 1;
  }
  const binLabels = counts.map((_, i) => `${((i + 0.5) / bins - 0.5).toFixed(2)} LSB`);
  barChart(slide, T.series(binLabels, ['count (12-bit, 8192 samples)', counts]), { x: 5.1, y: 3.0, w: 4.4, h: 1.65 }, { showValue: false, barGapWidthPct: 20, showCatAxisTitle: true, catAxisTitle: 'error (fraction of LSB)', valAxisMinVal: 0, chartColors: [C.teal] });
  T.caption(slide, 'Left: sawtooth error. Right: flat histogram → uniform → variance LSB²/12.', { x: M, y: 4.68, w: W - 2 * M, h: 0.3 });
};

build.snr = (s, slide) => {
  eqStack(slide, s.equations, { x: M, y: TOP, w: 5.3, h: 2.5 }, { fontSize: 13 });
  T.bullets(slide, s.bullets, { x: M, y: 3.75, w: 5.3, h: 0.95 }, { fontSize: 12 });
  const bits = [4, 6, 8, 10, 12, 14, 16, 18, 20, 24];
  lineChart(slide, T.series(bits.map(String), ['ideal SNR = 6.02 N + 1.76 dB', bits.map(dsp.snrBits)]), { x: 6.0, y: TOP, w: 3.5, h: 2.35 }, { lineDataSymbol: 'circle', lineDataSymbolSize: 6, showCatAxisTitle: true, catAxisTitle: 'bits N', showValAxisTitle: true, valAxisTitle: 'SNR (dB)', valAxisMinVal: 0, valAxisMaxVal: 160 });
  T.stat(slide, '6.02 dB', 'per bit', { x: 6.0, y: 3.55, w: 1.7, h: 1.1 }, { fontSize: 26, color: C.teal });
  T.stat(slide, '74 dB', '12-bit ideal', { x: 7.8, y: 3.55, w: 1.7, h: 1.1 }, { fontSize: 26 });
};

build.flash = (s, slide) => {
  D.flashAdc(slide, { x: M, y: TOP + 0.15, w: 4.6, h: 3.1 });
  T.bullets(slide, s.bullets, { x: 5.4, y: TOP, w: 4.1, h: 2.6 }, { fontSize: 12, gap: 5 });
  T.expertCorner(slide, s.expert, { x: 5.4, y: 3.85, w: 4.1, h: 1.2 });
};

build.sar = (s, slide) => {
  const r = dsp.sarSteps(0.7, 8, 1);
  const cycles = r.steps.map((st) => String(st.cycle));
  const trial = r.steps.map((st) => st.trial);
  const kept = [];
  let code = 0;
  r.steps.forEach((st, i) => {
    if (st.keep) code = Math.round(st.trial * 256);
    kept.push(code / 256);
  });
  lineChart(slide, T.series(cycles, ['DAC trial voltage', trial], ['result after decision', kept], ['V_in = 0.70 V_ref', cycles.map(() => 0.7)]), { x: M, y: TOP, w: 4.6, h: 2.9 }, { lineDataSymbol: 'circle', lineDataSymbolSize: 6, showCatAxisTitle: true, catAxisTitle: 'clock cycle (bit tested: MSB → LSB)', showValAxisTitle: true, valAxisTitle: 'V / V_ref', valAxisMinVal: 0, valAxisMaxVal: 1, chartColors: [C.amber, C.teal, C.coral] });
  T.caption(slide, `Decisions: ${r.steps.map((st) => (st.keep ? '1' : '0')).join('')} = ${r.code} → V_out = ${r.vout.toFixed(4)} V_ref (error < 1 LSB = 1/256)`, { x: M, y: 4.05, w: 4.6, h: 0.3 });
  T.bullets(slide, s.bullets, { x: 5.4, y: TOP, w: 4.1, h: 3.2 }, { fontSize: 11.5, gap: 4 });
  T.expertCorner(slide, s.expert, { x: M, y: 4.4, w: W - 2 * M, h: 0.65 });
};

build.sigmadelta = (s, slide) => {
  eqStack(slide, s.equations, { x: M, y: TOP, w: 5.4, h: 2.5 }, { fontSize: 13 });
  T.bullets(slide, s.bullets, { x: 6.1, y: TOP, w: 3.4, h: 1.5 }, { fontSize: 11.5 });
  const fr = dsp.linspace(0.005, 0.5, 100);
  const flat = fr.map(() => 0);
  const first = fr.map((v) => 20 * Math.log10(2 * Math.sin(Math.PI * v)));
  const second = fr.map((v) => 40 * Math.log10(2 * Math.sin(Math.PI * v)));
  lineChart(slide, T.series(labelsOf(fr, 3), ['no shaping (flat)', flat], ['1st-order (1 − z⁻¹)', first], ['2nd-order', second.map((v) => Math.max(v, -60))]), { x: 6.1, y: 2.7, w: 3.4, h: 2.3 }, { catAxisLabelFrequency: 20, showCatAxisTitle: true, catAxisTitle: 'frequency / f_s  (signal band ≪ 0.5)', showValAxisTitle: true, valAxisTitle: 'noise density (dB)', valAxisMinVal: -60, valAxisMaxVal: 15, chartColors: [C.slate, C.teal, C.coral] });
  T.stat(slide, '+3 dB', 'per doubling of OSR, no shaping', { x: M, y: 3.75, w: 1.75, h: 1.2 }, { fontSize: 22 });
  T.stat(slide, '+9 dB', 'per doubling, 1st order', { x: 2.35, y: 3.75, w: 1.75, h: 1.2 }, { fontSize: 22, color: C.teal });
  T.stat(slide, '+15 dB', 'per doubling, 2nd order', { x: 4.2, y: 3.75, w: 1.75, h: 1.2 }, { fontSize: 22, color: C.coral });
};

build.datasheet = (s, slide) => {
  table(slide, s.table, { x: M, y: TOP, w: W - 2 * M }, { colW: [1.3, 3.9, 3.8], fontSize: 10, rowH: 0.3 });
  slide.addText('Architectures compared', { x: M, y: 3.05, w: 5, h: 0.3, fontFace: F.body, fontSize: 12, bold: true, color: C.navy, isTextBox: true, margin: 0 });
  table(slide, s.compare, { x: M, y: 3.4, w: W - 2 * M }, { colW: [1.3, 1.7, 1.3, 1.5, 3.2], fontSize: 10, rowH: 0.3 });
};

build.whyfreq = (s, slide) => {
  const N = 256;
  const fs = 256e3;
  const next = dsp.rng(11);
  const x = [];
  for (let n = 0; n < N; n++) x.push(Math.cos((2 * Math.PI * 30e3 * n) / fs) + 0.3 * Math.cos((2 * Math.PI * 75e3 * n) / fs + 0.7) + 0.05 * dsp.gaussian(next));
  const X = dsp.fft(x, new Array(N).fill(0));
  const db = dsp.magDb(X.re, X.im, N / 2).slice(0, N / 2);
  const tl = Array.from({ length: 128 }, (_, i) => String(i));
  lineChart(slide, T.series(tl, ['x[n]: 30 kHz + 75 kHz tones + noise', x.slice(0, 128)]), { x: M, y: TOP, w: 4.4, h: 2.35 }, { catAxisLabelFrequency: 16, showCatAxisTitle: true, catAxisTitle: 'sample n  (first 128 of 256)', valAxisMinVal: -1.6, valAxisMaxVal: 1.6, valAxisMajorUnit: 0.8, chartColors: [C.slate] });
  lineChart(slide, T.series(Array.from({ length: N / 2 }, (_, k) => String(k)), ['|X[k]| after 256-point FFT (dBFS)', db]), { x: 5.1, y: TOP, w: 4.4, h: 2.35 }, { catAxisLabelFrequency: 16, showCatAxisTitle: true, catAxisTitle: 'frequency (kHz)  ·  Δf = 1 kHz', valAxisMinVal: -80, valAxisMaxVal: 5, chartColors: [C.teal] });
  T.bullets(slide, s.bullets, { x: M, y: 3.6, w: W - 2 * M, h: 0.85 }, { fontSize: 11.5, gap: 3 });
  T.expertCorner(slide, s.expert, { x: M, y: 4.42, w: W - 2 * M, h: 0.63 });
};

build.lineage = (s, slide) => {
  const h = (BOTTOM - TOP - 0.2 - 0.3) / 3;
  s.equations.forEach((e, i) => {
    const y = TOP + i * (h + 0.1);
    T.equation(slide, e.eq, { x: M + 0.5, y, w: W - 2 * M - 0.5, h }, { caption: e.cap, fontSize: 15 });
    slide.addShape('ellipse', { x: M, y: y + h / 2 - 0.2, w: 0.4, h: 0.4, fill: { color: [C.slate, C.amber, C.teal][i] }, line: { color: [C.slate, C.amber, C.teal][i] } });
    slide.addText(String(i + 1), { x: M, y: y + h / 2 - 0.2, w: 0.4, h: 0.4, fontFace: F.body, fontSize: 12, bold: true, color: C.navy, align: 'center', valign: 'middle', isTextBox: true, margin: 0 });
    if (i < 2) D.line(slide, M + 0.2, y + h / 2 + 0.2, M + 0.2, y + h + 0.1 + h / 2 - 0.2, { arrow: true, color: C.slate });
  });
  T.caption(slide, 'Same operation three times: multiply by a spinning reference e^{−jθ} and sum. Only the DFT runs on a computer.', { x: M, y: BOTTOM - 0.3, w: W - 2 * M, h: 0.3 });
};

build.dft = (s, slide) => {
  eqStack(slide, s.equations, { x: M, y: TOP, w: 5.2, h: 1.9 }, { fontSize: 16 });
  T.bullets(slide, s.bullets, { x: 6.0, y: TOP, w: 3.5, h: 3.1 }, { fontSize: 11.5, gap: 5 });
  T.stat(slide, '39.06 kHz', 'Δf for 40 MSPS, N = 1024', { x: M, y: 3.15, w: 2.5, h: 0.95 }, { fontSize: 22 });
  T.stat(slide, 'bin 256', 'where a 10 MHz tone lands', { x: 3.1, y: 3.15, w: 2.5, h: 0.95 }, { fontSize: 22, color: C.teal });
  T.expertCorner(slide, s.expert, { x: M, y: 4.25, w: W - 2 * M, h: 0.75 });
};

build.basis = (s, slide) => {
  eqStack(slide, s.equations, { x: M, y: TOP, w: 4.6, h: 1.75 }, { fontSize: 14 });
  T.bullets(slide, s.bullets, { x: M, y: 3.0, w: 4.6, h: 1.25 }, { fontSize: 11.5, gap: 4 });
  const N = 32;
  const n = Array.from({ length: N }, (_, i) => i);
  const basis = (k) => n.map((i) => Math.cos((2 * Math.PI * k * i) / N));
  lineChart(slide, T.series(n.map(String), ['k = 1 (one cycle)', basis(1)], ['k = 2', basis(2)], ['k = 3', basis(3)]), { x: 5.3, y: TOP, w: 4.2, h: 3.05 }, { lineDataSymbol: 'circle', lineDataSymbolSize: 4, catAxisLabelFrequency: 4, showCatAxisTitle: true, catAxisTitle: 'sample n  (N = 32)', showValAxisTitle: true, valAxisTitle: 'cos(2πkn/N)', valAxisMinVal: -1.2, valAxisMaxVal: 1.2, valAxisMajorUnit: 0.4, valAxisLabelFormatCode: '0.0', chartColors: [C.teal, C.amber, C.coral] });
  T.expertCorner(slide, s.expert, { x: M, y: 4.3, w: W - 2 * M, h: 0.72 });
};

build.fft = (s, slide) => {
  eqStack(slide, s.equations, { x: M, y: TOP, w: 5.0, h: 1.75 }, { fontSize: 13 });
  T.bullets(slide, s.bullets, { x: M, y: 3.0, w: 5.0, h: 1.4 }, { fontSize: 11.5, gap: 4 });
  slide.addText('The butterfly', { x: 5.8, y: TOP - 0.02, w: 3.7, h: 0.25, fontFace: F.body, fontSize: 11, bold: true, color: C.navy, isTextBox: true, margin: 0 });
  D.butterfly(slide, { x: 5.8, y: TOP + 0.25, w: 3.7, h: 1.35 });
  const Ns = [64, 256, 1024, 4096, 16384];
  const ratio = Ns.map((N) => { const c = dsp.costs(N); return Math.round(c.dft / c.fft); });
  barChart(slide, T.series(Ns.map((N) => N.toLocaleString('en-US')), ['speed-up: N² ÷ (N/2)·log₂N', ratio]), { x: 5.8, y: 2.85, w: 3.7, h: 1.85 }, { dataLabelFormatCode: '#,##0"×"', showCatAxisTitle: true, catAxisTitle: 'FFT size N', valAxisHidden: true, valGridLine: { style: 'none' }, chartColors: [C.teal] });
  T.caption(slide, 'The saving grows with N: at 1024 points the FFT is 205× cheaper.', { x: 5.8, y: 4.72, w: 3.7, h: 0.3 });
};

build.fft8 = (s, slide) => {
  D.fft8(slide, { x: M + 0.1, y: TOP + 0.4, w: W - 2 * M - 0.2, h: 2.45 });
  T.bullets(slide, s.bullets, { x: M, y: 4.05, w: W - 2 * M, h: 1.0 }, { fontSize: 10.5, gap: 2 });
};

build.window = (s, slide) => {
  T.equation(slide, s.equations[0].eq, { x: M, y: TOP, w: 4.4, h: 0.85 }, { caption: s.equations[0].cap, fontSize: 16 });
  T.bullets(slide, s.bullets, { x: M, y: 2.1, w: 4.4, h: 2.2 }, { fontSize: 11.5, gap: 4 });
  const N = 128;
  const n = Array.from({ length: N }, (_, i) => i);
  const x = n.map((i) => Math.cos((2 * Math.PI * 20.5 * i) / N));
  const w = dsp.hann(N);
  const Xr = dsp.fft(x, new Array(N).fill(0));
  const Xh = dsp.fft(x.map((v, i) => v * w[i]), new Array(N).fill(0));
  const dbR = dsp.magDb(Xr.re, Xr.im).slice(0, N / 2);
  const dbH = dsp.magDb(Xh.re, Xh.im).slice(0, N / 2);
  lineChart(slide, T.series(n.slice(0, N / 2).map(String), ['Hann window', dbH.map((v) => Math.max(v, -100))], ['rectangular (no window)', dbR.map((v) => Math.max(v, -100))]), { x: 5.1, y: TOP, w: 4.4, h: 3.1 }, { catAxisLabelFrequency: 8, showCatAxisTitle: true, catAxisTitle: 'bin k  ·  tone at k = 20.5, N = 128', showValAxisTitle: true, valAxisTitle: '|X[k]| (dB, normalised)', valAxisMinVal: -100, valAxisMaxVal: 5, chartColors: [C.teal, C.coral] });
  T.expertCorner(slide, s.expert, { x: M, y: 4.32, w: W - 2 * M, h: 0.72 });
};

build.ifft = (s, slide) => {
  eqStack(slide, s.equations, { x: M, y: TOP, w: 4.8, h: 1.7 }, { fontSize: 15 });
  T.bullets(slide, s.bullets, { x: M, y: 2.95, w: 4.8, h: 1.35 }, { fontSize: 11.5, gap: 4 });
  const N = 64;
  const next = dsp.rng(5);
  const x = Array.from({ length: N }, (_, i) => Math.cos((2 * Math.PI * 3 * i) / N) + 0.5 * Math.sin((2 * Math.PI * 7 * i) / N) + 0.2 * (next() - 0.5));
  const X = dsp.fft(x, new Array(N).fill(0));
  const y = dsp.ifft(X.re, X.im);
  let err = 0;
  for (let i = 0; i < N; i++) err = Math.max(err, Math.abs(y.re[i] - x[i]), Math.abs(y.im[i]));
  lineChart(slide, T.series(x.map((_, i) => String(i)), ['original x[n]', x], ['IFFT(FFT(x))', y.re]), { x: 5.6, y: TOP, w: 3.9, h: 2.4 }, { lineDataSymbol: 'circle', lineDataSymbolSize: 4, catAxisLabelFrequency: 8, showCatAxisTitle: true, catAxisTitle: 'sample n', valAxisMinVal: -2, valAxisMaxVal: 2, chartColors: [C.coral, C.teal] });
  T.stat(slide, err.toExponential(1), 'max |x − IFFT(FFT(x))|, measured by this build', { x: 5.6, y: 3.6, w: 3.9, h: 1.0 }, { fontSize: 26, color: C.teal });
  T.expertCorner(slide, s.expert, { x: M, y: 4.35, w: 4.8, h: 0.7 });
};

build.example = (s, slide) => {
  const rowH = 0.6;
  s.steps.forEach(([h, t], i) => {
    const y = TOP + i * (rowH + 0.04);
    slide.addShape('ellipse', { x: M, y: y + 0.13, w: 0.34, h: 0.34, fill: { color: i === s.steps.length - 1 ? C.teal : C.navy }, line: { color: i === s.steps.length - 1 ? C.teal : C.navy } });
    slide.addText(String(i + 1), { x: M, y: y + 0.13, w: 0.34, h: 0.34, fontFace: F.body, fontSize: 11, bold: true, color: i === s.steps.length - 1 ? C.navy : C.white, align: 'center', valign: 'middle', isTextBox: true, margin: 0 });
    slide.addText(
      [
        { text: h, options: { bold: true, color: C.navy, breakLine: true } },
        { text: t, options: { color: C.ink, fontSize: 11, fontFace: F.math } },
      ],
      { x: M + 0.48, y, w: 5.5, h: rowH, fontFace: F.body, fontSize: 12, valign: 'middle', isTextBox: true, margin: 0 }
    );
  });
  T.equation(slide, s.equations[0].eq, { x: 6.5, y: TOP, w: 3.0, h: 1.2 }, { caption: s.equations[0].cap, fontSize: 12 });
  T.stat(slide, 'bin 256', '10 MHz ÷ 39.06 kHz', { x: 6.5, y: 2.45, w: 3.0, h: 0.8 }, { fontSize: 24, color: C.teal });
  T.stat(slide, '74 dB', 'ideal 12-bit SNR', { x: 6.5, y: 3.3, w: 1.45, h: 0.8 }, { fontSize: 20 });
  T.stat(slide, '−101 dBFS', 'FFT noise floor', { x: 8.0, y: 3.3, w: 1.5, h: 0.8 }, { fontSize: 20 });
  T.caption(slide, 'Every number here comes from an equation shown earlier.', { x: 6.5, y: 4.3, w: 3.0, h: 0.5 });
};

build.ofdm = (s, slide) => {
  D.ofdmChain(slide, { x: M + 0.55, y: TOP + 0.05, w: W - 2 * M - 0.55, h: 1.6 });
  const o = dsp.ofdmSymbol(64, 52);
  const n = Array.from({ length: 64 }, (_, i) => String(i));
  lineChart(slide, T.series(n, ['OFDM symbol, real part (IFFT output)', o.time.re.map((v) => v * 8)], ['imaginary part', o.time.im.map((v) => v * 8)]), { x: M, y: 2.85, w: 4.4, h: 1.5 }, { catAxisLabelFrequency: 8, showCatAxisTitle: true, catAxisTitle: 'sample n (N = 64)  ·  teal: real part, amber: imaginary part', chartColors: [C.teal, C.amber], lineSize: 1.25, valAxisMinVal: -3, valAxisMaxVal: 3, valAxisMajorUnit: 1, showLegend: false });
  const order = [];
  const lab = [];
  for (let k = -32; k < 32; k++) { order.push(k); lab.push(String(k)); }
  const magRx = order.map((k) => Math.hypot(o.rx.re[(k + 64) % 64], o.rx.im[(k + 64) % 64]));
  barChart(slide, T.series(lab, ['|FFT output| per subcarrier (52 used, 12 null)', magRx]), { x: 5.1, y: 2.85, w: 4.4, h: 1.5 }, { showValue: false, barGapWidthPct: 20, catAxisLabelFrequency: 8, showCatAxisTitle: true, catAxisTitle: 'subcarrier index k', valAxisMinVal: 0, valAxisMaxVal: 2, chartColors: [C.coral] });
  T.bullets(slide, s.bullets.slice(0, 3), { x: M, y: 4.42, w: W - 2 * M, h: 0.65 }, { fontSize: 10.5, gap: 1 });
};

build.pitfalls = (s, slide) => {
  const gap = 0.2;
  const cw = (W - 2 * M - 2 * gap) / 3;
  const ch = 1.7;
  s.cards.forEach(([n, h, t], i) => {
    const row = i < 3 ? 0 : 1;
    const col = i < 3 ? i : i - 3;
    const x = M + col * (cw + gap) + (row === 1 ? (cw + gap) / 2 : 0);
    const y = TOP + row * (ch + 0.2);
    T.card(slide, h, t, { x, y, w: cw, h: ch }, { icon: n, iconColor: C.coral, headSize: 13, bodySize: 11 });
  });
};

// ---------------------------------------------------------------- assemble

let number = 0;
for (const s of SLIDES) {
  number += 1;
  if (s.kind === 'title') {
    titleSlide(s);
  } else if (s.kind === 'section') {
    sectionSlide(s, number);
  } else if (s.kind === 'recap') {
    recapSlide(s, number);
  } else if (s.kind === 'end') {
    endSlide(s, number);
  } else {
    const slide = T.contentSlide(pres, s.title, meta(s, number));
    if (!build[s.id]) throw new Error('No visual builder for slide ' + s.id);
    build[s.id](s, slide);
    slide.addNotes(notesFor(s));
  }
}

const dest = path.join(__dirname, '..', 'presentation', 'RF_Signal_Processing.pptx');
pres.writeFile({ fileName: dest }).then((f) => console.log(`Wrote ${f} (${number} slides)`));
