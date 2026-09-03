// Builds presentation/RF_Signal_Processing.pptx from src/content.js.
// Every figure is a native PowerPoint chart whose data comes from src/dsp.js.
//
// Content-slide layout: title (0.32–1.02), main area (TOP=1.12 to CB=3.9),
// then a band at y=4.02 with an everyday analogy (left) and a numeric example (right).

const path = require('path');
const pptxgen = require('pptxgenjs');
const dsp = require('./dsp');
const T = require('./theme');
const D = require('./diagrams');
const { PARTS, SLIDES } = require('./content');

const { C, F, W, H, M } = T;
const pres = new pptxgen();
pres.layout = 'LAYOUT_16x9';
pres.title = 'RF Signal Processing: how a radio wave becomes numbers';
pres.subject = 'RF signal processing presentation';
pres.company = 'RF_Signal_Processing_Equations';

const CT = pres.ChartType;
const TOP = 1.12; // main area top
const CB = 3.9; // main area bottom
const BAND_Y = 4.02; // analogy / example band
const BAND_H = 1.12;
const LW = 4.4; // left column width
const RX = 5.1; // right column x
const RW = 4.4; // right column width
const byId = Object.fromEntries(SLIDES.map((s) => [s.id, s]));

// ---------------------------------------------------------------- helpers

function labelsOf(arr, d = 2) {
  return arr.map((v) => T.fmt(v, d));
}

function eqStack(slide, eqs, box, opts = {}) {
  const gap = 0.1;
  const h = (box.h - gap * (eqs.length - 1)) / eqs.length;
  eqs.forEach((e, i) => {
    T.equation(slide, e.eq, { x: box.x, y: box.y + i * (h + gap), w: box.w, h }, { caption: e.cap, fontSize: opts.fontSize || 18, dark: opts.dark });
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
        fontFace: F.body,
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

/** Analogy (left) and example (right) band. Either may be absent. */
function band(slide, s, opts = {}) {
  const y = opts.y || BAND_Y;
  const h = opts.h || BAND_H;
  const exSize = (ex) => (Math.max(...ex.lines.map((l) => l.length), ex.title.length) > 56 ? 9 : 10);
  if (s.analogy && s.example) {
    T.analogyCard(slide, s.analogy, { x: M, y, w: LW, h }, { fontSize: s.analogy.length > 230 ? 10 : 10.5 });
    T.exampleCard(slide, s.example, { x: RX, y, w: RW, h }, { fontSize: exSize(s.example) });
  } else if (s.analogy) {
    T.analogyCard(slide, s.analogy, { x: M, y, w: W - 2 * M, h }, { fontSize: 10.5 });
  } else if (s.example) {
    T.exampleCard(slide, s.example, { x: M, y, w: W - 2 * M, h }, { fontSize: exSize(s.example) });
  }
}

function notesFor(s) {
  let n = s.notes || '';
  if (s.analogy) n += '\n\nAnalogy on the slide: ' + s.analogy;
  if (s.example) n += `\n\nExample on the slide (${s.example.title}): ` + s.example.lines.join('; ') + '.';
  if (s.expert) n += '\n\nFor the experts: ' + s.expert;
  if (s.chartNote) n += '\n\nChart: ' + s.chartNote;
  return n;
}

function meta(s, number) {
  return { section: PARTS[s.part].name, number };
}

function pageNumber(slide, number, dark) {
  slide.addText(String(number), { x: W - M - 1, y: H - 0.38, w: 1, h: 0.25, fontFace: F.body, fontSize: 9, color: dark ? '8FA3BF' : C.slate, align: 'right', isTextBox: true, margin: 0 });
}

// ---------------------------------------------------------------- slide kinds

function titleSlide(s) {
  const slide = T.darkSlide(pres);
  slide.addText(s.title, { x: M, y: 1.3, w: W - 2 * M, h: 1.1, fontFace: F.head, fontSize: 48, bold: true, color: C.white, isTextBox: true, margin: 0 });
  slide.addText(s.subtitle, { x: M, y: 2.4, w: W - 2 * M, h: 0.6, fontFace: F.body, fontSize: 20, color: C.teal, isTextBox: true, margin: 0 });
  slide.addText('For newcomers and RF engineers alike  ·  about 90 minutes', { x: M, y: 3.05, w: W - 2 * M, h: 0.4, fontFace: F.body, fontSize: 12, color: 'B8C4D6', isTextBox: true, margin: 0 });
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
  pageNumber(slide, number, true);
  slide.addNotes(notesFor(s));
}

function recapSlide(s, number) {
  const slide = T.darkSlide(pres);
  slide.addText(s.title, { x: M, y: 0.45, w: W - 2 * M, h: 0.7, fontFace: F.head, fontSize: 30, bold: true, color: C.white, isTextBox: true, margin: 0, valign: 'middle' });
  if (s.cheatsheet) {
    table(slide, s.cheatsheet, { x: M, y: 1.3, w: W - 2 * M }, { noHeader: true, dark: true, colW: [1.7, W - 2 * M - 1.7], fontSize: 11, mathCol: 1, rowH: 0.34 });
  } else {
    const items = s.bullets;
    const rowH = Math.min(0.62, (H - 0.5 - 1.35) / items.length);
    items.forEach((b, i) => {
      const y = 1.35 + i * rowH;
      slide.addShape('ellipse', { x: M, y: y + 0.1, w: 0.3, h: 0.3, fill: { color: C.teal }, line: { color: C.teal } });
      slide.addText('✓', { x: M, y: y + 0.1, w: 0.3, h: 0.3, fontSize: 12, bold: true, color: C.navy, align: 'center', valign: 'middle', isTextBox: true, margin: 0 });
      slide.addText(b, { x: M + 0.45, y, w: W - 2 * M - 0.45, h: rowH, fontFace: F.body, fontSize: 16, color: C.white, valign: 'middle', isTextBox: true, margin: 0 });
    });
  }
  pageNumber(slide, number, true);
  slide.addNotes(notesFor(s));
}

function appendixSlide(s, number) {
  const slide = T.darkSlide(pres);
  slide.addText(s.title, { x: M, y: 0.35, w: W - 2 * M, h: 0.6, fontFace: F.head, fontSize: 24, bold: true, color: C.white, isTextBox: true, margin: 0, valign: 'middle' });
  slide.addText('Reference material for the RF engineers · not presented', { x: M, y: 0.95, w: W - 2 * M, h: 0.3, fontFace: F.body, fontSize: 10, italic: true, color: 'B8C4D6', isTextBox: true, margin: 0 });
  const runs = [];
  s.fromSlides.forEach((id, i) => {
    const src = byId[id];
    if (!src || !src.expert) return;
    runs.push({ text: src.title + '.  ', options: { bold: true, color: C.teal, fontSize: 10.5 } });
    runs.push({ text: src.expert, options: { color: 'D7DEE8', fontSize: 10.5, breakLine: i < s.fromSlides.length - 1, paraSpaceAfter: 6 } });
  });
  slide.addText(runs, { x: M, y: 1.35, w: W - 2 * M, h: H - 0.5 - 1.35, fontFace: F.body, valign: 'top', isTextBox: true, margin: 0 });
  pageNumber(slide, number, true);
  slide.addNotes(notesFor(s));
}

function endSlide(s, number) {
  const slide = T.darkSlide(pres);
  slide.addText(s.title, { x: M, y: 0.9, w: W - 2 * M, h: 1.0, fontFace: F.head, fontSize: 48, bold: true, color: C.white, isTextBox: true, margin: 0 });
  slide.addText('Further reading', { x: M, y: 2.2, w: 5, h: 0.35, fontFace: F.body, fontSize: 12, bold: true, color: C.teal, isTextBox: true, margin: 0 });
  T.bullets(slide, s.references, { x: M, y: 2.6, w: W - 2 * M, h: 2.0 }, { color: 'D7DEE8', fontSize: 12, gap: 4 });
  pageNumber(slide, number, true);
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
  T.caption(slide, 'Every slide: a picture, the idea in plain words, an everyday comparison, a small example with real numbers, then the equation.', { x: M, y: 4.65, w: W - 2 * M, h: 0.3 });
};

build.bigpicture = (s, slide) => {
  D.rfChain(slide, { x: M, y: TOP + 0.05, w: W - 2 * M, h: 1.0 }, { sub: true, fontSize: 12 });
  const half = Math.ceil(s.bullets.length / 2);
  T.bullets(slide, s.bullets.slice(0, half), { x: M, y: 2.35, w: 4.35, h: 1.5 }, { fontSize: 11, gap: 4 });
  T.bullets(slide, s.bullets.slice(half), { x: 5.15, y: 2.35, w: 4.35, h: 1.5 }, { fontSize: 11, gap: 4 });
  band(slide, s);
};

build.glossary = (s, slide) => {
  table(slide, s.table, { x: M, y: TOP, w: W - 2 * M }, { colW: [1.6, 4.5, 2.9], fontSize: 10.5, rowH: 0.36 });
  T.caption(slide, 'Every other term in this talk is built from these eight.', { x: M, y: 4.5, w: W - 2 * M, h: 0.3 });
};

build.sine = (s, slide) => {
  eqStack(slide, s.equations, { x: M, y: TOP, w: LW, h: 1.5 });
  T.bullets(slide, s.bullets, { x: M, y: 2.72, w: LW, h: 1.15 }, { fontSize: 11.5, gap: 4 });
  const t = dsp.linspace(0, 2e-3, 201);
  const a = dsp.sine(t, 1000, 1, 0);
  const b = dsp.sine(t, 1000, 0.6, Math.PI / 2);
  lineChart(slide, T.series(labelsOf(t.map((v) => v * 1e3), 2), ['A = 1, φ = 0°', a], ['A = 0.6, φ = 90°', b]), { x: RX, y: TOP, w: RW, h: 2.75 }, { catAxisLabelFrequency: 25, showCatAxisTitle: true, catAxisTitle: 'time (ms)  ·  f = 1 kHz', showValAxisTitle: true, valAxisTitle: 'x(t)', valAxisMinVal: -1.2, valAxisMaxVal: 1.2, valAxisMajorUnit: 0.4, valAxisLabelFormatCode: '0.0' });
  band(slide, s);
};

build.db = (s, slide) => {
  eqStack(slide, s.equations, { x: M, y: TOP, w: LW, h: 1.9 });
  T.caption(slide, 'Every 10 dB is one more zero. Adding dB is multiplying powers.', { x: M, y: 3.15, w: LW, h: 0.3 });
  table(slide, s.table, { x: 5.3, y: TOP, w: 4.2 }, { colW: [0.75, 0.85, 2.6], fontSize: 9.5, rowH: 0.29 });
  const stats = [['×2', '= +3 dB'], ['×10', '= +10 dB'], ['×1000', '= +30 dB']];
  stats.forEach(([v, l], i) => T.stat(slide, v, l, { x: 5.3 + i * 1.4, y: 2.95, w: 1.4, h: 0.85 }, { fontSize: 24 }));
  band(slide, s);
};

build.modulation = (s, slide) => {
  eqStack(slide, s.equations, { x: M, y: TOP, w: LW, h: 1.5 });
  T.bullets(slide, s.bullets, { x: M, y: 2.72, w: LW, h: 1.15 }, { fontSize: 11.5, gap: 4 });
  const t = dsp.linspace(0, 1, 241);
  const I = t.map((v) => Math.cos(2 * Math.PI * 1.0 * v));
  const Q = t.map((v) => 0.8 * Math.sin(2 * Math.PI * 1.5 * v));
  const x = t.map((v, i) => I[i] * Math.cos(2 * Math.PI * 16 * v) - Q[i] * Math.sin(2 * Math.PI * 16 * v));
  lineChart(slide, T.series(labelsOf(t, 2), ['x(t) = I cos ωt − Q sin ωt', x], ['I(t)', I], ['Q(t)', Q]), { x: RX, y: TOP, w: RW, h: 2.75 }, { chartColors: [C.slate, C.teal, C.coral], lineSize: 1.25, catAxisLabelFrequency: 40, showCatAxisTitle: true, catAxisTitle: 'time (arbitrary units)', valAxisMinVal: -1.5, valAxisMaxVal: 1.5, valAxisMajorUnit: 0.5 });
  band(slide, s);
};

build.iq = (s, slide) => {
  const eqW = (W - 2 * M - 0.2) / 2;
  s.equations.forEach((e, i) => T.equation(slide, e.eq, { x: M + i * (eqW + 0.2), y: TOP, w: eqW, h: 0.8 }, { caption: e.cap, fontSize: 16 }));
  T.bullets(slide, s.bullets, { x: M, y: 2.0, w: W - 2 * M, h: 0.55 }, { fontSize: 11, gap: 2 });
  const N = 64;
  const n = Array.from({ length: N }, (_, i) => i);
  const x = n.map((i) => (1 + 0.5 * Math.cos((2 * Math.PI * 2 * i) / N)) * Math.cos((2 * Math.PI * 20 * i) / N));
  const X = dsp.fft(x, new Array(N).fill(0));
  const magRf = dsp.magnitude(X.re, X.im).map((v) => v / (N / 2));
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
  barChart(slide, T.series(n.map(String), ['radio signal: energy at the carrier (bin 20)', magRf]), { x: M, y: 2.6, w: LW, h: 1.3 }, { showValue: false, catAxisLabelFrequency: 8, barGapWidthPct: 30, valAxisMinVal: 0, valAxisMaxVal: 1.5, valAxisMajorUnit: 0.5 });
  barChart(slide, T.series(shiftedLabels, ['after I/Q mixing: same information near 0', shifted]), { x: RX, y: 2.6, w: RW, h: 1.3 }, { showValue: false, catAxisLabelFrequency: 8, barGapWidthPct: 30, chartColors: [C.coral], valAxisMinVal: 0, valAxisMaxVal: 1.5, valAxisMajorUnit: 0.5 });
  band(slide, s);
};

build.noise = (s, slide) => {
  eqStack(slide, s.equations, { x: M, y: TOP, w: 5.3, h: 2.78 }, { fontSize: 15 });
  T.bullets(slide, s.bullets, { x: 6.1, y: TOP, w: 3.4, h: 1.5 }, { fontSize: 11.5, gap: 5 });
  T.stat(slide, '−174', 'dBm per Hz of bandwidth', { x: 6.1, y: 2.75, w: 1.65, h: 0.9 }, { fontSize: 26 });
  T.stat(slide, '−101', 'dBm floor in 20 MHz', { x: 7.85, y: 2.75, w: 1.65, h: 0.9 }, { fontSize: 26, color: C.teal });
  band(slide, s);
};

build.linkbudget = (s, slide) => {
  const eqW = (W - 2 * M - 0.2) / 2;
  s.equations.forEach((e, i) => T.equation(slide, e.eq, { x: M + i * (eqW + 0.2), y: TOP, w: eqW, h: 0.85 }, { caption: e.cap, fontSize: 15 }));
  table(slide, s.table, { x: M, y: 2.07, w: 5.9 }, { colW: [1.9, 1.1, 2.9], fontSize: 9.5, rowH: 0.3 });
  T.stat(slide, '−50 dBm', 'received at 50 m', { x: 6.6, y: 2.1, w: 2.9, h: 0.85 });
  T.stat(slide, '≈ 51 dB', 'above the noise floor', { x: 6.6, y: 3.0, w: 2.9, h: 0.85 }, { color: C.teal });
  band(slide, s);
};

build.sampling = (s, slide) => {
  T.equation(slide, s.equations[0].eq, { x: M, y: TOP, w: LW, h: 0.9 }, { caption: s.equations[0].cap, fontSize: 18 });
  T.bullets(slide, s.bullets, { x: M, y: 2.12, w: LW, h: 1.75 }, { fontSize: 11.5, gap: 4 });
  const fs = 12e3;
  const f = 1e3;
  const per = 12;
  const nS = 36;
  const pts = nS * per + 1;
  const t = Array.from({ length: pts }, (_, i) => i / (fs * per));
  const cont = t.map((v) => Math.cos(2 * Math.PI * f * v));
  const stems = t.map((v, i) => (i % per === 0 ? cont[i] : 0));
  stemCombo(slide, labelsOf(t.map((v) => v * 1e3), 2), [['x(t): 1 kHz wave', cont]], { name: 'x[n]: readings at 12 kSPS', values: stems }, { x: RX, y: TOP, w: RW, h: 2.75 }, { catAxisLabelFrequency: per * 6, showCatAxisTitle: true, catAxisTitle: 'time (ms)', valAxisMinVal: -1.2, valAxisMaxVal: 1.2, valAxisMajorUnit: 0.4 });
  band(slide, s);
};

build.nyquist = (s, slide) => {
  eqStack(slide, s.equations, { x: M, y: TOP, w: LW, h: 1.78 }, { fontSize: 16 });
  T.bullets(slide, s.bullets, { x: M, y: 3.0, w: LW, h: 0.88 }, { fontSize: 11, gap: 3 });
  const fs = 8e3;
  const per = 30;
  const nS = 8;
  const pts = nS * per + 1;
  const t = Array.from({ length: pts }, (_, i) => i / (fs * per));
  const hi = t.map((v) => Math.cos(2 * Math.PI * 9e3 * v));
  const lo = t.map((v) => Math.cos(2 * Math.PI * 1e3 * v));
  const stems = t.map((v, i) => (i % per === 0 ? hi[i] : 0));
  stemCombo(slide, labelsOf(t.map((v) => v * 1e3), 3), [['1 kHz disguise', lo], ['9 kHz input', hi]], { name: 'readings at 8 kSPS', values: stems }, { x: RX, y: TOP, w: RW, h: 2.75 }, { catAxisLabelFrequency: per, showCatAxisTitle: true, catAxisTitle: 'time (ms)', valAxisMinVal: -1.2, valAxisMaxVal: 1.2, valAxisMajorUnit: 0.4, lineColors: [C.teal, C.coral] });
  band(slide, s);
};

build.antialias = (s, slide) => {
  T.bullets(slide, s.bullets, { x: M, y: TOP, w: LW, h: 1.85 }, { fontSize: 11.5, gap: 5 });
  T.stat(slide, '44.1 kSPS', 'CD audio sample rate', { x: M, y: 3.0, w: 2.1, h: 0.85 }, { fontSize: 22 });
  T.stat(slide, '2.2 ×', 'sample rate ÷ bandwidth, typical', { x: 2.7, y: 3.0, w: 2.2, h: 0.85 }, { fontSize: 22, color: C.teal });
  const fr = dsp.linspace(0, 1, 51);
  const fc = 0.4;
  const butter = fr.map((v) => -10 * Math.log10(1 + Math.pow(v / fc, 10)));
  const brick = fr.map((v) => (v <= 0.5 ? 0 : -80));
  lineChart(slide, T.series(labelsOf(fr, 2), ['real 5th-order filter', butter.map((v) => Math.max(v, -80))], ['ideal brick wall at f_s/2', brick]), { x: RX, y: TOP, w: RW, h: 2.75 }, { catAxisLabelFrequency: 5, showCatAxisTitle: true, catAxisTitle: 'frequency ÷ f_s   (f_s/2 = 0.50)', showValAxisTitle: true, valAxisTitle: 'how much passes (dB)', valAxisMinVal: -80, valAxisMaxVal: 5, chartColors: [C.teal, C.coral] });
  band(slide, s);
};

build.reconstruction = (s, slide) => {
  T.equation(slide, s.equations[0].eq, { x: M, y: TOP, w: LW, h: 0.9 }, { caption: s.equations[0].cap, fontSize: 16 });
  T.bullets(slide, s.bullets, { x: M, y: 2.12, w: LW, h: 1.0 }, { fontSize: 11.5, gap: 4 });
  T.stat(slide, '−3.9 dB', 'staircase droop at f_s/2, pre-boosted away', { x: M, y: 3.05, w: LW, h: 0.8 }, { fontSize: 22 });
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
  stemCombo(slide, labelsOf(t.map((v) => v * 1e3), 2), [['smooth curve (= original)', recon], ['DAC staircase', zoh]], { name: 'readings x[n]', values: stems }, { x: RX, y: TOP, w: RW, h: 2.75 }, { catAxisLabelFrequency: per * 4, showCatAxisTitle: true, catAxisTitle: 'time (ms)  ·  f_s = 10 kSPS', valAxisMinVal: -1.6, valAxisMaxVal: 1.6, valAxisMajorUnit: 0.8, lineColors: [C.teal, C.amber] });
  band(slide, s);
};

build.adcblocks = (s, slide) => {
  D.adcBlocks(slide, { x: M + 0.2, y: TOP - 0.12, w: W - 2 * M - 0.4, h: 2.2 });
  T.bullets(slide, s.bullets, { x: M, y: 3.22, w: W - 2 * M, h: 0.66 }, { fontSize: 10, gap: 0 });
  band(slide, s);
};

build.sah = (s, slide) => {
  D.sampleHold(slide, { x: M, y: TOP + 0.2, w: W - 2 * M, h: 1.9 });
  band(slide, s);
};

build.jitter = (s, slide) => {
  T.equation(slide, s.equations[0].eq, { x: M, y: TOP, w: LW, h: 0.95 }, { caption: s.equations[0].cap, fontSize: 16 });
  T.bullets(slide, s.bullets, { x: M, y: 2.17, w: LW, h: 1.7 }, { fontSize: 11.5, gap: 4 });
  const fMHz = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];
  const mk = (tj) => fMHz.map((f) => dsp.jitterSnr(f * 1e6, tj));
  lineChart(slide, T.series(fMHz.map(String), ['wobble 100 fs', mk(100e-15)], ['wobble 1 ps', mk(1e-12)], ['wobble 10 ps', mk(10e-12)]), { x: RX, y: TOP, w: RW, h: 2.75 }, { lineDataSymbol: 'circle', lineDataSymbolSize: 5, showCatAxisTitle: true, catAxisTitle: 'input frequency (MHz)', showValAxisTitle: true, valAxisTitle: 'best possible SNR (dB)', valAxisMinVal: 20, valAxisMaxVal: 120, valAxisMajorUnit: 20, chartColors: [C.teal, C.amber, C.coral] });
  band(slide, s);
};

build.quant = (s, slide) => {
  eqStack(slide, s.equations, { x: M, y: TOP, w: LW, h: 1.5 });
  T.bullets(slide, s.bullets.slice(0, 1), { x: M, y: 2.72, w: LW, h: 0.45 }, { fontSize: 11.5, gap: 4 });
  T.stat(slide, '8', 'marks with 3 bits', { x: M, y: 3.18, w: 1.4, h: 0.68 }, { fontSize: 20 });
  T.stat(slide, '4096', 'marks with 12 bits', { x: 2.0, y: 3.18, w: 1.4, h: 0.68 }, { fontSize: 20, color: C.teal });
  T.stat(slide, '16.7 M', 'marks with 24 bits', { x: 3.5, y: 3.18, w: 1.4, h: 0.68 }, { fontSize: 20 });
  const v = dsp.linspace(-1, 1, 201);
  const q = v.map((x) => dsp.quantize(x, 3, 2));
  lineChart(slide, T.series(labelsOf(v, 2), ['smooth input (ramp)', v], ['3-bit output (staircase)', q]), { x: RX, y: TOP, w: RW, h: 2.75 }, { catAxisLabelFrequency: 25, showCatAxisTitle: true, catAxisTitle: 'input (V)  ·  range 2 V, step 0.25 V', showValAxisTitle: true, valAxisTitle: 'output (V)', valAxisMinVal: -1, valAxisMaxVal: 1, chartColors: [C.slate, C.teal] });
  band(slide, s);
};

build.qerror = (s, slide) => {
  const eqW = (W - 2 * M - 0.2) / 2;
  s.equations.forEach((e, i) => T.equation(slide, e.eq, { x: M + i * (eqW + 0.2), y: TOP, w: eqW, h: 0.92 }, { caption: e.cap, fontSize: 16 }));
  T.bullets(slide, s.bullets, { x: M, y: 2.12, w: W - 2 * M, h: 0.5 }, { fontSize: 11, gap: 2 });
  const v = dsp.linspace(-1, 1, 201);
  const err = v.map((x) => x - dsp.quantize(x, 3, 2));
  lineChart(slide, T.series(labelsOf(v, 2), ['error (3-bit)', err]), { x: M, y: 2.65, w: LW, h: 1.25 }, { catAxisLabelFrequency: 25, showCatAxisTitle: true, catAxisTitle: 'input (V): error is a sawtooth', valAxisMinVal: -0.15, valAxisMaxVal: 0.15, valAxisMajorUnit: 0.05, valAxisLabelFormatCode: '0.00', chartColors: [C.coral] });
  const bits = 12;
  const lsb = 2 / Math.pow(2, bits);
  const bins = 10;
  const counts = new Array(bins).fill(0);
  const Ns = 8192;
  for (let i = 0; i < Ns; i++) {
    const x = 0.9 * Math.cos(2 * Math.PI * 0.0137 * i) + 0.05 * Math.cos(2 * Math.PI * 0.21 * i + 0.3);
    const e = x - dsp.quantize(x, bits, 2);
    let b = Math.floor(((e + lsb / 2) / lsb) * bins);
    b = Math.max(0, Math.min(bins - 1, b));
    counts[b] += 1;
  }
  const binLabels = counts.map((_, i) => `${((i + 0.5) / bins - 0.5).toFixed(2)}`);
  barChart(slide, T.series(binLabels, ['how often each error size occurs (12-bit)', counts]), { x: RX, y: 2.65, w: RW, h: 1.25 }, { showValue: false, barGapWidthPct: 20, showCatAxisTitle: true, catAxisTitle: 'error in steps: every size equally likely', valAxisMinVal: 0, chartColors: [C.teal] });
  band(slide, s);
};

build.snr = (s, slide) => {
  eqStack(slide, s.equations, { x: M, y: TOP, w: 5.3, h: 2.78 }, { fontSize: 15 });
  const bits = [4, 6, 8, 10, 12, 14, 16, 18, 20, 24];
  lineChart(slide, T.series(bits.map(String), ['ideal SNR = 6.02 N + 1.76 dB', bits.map(dsp.snrBits)]), { x: 6.0, y: TOP, w: 3.5, h: 1.9 }, { lineDataSymbol: 'circle', lineDataSymbolSize: 6, showCatAxisTitle: true, catAxisTitle: 'bits N', showValAxisTitle: true, valAxisTitle: 'SNR (dB)', valAxisMinVal: 0, valAxisMaxVal: 160, valAxisMajorUnit: 40 });
  T.stat(slide, '6 dB', 'per bit', { x: 6.0, y: 3.05, w: 1.7, h: 0.82 }, { fontSize: 26, color: C.teal });
  T.stat(slide, '74 dB', 'ideal 12-bit', { x: 7.8, y: 3.05, w: 1.7, h: 0.82 }, { fontSize: 26 });
  band(slide, s);
};

build.flash = (s, slide) => {
  D.flashAdc(slide, { x: M, y: TOP + 0.12, w: 4.6, h: 2.3 });
  T.bullets(slide, s.bullets, { x: 5.4, y: TOP, w: 4.1, h: 2.75 }, { fontSize: 11, gap: 3 });
  band(slide, s);
};

build.sar = (s, slide) => {
  const r = dsp.sarSteps(0.7, 8, 1);
  const cycles = r.steps.map((st) => String(st.cycle));
  const trial = r.steps.map((st) => st.trial);
  const kept = [];
  let code = 0;
  r.steps.forEach((st) => {
    if (st.keep) code = Math.round(st.trial * 256);
    kept.push(code / 256);
  });
  lineChart(slide, T.series(cycles, ['trial voltage', trial], ['result so far', kept], ['input = 0.70', cycles.map(() => 0.7)]), { x: M, y: TOP, w: 4.6, h: 2.45 }, { lineDataSymbol: 'circle', lineDataSymbolSize: 6, showCatAxisTitle: true, catAxisTitle: 'clock tick (bit tested: biggest first)', showValAxisTitle: true, valAxisTitle: 'fraction of full scale', valAxisMinVal: 0, valAxisMaxVal: 1, valAxisMajorUnit: 0.25, chartColors: [C.amber, C.teal, C.coral] });
  T.caption(slide, `Decisions ${r.steps.map((st) => (st.keep ? '1' : '0')).join('')} = ${r.code}; result ${r.vout.toFixed(4)}, within one step (1/256) of 0.70`, { x: M, y: 3.6, w: 4.6, h: 0.28 });
  T.bullets(slide, s.bullets, { x: 5.4, y: TOP, w: 4.1, h: 2.75 }, { fontSize: 11, gap: 3 });
  band(slide, s);
};

build.sigmadelta = (s, slide) => {
  eqStack(slide, s.equations, { x: M, y: TOP, w: 5.3, h: 1.75 }, { fontSize: 15 });
  T.bullets(slide, s.bullets, { x: M, y: 2.97, w: 5.3, h: 0.9 }, { fontSize: 11, gap: 3 });
  const fr = dsp.linspace(0.005, 0.5, 100);
  const flat = fr.map(() => 0);
  const first = fr.map((v) => 20 * Math.log10(2 * Math.sin(Math.PI * v)));
  const second = fr.map((v) => 40 * Math.log10(2 * Math.sin(Math.PI * v)));
  lineChart(slide, T.series(labelsOf(fr, 2), ['plain quantiser hiss', flat], ['1st-order loop', first], ['2nd-order loop', second.map((v) => Math.max(v, -60))]), { x: 6.0, y: TOP, w: 3.5, h: 2.75 }, { catAxisLabelFrequency: 20, showCatAxisTitle: true, catAxisTitle: 'frequency ÷ f_s  (signal band is far left)', showValAxisTitle: true, valAxisTitle: 'hiss level (dB)', valAxisMinVal: -60, valAxisMaxVal: 15, valAxisMajorUnit: 15, chartColors: [C.slate, C.teal, C.coral] });
  band(slide, s);
};

build.datasheet = (s, slide) => {
  table(slide, s.table, { x: M, y: TOP, w: W - 2 * M }, { colW: [1.3, 4.4, 3.3], fontSize: 9.5, rowH: 0.25 });
  slide.addText('The four ADC types compared', { x: M, y: 2.42, w: 5, h: 0.25, fontFace: F.body, fontSize: 11, bold: true, color: C.navy, isTextBox: true, margin: 0 });
  table(slide, s.compare, { x: M, y: 2.68, w: W - 2 * M }, { colW: [1.1, 2.4, 0.8, 1.0, 3.7], fontSize: 9.5, rowH: 0.24 });
  band(slide, s, { y: 4.1, h: 0.98 });
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
  lineChart(slide, T.series(tl, ['readings: two tones + hiss, in time', x.slice(0, 128)]), { x: M, y: TOP, w: LW, h: 2.05 }, { catAxisLabelFrequency: 16, showCatAxisTitle: true, catAxisTitle: 'reading number', valAxisMinVal: -1.6, valAxisMaxVal: 1.6, valAxisMajorUnit: 0.8, chartColors: [C.slate] });
  lineChart(slide, T.series(Array.from({ length: N / 2 }, (_, k) => String(k)), ['the same readings after a 256-point FFT (dB)', db]), { x: RX, y: TOP, w: RW, h: 2.05 }, { catAxisLabelFrequency: 16, showCatAxisTitle: true, catAxisTitle: 'frequency (kHz)  ·  one bucket = 1 kHz', valAxisMinVal: -80, valAxisMaxVal: 5, valAxisMajorUnit: 20, chartColors: [C.teal] });
  T.bullets(slide, s.bullets, { x: M, y: 3.22, w: W - 2 * M, h: 0.65 }, { fontSize: 11, gap: 2 });
  band(slide, s);
};

build.lineage = (s, slide) => {
  const h = (CB - TOP - 0.2) / 3;
  s.equations.forEach((e, i) => {
    const y = TOP + i * (h + 0.1);
    T.equation(slide, e.eq, { x: M + 0.5, y, w: W - 2 * M - 0.5, h }, { caption: e.cap, fontSize: 15 });
    slide.addShape('ellipse', { x: M, y: y + h / 2 - 0.2, w: 0.4, h: 0.4, fill: { color: [C.slate, C.amber, C.teal][i] }, line: { color: [C.slate, C.amber, C.teal][i] } });
    slide.addText(String(i + 1), { x: M, y: y + h / 2 - 0.2, w: 0.4, h: 0.4, fontFace: F.body, fontSize: 12, bold: true, color: C.navy, align: 'center', valign: 'middle', isTextBox: true, margin: 0 });
    if (i < 2) D.line(slide, M + 0.2, y + h / 2 + 0.2, M + 0.2, y + h + 0.1 + h / 2 - 0.2, { arrow: true, color: C.slate });
  });
  band(slide, s);
};

build.dft = (s, slide) => {
  eqStack(slide, s.equations, { x: M, y: TOP, w: 5.2, h: 1.75 }, { fontSize: 16 });
  T.bullets(slide, s.bullets, { x: M, y: 2.97, w: 5.2, h: 0.9 }, { fontSize: 11, gap: 3 });
  T.stat(slide, '39.06 kHz', 'bucket width: 40 MSPS ÷ 1024', { x: 6.0, y: TOP + 0.1, w: 3.5, h: 0.95 }, { fontSize: 26 });
  T.stat(slide, 'bucket 256', 'where a 10 MHz tone lands', { x: 6.0, y: 2.25, w: 3.5, h: 0.95 }, { fontSize: 26, color: C.teal });
  T.caption(slide, 'Longer recording → narrower buckets. More bits do not help resolution.', { x: 6.0, y: 3.35, w: 3.5, h: 0.5 });
  band(slide, s);
};

build.basis = (s, slide) => {
  eqStack(slide, s.equations, { x: M, y: TOP, w: LW, h: 1.72 }, { fontSize: 15 });
  T.bullets(slide, s.bullets, { x: M, y: 2.94, w: LW, h: 0.93 }, { fontSize: 11, gap: 3 });
  const N = 32;
  const n = Array.from({ length: N }, (_, i) => i);
  const basis = (k) => n.map((i) => Math.cos((2 * Math.PI * k * i) / N));
  lineChart(slide, T.series(n.map(String), ['k = 1 (one wiggle)', basis(1)], ['k = 2', basis(2)], ['k = 3', basis(3)]), { x: RX, y: TOP, w: RW, h: 2.75 }, { lineDataSymbol: 'circle', lineDataSymbolSize: 4, catAxisLabelFrequency: 4, showCatAxisTitle: true, catAxisTitle: 'reading n  (N = 32)', showValAxisTitle: true, valAxisTitle: 'test cosine', valAxisMinVal: -1.2, valAxisMaxVal: 1.2, valAxisMajorUnit: 0.4, valAxisLabelFormatCode: '0.0', chartColors: [C.teal, C.amber, C.coral] });
  band(slide, s);
};

build.fft = (s, slide) => {
  eqStack(slide, s.equations, { x: M, y: TOP, w: 5.0, h: 1.6 }, { fontSize: 14 });
  T.bullets(slide, s.bullets, { x: M, y: 2.82, w: 5.0, h: 1.05 }, { fontSize: 11, gap: 3 });
  slide.addText('The butterfly', { x: 5.8, y: TOP - 0.04, w: 3.7, h: 0.22, fontFace: F.body, fontSize: 10.5, bold: true, color: C.navy, isTextBox: true, margin: 0 });
  D.butterfly(slide, { x: 5.8, y: TOP + 0.18, w: 3.7, h: 1.15 });
  const Ns = [64, 256, 1024, 4096, 16384];
  const ratio = Ns.map((N) => { const c = dsp.costs(N); return Math.round(c.dft / c.fft); });
  barChart(slide, T.series(Ns.map((N) => N.toLocaleString('en-US')), ['how many times less work than the plain DFT', ratio]), { x: 5.8, y: 2.5, w: 3.7, h: 1.4 }, { dataLabelFormatCode: '#,##0"×"', showCatAxisTitle: true, catAxisTitle: 'number of readings N', valAxisHidden: true, valGridLine: { style: 'none' }, chartColors: [C.teal] });
  band(slide, s);
};

build.fft8 = (s, slide) => {
  D.fft8(slide, { x: M + 0.1, y: TOP + 0.4, w: W - 2 * M - 0.2, h: 1.72 });
  T.bullets(slide, s.bullets, { x: M, y: 3.36, w: W - 2 * M, h: 0.5 }, { fontSize: 10, gap: 0 });
  band(slide, s);
};

build.window = (s, slide) => {
  T.equation(slide, s.equations[0].eq, { x: M, y: TOP, w: LW, h: 0.8 }, { caption: s.equations[0].cap, fontSize: 16 });
  T.bullets(slide, s.bullets, { x: M, y: 2.0, w: LW, h: 1.88 }, { fontSize: 11, gap: 3 });
  const N = 128;
  const n = Array.from({ length: N }, (_, i) => i);
  const x = n.map((i) => Math.cos((2 * Math.PI * 20.5 * i) / N));
  const w = dsp.hann(N);
  const Xr = dsp.fft(x, new Array(N).fill(0));
  const Xh = dsp.fft(x.map((v, i) => v * w[i]), new Array(N).fill(0));
  const dbR = dsp.magDb(Xr.re, Xr.im).slice(0, N / 2);
  const dbH = dsp.magDb(Xh.re, Xh.im).slice(0, N / 2);
  lineChart(slide, T.series(n.slice(0, N / 2).map(String), ['with Hann window', dbH.map((v) => Math.max(v, -100))], ['no window', dbR.map((v) => Math.max(v, -100))]), { x: RX, y: TOP, w: RW, h: 2.75 }, { catAxisLabelFrequency: 8, showCatAxisTitle: true, catAxisTitle: 'bucket k  ·  tone at k = 20.5, N = 128', showValAxisTitle: true, valAxisTitle: 'level (dB)', valAxisMinVal: -100, valAxisMaxVal: 5, valAxisMajorUnit: 20, chartColors: [C.teal, C.coral] });
  band(slide, s);
};

build.ifft = (s, slide) => {
  eqStack(slide, s.equations, { x: M, y: TOP, w: 4.8, h: 1.5 }, { fontSize: 15 });
  T.bullets(slide, s.bullets, { x: M, y: 2.72, w: 4.8, h: 1.15 }, { fontSize: 11, gap: 3 });
  const N = 64;
  const next = dsp.rng(5);
  const x = Array.from({ length: N }, (_, i) => Math.cos((2 * Math.PI * 3 * i) / N) + 0.5 * Math.sin((2 * Math.PI * 7 * i) / N) + 0.2 * (next() - 0.5));
  const X = dsp.fft(x, new Array(N).fill(0));
  const y = dsp.ifft(X.re, X.im);
  let err = 0;
  for (let i = 0; i < N; i++) err = Math.max(err, Math.abs(y.re[i] - x[i]), Math.abs(y.im[i]));
  lineChart(slide, T.series(x.map((_, i) => String(i)), ['original readings', x], ['IFFT(FFT(x))', y.re]), { x: 5.6, y: TOP, w: 3.9, h: 1.95 }, { lineDataSymbol: 'circle', lineDataSymbolSize: 4, catAxisLabelFrequency: 8, showCatAxisTitle: true, catAxisTitle: 'reading n', valAxisMinVal: -2, valAxisMaxVal: 2, valAxisMajorUnit: 1, chartColors: [C.coral, C.teal] });
  T.stat(slide, err.toExponential(1), 'biggest difference after the round trip, measured by this build', { x: 5.6, y: 3.1, w: 3.9, h: 0.78 }, { fontSize: 24, color: C.teal });
  band(slide, s);
};

build.example = (s, slide) => {
  const rowH = 0.46;
  s.steps.forEach(([h, t], i) => {
    const y = TOP + i * rowH;
    const last = i === s.steps.length - 1;
    slide.addShape('ellipse', { x: M, y: y + 0.08, w: 0.3, h: 0.3, fill: { color: last ? C.teal : C.navy }, line: { color: last ? C.teal : C.navy } });
    slide.addText(String(i + 1), { x: M, y: y + 0.08, w: 0.3, h: 0.3, fontFace: F.body, fontSize: 10, bold: true, color: last ? C.navy : C.white, align: 'center', valign: 'middle', isTextBox: true, margin: 0 });
    slide.addText(
      [
        { text: h, options: { bold: true, color: C.navy, breakLine: true } },
        { text: t, options: { color: C.ink, fontSize: 9.5, fontFace: F.math } },
      ],
      { x: M + 0.42, y, w: 5.9, h: rowH, fontFace: F.body, fontSize: 11, valign: 'middle', isTextBox: true, margin: 0 }
    );
  });
  T.equation(slide, s.equations[0].eq, { x: 6.5, y: TOP, w: 3.0, h: 1.15 }, { caption: s.equations[0].cap, fontSize: 12 });
  T.stat(slide, 'bucket 256', '10 MHz ÷ 39.06 kHz', { x: 6.5, y: 2.35, w: 3.0, h: 0.72 }, { fontSize: 22, color: C.teal });
  T.stat(slide, '74 dB', 'ideal 12-bit SNR', { x: 6.5, y: 3.12, w: 1.45, h: 0.72 }, { fontSize: 18 });
  T.stat(slide, '−101 dBFS', 'FFT noise floor', { x: 8.0, y: 3.12, w: 1.5, h: 0.72 }, { fontSize: 18 });
  band(slide, s, { y: 4.05, h: 0.8 });
};

build.ofdm = (s, slide) => {
  D.ofdmChain(slide, { x: M + 0.55, y: TOP, w: W - 2 * M - 0.55, h: 1.35 });
  const o = dsp.ofdmSymbol(64, 52);
  const n = Array.from({ length: 64 }, (_, i) => String(i));
  lineChart(slide, T.series(n, ['what the IFFT sends (real part)', o.time.re.map((v) => v * 8)], ['imaginary part', o.time.im.map((v) => v * 8)]), { x: M, y: 2.55, w: LW, h: 1.35 }, { catAxisLabelFrequency: 8, showCatAxisTitle: true, catAxisTitle: 'reading n (N = 64)  ·  teal: real, amber: imaginary', chartColors: [C.teal, C.amber], lineSize: 1.25, valAxisMinVal: -3, valAxisMaxVal: 3, valAxisMajorUnit: 1, showLegend: false });
  const order = [];
  const lab = [];
  for (let k = -32; k < 32; k++) { order.push(k); lab.push(String(k)); }
  const magRx = order.map((k) => Math.hypot(o.rx.re[(k + 64) % 64], o.rx.im[(k + 64) % 64]));
  barChart(slide, T.series(lab, ['what the FFT gets back: 52 filled buckets, 12 empty', magRx]), { x: RX, y: 2.55, w: RW, h: 1.35 }, { showValue: false, barGapWidthPct: 20, catAxisLabelFrequency: 8, showCatAxisTitle: true, catAxisTitle: 'bucket (subcarrier) index', valAxisMinVal: 0, valAxisMaxVal: 2, valAxisMajorUnit: 1, chartColors: [C.coral], showLegend: true });
  band(slide, s);
};

build.pitfalls = (s, slide) => {
  const gap = 0.2;
  const cw = (W - 2 * M - 2 * gap) / 3;
  const ch = 1.75;
  s.cards.forEach(([n, h, t], i) => {
    const row = i < 3 ? 0 : 1;
    const col = i < 3 ? i : i - 3;
    const x = M + col * (cw + gap) + (row === 1 ? (cw + gap) / 2 : 0);
    const y = TOP + row * (ch + 0.2);
    T.card(slide, h, t, { x, y, w: cw, h: ch }, { icon: n, iconColor: C.coral, headSize: 13, bodySize: 10.5 });
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
  } else if (s.kind === 'appendix') {
    appendixSlide(s, number);
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
