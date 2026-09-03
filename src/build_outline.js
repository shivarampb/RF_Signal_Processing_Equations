// Generates presentation/outline.md from src/content.js.
const fs = require('fs');
const path = require('path');
const { PARTS, SLIDES } = require('./content');

const byId = Object.fromEntries(SLIDES.map((s) => [s.id, s]));
const out = [];
const total = PARTS.reduce((a, p) => a + p.minutes, 0);

out.push('# RF Signal Processing: presentation outline');
out.push('');
out.push('Generated from `src/content.js`. Edit that file and run `node src/build_outline.js`; the same file drives the slide deck.');
out.push('');
out.push(`Audience: mixed (RF experts and newcomers). Every content slide has a plain-language idea, an everyday analogy ("think of it like this"), a small numeric example, and the equation. Expert-level detail is in the speaker notes and the appendix. Duration: about ${total} minutes including recaps and questions.`);
out.push('');
out.push('## Timing');
out.push('');
out.push('| Part | Minutes | Slides |');
out.push('|---|---:|---:|');
PARTS.forEach((p) => {
  const n = SLIDES.filter((s) => s.part === p.id).length;
  out.push(`| ${p.name} | ${p.minutes} | ${n} |`);
});
out.push(`| **Total** | **${total}** | **${SLIDES.length}** |`);
out.push('');

const tableMd = (rows, hasHeader) => {
  const header = hasHeader ? rows[0] : rows[0].map(() => ' ');
  out.push(`| ${header.join(' | ')} |`);
  out.push(`|${header.map(() => '---').join('|')}|`);
  (hasHeader ? rows.slice(1) : rows).forEach((r) => out.push(`| ${r.join(' | ')} |`));
  out.push('');
};

let num = 0;
let currentPart = -1;
for (const s of SLIDES) {
  num += 1;
  if (s.part !== currentPart) {
    currentPart = s.part;
    const p = PARTS[currentPart];
    out.push(`## ${p.name}${p.minutes ? ` (${p.minutes} min)` : ''}`);
    out.push('');
  }
  const mins = s.minutes ? ` · ${s.minutes} min` : '';
  out.push(`### Slide ${num} · ${s.title}${mins}`);
  out.push('');
  if (s.subtitle) out.push(`*${s.subtitle}*\n`);
  if (s.bullets) {
    out.push('**Slide content**');
    out.push('');
    s.bullets.forEach((b) => out.push(`- ${typeof b === 'string' ? b : b.text}`));
    out.push('');
  }
  if (s.outcomes) {
    out.push('**After this talk you can**');
    out.push('');
    s.outcomes.forEach((b) => out.push(`- ${b}`));
    out.push('');
  }
  if (s.steps) {
    out.push('**Worked steps**');
    out.push('');
    s.steps.forEach(([h, t], i) => out.push(`${i + 1}. **${h}** · ${t}`));
    out.push('');
  }
  if (s.cards) {
    s.cards.forEach(([n, h, t]) => out.push(`${n}. **${h}** · ${t}`));
    out.push('');
  }
  if (s.table) tableMd(s.table, true);
  if (s.compare) tableMd(s.compare, true);
  if (s.cheatsheet) tableMd(s.cheatsheet, false);
  if (s.analogy) {
    out.push(`**Think of it like this.** ${s.analogy}`);
    out.push('');
  }
  if (s.example) {
    out.push(`**Example · ${s.example.title}**`);
    out.push('');
    s.example.lines.forEach((l) => out.push(`- ${l}`));
    out.push('');
  }
  if (s.equations) {
    out.push('**Equations**');
    out.push('');
    s.equations.forEach((e) => out.push(`- \`${e.eq.replace(/\n/g, ' ')}\`  \n  ${e.cap}`));
    out.push('');
  }
  if (s.fromSlides) {
    out.push('**Expert notes collected from the talk**');
    out.push('');
    s.fromSlides.forEach((id) => {
      const src = byId[id];
      if (src && src.expert) out.push(`- **${src.title}.** ${src.expert}`);
    });
    out.push('');
  }
  if (s.references) {
    out.push('**References**');
    out.push('');
    s.references.forEach((r) => out.push(`- ${r}`));
    out.push('');
  }
  if (s.chartNote) {
    out.push(`*Chart:* ${s.chartNote}`);
    out.push('');
  }
  out.push('**Speaker notes**');
  out.push('');
  out.push(s.notes);
  if (s.expert) {
    out.push('');
    out.push(`> **For the experts (notes and appendix only).** ${s.expert}`);
  }
  out.push('');
}

const dest = path.join(__dirname, '..', 'presentation', 'outline.md');
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, out.join('\n'));
console.log(`Wrote ${dest} (${SLIDES.length} slides, ${total} min)`);
