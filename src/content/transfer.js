/**
 * Structural transfer of the approved scene script into the content document.
 *
 * The owner approved one artefact: `docs/redesign/approved-scene-script.md`,
 * SHA-256 `a9bd21f3…`. Retyping its 45 scenes into JSON would be a second
 * transcription, and a second transcription is a second chance to drift. So
 * the reader copy is never retyped: it is parsed out of that file, and
 * `npm run content:transfer` rewrites `content/content.json` from it. A test
 * reruns the parse and compares, so a content document that stops matching
 * the approved script fails rather than ships.
 *
 * Nothing here writes prose. Every reader-visible string this module produces
 * is a substring of the approved script, of a verified asset manifest, or of
 * the audited source register. The two exceptions are both structural: a
 * citation's `[^07]` marker becomes the visible `[7]` and the accessible
 * `Source 7`, which the script's interface section specifies by name.
 */

import { createHash } from 'node:crypto';

export const SCHEMA_ID = 'happiness-essay-content/v2';

/** The approved script this content is transferred from. */
export const APPROVED_SCRIPT = {
  path: 'docs/redesign/approved-scene-script.md',
  sha256: 'a9bd21f3f653a7b177f754cb3d26078227fde34eb130c1a7dce8265eb8f0c97f',
};

/** The speaker labels the script fixes; a narrator block carries no label. */
export const SPEAKERS = ['TJ', 'Koj', 'Vier'];

/** The chapter anchors the script's navigation contract names. */
export const CHAPTER_ANCHORS = ['s088', 's092', 's097', 's103', 's109', 's114', 's122', 's128'];

/** The layouts the script assigns to scenes. */
export const LAYOUTS = ['group', 'single', 'pair', 'text'];

/**
 * Interface strings, each asserted to appear as a backticked token in the
 * script's own interface section rather than trusted from here. Declaring
 * them is what lets the assertion exist: a value parsed out of prose could
 * not be checked against anything.
 */
export const INTERFACE = {
  title: 'What it takes to be happy',
  begin: 'Begin',
  sources: 'Sources & Credits',
  chapters: 'Chapters',
  continuous: 'Read continuously',
  scene: 'Scene view',
  print: 'Print',
  skip: 'Skip to scene',
  back: 'Back',
  next: 'Next',
  readAgain: 'Read again',
  backToReading: 'Back to reading',
};

/** How a citation marker reaches the reader. */
export const citationLabel = (number) => `[${number}]`;
export const citationName = (number) => `Source ${number}`;

class TransferError extends Error {}

const fail = (message) => {
  throw new TransferError(message);
};

/* --------------------------------------------------------------------------
 * Reader copy
 * ----------------------------------------------------------------------- */

const CITATION = /\[\^(\d{2})\]/g;

/**
 * One authored paragraph, split into exactly the parts a renderer needs.
 *
 * Citation markers sit mid-paragraph as often as they end one, so a paragraph
 * cannot be a single string with a list of numbers beside it. The parts are
 * the paragraph cut at each marker: joining the text parts back with the
 * markers restored returns the authored line character for character, which
 * is what `plainText` asserts for every block.
 */
function splitParts(line) {
  const parts = [];
  let cursor = 0;
  for (const match of line.matchAll(CITATION)) {
    if (match.index > cursor) parts.push({ text: line.slice(cursor, match.index) });
    parts.push({ citation: Number.parseInt(match[1], 10) });
    cursor = match.index + match[0].length;
  }
  if (cursor < line.length) parts.push({ text: line.slice(cursor) });
  return parts;
}

/** The sentence a reader sees: authored text with `[^07]` shown as `[7]`. */
export const visibleText = (parts) =>
  parts.map((part) => (part.text === undefined ? citationLabel(part.citation) : part.text)).join('');

/** The authored line, reassembled, so a transfer can be checked against it. */
const authoredText = (parts) =>
  parts.map((part) => (part.text === undefined ? `[^${String(part.citation).padStart(2, '0')}]` : part.text)).join('');

/**
 * Main-path words.
 *
 * The rule, recorded rather than tuned: count the reader-visible narration and
 * dialogue of all 45 scenes, excluding speaker labels, citation markers, scene
 * and chapter titles, interface strings and everything on the Sources &
 * Credits page. A word is a run of characters separated by whitespace, so a
 * hyphenated or apostrophised word counts once.
 */
export const WORD_COUNT_RULE =
  'Reader-visible narration and dialogue of the 45 main-path scenes, whitespace-separated, '
  + 'excluding speaker labels, citation markers, scene and chapter titles, interface strings '
  + 'and the Sources & Credits page.';

export function countWords(scenes) {
  let total = 0;
  for (const scene of scenes) {
    for (const block of scene.blocks) {
      const text = block.parts.filter((part) => part.text !== undefined).map((part) => part.text).join('');
      total += text.split(/\s+/).filter(Boolean).length;
    }
  }
  return total;
}

/* --------------------------------------------------------------------------
 * Assets
 * ----------------------------------------------------------------------- */

/**
 * One generated asset, normalised across both manifest generations.
 *
 * A01 was inspected before the later assets and records its name anchors in an
 * older shape: an `x_fraction` for each name beside a single
 * `name_y_fraction_desktop`/`name_y_fraction_phone` pair for all of them.
 * A02–A18 give every anchor its own `y_fraction`, which is the same number at
 * both widths. Normalising here rather than branching in the renderer means
 * the older manifest is handled, not skipped, and the test suite checks both
 * shapes arrive with the same fields.
 */
export function readAsset(manifest) {
  const ref = manifest.ref ?? 'A01';
  const id = manifest.id;
  const browser = manifest.browser_text ?? {};
  if (browser.embedded_names_or_dialogue !== false) {
    fail(`${ref}: manifest does not record that the image carries no lettering`);
  }

  const desktop = browser.name_y_fraction_desktop;
  const phone = browser.name_y_fraction_phone;
  const legacy = desktop !== undefined;

  const labels = [
    ...(browser.name_anchors ?? []).map((anchor) => {
      const y = legacy ? desktop : anchor.y_fraction;
      if (y === undefined) fail(`${ref}: name anchor ${anchor.name} has no vertical position`);
      return {
        kind: 'name',
        text: anchor.name,
        x: anchor.x_fraction,
        yDesktop: y,
        yPhone: legacy ? phone : anchor.y_fraction,
      };
    }),
    ...(browser.prop_or_dialogue_anchors ?? []).map((anchor) => ({
      kind: 'prop',
      text: anchor.text,
      x: anchor.x_fraction,
      yDesktop: anchor.y_fraction,
      yPhone: anchor.y_fraction,
    })),
  ];

  const selected = manifest.selected_images ?? [manifest.selected_image];
  const images = selected.map((image) => ({
    path: `assets/generated/${id}/${image.path}`,
    width: image.width,
    height: image.height,
    sha256: image.sha256,
    alt: image.alt ?? manifest.alt,
  }));

  return {
    ref,
    id,
    manifestGeneration: legacy ? 'a01' : 'a02-a18',
    assetBranch: manifest.asset_branch,
    images,
    labels,
  };
}

/* --------------------------------------------------------------------------
 * The script
 * ----------------------------------------------------------------------- */

const BACKTICKED = /`([^`]+)`/g;

function parseInterface(markdown) {
  const section = markdown.slice(
    markdown.indexOf('### Landing and shared interface copy'),
    markdown.indexOf('### Art status and boundaries'),
  );
  if (!section) fail('the approved script has no interface section');
  const tokens = new Set(Array.from(section.matchAll(BACKTICKED), (match) => match[1]));
  for (const [key, value] of Object.entries(INTERFACE)) {
    if (!tokens.has(value)) fail(`interface string ${key} (${value}) is not named in the approved script`);
  }
  return { ...INTERFACE };
}

/** `A03 and A06` / `A09a/A09b` / `A12` — the refs a production note assigns. */
const refsIn = (text) => Array.from(text.matchAll(/\bA\d{2}[ab]?\b/g), (match) => match[0]);

/**
 * What a scene's production note settles: the layout, which assets it uses,
 * the exact view or control labels, and whether the two drawings are a pair
 * shown together or two states of one optional comparison.
 *
 * Parsing the note rather than retyping the assignment keeps the mapping in
 * the approved document. Every label is taken from the note's own backticks,
 * so a label the renderer shows is a string the owner approved.
 */
function parseProduction(sceneId, note, assetsByRef) {
  const layoutMatch = note.match(/`(group|single|pair|text)`/);
  if (!layoutMatch) fail(`${sceneId}: production note names no layout`);
  const layout = layoutMatch[1];

  const head = note.slice(0, layoutMatch.index);
  const refs = refsIn(head);

  if (layout === 'text') {
    if (refs.length > 0) fail(`${sceneId}: a text scene cannot be assigned artwork`);
    return { layout, views: [], control: null };
  }
  if (refs.length === 0) fail(`${sceneId}: ${layout} layout names no asset`);

  const control = /optional art-state control/.test(note);
  const labels = Array.from(note.slice(layoutMatch.index).matchAll(BACKTICKED), (match) => match[1])
    .filter((value) => value !== layout);

  const view = (ref, image, label) => {
    const asset = assetsByRef.get(ref) ?? fail(`${sceneId}: no delivered asset for ${ref}`);
    if (!asset.images[image]) fail(`${sceneId}: ${ref} has no image ${image}`);
    return { ref, image, label };
  };

  if (layout === 'pair') {
    const [first, second] = labels;
    if (!first || !second) fail(`${sceneId}: a pair needs two exact view labels`);
    // Two refs pair one drawing from each; one ref pairs its own two cutouts,
    // which is how A16 and A18 were drawn and inspected.
    const views = refs.length === 2
      ? [view(refs[0], 0, first), view(refs[1], 0, second)]
      : [view(refs[0], 0, first), view(refs[0], 1, second)];
    return { layout, views, control: null };
  }

  if (control) {
    if (refs.length !== 2) fail(`${sceneId}: an optional comparison needs two drawn states`);
    const [first, second] = labels;
    if (!first || !second) fail(`${sceneId}: an optional comparison needs both exact state labels`);
    return {
      layout,
      views: [view(refs[0], 0, first), view(refs[1], 0, second)],
      control: { labels: [first, second] },
    };
  }

  if (refs.length !== 1) fail(`${sceneId}: ${layout} layout expects one asset, found ${refs.join(', ')}`);
  return { layout, views: [view(refs[0], 0, null)], control: null };
}

/**
 * Where the drawing sits inside a `single` scene.
 *
 * The layout contract puts it after the first authored block, and five notes
 * add "art follows <speaker>'s dialogue". Both are read: the position is
 * computed from the blocks, and a note that names a speaker has to agree with
 * it, so a reordered scene is caught rather than silently re-illustrated.
 */
function artPlacement(sceneId, note, blocks, layout) {
  if (layout !== 'single') return 0;
  const named = note.match(/art follows ([A-Za-z]+)'s dialogue/);
  if (named) {
    const speaker = named[1];
    const index = blocks.findIndex((block) => block.speaker === speaker);
    if (index < 0) fail(`${sceneId}: production names ${speaker}'s dialogue, which the scene does not contain`);
    if (index !== 0) fail(`${sceneId}: ${speaker}'s dialogue is not the first block`);
  }
  return 1;
}

function parseScenes(markdown, assetsByRef) {
  const lines = markdown.split('\n');
  const chapters = [];
  const scenes = [];
  let chapter = null;
  let scene = null;
  let mode = null;

  const closeScene = () => {
    if (!scene) return;
    if (scene.blocks.length === 0) fail(`${scene.id}: no reader copy`);
    if (!scene.production) fail(`${scene.id}: no production note`);
    scenes.push(scene);
    scene = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();

    const chapterHead = line.match(/^## (\d)\. (.+)$/);
    if (chapterHead) {
      closeScene();
      chapter = { id: `c${chapterHead[1]}`, number: Number.parseInt(chapterHead[1], 10), title: chapterHead[2], sceneIds: [] };
      chapters.push(chapter);
      continue;
    }
    // Any other second-level heading ends the scene run; the briefs, source
    // page and provenance tables that follow are not reader copy.
    if (/^## /.test(line)) {
      closeScene();
      chapter = null;
      continue;
    }

    const sceneHead = line.match(/^### (s\d{3}) \| (.+)$/);
    if (sceneHead) {
      closeScene();
      if (!chapter) fail(`${sceneHead[1]} appears before any chapter`);
      scene = { id: sceneHead[1], title: sceneHead[2], chapterId: chapter.id, blocks: [], production: null };
      chapter.sceneIds.push(scene.id);
      mode = null;
      continue;
    }

    if (!scene) continue;
    if (line === '**Reader copy**') { mode = 'copy'; continue; }

    const production = line.match(/^\*\*Production:\*\* (.+)$/);
    if (production) { scene.production = production[1]; mode = null; continue; }

    if (mode !== 'copy' || line === '') continue;

    const spoken = line.match(/^(Narrator|TJ|Koj|Vier): (.+)$/);
    if (!spoken) fail(`${scene.id}: unlabelled reader copy line: ${line}`);
    const [, label, text] = spoken;
    const parts = splitParts(text);
    if (authoredText(parts) !== text) fail(`${scene.id}: citation markers did not round-trip`);
    scene.blocks.push({
      kind: label === 'Narrator' ? 'narration' : 'dialogue',
      speaker: label === 'Narrator' ? null : label,
      parts,
    });
  }
  closeScene();

  for (const entry of scenes) {
    const visual = parseProduction(entry.id, entry.production, assetsByRef);
    entry.visual = { ...visual, afterBlock: artPlacement(entry.id, entry.production, entry.blocks, visual.layout) };
    delete entry.production;
  }

  return { chapters, scenes };
}

/* --------------------------------------------------------------------------
 * Sources and credits
 * ----------------------------------------------------------------------- */

const MARKDOWN_LINK = /\[([^\]]+)\]\(([^)]+)\)/g;

/** A register note, split so its extra access links stay links. */
function noteParts(text) {
  const parts = [];
  let cursor = 0;
  for (const match of text.matchAll(MARKDOWN_LINK)) {
    if (match.index > cursor) parts.push({ text: text.slice(cursor, match.index) });
    parts.push({ link: match[1], url: match[2] });
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor) });
  return parts;
}

function parseSources(markdown, sourceMap) {
  const sources = [];
  for (const match of markdown.matchAll(/^\[\^(\d{2})\]: (.+)$/gm)) {
    const number = Number.parseInt(match[1], 10);
    const body = match[2];
    const citation = body.match(/^\[([^\]]+)\]\(([^)]+)\)\s*/);
    if (!citation) fail(`source ${number}: no bibliographic link`);
    const register = sourceMap[match[1]] ?? fail(`source ${number}: not in the source map`);
    if (register.url !== citation[2]) {
      fail(`source ${number}: register URL ${register.url} does not match the script's ${citation[2]}`);
    }
    sources.push({
      number,
      sourceId: register.source_id,
      auditStatus: register.audit_status,
      label: citationLabel(number),
      accessibleName: citationName(number),
      citation: citation[1],
      url: citation[2],
      note: noteParts(body.slice(citation[0].length)),
    });
  }
  if (sources.length !== 26) fail(`expected 26 register entries, found ${sources.length}`);
  sources.forEach((source, index) => {
    if (source.number !== index + 1) fail(`register entry ${index + 1} is numbered ${source.number}`);
  });
  return sources;
}

const readerFacing = (markdown, label) => {
  const match = markdown.match(new RegExp(`^\\*\\*Reader-facing ${label}:\\*\\* (.+)$`, 'm'));
  return match ? match[1] : fail(`the approved script has no reader-facing ${label}`);
};

function parseSourcesPage(markdown, sources) {
  return {
    title: readerFacing(markdown, 'page title'),
    intro: noteParts(readerFacing(markdown, 'introduction')),
    classNote: noteParts(readerFacing(markdown, 'class-material note')),
    credits: noteParts(readerFacing(markdown, 'credits')),
    methodNote: noteParts(readerFacing(markdown, 'method note')),
    returnLabel: readerFacing(markdown, 'return control'),
    sources,
  };
}

/* --------------------------------------------------------------------------
 * Transfer
 * ----------------------------------------------------------------------- */

/**
 * @param {object} input
 * @param {string} input.markdown the approved script, verbatim
 * @param {object[]} input.manifests every delivered asset manifest
 * @param {object} input.sourceMap `docs/redesign/source-map.json`
 * @returns {object} a content document
 */
export function transfer({ markdown, manifests, sourceMap }) {
  const digest = createHash('sha256').update(markdown).digest('hex');
  if (digest !== APPROVED_SCRIPT.sha256) {
    fail(`the script at ${APPROVED_SCRIPT.path} is ${digest}, not the approved ${APPROVED_SCRIPT.sha256}`);
  }

  const assets = manifests.map(readAsset).sort((a, b) => a.ref.localeCompare(b.ref));
  const assetsByRef = new Map(assets.map((asset) => [asset.ref, asset]));

  const interfaceCopy = parseInterface(markdown);
  const { chapters, scenes } = parseScenes(markdown, assetsByRef);

  if (scenes.length !== 45) fail(`expected 45 scenes, found ${scenes.length}`);
  if (chapters.length !== 8) fail(`expected 8 chapters, found ${chapters.length}`);
  chapters.forEach((chapter, index) => {
    if (chapter.sceneIds[0] !== CHAPTER_ANCHORS[index]) {
      fail(`chapter ${chapter.number} starts at ${chapter.sceneIds[0]}, not the anchor ${CHAPTER_ANCHORS[index]}`);
    }
  });

  const sources = parseSources(markdown, sourceMap);
  const cited = new Set(scenes.flatMap((scene) =>
    scene.blocks.flatMap((block) => block.parts.filter((part) => part.text === undefined).map((part) => part.citation))));
  for (const source of sources) {
    if (!cited.has(source.number)) fail(`source ${source.number} is never cited in a scene`);
  }
  for (const number of cited) {
    if (!sources.some((source) => source.number === number)) fail(`scene cites [${number}], which the register does not define`);
  }

  // Numbering follows first appearance, which the script states and which a
  // reordered scene would silently break.
  let expected = 1;
  for (const scene of scenes) {
    for (const block of scene.blocks) {
      for (const part of block.parts) {
        if (part.text !== undefined) continue;
        if (part.citation > expected) fail(`${scene.id} cites [${part.citation}] before [${expected}] appears`);
        if (part.citation === expected) expected += 1;
      }
    }
  }

  // The landing shows the opening drawing and nothing the renderer invented.
  const opening = assetsByRef.get('A01') ?? fail('the opening asset A01 was not delivered');

  const document = {
    schema: SCHEMA_ID,
    source: { ...APPROVED_SCRIPT },
    interface: interfaceCopy,
    landing: {
      title: interfaceCopy.title,
      beginLabel: interfaceCopy.begin,
      beginSceneId: CHAPTER_ANCHORS[0],
      sourcesLabel: interfaceCopy.sources,
      visual: { layout: 'group', views: [{ ref: opening.ref, image: 0, label: null }], control: null, afterBlock: 0 },
    },
    chapters,
    scenes,
    assets,
    sourcesPage: parseSourcesPage(markdown, sources),
    measure: { words: countWords(scenes), rule: WORD_COUNT_RULE },
  };

  return document;
}

export { TransferError };
