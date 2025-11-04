// copy twemoji svg assets into assets/twemoji/svg (run once or add to postinstall)
const fs = require('fs');
const path = require('path');

const projectRoot = __dirname;
const destDir = path.join(projectRoot, 'assets', 'twemoji', 'svg');

// candidate locations in node_modules where svg assets can be found
const candidates = [
  path.join(projectRoot, 'node_modules', 'twemoji', 'assets', 'svg'),
  path.join(projectRoot, 'node_modules', 'twemoji', 'svg'),
  path.join(projectRoot, 'node_modules', 'twemoji', 'assets'),
  path.join(projectRoot, 'node_modules', 'twemoji'),
];

function existsAndHasSvg(p) {
  try {
    if (!fs.existsSync(p)) return false;
    const items = fs.readdirSync(p);
    return items.some(f => f.toLowerCase().endsWith('.svg')) || items.some(f => fs.statSync(path.join(p, f)).isDirectory());
  } catch (e) { return false; }
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const items = fs.readdirSync(src);
  for (const item of items) {
    const s = path.join(src, item);
    const d = path.join(dest, item);
    const stat = fs.statSync(s);
    if (stat.isDirectory()) {
      copyDir(s, d);
    } else {
      // only copy svg files (and preserve other small assets if present)
      if (item.toLowerCase().endsWith('.svg') || item.toLowerCase().endsWith('.png') || item.toLowerCase().endsWith('.json')) {
        fs.copyFileSync(s, d);
      }
    }
  }
}

let found = null;
for (const cand of candidates) {
  if (existsAndHasSvg(cand)) {
    found = cand;
    break;
  }
}

if (!found) {
  // helpful debug output
  const nm = path.join(projectRoot, 'node_modules', 'twemoji');
  console.error('Twemoji svg source not found in expected locations.');
  console.error('Checked candidates:', candidates);
  if (fs.existsSync(nm)) {
    console.error('Contents of node_modules/twemoji:', fs.readdirSync(nm));
  } else {
    console.error('node_modules/twemoji does not exist. Did npm install run?');
  }
  process.exitCode = 1;
  throw new Error('Source twemoji assets not found. Run "npm install" and ensure twemoji package is present.');
}

console.log('Copying Twemoji assets from', found, 'to', destDir);
copyDir(found, destDir);
console.log('Twemoji assets copied.');