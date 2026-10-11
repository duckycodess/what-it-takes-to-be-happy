/**
 * The shared renderer.
 *
 * Every output is these functions with different resource URLs: the hosted
 * essay, the hosted Sources & Credits page, and the retained single-file
 * export. All 45 scenes are written into the markup, so print, a browser with
 * scripting unavailable, and the continuous view all carry the complete
 * argument; the browser script only chooses what is on screen.
 *
 * Nothing here writes reader prose. Every sentence, label, control name and
 * alternative text comes from the content document, which was transferred from
 * the approved script and the inspected asset manifests. There is no caption,
 * no byline, no summary, no reading-time estimate and no progress score to
 * render, because the approved essay has none.
 */

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escapes text for element content and for double-quoted attributes alike. */
export const esc = (value) => String(value).replace(/[&<>"']/g, (character) => ESCAPES[character]);

/** The fragment a register entry answers to, on either output shape. */
export const sourceAnchor = (number) => `source-${number}`;

const percent = (value) => `${Math.round(value * 1000) / 10}%`;

/* --------------------------------------------------------------------------
 * Reader copy
 * ----------------------------------------------------------------------- */

/**
 * A paragraph, with its citation markers rendered as small numbered links.
 *
 * The link is written into the sentence where the author put it, which is
 * sometimes mid-paragraph. Its visible label is `[9]` and its accessible name
 * is `Source 9`: the same two strings the approved interface section names,
 * so a reader hearing the page is told what the bracketed number is for. Both
 * are taken from that source's own register entry, which is where the
 * approved copy for them lives.
 *
 * The destination carries where the reader was. A hosted citation link goes to
 * the separate page with the originating scene and reading mode in its query,
 * so returning can restore both — including for a reader with no script, who
 * at least arrives at the right entry.
 */
function renderParts(parts, context, sceneId) {
  return parts
    .map((part) => {
      if (part.text !== undefined) return esc(part.text);
      const href = context.sourceHref(part.citation, sceneId);
      const strings = context.sourceStrings.get(part.citation)
        ?? { label: `[${part.citation}]`, accessibleName: `Source ${part.citation}` };
      return `<a class="citation" href="${esc(href)}" data-citation="${part.citation}"`
        + `${sceneId ? ` data-from="${esc(sceneId)}"` : ''}`
        + ` aria-label="${esc(strings.accessibleName)}">${esc(strings.label)}</a>`;
    })
    .join('');
}

/**
 * One block of the main path.
 *
 * A narrator block is a paragraph with no label; the three members speak under
 * their exact names. The name is a real element rather than text inside the
 * paragraph, so a reader can see who is speaking without the label being read
 * as part of the sentence.
 */
function renderBlock(block, context, sceneId) {
  const text = renderParts(block.parts, context, sceneId);
  if (block.kind === 'narration') return `<p class="narration">${text}</p>`;
  return `<p class="line" data-speaker="${esc(block.speaker)}">`
    + `<span class="speaker">${esc(block.speaker)}</span>`
    + `<span class="line-text">${text}</span></p>`;
}

/* --------------------------------------------------------------------------
 * Artwork
 * ----------------------------------------------------------------------- */

/**
 * One drawing, as a linked image with its browser labels over it.
 *
 * There is no frame, no border and no fixed-height stage: the image keeps the
 * intrinsic proportions it was generated at, `width` and `height` reserve its
 * box before it loads so nothing jumps, and the labels are positioned as
 * fractions of that box exactly as the provider inspected them.
 *
 * Space is reserved *above* the image for the names, because a name anchored
 * at 1% of the height sits almost entirely above the drawing. Nothing clips
 * it: the reserve is padding on the surrounding block, and the labels are
 * ordinary selectable text in the page's own typeface, never lettering baked
 * into the asset.
 *
 * Only the first illustration a reader can reach is eager. The rest are lazy
 * and decoded off the main thread: the 22 selected cutouts are 20.4 MB, and
 * fetching all of them on a phone before the first scene is read would be a
 * cost paid for nothing.
 */
function renderView(view, asset, context, options = {}) {
  const image = asset.images[view.image];
  const labels = asset.labels
    .map((label) => `<span class="art-label" data-kind="${esc(label.kind)}"`
      + ` style="--x:${percent(label.x)};--y-desktop:${percent(label.yDesktop)};--y-phone:${percent(label.yPhone)}"`
      + `>${esc(label.text)}</span>`)
    .join('\n');

  const loading = context.takeEager() ? '' : ' loading="lazy"';
  const label = view.label
    ? `<p class="art-view-label">${esc(view.label)}</p>`
    : '';

  return `<div class="art-view" data-state="${options.state ?? 0}" data-ref="${esc(view.ref)}">
<span class="art-anchor">
<img src="${esc(context.assetUrl(image.path))}" alt="${esc(image.alt)}" width="${image.width}" height="${image.height}"${loading} decoding="async">
${labels}
</span>
${label}
</div>`;
}

/**
 * The drawings a scene shows, and the control that switches between two of
 * them where the approved script asks for one.
 *
 * A pair shows both at once, side by side on a wide screen and stacked in the
 * authored label order on a phone. An optional comparison shows one at a time
 * behind two native buttons carrying the exact approved state labels, with the
 * selected one exposed through `aria-pressed`; Enter and Space work because
 * they are buttons rather than something made to look like one. Every
 * paragraph of the scene stays visible in either state, and the continuous
 * view, print and a browser with no script show both drawings with their
 * labels in order, so no part of the argument is behind a control.
 */
function renderArt(visual, context) {
  if (visual.layout === 'text' || visual.views.length === 0) return '';

  const comparison = visual.control !== null;
  const views = visual.views
    .map((view, index) => renderView(view, context.assetsByRef.get(view.ref), context, { state: index }))
    .join('\n');

  const control = comparison
    ? `<div class="art-control js-only" role="group" aria-label="Choose a drawing">
${visual.control.labels.map((label, index) =>
    `<button type="button" data-art-state="${index}" aria-pressed="${index === 0 ? 'true' : 'false'}">${esc(label)}</button>`).join('\n')}
</div>`
    : '';

  const classes = ['art', comparison ? 'art-comparison' : ''].filter(Boolean).join(' ');
  return `<figure class="${classes}" data-layout="${esc(visual.layout)}"${comparison ? ' data-active="0"' : ''}>
<div class="art-views">
${views}
</div>
${control}
</figure>`;
}

/* --------------------------------------------------------------------------
 * Scenes
 * ----------------------------------------------------------------------- */

/**
 * One scene: its title, its blocks in the authored order, and its drawing in
 * the authored position.
 *
 * `group` opens with the first narrator block above the art and continues
 * underneath it. `single` puts the drawing after the first authored block,
 * which is sometimes that scene's opening line of dialogue. `pair` places both
 * views after the first block. `text` has no drawing at all, and gets no
 * decorative substitute.
 */
function renderScene(scene, context, position) {
  const art = renderArt(scene.visual, context);
  // The addresses the superseded script published that now lead here. They
  // are in the markup rather than in the script, so the mapping is the
  // content document's and the script only reads it.
  const relocated = context.relocationsTo.get(scene.id) ?? [];
  const answers = relocated.length > 0 ? ` data-relocates="${esc(relocated.join(' '))}"` : '';
  const blocks = scene.blocks.map((block) => renderBlock(block, context, scene.id));
  const body = art
    ? [...blocks.slice(0, scene.visual.afterBlock), art, ...blocks.slice(scene.visual.afterBlock)]
    : blocks;

  return `<section class="scene" id="${esc(scene.id)}" data-scene="${esc(scene.id)}" data-chapter="${esc(scene.chapterId)}" data-position="${position}"${answers} tabindex="-1" aria-labelledby="${esc(scene.id)}-title">
<h3 class="scene-title" id="${esc(scene.id)}-title">${esc(scene.title)}</h3>
${body.join('\n')}
</section>`;
}

function renderChapter(chapter, context) {
  const scenes = chapter.sceneIds
    .map((id) => renderScene(context.sceneById.get(id), context, context.positions.get(id)))
    .join('\n');
  return `<section class="chapter" id="${esc(chapter.id)}" data-chapter="${esc(chapter.id)}" data-chapter-number="${chapter.number}" aria-labelledby="${esc(chapter.id)}-title">
<h2 class="chapter-title" id="${esc(chapter.id)}-title">${esc(chapter.title)}</h2>
<div class="chapter-scenes">
${scenes}
</div>
</section>`;
}

/* --------------------------------------------------------------------------
 * Interface
 * ----------------------------------------------------------------------- */

/**
 * The landing.
 *
 * The approved script lists what is here: the title, the opening drawing with
 * its browser names, Begin, and Sources & Credits. Nothing else. There is no
 * subtitle, no opening disclaimer, no byline, no credits footer and no
 * estimate of how long the essay takes.
 */
function renderLanding(content, context) {
  return `<section class="landing" id="landing" aria-labelledby="landing-title">
<h1 id="landing-title" tabindex="-1">${esc(content.landing.title)}</h1>
${renderArt(content.landing.visual, context)}
<p class="landing-actions">
<a class="button" href="#${esc(content.landing.beginSceneId)}" data-begin>${esc(content.landing.beginLabel)}</a>
<a class="button quiet" href="${esc(context.sourcesHref)}" data-sources>${esc(content.landing.sourcesLabel)}</a>
</p>
</section>`;
}

/**
 * The chapter rail: every chapter, and the parts inside it.
 *
 * The whole navigation is written into the markup rather than assembled by
 * the script, for the same reason the essay is: a reader with no script and
 * the continuous view both get a working list of chapters and parts, and the
 * script only chooses what is on screen.
 *
 * Every reader-facing word here is already approved. The rail is named
 * `Chapters`, which is the approved name for the chapter navigation; each part
 * is labelled with that scene's own approved title; and each chapter's expand
 * control takes its accessible name from the chapter title beside it through
 * `aria-labelledby`, so no new string is invented for it. State is carried by
 * `aria-expanded` rather than by a word.
 *
 * `Read continuously` and `Sources & Credits` sit in a separate secondary
 * section below the chapters, because neither is a place in the essay.
 */
function renderChapterRail(content, context) {
  const ui = content.interface;
  const chapters = content.chapters
    .map((chapter) => {
      const parts = chapter.sceneIds
        .map((id) => {
          const scene = context.sceneById.get(id);
          return `<li><a href="#${esc(scene.id)}" data-part-link="${esc(scene.id)}">${esc(scene.title)}</a></li>`;
        })
        .join('\n');
      return `<li class="rail-chapter" data-rail-chapter="${esc(chapter.id)}">
<p class="rail-chapter-head">
<a class="rail-chapter-link" id="rail-${esc(chapter.id)}" href="#${esc(chapter.id)}" data-chapter-link="${esc(chapter.id)}">${esc(chapter.title)}</a>
<button type="button" class="rail-expand js-only" data-chapter-toggle="${esc(chapter.id)}" aria-controls="rail-parts-${esc(chapter.id)}" aria-expanded="true" aria-labelledby="rail-${esc(chapter.id)}"><span class="rail-marker" aria-hidden="true"></span></button>
</p>
<ol class="rail-parts" id="rail-parts-${esc(chapter.id)}" data-rail-parts="${esc(chapter.id)}">
${parts}
</ol>
</li>`;
    })
    .join('\n');

  // The approved interface names the two arrangements separately: a rail
  // beside the essay is hidden and shown, and a drawer over it is opened and
  // closed. Each control is written with both of its names and the script
  // chooses which is in force, so neither is invented and neither is a
  // generic word standing in for both.
  //
  // The landmark is named `Chapters`, which is the approved word for the
  // navigation itself rather than for an action on it. It is an `aria-label`
  // because the control that would otherwise carry the name has to change its
  // own text between the two arrangements, and a landmark whose name moves
  // under a reader is worse than one that is not visible on the page.
  return `<nav class="chapter-rail" id="chapters" aria-label="${esc(ui.chapters)}">
<button type="button" class="rail-toggle js-only" data-rail-toggle aria-controls="chapters" aria-expanded="true" data-rail-label="${esc(ui.hideChapters)}" data-drawer-label="${esc(ui.closeChapters)}">${esc(ui.hideChapters)}</button>
<ol class="rail-chapters">
${chapters}
</ol>
<p class="rail-secondary">
<button type="button" class="js-only" data-view-toggle data-scene-label="${esc(ui.partView)}">${esc(ui.continuous)}</button>
<a class="button quiet" href="${esc(context.sourcesHref)}" data-sources>${esc(ui.sources)}</a>
</p>
</nav>`;
}

/**
 * The control that brings the rail back, and opens it on a phone.
 *
 * One control doing both jobs, because they are the same job: the rail is
 * either on screen or it is not, and this is how a reader asks for it. On a
 * wide screen it appears only once the rail has been collapsed; at phone width
 * the rail is a drawer and this is the way in while reading. It sits outside
 * the rail, so collapsing the rail can never hide the way back.
 */
function renderRailLauncher(content) {
  const ui = content.interface;
  return `<p class="rail-launcher js-only">
<button type="button" data-rail-restore aria-controls="chapters" aria-expanded="true" data-rail-label="${esc(ui.showChapters)}" data-drawer-label="${esc(ui.chapters)}">${esc(ui.showChapters)}</button>
</p>`;
}

/**
 * The reading footer.
 *
 * Back and Next, and nothing else. Back at the first scene returns to the
 * landing and the last scene drops Next, so the two controls say where the
 * reader is by what they offer rather than by a counter. Everything that is
 * not a step through the essay -- the chapters, the reading mode, the
 * register -- is in the rail. It is script-only: with no script there is one
 * continuous document and nothing to step between.
 */
function renderControls(content) {
  const ui = content.interface;
  // No `aria-label`: the only names this build may use are the approved
  // interface strings, and none of them names this group. Labelling it
  // "Chapters" -- which is the rail's name -- announced two different
  // landmarks under one name and called Back and Next a chapter list.
  return `<nav class="reader-controls js-only">
<button type="button" data-back>${esc(ui.back)}</button>
<button type="button" data-next>${esc(ui.next)}</button>
</nav>`;
}

/**
 * Read again, offered with the final passage rather than in the footer.
 *
 * The footer carries Back and Next alone, so the one control that belongs to
 * the end of the essay is written at the end of the essay. The script reveals
 * it on the last scene and hides it everywhere else; print drops it, because
 * paper cannot be read again by pressing anything.
 */
function renderClosing(content) {
  return `<p class="closing-actions js-only">
<a class="button" href="#${esc(content.landing.beginSceneId)}" data-read-again hidden>${esc(content.interface.readAgain)}</a>
</p>`;
}

/* --------------------------------------------------------------------------
 * Sources & Credits
 * ----------------------------------------------------------------------- */

const renderRich = (parts) =>
  parts
    .map((part) => (part.link === undefined
      ? esc(part.text)
      : `<a href="${esc(part.url)}" rel="noreferrer">${esc(part.link)}</a>`))
    .join('');

/**
 * One register entry.
 *
 * The bracketed number a claim carries is the number here, so a reader
 * following `[9]` lands on the entry that supports it. The access note is the
 * approved one and says what was actually opened: a publisher's description, an
 * abstract, or the full text. It is not reduced to a badge.
 */
function renderSourceEntry(source) {
  return `<li class="source" id="${esc(sourceAnchor(source.number))}" data-source="${source.number}" tabindex="-1">
<p class="source-head"><span class="source-number">${esc(source.label)}</span> <a href="${esc(source.url)}" rel="noreferrer">${esc(source.citation)}</a></p>
<p class="source-note">${renderRich(source.note)}</p>
</li>`;
}

/**
 * The Sources & Credits content, used as a separate hosted page and as a
 * section of the retained single-file export.
 *
 * The return control restores where the reader was. Its destination is written
 * for a reader arriving with no script — the essay itself — and the script
 * rewrites it from the originating scene and reading mode the citation link
 * carried, which is what makes the return restore both.
 */
export function renderSourcesBody(content, options = {}) {
  const page = content.sourcesPage;
  const heading = options.heading ?? 'h1';
  return `<section class="sources" id="sources" aria-labelledby="sources-title">
<${heading} id="sources-title">${esc(page.title)}</${heading}>
${page.intro.length ? `<p class="sources-intro">${renderRich(page.intro)}</p>` : ''}
<p class="sources-note">${renderRich(page.classNote)}</p>
${page.creditItems ? `<ul class="sources-credits">${page.creditItems.map((item) => `<li>${renderRich(item)}</li>`).join('')}</ul>` : `<p class="sources-credits">${renderRich(page.credits)}</p>`}
<${heading === 'h1' ? 'h2' : 'h3'}>References</${heading === 'h1' ? 'h2' : 'h3'}>
<p class="sources-note">${renderRich(page.methodNote)}</p>
<ol class="source-list">
${page.sources.map(renderSourceEntry).join('\n')}
</ol>
<p class="sources-return"><a class="button" href="${esc(options.returnHref ?? 'index.html')}" data-return>${esc(page.returnLabel)}</a></p>
</section>`;
}

/* --------------------------------------------------------------------------
 * Documents
 * ----------------------------------------------------------------------- */

function head(content, options, title) {
  const styles = options.inlineStyles
    ? `<style>\n${options.inlineStyles}\n</style>`
    : `<link rel="stylesheet" href="${esc(options.stylesheetUrl)}">`;
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
${styles}
<script>document.documentElement.classList.add('js');</script>`;
}

const script = (options) => (options.inlineScript
  ? `<script>\n${options.inlineScript}\n</script>`
  : `<script src="${esc(options.scriptUrl)}" defer></script>`);

/**
 * Builds the shared rendering context.
 *
 * `takeEager` answers true exactly once, for the first drawing written into
 * the document. That is the opening illustration on the landing, the one a
 * reader meets before scrolling anything; every other image waits until it is
 * approached. A01 appears in five scenes as well, and those copies are lazy
 * like the rest.
 */
function context(content, options) {
  const sceneById = new Map(content.scenes.map((scene) => [scene.id, scene]));
  const assetsByRef = new Map(content.assets.map((asset) => [asset.ref, asset]));
  const positions = new Map();
  content.chapters.flatMap((chapter) => chapter.sceneIds).forEach((id, index) => positions.set(id, index + 1));

  // The register's own strings, so a citation is written from the approved
  // copy rather than composed again here. The validator already requires each
  // entry's label and accessible name to agree with its number, so this is
  // the same two strings with one origin instead of two.
  const sourceStrings = new Map(content.sourcesPage.sources
    .map((source) => [source.number, { label: source.label, accessibleName: source.accessibleName }]));

  // Every published address that now leads to a given part, in the order the
  // approved handoff relocates them.
  const relocationsTo = new Map();
  for (const entry of content.relocations ?? []) {
    if (!relocationsTo.has(entry.to)) relocationsTo.set(entry.to, []);
    relocationsTo.get(entry.to).push(entry.from);
  }

  let eager = true;
  return {
    sceneById,
    relocationsTo,
    assetsByRef,
    positions,
    sourceStrings,
    takeEager: () => {
      if (!eager) return false;
      eager = false;
      return true;
    },
    assetUrl: options.assetUrl ?? ((path) => path),
    sourcesHref: options.sourcesHref ?? '#sources',
    sourceHref: options.sourceHref ?? ((number) => `#${sourceAnchor(number)}`),
  };
}

/**
 * The essay.
 *
 * @param {object} content a validated content document
 * @param {object} options resource URLs, and how citations reach the register
 * @returns {string} a complete HTML document
 */
export function renderEssay(content, options) {
  const ctx = context(content, options);
  const ui = content.interface;

  // The retained single-file export has nowhere else to put the register, so
  // it carries it as a section. The hosted site links a separate page, which
  // is what the approved script asks for.
  const inlineSources = options.inlineSources
    ? renderSourcesBody(content, { heading: 'h2', returnHref: `#${esc(content.landing.beginSceneId)}` })
    : '';

  // Only the retained single-file export carries this. It bundles a fallback
  // face whose licence requires the permission notice to travel with every
  // copy of the font software, and that document has no neighbouring file to
  // put it in. The hosted website ships the licence as its own file and the
  // approved Sources & Credits copy carries the typeface credit, so nothing
  // is added to the reader's page here.
  const exportColophon = options.fontLicense
    ? `<footer class="export-colophon">
<p>${esc(options.fontNotice ?? '')}</p>
<details><summary>Bundled font licence</summary>
<pre class="licence-text">${esc(options.fontLicense.trimEnd())}</pre>
</details>
</footer>`
    : '';

  return `<!doctype html>
<html lang="en" data-mode="${esc(options.mode)}">
<head>
${head(content, options, content.landing.title)}
</head>
<body>
<a class="skip-link" href="#essay">${esc(ui.skip)}</a>
<button type="button" class="sound-toggle js-only" data-sound aria-pressed="false">${esc(ui.sound ?? 'Sound')}</button>
${renderRailLauncher(content)}
<main id="essay" tabindex="-1">
${renderLanding(content, ctx)}
<div class="reader-shell">
${renderChapterRail(content, ctx)}
<div class="essay-body" data-essay>
${content.chapters.map((chapter) => renderChapter(chapter, ctx)).join('\n')}
${renderClosing(content)}
</div>
</div>
${inlineSources}
</main>
${renderControls(content)}
<div class="page-wipe js-only" data-page-wipe aria-hidden="true" hidden></div>
${exportColophon}
${script(options)}
</body>
</html>
`;
}

/**
 * The separate Sources & Credits page.
 *
 * @param {object} content a validated content document
 * @param {object} options resource URLs
 * @returns {string} a complete HTML document
 */
export function renderSourcesPage(content, options) {
  return `<!doctype html>
<html lang="en" data-mode="${esc(options.mode)}" data-page="sources">
<head>
${head(content, options, content.sourcesPage.title)}
</head>
<body>
<a class="skip-link" href="#sources">${esc(content.interface.skip)}</a>
<button type="button" class="sound-toggle js-only" data-sound aria-pressed="false">${esc(content.interface.sound ?? 'Sound')}</button>
<main id="sources-main" tabindex="-1">
${renderSourcesBody(content, { heading: 'h1', returnHref: options.essayUrl ?? 'index.html' })}
</main>
${script(options)}
</body>
</html>
`;
}
