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
  // The summary is the transferred argument's shape: the approved eight
  // chapters and 45 scenes, the 26-entry reader register, the delivered
  // drawings, and the measured main path rather than a promised reading time.
  assert.match(
    stdout,
    /^ok {2}content\/content\.json: 8 chapter\(s\), 31 part\(s\), 26 source\(s\), 34 generated asset\(s\), \d+ main-path words\.$/m,
  );
});

test('validating a broken document fails with a nonzero exit code and located errors', () => {
  const { status, stderr } = runValidate(['test/fixtures/invalid-content.json']);
  assert.equal(status, 1);
  assert.match(stderr, /FAIL test\/fixtures\/invalid-content\.json: \d+ error\(s\)/);

  // Each of these is a different kind of fault, and each must arrive with the
  // path that locates it rather than as a bare complaint about the document.
  assert.match(stderr, /^ {2}\.chapters {2}SCENE_UNREACHABLE: s089 is in no chapter/m);
  assert.match(stderr, /^ {2}\.scenes\[1\]\.blocks {2}EMPTY_SCENE: /m);
  assert.match(stderr, /^ {2}\.scenes\[0\]\.blocks\[1\]\.speaker {2}UNKNOWN_SPEAKER: /m);
  assert.match(stderr, /^ {2}\.assets\[0\]\.images\[0\]\.sha256 {2}INVALID_CHECKSUM: /m);
  assert.match(stderr, /^ {2}\.sourcesPage\.sources {2}DANGLING_CITATION: a scene cites \[9\]/m);
});

test('an unreadable document fails cleanly rather than crashing', () => {
  const { status, stderr } = runValidate(['content/does-not-exist.json']);
  assert.equal(status, 1);
  assert.match(stderr, /UNREADABLE/);
});
