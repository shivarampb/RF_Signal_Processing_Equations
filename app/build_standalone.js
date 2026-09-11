// Wraps an app source file (artifact body content) into a complete HTML document,
// so it can be opened straight from disk or served by GitHub Pages.

const fs = require('fs');
const path = require('path');

// Build one app, or both when no name is given:  node app/build_standalone.js [name]
const APPS = [
  { src: 'rf-signal-lab.html', dest: 'index.html',
    desc: 'Interactive companion to the RF Signal Processing talk: sampling, aliasing, ADC quantisation, SAR conversion, clock jitter, the FFT and the IFFT, all computed live.' },
  { src: 'adc-lab.html', dest: 'adc.html',
    desc: 'Interactive companion to the Inside the ADC talk: resolution, LSB, offset, gain, DNL, INL, SNR, THD, SINAD, ENOB, SFDR, jitter, settling, bandwidth and the figures of merit, all computed live.' },
];
const only = process.argv[2];
const targets = only ? APPS.filter((a) => a.src.startsWith(only) || a.dest.startsWith(only)) : APPS;
if (!targets.length) throw new Error('No app matches "' + only + '"');

for (const app of targets) {
  const body = fs.readFileSync(path.join(__dirname, app.src), 'utf8');
  const dest = path.join(__dirname, app.dest);

  const doc = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="${app.desc}">
<style>
  /* The artifact host supplies these defaults; reproduce them for the standalone file. */
  :root { color-scheme: light dark; }
  body { margin: 0; font: 14px system-ui, sans-serif; background: #f6f6f4; }
  img { max-width: 100%; }
  [hidden] { display: none !important; }
</style>
${body}
</body>
</html>
`;

  fs.writeFileSync(dest, doc);
  console.log(`Wrote ${dest} (${(doc.length / 1024).toFixed(0)} kB)`);
}
