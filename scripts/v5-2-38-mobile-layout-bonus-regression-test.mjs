import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync('src/App.tsx', 'utf8');

// Completed/behind 45h context must not inject a duplicate Start-column flow hint.
const hintStart = app.indexOf('const startFieldHint =');
const hintEnd = app.indexOf('const startFieldPlaceholder =', hintStart);
assert.ok(hintStart >= 0 && hintEnd > hintStart);
const hintSource = app.slice(hintStart, hintEnd);
assert.match(hintSource, /weeklyRestTargetIsBeforeSelectedDay[\s\S]*\? ""/);
assert.doesNotMatch(hintSource, /weeklyRestEnded/);

// Daily 11h/9h provenance stays inside Start as before.
assert.match(hintSource, /from11hRest/);
assert.match(hintSource, /from9hRest/);

// Bonus draft row gives the selector more room and keeps Add width unchanged.
assert.match(app, /gridTemplateColumns: "minmax\(0,1fr\) 56px 88px"/);
assert.match(app, /<select style=\{\{ \.\.\.inputStyle, minWidth: 0, fontSize: 14, padding: "12px 8px" \}\}/);
assert.match(app, /<input style=\{\{ \.\.\.inputStyle, padding: "12px 6px", textAlign: "center" \}\} inputMode="numeric" value=\{draftBonusQty\}/);

console.log('v5.2.38 mobile Start-row / bonus-row regression: PASS');
