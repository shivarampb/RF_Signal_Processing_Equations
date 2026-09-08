// Wraps app/rf-signal-lab.html (artifact body content) into a complete HTML document
// at app/index.html, so the app can be opened straight from disk or served by GitHub Pages.
//
//   node app/build_standalone.js

const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'rf-signal-lab.html');
const dest = path.join(__dirname, 'index.html');
const body = fs.readFileSync(src, 'utf8');

const doc = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="Interactive companion to the RF Signal Processing talk: sampling, aliasing, ADC quantisation, SAR conversion, clock jitter, the FFT and the IFFT, all computed live.">
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
