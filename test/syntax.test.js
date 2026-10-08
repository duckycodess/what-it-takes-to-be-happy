/**
 * This project deliberately installs no linter, formatter, or type checker, so
 * the cheapest real safety net is Node's own parser over every source file,
 * including the browser script that only ever runs in a page.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import { repoRoot } from './helpers.js';

function collectJsFiles(directory) {
  const found = [];
  for (const entry of readdirSync(directory).sort()) {
    const full = join(directory, entry);
    if (statSync(full).isDirectory()) found.push(...collectJsFiles(full));
    else if (entry.endsWith('.js')) found.push(full);
  }
  return found;
}

test('every JavaScript source file parses', () => {
  const files = [...collectJsFiles(join(repoRoot, 'src')), ...collectJsFiles(join(repoRoot, 'test'))];
  assert.ok(files.length >= 5, 'expected to find the project sources');

  for (const file of files) {
    assert.doesNotThrow(
      () => execFileSync(process.execPath, ['--check', file], { stdio: ['ignore', 'ignore', 'pipe'] }),
      `${relative(repoRoot, file)} does not parse`,
    );
  }
});
