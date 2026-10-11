/**
 * Structural transfer of the approved essay into the content document.
 *
 * The owner approved two artefacts on 11 October 2026 and asked for them to be
 * integrated exactly: `docs/editorial/full-essay-v2.md`, which is the essay as
 * a reader-legible document, and `docs/editorial/full-essay-handoff-v2.json`,
 * which is the same copy in machine form with paragraph boundaries, per-part
 * checksums, artwork anchors and the approved interface strings. Retyping
 * either into JSON would be a second transcription, and a second transcription
 * is a second chance to drift. So the reader copy is never retyped: it is read
 * out of those files, and `npm run content:transfer` rewrites
 * `content/content.json` from them. A test reruns the transfer and compares, so
 * a content document that stops matching the approved essay fails rather than
 * ships.
 *
 * Four things are checked rather than trusted, on every transfer:
 *
 *   Both approved files hash to the checksums the authorization record binds.
 *   Every part's copy hashes to the checksum the handoff records for it.
 *   Every part's copy appears verbatim in the Markdown document as well, so
 *     the two approved files cannot disagree without the transfer failing.
 *   Every citation's destination is the URL the register records for that
 *     number, so a marker cannot point somewhere the source audit does not.
 *
 * Nothing here writes prose. Every reader-visible string this module produces
 * is a substring of the approved essay, of a verified asset manifest, or of the
 * audited source register. The one exception is structural: a `[7](url)` marker
 * becomes the visible `[7]` and the accessible `Source 7`, which the approved
 * interface specifies by name.
 *
 * The superseded 45-scene script is still in the repository as provenance —
 * `docs/redesign/approved-scene-script.md`, and the relocation table below maps
 * each of its addresses to the part that now carries the related passage — but
 * it is no longer what the website is built from.
 */

import { createHash } from 'node:crypto';

export const SCHEMA_ID = 'happiness-essay-content/v3';
export const POLISH_AMENDMENT = { path: 'docs/editorial/polish-amendment.json', sha256: '3234f3285e84c542e3c3137f81d8557622c98675484d91e63600d3c87fb94c50' };

/** The approved essay this content is transferred from, in both its forms. */
export const APPROVED_ESSAY = {
  markdown: {
    path: 'docs/editorial/full-essay-v2.md',
    sha256: 'b96ca8697becf3f62203341302dddb24f4050257cfc602ef89e78fb6995c524c',
  },
  handoff: {
    path: 'docs/editorial/full-essay-handoff-v2.json',
    sha256: '35a56e6e5aaafce5ba7456f51d68cf72837351b2123ba61952507e506c872c87',
  },
};

/** The superseded script, kept as provenance and as the relocation source. */
export const SUPERSEDED_SCRIPT = {
  path: 'docs/redesign/approved-scene-script.md',
  sha256: 'a9bd21f3f653a7b177f754cb3d26078227fde34eb130c1a7dce8265eb8f0c97f',
};

/** The speaker labels the essay may use; a narrator block carries no label. */
export const SPEAKERS = ['TJ', 'Koj', 'Vier'];

/** The layouts the approved handoff assigns to parts. */
export const LAYOUTS = ['support', 'pair', 'comparison', 'text'];

/**
 * How an authoring key becomes an application identifier.
 *
 * The handoff's `id_policy` is explicit: `v2-cN-pN` are stable authoring keys,
 * the integration chooses compatible unused application identifiers, and
 * `s088`–`s132` are never reused for changed copy. The 31 parts therefore take
 * `s201` upward, which is the same `s\d{3}` shape every earlier address had and
 * is clear of every identifier this project has published. The mapping is kept
 * in the content document, so an authoring key can always be traced to the
 * address a reader sees.
 */
export const FIRST_PART_NUMBER = 201;
export const partId = (index) => `s${FIRST_PART_NUMBER + index}`;

/** Chapter identifiers stay positional: `#c6` still means the sixth chapter. */
export const chapterId = (number) => `c${number}`;

/** How a citation marker reaches the reader. */
export const citationLabel = (number) => `[${number}]`;
export const citationName = (number) => `Source ${number}`;

class TransferError extends Error {}

const fail = (message) => {
  throw new TransferError(message);
};

const sha256 = (value) => createHash('sha256').update(value).digest('hex');

/* --------------------------------------------------------------------------
 * Reader copy
 * ----------------------------------------------------------------------- */

/**
 * A citation as the approved copy writes it: `[7](https://…)`.
 *
 * The number is what a reader sees and the destination is the work itself. On
 * the page the marker links to the register entry rather than to the work,
 * because the entry is where the access note and the limitation are; the URL
 * here is checked against that entry and then belongs to it.
 */
const CITATION = /\[(\d{1,2})\]\((https?:\/\/[^\s)]+)\)/g;

/**
 * One authored paragraph, split into exactly the parts a renderer needs.
 *
 * Citation markers sit mid-paragraph as often as they end one, so a paragraph
 * cannot be a single string with a list of numbers beside it. The parts are the
 * paragraph cut at each marker: joining the text parts back with the markers
 * restored returns the authored paragraph character for character, which is
 * what every block is checked against.
 */
function splitParts(line, onCitation) {
  const parts = [];
  let cursor = 0;
  for (const match of line.matchAll(CITATION)) {
    if (match.index > cursor) parts.push({ text: line.slice(cursor, match.index) });
    const number = Number.parseInt(match[1], 10);
    onCitation(number, match[2]);
    parts.push({ citation: number });
    cursor = match.index + match[0].length;
  }
  if (cursor < line.length) parts.push({ text: line.slice(cursor) });
  return parts;
}

/** The sentence a reader sees: authored text with the marker shown as `[7]`. */
export const visibleText = (parts) =>
  parts.map((part) => (part.text === undefined ? citationLabel(part.citation) : part.text)).join('');

/* --------------------------------------------------------------------------
 * Main-path words
 * ----------------------------------------------------------------------- */

/**
 * The rule, recorded rather than tuned: count the reader-visible narration and
 * dialogue of all 31 parts, excluding speaker labels, citation markers, part
 * and chapter titles, interface strings and everything on the Sources &
 * Credits page. A word is a run of characters separated by whitespace, so a
 * hyphenated or apostrophised word counts once.
 */
export const WORD_COUNT_RULE =
  'Reader-visible narration and dialogue of the 31 main-path parts, whitespace-separated, '
  + 'excluding speaker labels, citation markers, part and chapter titles, interface strings '
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
 * both widths. Normalising here rather than branching in the renderer means the
 * older manifest is handled, not skipped, and the test suite checks both shapes
 * arrive with the same fields.
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
 * Interface
 * ----------------------------------------------------------------------- */

/**
 * The approved control names, read out of the handoff's own interface section.
 *
 * Each is taken from the field the handoff puts it in rather than retyped, so
 * a control this build renders is a string the owner approved. The two pairs
 * are the two arrangements of one list: a rail beside the essay is hidden and
 * shown, and a drawer over it is opened and closed.
 */
function readInterface(handoff) {
  const ui = handoff.interface ?? fail('the approved handoff has no interface section');
  const at = (value, where) => (typeof value === 'string' && value !== ''
    ? value
    : fail(`the approved handoff has no interface string at ${where}`));

  const footer = ui.footer ?? [];
  const sidebar = ui.desktop_sidebar_toggle ?? [];
  const drawer = ui.phone_drawer ?? [];
  const secondary = ui.secondary_sidebar ?? [];

  return {
    title: at(handoff.website_title, 'website_title'),
    begin: at(ui.landing_action, 'interface.landing_action'),
    sources: at(secondary[1], 'interface.secondary_sidebar[1]'),
    continuous: at(secondary[0], 'interface.secondary_sidebar[0]'),
    partView: at(ui.continuous_mode_return, 'interface.continuous_mode_return'),
    chapters: at(drawer[0], 'interface.phone_drawer[0]'),
    closeChapters: at(drawer[1], 'interface.phone_drawer[1]'),
    hideChapters: at(sidebar[0], 'interface.desktop_sidebar_toggle[0]'),
    showChapters: at(sidebar[1], 'interface.desktop_sidebar_toggle[1]'),
    skip: at(ui.skip_link, 'interface.skip_link'),
    back: at(footer[0], 'interface.footer[0]'),
    next: at(footer[1], 'interface.footer[1]'),
    readAgain: at(ui.end_content_action, 'interface.end_content_action'),
    backToReading: at(ui.source_return, 'interface.source_return'),
  };
}

/* --------------------------------------------------------------------------
 * Parts
 * ----------------------------------------------------------------------- */

/**
 * What a part's artwork entry settles: the layout, which inspected cutouts it
 * shows, the exact view or state labels, and where in the part it sits.
 *
 * The anchor is read twice. `after_paragraph` says how many paragraphs come
 * before the drawing, and `anchor_paragraph_markdown` says which paragraph it
 * belongs to; they have to agree, so a part whose paragraphs were reordered is
 * caught rather than silently re-illustrated.
 */
function readArt(key, art, paragraphs, assetsByRef) {
  if (!art) return { layout: 'text', views: [], control: null, afterBlock: 0 };

  const layout = art.layout;
  if (!LAYOUTS.includes(layout)) fail(`${key}: unknown layout ${layout}`);
  if (layout === 'text') {
    if ((art.views ?? []).length > 0) fail(`${key}: a text part cannot be assigned artwork`);
    return { layout, views: [], control: null, afterBlock: 0 };
  }

  const after = art.after_paragraph;
  if (!Number.isInteger(after) || after < 1 || after > paragraphs.length) {
    fail(`${key}: the drawing follows paragraph ${after}, which the part does not have`);
  }
  if (art.anchor_paragraph_markdown !== undefined
    && art.anchor_paragraph_markdown !== paragraphs[after - 1].markdown) {
    fail(`${key}: the anchor paragraph is not the paragraph the drawing is placed after`);
  }

  const views = (art.views ?? []).map((view) => {
    const asset = assetsByRef.get(view.ref) ?? fail(`${key}: no delivered asset for ${view.ref}`);
    const image = asset.images[view.image_index];
    if (!image) fail(`${key}: ${view.ref} has no image ${view.image_index}`);
    const selected = view.selected_image;
    if (selected) {
      if (selected.path !== image.path) fail(`${key}: ${view.ref} names a file the manifest does not select`);
      if (selected.sha256 !== image.sha256) fail(`${key}: ${view.ref} names different bytes from the manifest`);
    }
    return { ref: view.ref, image: view.image_index, label: view.label ?? null };
  });
  if (views.length === 0) fail(`${key}: ${layout} layout names no asset`);

  if (layout === 'pair') {
    if (views.length !== 2) fail(`${key}: a pair shows two drawings`);
    if (!views[0].label || !views[1].label) fail(`${key}: a pair needs two exact view labels`);
    if (art.control_labels) fail(`${key}: a pair is not an optional comparison`);
    return { layout, views, control: null, afterBlock: after };
  }

  if (layout === 'comparison') {
    if (views.length !== 2) fail(`${key}: an optional comparison needs two drawn states`);
    const labels = art.control_labels ?? fail(`${key}: an optional comparison needs both exact state labels`);
    if (labels.length !== 2 || !labels[0] || !labels[1]) {
      fail(`${key}: an optional comparison needs both exact state labels`);
    }
    return { layout, views, control: { labels: [...labels] }, afterBlock: after };
  }

  if (views.length !== 1) fail(`${key}: a support drawing is one cutout, found ${views.length}`);
  return { layout, views, control: null, afterBlock: after };
}

/** One paragraph of approved copy, as a block the renderer can write. */
function readParagraph(key, paragraph, onCitation) {
  const kind = paragraph.kind;
  if (kind !== 'narration' && kind !== 'dialogue') fail(`${key}: unknown paragraph kind ${kind}`);
  const speaker = paragraph.speaker ?? null;
  if (kind === 'dialogue' && !SPEAKERS.includes(speaker)) {
    fail(`${key}: ${speaker} is not one of the three members`);
  }
  if (kind === 'narration' && speaker !== null) fail(`${key}: a narrator block carries no name`);

  const markdown = paragraph.markdown;
  if (typeof markdown !== 'string' || markdown.trim() === '') fail(`${key}: an empty paragraph`);
  const parts = splitParts(markdown, onCitation);

  // The authored paragraph, reassembled from the parts, has to be the
  // authored paragraph: a marker that did not round-trip would mean a
  // sentence was cut in a place the author did not write.
  const rebuilt = parts
    .map((part) => (part.text === undefined ? null : part.text))
    .join('');
  const authored = markdown.replace(CITATION, '');
  if (rebuilt !== authored) fail(`${key}: citation markers did not round-trip`);

  return { kind, speaker: kind === 'dialogue' ? speaker : null, parts };
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

function readSources(handoff, sourceMap) {
  const entries = handoff.sources ?? [];
  if (entries.length !== 26) fail(`expected 26 register entries, found ${entries.length}`);

  return entries.map((entry, index) => {
    const number = entry.number;
    if (number !== index + 1) fail(`register entry ${index + 1} is numbered ${number}`);

    const body = entry.entry_markdown;
    const citation = body.match(/^\[([^\]]+)\]\(([^)]+)\)\s*/);
    if (!citation) fail(`source ${number}: no bibliographic link`);

    const register = sourceMap[String(number).padStart(2, '0')]
      ?? fail(`source ${number}: not in the source map`);
    if (register.source_id !== entry.id) {
      fail(`source ${number}: the register calls it ${register.source_id}, the handoff ${entry.id}`);
    }
    if (register.url !== citation[2] || register.url !== entry.original_url) {
      fail(`source ${number}: register URL ${register.url} does not match the approved entry`);
    }

    return {
      number,
      sourceId: register.source_id,
      auditStatus: register.audit_status,
      label: citationLabel(number),
      accessibleName: citationName(number),
      citation: citation[1],
      url: citation[2],
      note: noteParts(body.slice(citation[0].length)),
    };
  });
}

/**
 * The Sources & Credits page, read out of the approved page copy.
 *
 * Its shape is fixed by the approved document: the heading, three paragraphs
 * of introduction, class note and credits, a `### References` heading, the
 * method note, and then the 26 numbered entries. The entries are not re-parsed
 * here — they are the register above — so the only thing read out of this
 * markdown is the prose around them, and each paragraph is checked to be
 * exactly where the approved document puts it.
 */
function readSourcesPage(handoff, sources, ui) {
  const lines = handoff.source_page_markdown.split('\n').map((line) => line.trim()).filter(Boolean);

  const heading = lines[0] ?? '';
  if (!heading.startsWith('## ')) fail('the approved source page does not open with its title');
  const title = heading.slice(3);
  if (title !== ui.sources) fail(`the source page is titled ${title}, not the approved ${ui.sources}`);

  const referencesAt = lines.findIndex((line) => line === '### References');
  if (referencesAt !== 4) fail('the approved source page does not carry three paragraphs before its references');

  const numbered = lines.slice(referencesAt + 2);
  if (numbered.length !== sources.length) {
    fail(`the approved source page lists ${numbered.length} entries for ${sources.length} register numbers`);
  }
  numbered.forEach((line, index) => {
    const expected = `${index + 1}. ${handoff.sources[index].entry_markdown}`;
    if (line !== expected) fail(`source page entry ${index + 1} is not the approved register entry`);
  });

  return {
    title,
    intro: noteParts(lines[1]),
    classNote: noteParts(lines[2]),
    credits: noteParts(lines[3]),
    methodNote: noteParts(lines[referencesAt + 1]),
    returnLabel: ui.backToReading,
    sources,
  };
}

/**
 * Where a register entry says its work can be reached.
 *
 * The entry's own bibliographic link, and every extra access link its note
 * carries. Two entries carry one: the World Happiness Report entry links the
 * edition and then "Read Chapter 3", and the blog entry links the category
 * index and then the post that was actually read.
 */
function sourceDestinations(source) {
  return [source.url, ...source.note.filter((part) => part.url !== undefined).map((part) => part.url)];
}

/** The last two labels of a hostname: `pmc.ncbi.nlm.nih.gov` and `pubmed…` agree. */
function registrableDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '').split('.').slice(-2).join('.');
  } catch (error) {
    return null;
  }
}

/**
 * Whether a marker's destination is one the register entry stands behind.
 *
 * In the approved copy a marker names the exact passage that was read, and the
 * register entry names the work. Most of the time those are the same address.
 * Three are not, and all three are the same work: `[16]` names the World
 * Happiness Report chapter the entry's note links, `[17]` names the blog post
 * the entry's note links, and `[21]` names the PubMed record for the article
 * the entry catalogues at PMC. So a destination passes if the entry records it
 * or if it is on the same site; anything else is a marker pointing at a work
 * the source audit never looked at.
 *
 * None of these URLs reaches a reader. A rendered citation links to the
 * register entry, because that is where the access note and the limitation
 * are; the work's own address belongs to the entry.
 */
function reaches(recorded, url) {
  if (recorded.includes(url)) return true;
  const host = registrableDomain(url);
  return host !== null && recorded.some((known) => registrableDomain(known) === host);
}

/* --------------------------------------------------------------------------
 * Transfer
 * ----------------------------------------------------------------------- */

/**
 * @param {object} input
 * @param {string} input.markdown the approved essay document, verbatim
 * @param {string} input.handoffJson the approved handoff, verbatim
 * @param {object[]} input.manifests every delivered asset manifest
 * @param {object} input.sourceMap `docs/redesign/source-map.json`
 * @returns {object} a content document
 */
export function transfer({ markdown, handoffJson, manifests, sourceMap, amendmentJson }) {
  const markdownDigest = sha256(markdown);
  if (markdownDigest !== APPROVED_ESSAY.markdown.sha256) {
    fail(`the essay at ${APPROVED_ESSAY.markdown.path} is ${markdownDigest}, `
      + `not the approved ${APPROVED_ESSAY.markdown.sha256}`);
  }
  const handoffDigest = sha256(handoffJson);
  if (handoffDigest !== APPROVED_ESSAY.handoff.sha256) {
    fail(`the handoff at ${APPROVED_ESSAY.handoff.path} is ${handoffDigest}, `
      + `not the approved ${APPROVED_ESSAY.handoff.sha256}`);
  }

  const handoff = JSON.parse(handoffJson);
  const assets = manifests.map(readAsset).sort((a, b) => a.ref.localeCompare(b.ref));
  const assetsByRef = new Map(assets.map((asset) => [asset.ref, asset]));

  const ui = readInterface(handoff);
  const sources = readSources(handoff, sourceMap);
  const destinations = new Map(sources.map((source) => [source.number, sourceDestinations(source)]));

  /* --- Chapters and parts --- */

  const chapters = [];
  const scenes = [];
  const keyToId = new Map();

  (handoff.chapters ?? []).forEach((chapter, chapterIndex) => {
    const number = chapterIndex + 1;
    const id = chapterId(number);
    const entry = { id, number, title: chapter.title, sceneIds: [] };
    chapters.push(entry);

    for (const part of chapter.parts ?? []) {
      const key = part.key;
      const index = scenes.length;
      const scene = {
        id: partId(index),
        partKey: key,
        chapterId: id,
        title: part.title,
        blocks: [],
        visual: null,
      };
      keyToId.set(key, scene.id);
      entry.sceneIds.push(scene.id);

      // Every citation is checked as it is read: a marker may only point at
      // the work the register records for that number.
      const onCitation = (citation, url) => {
        const known = destinations.get(citation);
        if (!known) fail(`${key}: cites [${citation}], which the register does not define`);
        if (!reaches(known, url)) {
          fail(`${key}: [${citation}] points at ${url}, which entry ${citation} does not record`);
        }
      };

      const paragraphs = part.paragraphs ?? [];
      if (paragraphs.length === 0) fail(`${key}: no reader copy`);
      scene.blocks = paragraphs.map((paragraph) => readParagraph(key, paragraph, onCitation));
      scene.visual = readArt(key, part.art, paragraphs, assetsByRef);

      // The copy, as approved: its own recorded checksum, and the same words
      // present verbatim in the Markdown document the owner read.
      const copy = part.reader_copy_markdown;
      if (typeof copy !== 'string' || copy.trim() === '') fail(`${key}: no approved copy block`);
      const digest = sha256(copy);
      if (digest !== part.reader_copy_sha256) {
        fail(`${key}: the copy hashes to ${digest}, not the approved ${part.reader_copy_sha256}`);
      }
      if (!markdown.includes(copy)) {
        fail(`${key}: the approved copy is not in ${APPROVED_ESSAY.markdown.path} verbatim`);
      }
      if (!markdown.includes(part.title)) {
        fail(`${key}: the title "${part.title}" is not in ${APPROVED_ESSAY.markdown.path}`);
      }

      scenes.push(scene);
    }
  });

  if (chapters.length !== 8) fail(`expected 8 chapters, found ${chapters.length}`);
  if (scenes.length !== 31) fail(`expected 31 parts, found ${scenes.length}`);

  /* --- Citations --- */

  const cited = new Set(scenes.flatMap((scene) =>
    scene.blocks.flatMap((block) =>
      block.parts.filter((part) => part.text === undefined).map((part) => part.citation))));
  for (const source of sources) {
    if (!cited.has(source.number)) fail(`source ${source.number} is never cited in a part`);
  }

  /* --- Old addresses --- */

  const relocations = (handoff.proposed_old_address_relocations ?? []).map((entry) => {
    const to = keyToId.get(entry.new_part_key)
      ?? fail(`${entry.old_scene_id} relocates to ${entry.new_part_key}, which is not a part`);
    if (!/^s\d{3}$/.test(entry.old_scene_id)) fail(`${entry.old_scene_id} is not an address this site published`);
    return { from: entry.old_scene_id, to, partKey: entry.new_part_key };
  });
  if (relocations.length !== 45) {
    fail(`expected a relocation for each of the 45 published addresses, found ${relocations.length}`);
  }
  for (const relocation of relocations) {
    if (Number.parseInt(relocation.to.slice(1), 10) < FIRST_PART_NUMBER) {
      fail(`${relocation.from} relocates to ${relocation.to}, which reuses a published address`);
    }
  }

  /* --- The landing --- */

  const opening = assetsByRef.get('A01') ?? fail('the opening asset A01 was not delivered');

  const document = {
    schema: SCHEMA_ID,
    source: {
      essay: { ...APPROVED_ESSAY.markdown },
      handoff: { ...APPROVED_ESSAY.handoff },
      supersedes: { ...SUPERSEDED_SCRIPT },
    },
    interface: ui,
    landing: {
      title: ui.title,
      beginLabel: ui.begin,
      beginSceneId: scenes[0].id,
      sourcesLabel: ui.sources,
      visual: { layout: 'support', views: [{ ref: opening.ref, image: 0, label: null }], control: null, afterBlock: 0 },
    },
    chapters,
    scenes,
    relocations,
    assets,
    sourcesPage: readSourcesPage(handoff, sources, ui),
    measure: { words: countWords(scenes), rule: WORD_COUNT_RULE },
  };
  if (amendmentJson !== undefined) {
    if (sha256(amendmentJson) !== POLISH_AMENDMENT.sha256) fail('the owner polish amendment changed');
    const amendment = JSON.parse(amendmentJson);
    const page = document.sourcesPage;
    const intro = visibleRich(page.intro);
    const classNote = visibleRich(page.classNote);
    if (intro !== amendment.source_removals[0]) fail('the requested intro removal no longer matches');
    if (!classNote.includes(amendment.source_removals[1])) fail('the requested class note removal no longer matches');
    page.intro = [];
    page.classNote = [{ text: classNote.replace(amendment.source_removals[1], '').trim() }];
    page.creditItems = amendment.credit_items.map(noteParts);
    page.credits = page.creditItems.flatMap((item, i) => i ? [{ text: ' ' }, ...item] : item);
    document.interface.sound = amendment.sound_label;
    document.source.amendment = { ...POLISH_AMENDMENT };
    for (const entry of amendment.art) {
      const scene = scenes.find((part) => part.id === entry.scene);
      if (!scene || scene.visual.layout !== 'text') fail(`${entry.scene}: amendment only supplies previously empty artwork`);
      if (!assetsByRef.has(entry.ref)) fail(`${entry.scene}: ${entry.ref} has not been delivered`);
      scene.visual = { layout: 'support', views: [{ ref: entry.ref, image: 0, label: null }], control: null, afterBlock: entry.after_block };
    }
  }
  return document;
}

const visibleRich = (parts) => parts.map((part) => part.text ?? part.link).join('');

export { TransferError };
