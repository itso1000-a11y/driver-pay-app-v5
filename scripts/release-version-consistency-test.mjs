import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const pkg = JSON.parse(read('package.json'));
const lock = JSON.parse(read('package-lock.json'));
const version = pkg.version;
const v = `v${version}`;
const display = `V${version}`;
const cache = version.replace(/\./g, '-');

assert.match(version, /^\d+\.\d+\.\d+$/);
assert.equal(lock.version, version, 'package-lock top-level version must match package.json');
assert.equal(lock.packages?.['']?.version, version, 'package-lock root package version must match package.json');

const versionTs = read('src/version.ts');
assert.match(versionTs, new RegExp(`APP_VERSION = "${v.replace(/\./g, '\\.')}"`));
assert.match(versionTs, new RegExp(`APP_VERSION_NUMBER = "${version.replace(/\./g, '\\.')}"`));
assert.match(versionTs, new RegExp(`APP_DISPLAY_VERSION = "${display.replace(/\./g, '\\.')}"`));

assert.ok(read('index.html').includes(`<title>Driver Pay App ${v}</title>`), 'index title version mismatch');
const manifest = JSON.parse(read('public/manifest.webmanifest'));
assert.equal(manifest.name, `Driver Pay App ${v}`);
assert.equal(manifest.short_name, `Driver Pay ${version}`);
assert.equal(manifest.description, `Driver Pay App ${v}`);
assert.ok(read('public/sw.js').includes(`const CACHE_NAME = "driver-pay-v${cache}";`), 'service-worker cache version mismatch');

const masterName = `MASTER_PROJECT_QA_v${version}.md`;
assert.ok(fs.existsSync(path.join(ROOT, masterName)), `${masterName} is missing`);
assert.ok(read(masterName).includes(`Consolidated through v${version}`), 'MASTER consolidated version mismatch');
assert.ok(read('VERSION_HISTORY_RECENT.md').includes(`## v${version} —`), 'recent history is missing current version');

// If a built artifact is present, it must not carry an older identity. Source-QA
// packages may legitimately omit dist; this test does not decide dist policy.
const distIndex = path.join(ROOT, 'dist', 'index.html');
if (fs.existsSync(distIndex)) {
  assert.ok(fs.readFileSync(distIndex, 'utf8').includes(`Driver Pay App ${v}`), 'dist/index.html version mismatch');
}
const distSw = path.join(ROOT, 'dist', 'sw.js');
if (fs.existsSync(distSw)) {
  assert.ok(fs.readFileSync(distSw, 'utf8').includes(`driver-pay-v${cache}`), 'dist/sw.js cache version mismatch');
}

console.log(`Release/version consistency v${version}: PASS`);
