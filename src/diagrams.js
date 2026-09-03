// Shape-drawn diagrams (no images): RF chain, ADC blocks, sample-and-hold, flash, butterfly,
// 8-point FFT signal flow, OFDM chain. All coordinates in inches inside a caller-supplied box.

const { C, F } = require('./theme');

// ---------------------------------------------------------------- primitives

function block(slide, x, y, w, h, label, o = {}) {
  slide.addText(label, {
    shape: o.shape || 'roundRect',
    rectRadius: o.shape ? undefined : 0.06,
    x,
    y,
    w,
    h,
    fill: { color: o.fill || C.tint },
    line: { color: o.line || o.fill || C.tint, width: o.lineW || 0.75 },
    fontFace: F.body,
    fontSize: o.fontSize || 10,
    bold: o.bold !== false,
    color: o.color || C.navy,
    align: 'center',
    valign: 'middle',
    isTextBox: true,
    margin: 0.02,
  });
}

/** Straight line from (x1,y1) to (x2,y2); optional arrowhead at the end. */
function line(slide, x1, y1, x2, y2, o = {}) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const opts = {
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    w: Math.abs(dx),
    h: Math.abs(dy),
    line: { color: o.color || C.slate, width: o.width || 1 },
  };
  if (o.arrow) opts.line.endArrowType = 'triangle';
  if (o.dash) opts.line.dashType = o.dash;
  if (dx < 0) opts.flipH = true;
  if (dy < 0) opts.flipV = true;
  slide.addShape('line', opts);
}

function label(slide, text, x, y, w, h, o = {}) {
  slide.addText(text, {
    x,
    y,
    w,
    h,
    fontFace: o.math ? F.math : F.body,
    fontSize: o.fontSize || 9,
    color: o.color || C.slate,
    bold: !!o.bold,
    italic: !!o.italic,
    align: o.align || 'center',
    valign: o.valign || 'middle',
    isTextBox: true,
    margin: 0,
  });
}

function dot(slide, cx, cy, r = 0.05, color = C.navy) {
  slide.addShape('ellipse', { x: cx - r, y: cy - r, w: 2 * r, h: 2 * r, fill: { color }, line: { color } });
}

// ---------------------------------------------------------------- RF chain

const CHAIN = ['Antenna', 'LNA', 'Mixer', 'Filter', 'ADC', 'DSP', 'Data'];

/**
 * Receive chain of blocks with arrows. o.highlight names the block to emphasise.
 * o.dark draws for a navy background. o.sub adds a one-line role under each block.
 */
function rfChain(slide, box, o = {}) {
  const n = CHAIN.length;
  const gap = 0.22;
  const bw = (box.w - gap * (n - 1)) / n;
  const bh = o.sub ? box.h * 0.55 : box.h;
  const subs = ['EM wave → µV', 'low-noise gain', 'RF → IF', 'band select', 'V → bits', 'FFT, demod', 'information'];
  CHAIN.forEach((name, i) => {
    const x = box.x + i * (bw + gap);
    const hl = o.highlight === name;
    const fill = hl ? C.teal : o.dark ? C.tintDark : C.tint;
    const color = hl ? C.navy : o.dark ? C.white : C.navy;
    block(slide, x, box.y, bw, bh, name, { fill, color, fontSize: o.fontSize || 11 });
    if (i < n - 1) {
      line(slide, x + bw, box.y + bh / 2, x + bw + gap, box.y + bh / 2, { arrow: true, color: o.dark ? '8FA3BF' : C.slate, width: 1.25 });
    }
    if (o.sub) {
      label(slide, subs[i], x - 0.05, box.y + bh + 0.05, bw + 0.1, box.h - bh - 0.05, { color: o.dark ? 'B8C4D6' : C.slate, fontSize: 9 });
    }
  });
}

// ---------------------------------------------------------------- ADC blocks

function adcBlocks(slide, box) {
  const names = ['Sample & hold', 'Quantiser', 'Encoder'];
  const subs = ['freeze V_in for one T_s', 'nearest of 2ᴺ levels', 'level → N-bit code'];
  const gap = 0.5;
  const bw = (box.w - 2 * gap - 1.4) / 3;
  const bh = 0.7;
  const y = box.y + 0.45;
  label(slide, 'V_in', box.x, y, 0.6, bh, { math: true, fontSize: 12, color: C.navy, bold: true });
  line(slide, box.x + 0.6, y + bh / 2, box.x + 0.7, y + bh / 2, { arrow: true });
  names.forEach((nm, i) => {
    const x = box.x + 0.7 + i * (bw + gap);
    block(slide, x, y, bw, bh, `${i + 1} · ${nm}`, { fontSize: 11 });
    label(slide, subs[i], x - 0.1, y + bh + 0.06, bw + 0.2, 0.3, { fontSize: 9 });
    if (i < 2) line(slide, x + bw, y + bh / 2, x + bw + gap, y + bh / 2, { arrow: true, width: 1.25 });
  });
  const xEnd = box.x + 0.7 + 3 * bw + 2 * gap;
  line(slide, xEnd, y + bh / 2, xEnd + 0.1, y + bh / 2, { arrow: true });
  label(slide, 'N-bit\ncode', xEnd + 0.1, y, 0.6, bh, { math: true, fontSize: 12, color: C.navy, bold: true });
  // clock
  const cx = box.x + 0.7 + 0.14;
  block(slide, cx - 0.5, box.y + 1.75, 1.0, 0.4, 'Clock  f_s', { fill: 'FFF4D6', color: C.navy, fontSize: 10 });
  line(slide, cx, box.y + 1.75, cx, y + bh, { arrow: true, dash: 'dash', color: C.amber, width: 1.25 });
  label(slide, 'every T_s = 1/f_s: hold → compare → output', cx + 0.6, box.y + 1.75, box.w - bw / 2 - 1.3, 0.4, { align: 'left', fontSize: 10, italic: true });
}

// ---------------------------------------------------------------- sample-and-hold

/** Left: switch + capacitor. Right: track/hold timing with jitter marker. */
function sampleHold(slide, box) {
  const x0 = box.x;
  const y0 = box.y;
  // circuit
  const yWire = y0 + 0.7;
  label(slide, 'V_in', x0, yWire - 0.2, 0.45, 0.4, { math: true, fontSize: 11, color: C.navy, bold: true });
  line(slide, x0 + 0.45, yWire, x0 + 0.95, yWire, { width: 1.5, color: C.navy });
  dot(slide, x0 + 0.95, yWire, 0.04);
  // switch blade (open)
  line(slide, x0 + 0.95, yWire, x0 + 1.4, yWire - 0.25, { width: 1.5, color: C.navy });
  dot(slide, x0 + 1.5, yWire, 0.04);
  line(slide, x0 + 1.5, yWire, x0 + 2.4, yWire, { width: 1.5, color: C.navy });
  label(slide, 'switch (clock)', x0 + 0.85, yWire - 0.62, 0.8, 0.3, { fontSize: 9 });
  // capacitor
  const cx = x0 + 1.95;
  line(slide, cx, yWire, cx, yWire + 0.3, { width: 1.5, color: C.navy });
  line(slide, cx - 0.2, yWire + 0.3, cx + 0.2, yWire + 0.3, { width: 2, color: C.navy });
  line(slide, cx - 0.2, yWire + 0.4, cx + 0.2, yWire + 0.4, { width: 2, color: C.navy });
  line(slide, cx, yWire + 0.4, cx, yWire + 0.65, { width: 1.5, color: C.navy });
  line(slide, cx - 0.15, yWire + 0.65, cx + 0.15, yWire + 0.65, { width: 1.5, color: C.navy });
  label(slide, 'C_hold', cx + 0.22, yWire + 0.25, 0.6, 0.3, { math: true, fontSize: 9, align: 'left' });
  // buffer triangle
  slide.addShape('triangle', { x: x0 + 2.4, y: yWire - 0.25, w: 0.45, h: 0.5, rotate: 90, fill: { color: C.tint }, line: { color: C.navy, width: 1 } });
  line(slide, x0 + 2.85, yWire, x0 + 3.2, yWire, { width: 1.5, color: C.navy, arrow: true });
  label(slide, 'to quantiser', x0 + 3.2, yWire - 0.2, 0.9, 0.4, { fontSize: 9, align: 'left' });
  label(slide, 'Track: switch closed, C follows V_in.  Hold: switch opens, C keeps the value.', x0, y0 + 1.75, 4.2, 0.5, { fontSize: 10, align: 'left', valign: 'top', color: C.ink });

  // timing diagram
  const tx = x0 + 4.6;
  const tw = box.w - 4.6;
  const ty = y0 + 0.25;
  const th = 1.3;
  // clock trace
  label(slide, 'clock', tx - 0.5, ty, 0.5, 0.3, { fontSize: 9, align: 'right' });
  let px = tx;
  const seg = tw / 4;
  for (let i = 0; i < 2; i++) {
    line(slide, px, ty + 0.3, px + seg, ty + 0.3, { width: 1.25, color: C.navy });
    line(slide, px + seg, ty + 0.3, px + seg, ty + 0.05, { width: 1.25, color: C.navy });
    line(slide, px + seg, ty + 0.05, px + 2 * seg, ty + 0.05, { width: 1.25, color: C.navy });
    line(slide, px + 2 * seg, ty + 0.05, px + 2 * seg, ty + 0.3, { width: 1.25, color: C.navy });
    px += 2 * seg;
  }
  label(slide, 'track', tx, ty + 0.32, seg, 0.25, { fontSize: 8 });
  label(slide, 'hold', tx + seg, ty + 0.32, seg, 0.25, { fontSize: 8 });
  // capacitor voltage trace: rises during track, flat during hold
  const vy = ty + 0.7;
  label(slide, 'V_C', tx - 0.5, vy + 0.15, 0.5, 0.3, { math: true, fontSize: 9, align: 'right' });
  line(slide, tx, vy + 0.55, tx + seg, vy + 0.2, { width: 1.5, color: C.teal });
  line(slide, tx + seg, vy + 0.2, tx + 2 * seg, vy + 0.2, { width: 1.5, color: C.teal });
  line(slide, tx + 2 * seg, vy + 0.2, tx + 3 * seg, vy + 0.5, { width: 1.5, color: C.teal });
  line(slide, tx + 3 * seg, vy + 0.5, tx + 4 * seg, vy + 0.5, { width: 1.5, color: C.teal });
  // jitter marker around the first hold edge
  line(slide, tx + seg - 0.12, ty, tx + seg - 0.12, vy + 0.6, { dash: 'dash', color: C.coral, width: 0.75 });
  line(slide, tx + seg + 0.12, ty, tx + seg + 0.12, vy + 0.6, { dash: 'dash', color: C.coral, width: 0.75 });
  label(slide, 't_j', tx + seg - 0.3, vy + 0.62, 0.6, 0.25, { math: true, fontSize: 9, color: C.coral, bold: true });
  label(slide, 'The hold edge wobbles by t_j; on a fast-moving input that samples the wrong voltage.', tx - 0.3, y0 + th + 0.45, tw + 0.3, 0.45, { fontSize: 10, align: 'left', valign: 'top', color: C.ink });
}

// ---------------------------------------------------------------- flash ADC

function flashAdc(slide, box) {
  const n = 7; // 3-bit: 7 comparators
  const rowH = box.h / (n + 1);
  const xLadder = box.x + 0.9;
  const xComp = box.x + 1.7;
  const compW = 0.55;
  const xEnc = box.x + 3.1;
  label(slide, 'V_ref', xLadder - 0.35, box.y - 0.28, 0.7, 0.25, { math: true, fontSize: 9, bold: true, color: C.navy });
  label(slide, 'V_in', box.x, box.y + box.h / 2 - 0.15, 0.5, 0.3, { math: true, fontSize: 10, bold: true, color: C.navy });
  line(slide, box.x + 0.5, box.y + box.h / 2, box.x + 0.7, box.y + box.h / 2, { width: 1.5, color: C.navy });
  // vertical V_in bus
  line(slide, box.x + 0.7, box.y + rowH * 0.9, box.x + 0.7, box.y + rowH * (n + 0.1), { width: 1.5, color: C.navy });
  const thermo = ['0', '0', '0', '1', '1', '1', '1'];
  for (let i = 0; i < n; i++) {
    const y = box.y + rowH * (i + 0.5);
    // resistor
    block(slide, xLadder - 0.12, y - rowH * 0.5 + 0.03, 0.24, rowH * 0.5, 'R', { shape: 'rect', fill: C.white, line: C.navy, fontSize: 7, color: C.navy });
    line(slide, xLadder, y + 0.03, xLadder, y + rowH * 0.5, { width: 1, color: C.navy });
    // tap to comparator
    line(slide, xLadder, y + 0.05, xComp, y + 0.05, { width: 0.75, color: C.slate });
    // comparator
    slide.addShape('triangle', { x: xComp, y: y - rowH * 0.3, w: compW, h: rowH * 0.7, rotate: 90, fill: { color: thermo[i] === '1' ? C.teal : C.tint }, line: { color: C.navy, width: 0.75 } });
    // V_in tap
    line(slide, box.x + 0.7, y - 0.08, xComp, y - 0.08, { width: 0.75, color: C.slate });
    // output to encoder
    line(slide, xComp + compW, y + 0.03, xEnc, y + 0.03, { width: 0.75, color: C.slate, arrow: true });
    label(slide, thermo[i], xComp + compW + 0.05, y - 0.16, 0.3, 0.25, { fontSize: 9, bold: true, color: thermo[i] === '1' ? C.teal : C.slate });
  }
  block(slide, xLadder - 0.12, box.y + rowH * (n + 0.53), 0.24, rowH * 0.4, 'R', { shape: 'rect', fill: C.white, line: C.navy, fontSize: 7, color: C.navy });
  label(slide, 'GND', xLadder - 0.35, box.y + box.h - 0.02, 0.7, 0.22, { fontSize: 8 });
  block(slide, xEnc, box.y + rowH * 1.5, 1.0, rowH * 5, 'Thermo-\nmeter\n→ binary\nencoder', { fontSize: 9 });
  line(slide, xEnc + 1.0, box.y + box.h / 2, xEnc + 1.3, box.y + box.h / 2, { arrow: true, width: 1.25 });
  label(slide, '100', xEnc + 1.3, box.y + box.h / 2 - 0.18, 0.5, 0.35, { math: true, fontSize: 14, bold: true, color: C.navy, align: 'left' });
  label(slide, '2ᴺ − 1 = 7 comparators for 3 bits; V_in ≈ 0.55 V_ref → four ones → code 4 = 100', box.x, box.y + box.h + 0.15, box.w, 0.3, { fontSize: 10, italic: true });
}

// ---------------------------------------------------------------- butterfly

function butterfly(slide, box) {
  const x0 = box.x + 0.5;
  const x1 = box.x + box.w - 0.9;
  const yA = box.y + 0.35;
  const yB = box.y + box.h - 0.45;
  label(slide, 'a', box.x, yA - 0.15, 0.45, 0.3, { math: true, fontSize: 14, bold: true, color: C.navy });
  label(slide, 'b', box.x, yB - 0.15, 0.45, 0.3, { math: true, fontSize: 14, bold: true, color: C.navy });
  // twiddle on lower input
  const xw = x0 + 0.55;
  line(slide, x0, yB, xw - 0.18, yB, { width: 1.5, color: C.navy });
  slide.addShape('ellipse', { x: xw - 0.18, y: yB - 0.18, w: 0.36, h: 0.36, fill: { color: C.amber }, line: { color: C.amber } });
  label(slide, 'W', xw - 0.18, yB - 0.18, 0.36, 0.36, { math: true, fontSize: 11, bold: true, color: C.navy });
  line(slide, x0, yA, x1, yA, { width: 1.5, color: C.navy, arrow: true });
  line(slide, xw + 0.18, yB, x1, yB, { width: 1.5, color: C.navy, arrow: true });
  line(slide, xw + 0.18, yB, x1, yA, { width: 1.5, color: C.teal, arrow: true });
  line(slide, x0, yA, x1, yB, { width: 1.5, color: C.coral, arrow: true });
  dot(slide, x1, yA, 0.05, C.navy);
  dot(slide, x1, yB, 0.05, C.navy);
  label(slide, 'a + W·b', x1 + 0.08, yA - 0.15, 0.85, 0.3, { math: true, fontSize: 13, bold: true, color: C.navy, align: 'left' });
  label(slide, 'a − W·b', x1 + 0.08, yB - 0.15, 0.85, 0.3, { math: true, fontSize: 13, bold: true, color: C.navy, align: 'left' });
  label(slide, '−1', (x0 + x1) / 2 + 0.25, yB - 0.42, 0.4, 0.25, { math: true, fontSize: 9, color: C.coral, bold: true });
  label(slide, 'one complex multiply, two adds', box.x, box.y + box.h - 0.12, box.w, 0.25, { fontSize: 9, italic: true });
}

// ---------------------------------------------------------------- 8-point FFT flow graph

function fft8(slide, box) {
  const N = 8;
  const rows = N;
  const rowH = box.h / rows;
  const stageX = [box.x + 0.85, box.x + 0.85 + (box.w - 1.7) / 3, box.x + 0.85 + (2 * (box.w - 1.7)) / 3, box.x + box.w - 0.85];
  const ys = Array.from({ length: rows }, (_, r) => box.y + rowH * (r + 0.5));
  const bitrev = [0, 4, 2, 6, 1, 5, 3, 7];
  // input labels (bit-reversed order)
  bitrev.forEach((idx, r) => {
    label(slide, `x[${idx}]`, box.x, ys[r] - 0.12, 0.8, 0.24, { math: true, fontSize: 10, bold: true, color: C.navy, align: 'right' });
  });
  // output labels (natural order)
  for (let r = 0; r < rows; r++) {
    label(slide, `X[${r}]`, box.x + box.w - 0.8, ys[r] - 0.12, 0.8, 0.24, { math: true, fontSize: 10, bold: true, color: C.navy, align: 'left' });
  }
  // horizontal through-lines
  for (let r = 0; r < rows; r++) line(slide, stageX[0], ys[r], stageX[3], ys[r], { width: 1, color: C.grid });
  // stages
  const stageColors = [C.teal, C.amber, C.coral];
  for (let s = 0; s < 3; s++) {
    const half = 1 << s;
    const size = half * 2;
    const xa = stageX[s];
    const xb = stageX[s + 1];
    for (let start = 0; start < N; start += size) {
      for (let k = 0; k < half; k++) {
        const i1 = start + k;
        const i2 = i1 + half;
        line(slide, xa, ys[i1], xb, ys[i1], { width: 1.25, color: C.navy });
        line(slide, xa, ys[i2], xb, ys[i2], { width: 1.25, color: C.navy });
        line(slide, xa, ys[i1], xb, ys[i2], { width: 1.25, color: stageColors[s] });
        line(slide, xa, ys[i2], xb, ys[i1], { width: 1.25, color: stageColors[s] });
        dot(slide, xb, ys[i1], 0.035);
        dot(slide, xb, ys[i2], 0.035);
        // twiddle label on lower input
        const tw = `W${size}^${k}`;
        label(slide, tw.replace(/W(\d+)\^(\d+)/, (m, a, b) => `W${'₀₁₂₃₄₅₆₇₈'[Number(a)] || a}${['⁰', '¹', '²', '³'][Number(b)]}`), xa + 0.02, ys[i2] - 0.22, 0.4, 0.2, { math: true, fontSize: 8, color: stageColors[s], bold: true, align: 'left' });
      }
    }
    label(slide, `Stage ${s + 1}: ${size}-point`, xa, box.y - 0.28, xb - xa, 0.25, { fontSize: 9, bold: true, color: stageColors[s] });
  }
  label(slide, 'bit-reversed in', stageX[0] - 0.85, box.y - 0.28, 0.85, 0.25, { fontSize: 8, italic: true });
  label(slide, 'natural order out', stageX[3], box.y - 0.28, 0.85, 0.25, { fontSize: 8, italic: true });
}

// ---------------------------------------------------------------- OFDM chain

function ofdmChain(slide, box) {
  const tx = ['QAM\nsymbols', 'Serial →\nparallel', 'IFFT', 'Add cyclic\nprefix', 'DAC + RF'];
  const rx = ['RF + ADC', 'Remove\nprefix', 'FFT', 'Equalise\n(1 tap/bin)', 'QAM\ndecisions'];
  const gap = 0.3;
  const bw = (box.w - gap * 4) / 5;
  const rowGap = 0.35;
  const bh = Math.min(0.55, (box.h - rowGap) / 2);
  const draw = (names, y, hlIndex, tag) => {
    label(slide, tag, box.x - 0.55, y, 0.5, bh, { fontSize: 10, bold: true, color: C.navy, align: 'right' });
    names.forEach((nm, i) => {
      const x = box.x + i * (bw + gap);
      const hl = i === hlIndex;
      block(slide, x, y, bw, bh, nm, { fill: hl ? C.teal : C.tint, fontSize: 9 });
      if (i < 4) line(slide, x + bw, y + bh / 2, x + bw + gap, y + bh / 2, { arrow: true, width: 1.25 });
    });
  };
  draw(tx, box.y, 2, 'TX');
  draw(rx, box.y + bh + rowGap, 2, 'RX');
  // channel arrow between
  const xm = box.x + box.w - bw / 2;
  line(slide, xm, box.y + bh, xm, box.y + bh + rowGap, { arrow: true, dash: 'dash', color: C.coral, width: 1.25 });
  label(slide, 'radio channel', xm - 1.3, box.y + bh + rowGap / 2 - 0.12, 1.2, 0.25, { fontSize: 9, color: C.coral, italic: true, align: 'right' });
}

module.exports = { block, line, label, dot, rfChain, adcBlocks, sampleHold, flashAdc, butterfly, fft8, ofdmChain, CHAIN };
