/**
 * The delivered artwork.
 *
 * The production drawings are generated files handed over on asset-only
 * branches, not geometry this repository draws. So the questions worth asking
 * are about the handoff: are the committed bytes the ones that were inspected,
 * does every selected cutout carry the alternative text the approved brief
 * specifies, are the browser-label anchors real coordinates, and is the
 * content document pointing at selected files rather than at an unselected
 * provenance output.
 *
 * Both manifest generations are checked here. A01 was inspected before the
 * rest and records its name heights once per width; A02–A18 record one per
 * anchor. Neither is skipped, and the test that normalises them is the same
 * code the build uses.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

import { readAsset, SUPERSEDED_SCRIPT } from '../src/content/transfer.js';
import { loadValidContent, repoRoot } from './helpers.js';

const content = loadValidContent();
const script = readFileSync(join(repoRoot, SUPERSEDED_SCRIPT.path), 'utf8');

const manifests = readdirSync(join(repoRoot, 'assets/generated'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort()
  .map((name) => ({
    name,
    manifest: JSON.parse(readFileSync(join(repoRoot, 'assets/generated', name, 'manifest.json'), 'utf8')),
  }));

const sha = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');

/** Width, height and colour type straight out of the PNG header. */
function pngHeader(path) {
  const bytes = readFileSync(path);
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', `${path} is not a PNG`);
  assert.equal(bytes.subarray(12, 16).toString('ascii'), 'IHDR');
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
    bitDepth: bytes[24],
    colourType: bytes[25],
  };
}

/** The approved brief table: reference, safe asset identifier, exact alt. */
function approvedBriefs() {
  const briefs = new Map();
  for (const line of script.split('\n')) {
    const row = line.match(/^\| (A\d{2}[ab]?) \| ([a-z0-9-]+) \| (.*?) \| (.*?) \|$/);
    if (row) briefs.set(row[1], { id: row[2], alt: row[4] });
  }
  return briefs;
}

test('every delivered folder carries a manifest for an approved brief', () => {
  const briefs = approvedBriefs();
  assert.equal(briefs.size, 20);
  assert.equal(manifests.length, 20);

  for (const { name, manifest } of manifests) {
    const ref = manifest.ref ?? 'A01';
    assert.ok(briefs.has(ref), `${name} claims reference ${ref}, which the approved briefs do not list`);
    assert.equal(manifest.id, name, `${name} does not match its own manifest identifier`);
    assert.equal(briefs.get(ref).id, name, `${ref} was briefed as ${briefs.get(ref).id}, not ${name}`);
  }
});

test('the committed image bytes are the inspected ones', () => {
  for (const { name, manifest } of manifests) {
    const selected = manifest.selected_images ?? [manifest.selected_image];
    for (const image of selected) {
      const path = join(repoRoot, 'assets/generated', name, image.path);
      assert.ok(existsSync(path), `${name}/${image.path} is not committed`);
      assert.equal(sha(path), image.sha256, `${name}/${image.path} is not the file the manifest records`);

      const header = pngHeader(path);
      assert.equal(header.width, image.width, `${name}/${image.path} width`);
      assert.equal(header.height, image.height, `${name}/${image.path} height`);
      // Colour type 6 is RGBA: the cutouts are transparent, which is what lets
      // them sit on the page without a box drawn around them.
      assert.equal(header.colourType, 6, `${name}/${image.path} is not an RGBA image`);
      assert.equal(header.bitDepth, 8);
      assert.equal(image.transparent_background, true);
    }
  }
});

test('every exact prompt record matches its recorded hash', () => {
  for (const { name, manifest } of manifests) {
    const records = [
      ...(manifest.prompt_records ?? []).map((record) => [record.path, record.sha256]),
      ...(manifest.generation ? [[manifest.generation.prompt, manifest.generation.prompt_sha256]] : []),
      ...(manifest.cleanup ? [[manifest.cleanup.prompt, manifest.cleanup.prompt_sha256]] : []),
    ];
    assert.ok(records.length > 0, `${name} records no prompt`);
    for (const [path, digest] of records) {
      assert.equal(sha(join(repoRoot, 'assets/generated', name, path)), digest, `${name}/${path}`);
    }
  }
});

test('the manifests record that no lettering is baked into the bitmaps', () => {
  for (const { name, manifest } of manifests) {
    assert.equal(manifest.browser_text.embedded_names_or_dialogue, false,
      `${name} does not record that its names and dialogue stay browser text`);
  }
});

test('both manifest generations normalise to the same shape', () => {
  const assets = manifests.map(({ manifest }) => readAsset(manifest));
  const generations = new Set(assets.map((asset) => asset.manifestGeneration));
  assert.deepEqual([...generations].sort(), ['a01', 'a02-a18'],
    'both inspected manifest generations must be present and handled');

  const a01 = assets.find((asset) => asset.ref === 'A01');
  assert.equal(a01.manifestGeneration, 'a01');
  // A01's older manifest gives one height per width for all three names. It is
  // normalised, not skipped: each anchor arrives with both.
  assert.deepEqual(a01.labels.map((label) => [label.text, label.x, label.yDesktop, label.yPhone]), [
    ['TJ', 0.18, 0.03, 0.01],
    ['Koj', 0.5, 0.03, 0.01],
    ['Vier', 0.82, 0.03, 0.01],
  ]);

  for (const asset of assets) {
    for (const label of asset.labels) {
      for (const axis of ['x', 'yDesktop', 'yPhone']) {
        assert.ok(label[axis] >= 0 && label[axis] <= 1, `${asset.ref} ${label.text} ${axis} is outside its image box`);
      }
    }
  }
});

test('every cutout carries the exact approved alternative text', () => {
  const briefs = approvedBriefs();
  for (const asset of content.assets) {
    const brief = briefs.get(asset.ref);
    if (asset.images.length === 1) {
      assert.equal(asset.images[0].alt, brief.alt, `${asset.ref} alternative text`);
    } else {
      // A16 and A18 were drawn as two independently usable cutouts, and the
      // brief gives each one its own sentence.
      assert.equal(`First cutout: ${asset.images[0].alt} Second cutout: ${asset.images[1].alt}`, brief.alt,
        `${asset.ref} per-cutout alternative text`);
    }
  }
});

test('the content document points only at selected files', () => {
  for (const asset of content.assets) {
    const manifest = manifests.find((entry) => entry.name === asset.id).manifest;
    const selected = (manifest.selected_images ?? [manifest.selected_image]).map((image) => image.path);
    for (const image of asset.images) {
      const file = image.path.split('/').pop();
      assert.ok(selected.includes(file), `${asset.ref} uses ${file}, which was not selected`);
      assert.notEqual(file, 'source-generation.png');
      assert.equal(sha(join(repoRoot, image.path)), image.sha256);
    }
  }
});

test('two assets retain an unselected generation as provenance only', () => {
  // A05 and A17 kept their first generation beside the selected file. It is a
  // record of how the drawing was made, never something to serve.
  const retained = manifests
    .filter(({ name }) => existsSync(join(repoRoot, 'assets/generated', name, 'source-generation.png')))
    .map(({ name }) => name);
  assert.deepEqual(retained.sort(), ['rewrite-campus-space-v1', 'rewrite-opening-v1', 'rewrite-playing-v1']);

  const used = new Set(content.assets.flatMap((asset) => asset.images.map((image) => image.path)));
  for (const path of used) assert.ok(!path.endsWith('source-generation.png'));
});

test('every scene that was briefed a drawing has one, and text scenes have none', () => {
  const withArt = content.scenes.filter((scene) => scene.visual.views.length > 0);
  const textOnly = content.scenes.filter((scene) => scene.visual.layout === 'text');

  assert.equal(withArt.length + textOnly.length, content.scenes.length);
  assert.equal(withArt.length, 17, 'the approved essay illustrates 17 of its 31 parts');
  for (const scene of textOnly) assert.equal(scene.visual.views.length, 0);

  // Every drawing the essay shows is a delivered one. The reverse is no
  // longer true: the approved essay is shorter than the script it replaced
  // and places artwork against passages rather than against scenes, so two
  // inspected briefs -- A04 and A11 -- are not shown anywhere in it. They are
  // kept, committed and inspected; they are simply not in this revision. That
  // is named here rather than left for someone to discover.
  const used = new Set([
    ...content.scenes.flatMap((scene) => scene.visual.views.map((view) => view.ref)),
    ...content.landing.visual.views.map((view) => view.ref),
  ]);
  const unused = content.assets.map((asset) => asset.ref).filter((ref) => !used.has(ref));
  assert.deepEqual(unused, ['A04', 'A11'],
    'the set of delivered drawings this revision does not show has changed');
  for (const ref of used) {
    assert.ok(content.assets.some((asset) => asset.ref === ref), `${ref} is shown but was never delivered`);
  }
});

test('the two optional comparisons are the ones the approved essay names', () => {
  const comparisons = content.scenes.filter((scene) => scene.visual.control !== null);
  assert.equal(comparisons.length, 2);
  assert.deepEqual(comparisons.map((scene) => scene.visual.control.labels), [
    ['Connection', 'Comparison'],
    ['Time available', 'Time claimed'],
  ]);
  // Each layout says what it is, so nothing downstream has to infer it.
  for (const scene of comparisons) assert.equal(scene.visual.layout, 'comparison');
});

test('every pair carries its exact approved view labels', () => {
  const pairs = content.scenes.filter((scene) => scene.visual.layout === 'pair');
  assert.deepEqual(
    pairs.map((scene) => scene.visual.views.map((view) => view.label)),
    [
      ['Chosen effort', 'Required work'],
      ['Time gained', 'Work performed'],
      ['Students using the space', 'Staff maintaining it'],
    ],
  );

  // A16 and A18 pair their own two cutouts; the first pairs one drawing from
  // each of two briefs.
  const refs = pairs.map((scene) => scene.visual.views.map((view) => `${view.ref}:${view.image}`));
  assert.deepEqual(refs, [
    ['A03:0', 'A06:0'],
    ['A16:0', 'A16:1'],
    ['A18:0', 'A18:1'],
  ]);
});
