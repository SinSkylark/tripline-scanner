/* Voting-mode feature-flag regression test.
 *
 *  The post-round survey / feedback export is prototype-only and MUST stay
 *  OFF by default — a regression that shows it to every player after a card
 *  reveal is exactly the bug this guards (issue #6, gated behind `votingEnabled`).
 *
 *  Asserts the flag's contract:
 *   1. Default (no ?vote, empty storage) → OFF; #feedback-block hidden.
 *   2. ?vote=1 / true / on → ON and persisted to localStorage (tl_voting).
 *   3. ?vote=0 → OFF and persists off, overriding a stored ON.
 *   4. No param → falls back to stored tl_voting.
 *   5. toggleVoting() flips state, persists, and updates the DOM both ways.
 *
 *  Pure node+vm (no browser, no deps), same idiom as test_i18n.js: the real
 *  functions are sliced out of index.html and run against tiny DOM/storage
 *  shims, so the test breaks if the actual gating logic drifts.
 *  Run: node tests/test_voting_flag.js   (exits non-zero on failure)
 */
const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const path = require('path');

const ROOT = path.dirname(__dirname);
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

// Slice a whole `function NAME(...) { ... }` by brace-balancing (same limitation
// as test_i18n.js's sliceBalanced: assumes no braces inside strings, which holds
// for these small functions).
function sliceFn(name) {
  const t = html.indexOf('function ' + name + '(');
  if (t < 0) throw new Error('function not found: ' + name);
  let depth = 0, i = html.indexOf('{', t);
  for (; i < html.length; i++) {
    if (html[i] === '{') depth++;
    else if (html[i] === '}') { depth--; if (depth === 0) { i++; break; } }
  }
  return html.slice(t, i);
}

let n = 0;
const ok = (v, msg) => { assert.ok(v, msg); n++; };

// ── Tiny shims ───────────────────────────────────────────────────────────────
function makeEl() {
  const classes = new Set();
  return {
    style: {}, textContent: '',
    classList: {
      toggle(c, force) { const on = force === undefined ? !classes.has(c) : !!force;
                         if (on) classes.add(c); else classes.delete(c); return on; },
      contains: c => classes.has(c),
    },
  };
}
function makeLS(init) {
  const m = new Map(Object.entries(init || {}));
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: k => m.delete(k),
  };
}

// Build one context holding the real gating functions + module state. Function
// declarations become context globals (callable); `let votingEnabled` stays
// lexically shared with them and is read back via the __voting() accessor.
const sandbox = { URLSearchParams, console };
vm.createContext(sandbox);
vm.runInContext(
  "let votingEnabled = false; const LS_VOTING = 'tl_voting';\n" +
  'function __voting() { return votingEnabled; }\n' +
  sliceFn('initVotingMode') + '\n' +
  sliceFn('applyVotingMode') + '\n' +
  sliceFn('toggleVoting') + '\n' +
  sliceFn('updateFeedbackCount') + '\n',
  sandbox
);

// Fresh DOM + storage + URL for one initVotingMode() run.
function run({ search = '', store = {} } = {}) {
  const els = { 'feedback-block': makeEl(), 'vote-toggle': makeEl(),
                'fb-count': makeEl(), 'fb-summary': makeEl() };
  els['feedback-block'].style.display = 'none'; // mirrors the HTML inline default
  sandbox.document = { getElementById: id => els[id] || null };
  sandbox.localStorage = makeLS(store);
  sandbox.location = { search };
  sandbox.t = (k) => k;
  sandbox.getFeedback = () => [];
  sandbox.initVotingMode();
  return { els, ls: sandbox.localStorage };
}

const shown = els => els['feedback-block'].style.display !== 'none';
const active = els => els['vote-toggle'].classList.contains('active');

// ── 1. Default OFF ───────────────────────────────────────────────────────────
let r = run({});
ok(sandbox.__voting() === false, 'default: voting OFF');
ok(!shown(r.els), 'default: feedback block hidden');
ok(!active(r.els), 'default: toggle not active');

// ── 2. ?vote enables + persists (all truthy spellings) ───────────────────────
for (const v of ['1', 'true', 'on']) {
  r = run({ search: '?vote=' + v });
  ok(sandbox.__voting() === true, `?vote=${v}: ON`);
  ok(shown(r.els), `?vote=${v}: feedback block shown`);
  ok(active(r.els), `?vote=${v}: toggle active`);
  ok(r.ls.getItem('tl_voting') === '1', `?vote=${v}: persisted '1'`);
}

// ── 3. ?vote=0 disables and overrides stored ON ──────────────────────────────
r = run({ search: '?vote=0', store: { tl_voting: '1' } });
ok(sandbox.__voting() === false, '?vote=0 overrides stored ON');
ok(!shown(r.els), '?vote=0: feedback block hidden');
ok(r.ls.getItem('tl_voting') === '0', "?vote=0: persisted '0'");

// ── 4. No param → falls back to stored value ─────────────────────────────────
ok(run({ store: { tl_voting: '1' } }) && sandbox.__voting() === true, 'no param + stored ON → ON');
ok(run({ store: { tl_voting: '0' } }) && sandbox.__voting() === false, 'no param + stored OFF → OFF');
ok(run({ search: '?foo=bar', store: { tl_voting: '1' } }) && sandbox.__voting() === true,
   'unrelated param leaves stored ON');

// ── 5. toggleVoting flips, persists, and updates the DOM ─────────────────────
r = run({});                       // OFF
sandbox.toggleVoting();
ok(sandbox.__voting() === true, 'toggle: OFF → ON');
ok(shown(r.els) && active(r.els), 'toggle ON: DOM reflects enabled');
ok(sandbox.localStorage.getItem('tl_voting') === '1', 'toggle ON persisted');
sandbox.toggleVoting();
ok(sandbox.__voting() === false, 'toggle: ON → OFF');
ok(!shown(r.els) && !active(r.els), 'toggle OFF: DOM reflects disabled');
ok(sandbox.localStorage.getItem('tl_voting') === '0', 'toggle OFF persisted');

console.log(`Voting feature-flag tests OK (${n} assertions)`);
