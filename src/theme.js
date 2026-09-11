// Palette, typography, and shared layout helpers for the deck.
// Every helper returns a FRESH options object: pptxgenjs mutates option objects in place.

const C = {
  navy: '0B1F3A', // dominant: title / section / recap slides
  ink: '14213D', // body text on light slides
  white: 'FFFFFF',
  teal: '2EC4B6', // signal accent
  amber: 'FFB703', // highlight / expert corner
  coral: 'E76F51', // alias / error series
  slate: '5B6B7F', // captions, muted text
  tint: 'EEF3F8', // light card background
  tintDark: '13294B', // card background on navy
  grid: 'D9E1EA',
};

const F = {
  head: 'Cambria',
  body: 'Calibri',
  math: 'Cambria',
};

const W = 10; // LAYOUT_16x9 width (in)
const H = 5.625; // height (in)
const M = 0.5; // margin

/** Base chart options. Pass a series count so the legend only shows for multi-series charts. */
function chartBase(series = 1, extra = {}) {
  return Object.assign(
    {
      chartColors: [C.teal, C.coral, C.amber, C.navy, C.slate],
      showLegend: series > 1,
      legendPos: 'b',
      legendFontSize: 9,
      legendFontFace: F.body,
      legendColor: C.ink,
      showTitle: false,
      catAxisLabelColor: C.slate,
      valAxisLabelColor: C.slate,
      catAxisLabelFontSize: 9,
      valAxisLabelFontSize: 9,
      catAxisLabelFontFace: F.body,
      valAxisLabelFontFace: F.body,
      catAxisTitleColor: C.slate,
      valAxisTitleColor: C.slate,
      catAxisTitleFontSize: 9,
      valAxisTitleFontSize: 9,
      catAxisTitleFontFace: F.body,
      valAxisTitleFontFace: F.body,
      valGridLine: { color: C.grid, size: 0.5 },
      catGridLine: { style: 'none' },
      catAxisLineShow: true,
      valAxisLineShow: false,
      catAxisMajorTickMark: 'none',
      catAxisMinorTickMark: 'none',
      valAxisMajorTickMark: 'none',
      valAxisMinorTickMark: 'none',
      valAxisCrossesAt: 'min', // category axis sits at the bottom, not at y = 0
      valAxisLabelFormatCode: 'General',
      plotArea: { fill: { color: C.white } },
      chartArea: { fill: { color: C.white }, roundedCorners: false },
    },
    extra
  );
}

/** Line chart defaults: thin lines, no markers unless asked. */
function lineChart(series = 1, extra = {}) {
  return chartBase(
    series,
    Object.assign(
      {
        lineSize: 1.5,
        lineDataSymbol: 'none',
        lineSmooth: false,
      },
      extra
    )
  );
}

/** Bar chart defaults with value labels. */
function barChart(series = 1, extra = {}) {
  return chartBase(
    series,
    Object.assign(
      {
        barDir: 'col',
        barGapWidthPct: 60,
        showValue: true,
        dataLabelPosition: 'outEnd',
        dataLabelFontSize: 9,
        dataLabelColor: C.ink,
        dataLabelFontFace: F.body,
      },
      extra
    )
  );
}

/** Build pptxgenjs chart data from x labels and one or more y series. */
function series(labels, ...named) {
  return named.map(([name, values]) => ({ name, labels, values }));
}

/** Format a number to fixed decimals as a category label. */
function fmt(v, d = 2) {
  return Number(v).toFixed(d);
}

// ---------------------------------------------------------------------------
// Slide scaffolds
// ---------------------------------------------------------------------------

/** Full-navy slide (title, section opener, recap). */
function darkSlide(pres) {
  const s = pres.addSlide();
  s.background = { color: C.navy };
  return s;
}

/** White content slide with title and footer. */
function contentSlide(pres, title, meta) {
  const s = pres.addSlide();
  s.background = { color: C.white };
  // Cambria bold at 28pt holds about 33 characters across 9"; step down for longer titles.
  const avail = (meta && meta.titleW) || W - 2 * M;
  const len = title.length * (9 / avail);
  const titleSize = len <= 33 ? 28 : len <= 39 ? 24 : len <= 46 ? 20 : 18;
  s.addText(title, {
    x: M,
    y: 0.32,
    w: (meta && meta.titleW) || W - 2 * M,
    h: 0.7,
    fontFace: F.head,
    fontSize: titleSize,
    bold: true,
    color: C.navy,
    isTextBox: true,
    margin: 0,
    valign: 'middle',
  });
  if (meta) {
    s.addText(meta.section, {
      x: M,
      y: H - 0.38,
      w: 5,
      h: 0.25,
      fontFace: F.body,
      fontSize: 9,
      color: C.slate,
      isTextBox: true,
      margin: 0,
    });
    s.addText(String(meta.number), {
      x: W - M - 1,
      y: H - 0.38,
      w: 1,
      h: 0.25,
      fontFace: F.body,
      fontSize: 9,
      color: C.slate,
      align: 'right',
      isTextBox: true,
      margin: 0,
    });
  }
  return s;
}

/** Bulleted list. items: string[] or {text, sub:boolean}[] */
function bullets(slide, items, box, opts = {}) {
  const runs = items.map((it, i) => {
    const o = typeof it === 'string' ? { text: it } : it;
    return {
      text: o.text,
      options: {
        bullet: o.sub ? { indent: 14 } : true,
        indentLevel: o.sub ? 1 : 0,
        breakLine: i < items.length - 1,
        paraSpaceAfter: opts.gap !== undefined ? opts.gap : 6,
        fontSize: o.sub ? (opts.fontSize || 14) - 2 : opts.fontSize || 14,
        color: opts.color || C.ink,
        bold: !!o.bold,
      },
    };
  });
  slide.addText(runs, {
    x: box.x,
    y: box.y,
    w: box.w,
    h: box.h,
    fontFace: F.body,
    valign: 'top',
    isTextBox: true,
    margin: 0,
  });
}

/** Equation card: tinted rounded rectangle with a centred equation and an optional caption. */
function equation(slide, text, box, opts = {}) {
  const dark = !!opts.dark;
  slide.addShape('roundRect', {
    x: box.x,
    y: box.y,
    w: box.w,
    h: box.h,
    fill: { color: dark ? C.tintDark : C.tint },
    line: { color: dark ? C.tintDark : C.tint },
    rectRadius: 0.08,
  });
  const capH = opts.caption ? 0.28 : 0;
  // Fit the longest line: Cambria averages ~0.5 × fontSize (pt) per character.
  const longest = Math.max(...text.split('\n').map((l) => l.length));
  const fit = Math.floor(((box.w - 0.3) * 128) / Math.max(longest, 1));
  const fontSize = Math.max(10, Math.min(opts.fontSize || 20, fit));
  slide.addText(text, {
    x: box.x + 0.15,
    y: box.y,
    w: box.w - 0.3,
    h: box.h - capH,
    fontFace: F.math,
    fontSize,
    color: dark ? C.white : C.navy,
    align: 'center',
    valign: 'middle',
    isTextBox: true,
    margin: 0,
  });
  if (opts.caption) {
    slide.addText(opts.caption, {
      x: box.x + 0.15,
      y: box.y + box.h - capH - 0.05,
      w: box.w - 0.3,
      h: capH,
      fontFace: F.body,
      fontSize: 10,
      color: dark ? 'B8C4D6' : C.slate,
      align: 'center',
      valign: 'top',
      isTextBox: true,
      margin: 0,
    });
  }
}

/** Expert corner: amber-tinted card with a bold label and small text. */
function expertCorner(slide, text, box) {
  slide.addShape('roundRect', {
    x: box.x,
    y: box.y,
    w: box.w,
    h: box.h,
    fill: { color: 'FFF4D6' },
    line: { color: 'FFF4D6' },
    rectRadius: 0.08,
  });
  slide.addShape('ellipse', {
    x: box.x + 0.12,
    y: box.y + 0.12,
    w: 0.26,
    h: 0.26,
    fill: { color: C.amber },
    line: { color: C.amber },
  });
  slide.addText('★', {
    x: box.x + 0.12,
    y: box.y + 0.12,
    w: 0.26,
    h: 0.26,
    fontSize: 11,
    color: C.navy,
    align: 'center',
    valign: 'middle',
    isTextBox: true,
    margin: 0,
  });
  slide.addText(
    [
      { text: 'Expert corner  ', options: { bold: true, color: C.navy } },
      { text: text, options: { color: C.ink } },
    ],
    {
      x: box.x + 0.48,
      y: box.y + 0.08,
      w: box.w - 0.6,
      h: box.h - 0.16,
      fontFace: F.body,
      fontSize: 10.5,
      valign: 'top',
      isTextBox: true,
      margin: 0,
    }
  );
}

/** Everyday analogy: teal-tinted card with a "Think of it like this" label. */
function analogyCard(slide, text, box, opts = {}) {
  slide.addShape('roundRect', {
    x: box.x,
    y: box.y,
    w: box.w,
    h: box.h,
    fill: { color: 'E4F7F4' },
    line: { color: 'E4F7F4' },
    rectRadius: 0.08,
  });
  slide.addShape('ellipse', {
    x: box.x + 0.12,
    y: box.y + 0.11,
    w: 0.26,
    h: 0.26,
    fill: { color: C.teal },
    line: { color: C.teal },
  });
  slide.addText('≈', {
    x: box.x + 0.12,
    y: box.y + 0.11,
    w: 0.26,
    h: 0.26,
    fontFace: F.body,
    fontSize: 12,
    bold: true,
    color: C.navy,
    align: 'center',
    valign: 'middle',
    isTextBox: true,
    margin: 0,
  });
  slide.addText(
    [
      { text: 'Think of it like this  ', options: { bold: true, color: C.navy } },
      { text, options: { color: C.ink } },
    ],
    {
      x: box.x + 0.46,
      y: box.y + 0.07,
      w: box.w - 0.58,
      h: box.h - 0.14,
      fontFace: F.body,
      fontSize: opts.fontSize || 10.5,
      valign: 'top',
      isTextBox: true,
      margin: 0,
    }
  );
}

/** Numeric example: white card with a navy outline, a bold title, and math-font lines. */
function exampleCard(slide, ex, box, opts = {}) {
  slide.addShape('roundRect', {
    x: box.x,
    y: box.y,
    w: box.w,
    h: box.h,
    fill: { color: C.white },
    line: { color: C.navy, width: 1 },
    rectRadius: 0.08,
  });
  slide.addShape('roundRect', {
    x: box.x + 0.12,
    y: box.y - 0.12,
    w: 1.0,
    h: 0.24,
    fill: { color: C.navy },
    line: { color: C.navy },
    rectRadius: 0.06,
  });
  slide.addText('EXAMPLE', {
    x: box.x + 0.12,
    y: box.y - 0.12,
    w: 1.0,
    h: 0.24,
    fontFace: F.body,
    fontSize: 8.5,
    bold: true,
    color: C.white,
    align: 'center',
    valign: 'middle',
    charSpacing: 1,
    isTextBox: true,
    margin: 0,
  });
  const runs = [{ text: ex.title, options: { bold: true, color: C.navy, fontFace: F.body, breakLine: true } }];
  ex.lines.forEach((l, i) => {
    runs.push({ text: l, options: { color: C.ink, fontFace: F.math, breakLine: i < ex.lines.length - 1, bullet: { code: '2022', indent: 9 } } });
  });
  slide.addText(runs, {
    x: box.x + 0.14,
    y: box.y + 0.15,
    w: box.w - 0.24,
    h: box.h - 0.2,
    fontSize: opts.fontSize || 10,
    valign: 'top',
    isTextBox: true,
    margin: 0,
    paraSpaceAfter: 1,
  });
}

/** Large stat callout: big number with a small label under it. */
function stat(slide, value, label, box, opts = {}) {
  const dark = !!opts.dark;
  slide.addText(value, {
    x: box.x,
    y: box.y,
    w: box.w,
    h: box.h * 0.62,
    fontFace: F.head,
    fontSize: opts.fontSize || 40,
    bold: true,
    color: opts.color || (dark ? C.teal : C.navy),
    align: 'center',
    valign: 'bottom',
    isTextBox: true,
    margin: 0,
  });
  slide.addText(label, {
    x: box.x,
    y: box.y + box.h * 0.62,
    w: box.w,
    h: box.h * 0.38,
    fontFace: F.body,
    fontSize: 11,
    color: dark ? 'B8C4D6' : C.slate,
    align: 'center',
    valign: 'top',
    isTextBox: true,
    margin: 0,
  });
}

/** Caption under a chart or diagram. */
function caption(slide, text, box) {
  slide.addText(text, {
    x: box.x,
    y: box.y,
    w: box.w,
    h: box.h || 0.3,
    fontFace: F.body,
    fontSize: 10,
    italic: true,
    color: C.slate,
    align: 'center',
    isTextBox: true,
    margin: 0,
  });
}

/** Small tinted card with a bold header and body text (icon-row / grid building block). */
function card(slide, head, body, box, opts = {}) {
  const dark = !!opts.dark;
  slide.addShape('roundRect', {
    x: box.x,
    y: box.y,
    w: box.w,
    h: box.h,
    fill: { color: dark ? C.tintDark : C.tint },
    line: { color: dark ? C.tintDark : C.tint },
    rectRadius: 0.08,
  });
  if (opts.icon) {
    slide.addShape('ellipse', {
      x: box.x + 0.15,
      y: box.y + 0.15,
      w: 0.36,
      h: 0.36,
      fill: { color: opts.iconColor || C.teal },
      line: { color: opts.iconColor || C.teal },
    });
    slide.addText(opts.icon, {
      x: box.x + 0.15,
      y: box.y + 0.15,
      w: 0.36,
      h: 0.36,
      fontFace: F.body,
      fontSize: 12,
      bold: true,
      color: C.navy,
      align: 'center',
      valign: 'middle',
      isTextBox: true,
      margin: 0,
    });
  }
  const textX = box.x + (opts.icon ? 0.62 : 0.15);
  slide.addText(head, {
    x: textX,
    y: box.y + 0.12,
    w: box.w - (textX - box.x) - 0.12,
    h: 0.36,
    fontFace: F.body,
    fontSize: opts.headSize || 13,
    bold: true,
    color: dark ? C.white : C.navy,
    valign: 'middle',
    isTextBox: true,
    margin: 0,
  });
  slide.addText(body, {
    x: box.x + 0.15,
    y: box.y + 0.52,
    w: box.w - 0.3,
    h: box.h - 0.6,
    fontFace: F.body,
    fontSize: opts.bodySize || 11,
    color: dark ? 'D7DEE8' : C.ink,
    valign: 'top',
    isTextBox: true,
    margin: 0,
  });
}

module.exports = {
  C,
  F,
  W,
  H,
  M,
  chartBase,
  lineChart,
  barChart,
  series,
  fmt,
  darkSlide,
  contentSlide,
  bullets,
  equation,
  expertCorner,
  analogyCard,
  exampleCard,
  stat,
  caption,
  card,
};
