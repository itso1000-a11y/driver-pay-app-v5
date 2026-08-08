import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const appSource = fs.readFileSync(path.join(ROOT, 'src', 'App.tsx'), 'utf8');

function canComplete(restMinutes, compensationMinutes) {
  return compensationMinutes > 0 && restMinutes >= 9 * 60 + compensationMinutes;
}
function completeEarliest(ledger, enteredStartAbs, restMinutes, currentDateISO) {
  const restStartAbs = enteredStartAbs - restMinutes;
  const restAlreadyUsed = ledger.some((item) => item.status === 'completed' && item.completedByStartAbs != null && item.completedRestMinutes != null && item.completedByStartAbs - item.completedRestMinutes === restStartAbs);
  if (restAlreadyUsed) return { ledger, completedId: null };
  const eligible = ledger
    .filter((item) => item.status === 'outstanding' && restStartAbs >= item.sourceStartAbs && enteredStartAbs > item.sourceStartAbs && currentDateISO <= item.deadlineISO)
    .sort((a,b) => a.deadlineISO.localeCompare(b.deadlineISO) || a.sourceStartAbs - b.sourceStartAbs);
  const obligation = eligible.find((item) => canComplete(restMinutes, item.originalMinutes));
  if (!obligation) return { ledger, completedId: null };
  return {
    ledger: ledger.map((item) => item.id === obligation.id ? {
      ...item,
      remainingMinutes: 0,
      status: 'completed',
      completedByStartAbs: enteredStartAbs,
      completedRestMinutes: restMinutes,
    } : item),
    completedId: obligation.id,
  };
}
function debt(id, sourceStartAbs, minutes, deadlineISO='2026-08-30') {
  return { id, sourceKey:id, sourceClosingSaturdayISO:'2026-08-08', sourceStartAbs, originalMinutes:minutes, remainingMinutes:minutes, deadlineISO, status:'outstanding', completedByStartAbs:null, completedRestMinutes:null };
}

// Core indivisible boundaries retained from the accepted compensation model.
assert.equal(canComplete(18*60,10*60), false, '18h must not complete 10h debt');
assert.equal(canComplete(19*60,10*60), true,  '19h may complete 10h debt via 9h base + 10h compensation');
assert.equal(canComplete(21*60,10*60), true,  '21h may complete 10h debt');
assert.equal(canComplete(55*60,10*60), true,  '55h may complete 10h debt');

const startBoundary = 500000;
const old = debt('old', startBoundary - 10000, 10*60, '2026-08-20');

// Insufficient rest: no partial credit and no mutation.
let result = completeEarliest([old], startBoundary, 18*60, '2026-08-10');
assert.equal(result.completedId, null);
assert.deepEqual(result.ledger, [old]);
assert.equal(result.ledger[0].remainingMinutes, 10*60);

// Exact qualifying rest completes whole debt in one step.
result = completeEarliest([old], startBoundary, 19*60, '2026-08-10');
assert.equal(result.completedId, 'old');
assert.equal(result.ledger[0].status, 'completed');
assert.equal(result.ledger[0].remainingMinutes, 0);
assert.equal(result.ledger[0].completedByStartAbs, startBoundary);
assert.equal(result.ledger[0].completedRestMinutes, 19*60);

// Chronology: a rest cannot complete a debt that arose at the same/later Start.
const sameBoundary = debt('same', startBoundary, 10*60, '2026-08-20');
result = completeEarliest([sameBoundary], startBoundary, 55*60, '2026-08-10');
assert.equal(result.completedId, null);
assert.equal(result.ledger[0].status, 'outstanding');

// Chronology: the repayment rest itself must not begin before the debt arose,
// even when it ends after the debt source boundary.
const debtDuringRest = debt('debt-during-rest', startBoundary - 10*60, 10*60, '2026-08-20');
result = completeEarliest([debtDuringRest], startBoundary, 19*60, '2026-08-10');
assert.equal(result.completedId, null, 'rest beginning before debt arose must not repay it');
assert.equal(result.ledger[0].status, 'outstanding');

// A qualifying rest that begins at/after the debt boundary may repay it.
const debtBeforeRest = debt('debt-before-rest', startBoundary - 20*60*60, 10*60, '2026-08-20');
result = completeEarliest([debtBeforeRest], startBoundary, 19*60, '2026-08-10');
assert.equal(result.completedId, 'debt-before-rest');

// Deadline: after deadline no completion.
result = completeEarliest([old], startBoundary, 55*60, '2026-08-21');
assert.equal(result.completedId, null);

// One factual rest completes at most one obligation; earliest deadline wins.
const laterDeadline = debt('later-deadline', startBoundary - 9000, 5*60, '2026-08-25');
const earlierDeadline = debt('earlier-deadline', startBoundary - 8000, 10*60, '2026-08-18');
result = completeEarliest([laterDeadline, earlierDeadline], startBoundary, 55*60, '2026-08-10');
assert.equal(result.completedId, 'earlier-deadline');
assert.equal(result.ledger.find(x=>x.id==='earlier-deadline').status, 'completed');
assert.equal(result.ledger.find(x=>x.id==='later-deadline').status, 'outstanding');

// Same deadline: older source boundary wins.
const olderSource = debt('older-source', startBoundary - 10000, 10*60, '2026-08-18');
const newerSource = debt('newer-source', startBoundary - 5000, 10*60, '2026-08-18');
result = completeEarliest([newerSource, olderSource], startBoundary, 55*60, '2026-08-10');
assert.equal(result.completedId, 'older-source');

// A newly-created debt at this exact Start cannot immediately complete itself,
// while an older debt may be completed by the same factual rest.
const newlyCreated = debt('new-current-rest', startBoundary, 10*60, '2026-08-30');
result = completeEarliest([old, newlyCreated], startBoundary, 35*60, '2026-08-10');
assert.equal(result.completedId, 'old');
assert.equal(result.ledger.find(x=>x.id==='old').status, 'completed');
assert.equal(result.ledger.find(x=>x.id==='new-current-rest').status, 'outstanding');


// Re-editing the Start of the same continuous rest must not spend that rest twice.
// The factual rest is identified by its unchanged rest-start boundary.
const firstDebt = debt('first-for-rest', startBoundary - 12000, 5*60, '2026-08-18');
const secondDebt = debt('second-for-rest', startBoundary - 11000, 5*60, '2026-08-19');
let firstUse = completeEarliest([firstDebt, secondDebt], startBoundary, 20*60, '2026-08-10');
assert.equal(firstUse.completedId, 'first-for-rest');
const sameRestStart = startBoundary - 20*60;
const editedStart = startBoundary + 60;
const editedRestMinutes = editedStart - sameRestStart;
let secondUse = completeEarliest(firstUse.ledger, editedStart, editedRestMinutes, '2026-08-10');
assert.equal(secondUse.completedId, null, 'same continuous rest must complete at most one obligation even if Start is edited');
assert.equal(secondUse.ledger.find(x=>x.id==='second-for-rest').status, 'outstanding');

// Already-completed items remain untouched.
const completed = { ...old, id:'done', sourceKey:'done', status:'completed', remainingMinutes:0, completedByStartAbs:startBoundary-1, completedRestMinutes:19*60 };
result = completeEarliest([completed], startBoundary, 55*60, '2026-08-10');
assert.equal(result.completedId, null);
assert.deepEqual(result.ledger, [completed]);

// Source-level integration guards: v5.2.18 adds timeline-owned repayment only.
assert.match(appSource, /function completeEarliestEligibleWeeklyCompensation\(/);
assert.match(appSource, /const restAlreadyUsed = ledger\.some\(/);
assert.match(appSource, /item\.completedByStartAbs - item\.completedRestMinutes === restStartAbs/);
assert.match(appSource, /restStartAbs >= item\.sourceStartAbs/);
assert.match(appSource, /const timelineRepaymentRestMinutes = timelineWeeklyRestPathEligible && enteredStartAbs != null && timelineWeeklyRestAnchor/);
assert.match(appSource, /enteredStartAbs - timelineWeeklyRestAnchor\.finishAbs/);
assert.match(appSource, /!timelineWeeklyRestPathEligible \|\| enteredStartAbs == null \|\| timelineRepaymentRestMinutes == null/);
assert.match(appSource, /completeEarliestEligibleWeeklyCompensation\(ledger, enteredStartAbs, timelineRepaymentRestMinutes, currentDay\.dateISO\)/);
assert.match(appSource, /if \(!result\.completedId\) return;/);
assert.match(appSource, /writeWeeklyCompensationLedger\(result\.ledger\)/);
// Legacy path must remain isolated under timeline ownership.
assert.match(appSource, /if \(timelineWeeklyRestPathEligible\) return;\s*let ledger = readWeeklyCompensationLedger\(\);/);

console.log('Timeline compensation repayment regression: PASS');
