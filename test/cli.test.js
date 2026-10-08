/** The validation command is what the build, CI, and editors actually run. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

import { repoRoot } from './helpers.js';

const runValidate = (args) => {
  try {
    const stdout = execFileSync(process.execPath, ['src/tools/validate.js', ...args], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { status: 0, stdout, stderr: '' };
  } catch (error) {
    return { status: error.status, stdout: error.stdout ?? '', stderr: error.stderr ?? '' };
  }
};

test('validating the authored document succeeds and reports what it checked', () => {
  const { status, stdout } = runValidate([]);
  assert.equal(status, 0);
  assert.match(stdout, /^ok\s+content\/content\.json: 6 chapter\(s\), 9 scene\(s\)/m);
  assert.match(stdout, /marked non-final/);
});

test('validating a broken document fails with a nonzero exit code and located errors', () => {
  const { status, stderr } = runValidate(['test/fixtures/invalid-content.json']);
  assert.equal(status, 1);
  assert.match(stderr, /FAIL test\/fixtures\/invalid-content\.json/);
  assert.match(stderr, /\[SCENE_ORPHANED\]/);
  assert.match(stderr, /scenes\[0\]\.narration: \[EMPTY_ESSENTIAL_SCENE\]/);
});

test('an unreadable document fails cleanly rather than crashing', () => {
  const { status, stderr } = runValidate(['content/does-not-exist.json']);
  assert.equal(status, 1);
  assert.match(stderr, /UNREADABLE/);
});
