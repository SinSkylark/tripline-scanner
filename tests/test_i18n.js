/* i18n regression test for the scanner.
 *
 *  Guards the two things that break silently after edits:
 *   1. pl/en dictionaries drift out of parity (a key added to one, not the
 *      other → mixed-language UI), or a [data-i18n] attribute points at a key
 *      that no dictionary defines (→ the raw key leaks into the UI).
 *   2. parseQR() — the QR contract (tripline:it=…&yt=…) — is unchanged. i18n
 *      touches only UI text; the parser must stay byte-for-byte compatible.
 *
 *  Pure node+vm (no browser, no deps), same idiom as test_scanner_security.js.
 *  Run: node tests/test_i18n.js   (exits non-zero on failure)
 */
const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const path = require('path');

const ROOT = path.dirname(__dirname);
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

// Slice a brace/bracket-balanced literal starting at `token` (like the
// security test does for ALLOWED_HOSTS / isSafeMusicUrl).
function sliceBalanced(token, open, close) {
  const t = html.indexOf(token);
  if (t < 0) throw new Error('token not found: ' + token);
  const start = html.indexOf(open, t);
  let depth = 0, i = start;
  for (; i < html.length; i++) {
    if (html[i] === open) depth++;
    else if (html[i] === close) { depth--; if (depth === 0) { i++; break; } }
  }
  return html.slice(t, i);
}

let n = 0;
const ok = (v, msg) => { assert.ok(v, msg); n++; };

// ── 1. Dictionary parity + attribute coverage ────────────────────────────────
const i18nCtx = {};
vm.runInNewContext(sliceBalanced('const I18N', '{', '}').replace('const I18N', 'I18N'), i18nCtx);
const { en, pl } = i18nCtx.I18N;

const enKeys = Object.keys(en).sort();
const plKeys = Object.keys(pl).sort();
ok(enKeys.length > 0, 'en dictionary is non-empty');
assert.deepStrictEqual(enKeys, plKeys, 'pl and en must define the SAME keys'); n++;

// Every [data-i18n] / [data-i18n-html] attribute must resolve to a real key.
const usedKeys = new Set();
const attrRe = /data-i18n(?:-html)?="([^"]+)"/g;
let m;
while ((m = attrRe.exec(html))) usedKeys.add(m[1]);
ok(usedKeys.size > 0, 'HTML uses data-i18n attributes');
const unresolved = [...usedKeys].filter(k => !(k in en));
assert.deepStrictEqual(unresolved, [], `data-i18n keys with no translation: ${unresolved}`); n++;

// ── 2. QR contract intact (i18n must not touch parseQR) ──────────────────────
const qrCtx = { URLSearchParams };
vm.runInNewContext(sliceBalanced('function parseQR', '{', '}'), qrCtx);
const { parseQR } = qrCtx;
const eq = (a, b, msg) => { assert.strictEqual(JSON.stringify(a), JSON.stringify(b), msg); n++; };

eq(parseQR('tripline:yt=fJ9rUzIMcZQ&it=1440806041&t=Bohemian%20Rhapsody&a=Queen&y=1975'),
   { yt: 'fJ9rUzIMcZQ', dz: null, it: '1440806041', t: 'Bohemian Rhapsody', a: 'Queen', y: '1975' },
   'canonical tripline: format');
eq(parseQR('tripline:it=123&dz=456'),
   { yt: null, dz: '456', it: '123', t: null, a: null, y: null }, 'it+dz only');
eq(parseQR('https://youtu.be/abcdefghijk'), { yt: 'abcdefghijk', dz: null, it: null }, 'youtu.be compat');
eq(parseQR('abcdefghijk'), { yt: 'abcdefghijk', dz: null, it: null }, 'bare 11-char id');
eq(parseQR('https://evil.com/x'), { raw: 'https://evil.com/x' }, 'unknown → raw (legacy path)');

console.log(`i18n + QR-contract tests OK (${n} assertions; ${enKeys.length} keys × 2 langs)`);
