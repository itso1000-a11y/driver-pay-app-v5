import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const APP_PATH = path.join(ROOT, 'src', 'App.tsx');
const appSource = fs.readFileSync(APP_PATH, 'utf8');

// Bind the regression to the real production path.
assert.match(appSource, /function hasPersistedPayWeekRecord\(saturdayISO: string\): boolean/);
assert.match(appSource, /function getNextPayPeriodContext\([\s\S]*targetWeekWasPersisted = hasPersistedPayWeekRecord\(saturdayISO\)/);
assert.match(appSource, /if \(!targetWeekWasPersisted\) \{[\s\S]*settings: sanitizeSettings\(currentSettings\)[\s\S]*activePayProfileId: currentActivePayProfileId \|\| ""/);
assert.match(appSource, /const nextContext = getNextPayPeriodContext\(nextSaturday, settings, activePayProfileId, payProfiles\);/);
assert.match(appSource, /setSettings\(nextContext\.settings\);/);
assert.doesNotMatch(appSource, /function openNextPayPeriod[\s\S]*?setSettings\(nextWeek\.settings\);/);

// The exact v5.2.41 failure fingerprint: the factory fallback is PAYE 14/21/21.
assert.match(appSource, /const initialSettings: SettingsState = \{[\s\S]*grossOnly: false,[\s\S]*weekdayRate: "14\.00",[\s\S]*saturdayRate: "21\.00",[\s\S]*sundayRate: "21\.00"/);

function settings(overrides = {}) {
  return {
    grossOnly: false,
    companyName: '',
    weekdayRate: '14.00',
    saturdayRate: '21.00',
    sundayRate: '21.00',
    pensionMode: 'none',
    pensionManualAmount: '0.00',
    overtimeThresholdHours: '10.00',
    overtimeRate: '17.50',
    foodAllowanceRate: '10.00',
    nightOutRate: '26.00',
    bonusRates: { ADR: '11.25', Genset: '11.25', Splitter: '11.25', 'Driver Assist': '11.25', 'London Bonus': '15.00' },
    customBonuses: Array.from({ length: 6 }, (_, i) => ({ id: `custom-${i + 1}`, name: '', rate: '' })),
    ...overrides,
  };
}

// Small policy model mirroring the new ownership rule. Source guards above ensure
// the production implementation uses the same branch ownership.
function resolveNextContext({ targetPersisted, currentSettings, currentProfileId, savedSettings, savedProfileId }) {
  if (!targetPersisted) {
    return { settings: structuredClone(currentSettings), activePayProfileId: currentProfileId, inheritedCurrentPayContext: true };
  }
  return { settings: structuredClone(savedSettings), activePayProfileId: savedProfileId, inheritedCurrentPayContext: false };
}

// 1) Exact real-world reproduction values: Gross Only ARC 18/20/21, next week absent.
{
  const current = settings({ grossOnly: true, companyName: 'ARC', weekdayRate: '18.00', saturdayRate: '20.00', sundayRate: '21.00' });
  const result = resolveNextContext({ targetPersisted: false, currentSettings: current, currentProfileId: 'arc-profile-1', savedSettings: settings(), savedProfileId: '' });
  assert.equal(result.inheritedCurrentPayContext, true);
  assert.equal(result.settings.grossOnly, true, 'Gross Only must survive End Week into a new week');
  assert.equal(result.settings.weekdayRate, '18.00');
  assert.equal(result.settings.saturdayRate, '20.00');
  assert.equal(result.settings.sundayRate, '21.00');
  assert.equal(result.activePayProfileId, 'arc-profile-1');
}

// 2) Reload semantics: after the normal persistence effect writes the inherited
// context, the target week is now persisted and must reopen with the same context.
{
  const inherited = settings({ grossOnly: true, companyName: 'ARC', weekdayRate: '18.00', saturdayRate: '20.00', sundayRate: '21.00' });
  const result = resolveNextContext({ targetPersisted: true, currentSettings: settings(), currentProfileId: '', savedSettings: inherited, savedProfileId: 'arc-profile-1' });
  assert.equal(result.inheritedCurrentPayContext, false);
  assert.equal(result.settings.grossOnly, true);
  assert.equal(result.settings.weekdayRate, '18.00');
  assert.equal(result.settings.saturdayRate, '20.00');
  assert.equal(result.activePayProfileId, 'arc-profile-1');
}

// 3) The carry-forward rule is neutral: PAYE also remains PAYE for a genuinely new week.
{
  const current = settings({ grossOnly: false, companyName: 'PAYE Co', weekdayRate: '19.25', saturdayRate: '22.00', sundayRate: '24.00' });
  const result = resolveNextContext({ targetPersisted: false, currentSettings: current, currentProfileId: 'paye-profile', savedSettings: settings(), savedProfileId: '' });
  assert.equal(result.settings.grossOnly, false);
  assert.equal(result.settings.weekdayRate, '19.25');
  assert.equal(result.settings.saturdayRate, '22.00');
  assert.equal(result.settings.sundayRate, '24.00');
  assert.equal(result.activePayProfileId, 'paye-profile');
}

// 4) A deliberately prepared future week remains authoritative.
{
  const current = settings({ grossOnly: true, companyName: 'ARC', weekdayRate: '18.00', saturdayRate: '20.00', sundayRate: '21.00' });
  const future = settings({ grossOnly: false, companyName: 'Future Co', weekdayRate: '25.00', saturdayRate: '30.00', sundayRate: '35.00' });
  const result = resolveNextContext({ targetPersisted: true, currentSettings: current, currentProfileId: 'arc-profile', savedSettings: future, savedProfileId: 'future-profile' });
  assert.equal(result.inheritedCurrentPayContext, false);
  assert.equal(result.settings.grossOnly, false);
  assert.equal(result.settings.weekdayRate, '25.00');
  assert.equal(result.settings.saturdayRate, '30.00');
  assert.equal(result.settings.sundayRate, '35.00');
  assert.equal(result.activePayProfileId, 'future-profile');
}

console.log('v5.2.42 End Week pay-context carry-forward regression: PASS');
