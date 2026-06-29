/* Security test for the BYOS scanner's QR-target allow-list.
 *
 *  isSafeMusicUrl (index.html) — stops a malicious printed card from
 *  redirecting the player or running a javascript: URL in the scanner origin.
 *
 *  Run: node tests/test_scanner_security.js   (exits non-zero on failure)
 */
const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const path = require('path');

const ROOT = path.dirname(__dirname);

function sliceBalanced(src, token, open, close) {
  const t = src.indexOf(token);
  if (t < 0) throw new Error('source token not found: ' + token);
  const start = src.indexOf(open, t);
  let depth = 0, i = start;
  for (; i < src.length; i++) {
    if (src[i] === open) depth++;
    else if (src[i] === close) { depth--; if (depth === 0) { i++; break; } }
  }
  return src.slice(t, i);
}

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const code =
  sliceBalanced(html, 'const ALLOWED_HOSTS', '[', ']') + ';\n' +
  sliceBalanced(html, 'function isSafeMusicUrl', '{', '}') + '\n';

const ctx = { URL };
vm.runInNewContext(code, ctx);
const { isSafeMusicUrl } = ctx;

let n = 0;
const ok = (v, msg) => { assert.ok(v, msg); n++; };
const no = (v, msg) => { assert.ok(!v, msg); n++; };

ok(isSafeMusicUrl('https://www.youtube.com/watch?v=abc'), 'youtube allowed');
ok(isSafeMusicUrl('https://music.youtube.com/watch?v=abc'), 'subdomain allowed');
ok(isSafeMusicUrl('https://youtu.be/abc'), 'youtu.be allowed');
ok(isSafeMusicUrl('https://open.spotify.com/track/x'), 'spotify allowed');
ok(isSafeMusicUrl('https://music.apple.com/x'), 'apple music allowed');
ok(isSafeMusicUrl('https://tidal.com/track/x'), 'tidal allowed');
no(isSafeMusicUrl('https://evil.com/phish'), 'unknown host blocked');
no(isSafeMusicUrl('http://www.youtube.com/x'), 'non-https blocked');
no(isSafeMusicUrl('javascript:alert(document.cookie)'), 'javascript: blocked');
no(isSafeMusicUrl('data:text/html,<script>x</script>'), 'data: blocked');
no(isSafeMusicUrl('https://youtube.com.evil.com/x'), 'lookalike subdomain blocked');
no(isSafeMusicUrl('not a url'), 'garbage blocked');

console.log(`Scanner security tests OK (${n} assertions)`);
