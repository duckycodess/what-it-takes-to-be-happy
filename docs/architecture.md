# Architecture contract

Status: implementation-neutral architecture for the confirmed experience. This document defines behavior, boundaries, and future work; it does not select or scaffold a framework.

> **Amended on 9 October 2026.** The hosted Vercel output is the deliverable; the self-contained offline HTML file is discontinued. [The owner amendment](decisions.md#owner-amendment--9-october-2026) is canonical. The offline path is still described here because the code still produces it and the packaging rules it imposes are still what keeps the hosted page self-sufficient — but nothing below is a release gate any more.

## Overall shape

The essay is a static, browser-readable experience. Author the story, cast, references, and original scene assets in the repository, then package them for Vercel. The build also still emits a self-contained offline HTML file from the same content and renderer; since the 9 October amendment that file is retained tooling rather than a deliverable. Runtime access to Google Docs is unnecessary; source imports and later deltas are editorial inputs.

```mermaid
flowchart LR
  N[Imported notes and future deltas] --> C[Reviewed chapters and scenes]
  R[Audited source register] --> C
  A[Original character and scene assets] --> P[Shared reader and scene renderer]
  C --> P
  P --> H[Vercel static output]
  P --> O[Self-contained offline HTML: retained tooling, not a deliverable]
  P --> T[Continuous reading and print view]
```

## Boundaries

| Part | Responsibility |
| --- | --- |
| Editorial inputs | Preserve source snapshots, record deltas, distinguish member reflection from hypothetical examples |
| Story content | Ordered chapters and scenes, essential prose, dialogue, concept application, evidence, limits, optional detail |
| Reference registry | Stable source identifiers, bibliographic detail when verified, links, claim roles and limitations |
| Cast registry | Stable member/friend identifiers, display names, original appearances, emotional states |
| Reader | Landing, Begin, Next/Back, chapter navigation, reading mode, focus and presentation state |
| Scene renderer | Draw/reuse/replace scenes, synchronize explanatory changes with the visible argument |
| Detail surfaces | Optional sources, extra examples, and supplementary thoughts without hiding essential content |
| Packaging | Generate the hosted files from the authored material, and the retained single-file output from the same render |

There is no current requirement for accounts, a database, a live feed, voting, a happiness score, or a complex simulation. Do not introduce them to satisfy static presentation needs.

## Content contract

Choose the concrete storage format during implementation. It must express these relationships:

| Entity | Required information |
| --- | --- |
| Chapter | Stable identifier, title/question, ordered scene identifiers, opening and closing connections |
| Scene | Stable identifier, chapter, essential narrative text, optional dialogue, character/visual state, relevant concept/source identifiers, visible limitations, optional supplementary content |
| Dialogue | Speaker identifier, text, whether it is a member-endorsed position or a fictional friend's illustrative line, relevant source identifiers |
| Source | Stable identifier, label, original URL, the evidence level actually reached, what was opened and read, bibliographic detail, supported claim, limitations |
| Character | Stable identifier, member/friend role, displayed name, original appearance, available expressions |
| Interaction | Explanatory purpose, optional trigger/state, supplemental output, keyboard/touch behavior, static readable equivalent |
| Provenance | Source note or delta location supporting a member position or content change |

Keep editorial audit/provenance information in the authoring material. The product shows citations and meaningful context, not internal workflow metadata. Stable identifiers allow later notes to modify a scene without relying on its numeric position.

Content validation should catch broken references, duplicate or missing identifiers, nonexistent speakers, empty essential scenes, and ordering errors. Tests should exercise meaningful contracts and transitions rather than duplicate implementation details.

## Reading behavior

- Landing opens with the working question, emotional original stickmen, Begin, member names, and an honest reading-time estimate once measured.
- Begin enters the first authored scene. Next and Back traverse the complete sequence; boundary behavior is explicit and keyboard accessible.
- Chapter shortcuts revisit the beginning of a chosen chapter. Readers do not need to repeat earlier optional interactions.
- Presentation and full reading views contain the same essential prose, dialogue, findings, caveats, and conclusion.
- Source links/details can be inspected and dismissed without losing the current scene or keyboard focus.
- Optional comparisons/reveals never gate progression or contain the sole explanation of a major perspective.
- No timer advances prose automatically. Scene motion follows explanation and allows reading at the visitor's pace.

## Illustration and motion

Scenes may reuse the same setting to reveal another condition or replace the composition for a new example. A shared cast/expression vocabulary keeps emotional changes consistent. Generic fictional characters remain distinct from the three real contributors.

Scalable line art is a suitable implementation option; no asset format is mandated. Text and names should remain readable as text. Supply an equivalent description for meaning conveyed visually. Reduced-motion/static presentation must preserve the explanation even when animation is disabled.

The [asset workflow](asset-workflow.md) starts with built-in image generation for concepts, then prepares reusable browser drawing parts and expression states. The first PNG character sheet is authoring input, not a separated animation library. SVG components are a suitable production option. Simple CSS/Web Animations can move or reveal them; Anime.js is optional if coordinated timelines need a helper. Rough.js is optional for sketch-like scenery. No library has been installed yet.

Image generation, drawing editors, and any future MCP connector run during authoring. The deployed reader consumes committed assets and local state only. Motion must cancel or settle to the selected scene's correct state when Next/Back changes the beat, and reduced motion must show the same explanatory state without an animated transition. Keep generated lettering out of production labels and dialogue.

## Responsive and accessible presentation

Desktop may place narrative and illustration side by side or within a wide stage. Phones rearrange them into a readable layout. Do not lock readability to the reference site's fixed dimensions.

Use semantic controls, visible keyboard focus, a sensible reading order, legible contrast, text alternatives, and labels above member avatars. Source/detail surfaces should be keyboard reachable and dismissible. Full reading mode provides a direct text route through the complete argument.

## Hosted packaging

Vercel serves the static hosted output, and that is the deliverable. The hosted page must carry the complete argument with its own committed resources: no runtime fetching of content, no remote font, no remote illustration dependency, and no third-party request that a reader's network can fail. External reference destinations are ordinary links and may need internet; their labels, claim context, and necessary source details stay readable without following them.

The build also still writes a single self-contained HTML file containing the same prose, references, styles, scripts, font, and illustrations. The 9 October amendment discontinued it as a deliverable: it is not a submission artifact, hosted/offline parity is not an acceptance criterion, and opening it from `file://` with networking disabled is not a release check. It is retained because the rules it enforces — every required resource committed, inlined, and accounted for — are the same rules that keep the hosted page self-sufficient, and because the packaging tests that assert them are cheap. Removing it from the published `dist/` is owned by [#7](https://github.com/duckycodess/what-it-takes-to-be-happy/issues/7) and has not been done.

The foundation implementation documents the actual local preview, validation, hosted packaging, and export commands below.

## The implemented foundation

The foundation package filled in the implementation choices this document left open. What follows records what exists, not what is planned.

### Tooling, and why it is this small

Node 24 with **no dependencies at all**. The committed `package-lock.json` contains no packages, tests use Node's built-in runner, and the build uses only `node:fs`, `node:path`, `node:crypto`, and `node:http`.

The reasoning was the offline requirement, which the 9 October amendment has since retired. A framework or bundler would put a toolchain between the authored content and a file that has to open from a local disk with no network, and every dependency added to that path is another way for the artifact to break on the night it is due. The conclusion survives its premise: nothing has since earned a dependency, and the hosted page still has to carry its own font and artwork. A static essay with one page, one stylesheet, and one browser script does not need one. Nothing here prevents a later package from adding a dependency if it earns its place; the decision is only that the foundation did not need one.

Consequences worth knowing: there is no linter, formatter, or type checker configured, so `npm test` runs Node's own parser over every source file instead. The browser script is a classic script rather than an ES module, because module loading is blocked for `file://` documents.

| Path | Role |
| --- | --- |
| `content/content.json` | The single content document. See [the content contract](content-contract.md). |
| `src/content/` | Schema constants, the validator, and the loader. |
| `src/art/` | The original drawings: figures, expressions, postures, scene compositions, and the storyboard coverage map. See [the drawing system](art-system.md). |
| `src/runtime/` | The shared renderer, the stylesheet, and the browser script. |
| `src/build/` | Asset declarations, data-URI inlining, the output audits, and the build. |
| `src/tools/` | The validation command and the local preview server. |
| `test/` | Contract, renderer, packaging, and preview checks, plus a deliberately broken fixture. |

### Commands

| Command | What it does |
| --- | --- |
| `npm run validate` | Checks `content/content.json` against the contract. Exits nonzero with located errors. |
| `npm test` | Runs every check: contract rules, stable-identifier reordering, rendering, packaging, determinism, and the preview server. |
| `npm run build` | Validates, renders, audits, and writes `dist/`. |
| `npm run export:offline` | Writes only `dist/offline.html`. Retained tooling; the file is no longer a deliverable. |
| `npm run preview` | Serves `dist/` at `http://localhost:4173`. |
| `npm run check` | `validate`, then `test`, then `build`. |

`dist/` is generated and git-ignored. The exact hosting settings are in [delivery](delivery.md).

### One render, three outputs

`src/runtime/render.js` renders the **entire** essay into the markup — every chapter, every beat, every optional panel — and the browser script only decides what is on screen. That single decision is what makes the rest hold together:

- Print carries the complete argument whichever view is open, and optional panels are reopened before printing.
- A browser with scripting unavailable shows the continuous reading view, which is the same thing the print route needs.
- The hosted page and the single-file output differ only in whether their resources are linked or embedded; a build check asserts their visible text is identical. That check now guards the renderer against dropping content in one path, not a parity requirement between two deliverables.

The build refuses to publish an output that drops essential content, and refuses a single-file output that references anything it does not carry. External source destinations stay as ordinary links: their labels, roles, and limitations are readable without following them, and only following the link needs a connection.

### The implemented reader

The reader package filled in the behaviour this document described. Three decisions carry most of it.

**The fragment is the state.** Every move writes one and every fragment resolves: a beat identifier to that beat, a chapter identifier to that chapter's first beat, `sources` or a single source identifier to the register in the continuous view. `hashchange` and `popstate` apply whatever the fragment says, so deep links, chapter revisiting, and the browser's Back button are one mechanism rather than three. `history.pushState` is tried first and the entry carries the view, so Back restores how the reader was reading as well as where they were; a browser that refuses `pushState` — which a `file://` document is exactly where to expect — falls back to assigning `location.hash` and infers the view from the fragment instead. Switching view replaces the current entry rather than adding one: how you read is not a place. A fragment the script does not recognise is left alone after the first load: the document has landmarks of its own — the skip link's `#essay`, the chapter list's `#chapters` — and following one is a move within the page, not a reason to take the reader off their beat.

**A move is announced once.** Focus moves to the newly selected beat, which carries `aria-labelledby` pointing at its own title. Nothing else is a live region, so the move is reported once rather than twice. The progress line next to the controls is plain text: position, the chapter it sits in, and a sentence at each end, because a disabled button is easy to miss and does not say why it is disabled. The view switch changes its label and carries no `aria-pressed`, for the same reason — both would read as "Back to the beats, pressed".

**The view decides only what the reader has not.** An optional panel remembers whether the reader opened or closed it; until they touch one it follows the view, collapsed between beats and open in the continuous view. Print opens every panel and then hands the choices back. The `toggle` event is queued rather than fired during the assignment, so the script compares each panel against the last value it wrote instead of holding a flag across the change.

Everything else follows from the renderer putting the whole essay in the markup. Each register entry is anchored; each beat-side source reference keeps its evidence level and limitation in place *and* links the full entry; the chapter list, which stays on screen in every view, carries a Sources link. Arrow keys move between beats but never inside a summary, link, button, or field that owns them. Every arrival at a beat brings that beat to the top of the window, because the page is taller than one beat.

Styling is one stylesheet with no fixed stage, since the finished artwork does not exist yet and the layout must not be built around its dimensions. Every selector that hides something in a view is answered by a print rule, and a test fails if a new one is not.

### Evidence levels reach the reader

A source's `reviewStatus` is the level the audit actually reached: read in full, abstract only, publisher or catalogue description only, or not opened. The contract will not let a source state what it supports at a level where nothing inside the work was read, and the renderer phrases every supported claim against its level, so an abstract or a publisher's description is never presented as a passage from the work. [The content contract](content-contract.md) holds the table; [the register](research.md) holds the audit itself.

The bundled font's licence is rendered into the document rather than left beside it, because any output that embeds the font is a copy of the font software and the licence requires its notice to travel with every copy. A build check fails if either output loses it.

The project typeface is handled differently, because its permission is different. Futura Handwritten is used under the author's own note granting use, which is not a named licence and is not a grant to redistribute the file. So it is **served** by the hosted site from this origin and is **never embedded** in an output handed to someone else. One stylesheet carries both faces, with everything that depends on the project typeface inside a marked region the hosted output keeps and the offline file drops; a build check fails the offline output if the font's bytes, a URL pointing at it, or even its family name survive into it. Each output credits the fonts it actually carries and no others, which is also a build check — a credit for a face a reader is not looking at would be a false statement about the page.

### Illustration, as built

The artwork package filled in the illustration side of this contract. The drawings are authored
geometry generated into the markup as inline SVG, so a scene costs the page no request and
no asset; a scene names its composition and its settled state by identifier, and content validation
refuses a document that asks for a drawing the artwork cannot produce. Names above heads are browser
text positioned over the drawing, never lettering inside it. A composition's condition layer is in
the markup and settled by default, and the one CSS entrance animates a drawing that is already
correct — which is what makes rapid Next/Back and reduced motion safe rather than special cases.
[The drawing system](art-system.md) is the full account, including the 33 of 87 storyboard beats
that have a motif and the 54 that are still carried by their written description.

### What is still open

Final prose, the complete scene set, and the reader's finished visual design are all still open. The
committed concept sheet is provenance for the drawings rather than production artwork.

The project typeface is settled. Futura Handwritten is served by the hosted site and sets the whole
essay; the committed DejaVu Sans stands behind it and draws the one character on this content it has
no glyph for. The distinction that governs where it may appear — permission to use a face is not
permission to pass the file on — and everything that was checked to establish it, are in
[`assets/fonts/README.md`](../assets/fonts/README.md). No lookalike was substituted; all lettering is
browser text, so nothing in the argument depends on the face.

### How the reader is tested

Two suites, because they answer different questions. `test/reader.test.js` runs the real browser script against the real rendered markup in a small DOM built for the purpose, and always runs. `test/browser.test.js` runs the same journeys in Chrome and answers what the *stylesheet* does — what a view hides, whether a focus ring is painted, where focus goes when a native disclosure is clicked, whether a phone-width window scrolls sideways. It skips with a stated reason where no browser is installed, and [verification](verification.md) records which happened.

The journeys are driven against `dist/offline.html`, because one file is the cheapest thing a browser can open without a server and it is the same renderer. The typography is driven against the hosted build instead — `index.html` with its stylesheet, script, and both fonts written beside it at the paths it links them at — because a webfont the browser never had to fetch proves nothing. That suite checks the loaded `FontFace`, that what the page draws measures as the project typeface rather than the fallback, and that withholding the font file alone makes the page fall back, which is what rules out a `local()` lookup standing in for the file whose provenance is recorded. Serving the same tree over HTTP would be closer still; a Windows browser driven from WSL cannot reach a loopback port inside it, so what a real HTTP response carries is checked against the preview server in `test/build.test.js`. `test/fonts.test.js` pins each font file's size and digest and checks, against both `cmap` tables, that every character the essay prints is one a packaged face can draw.

Both harnesses are deliberately small and dependency-free: `test/support/dom.js` implements exactly the subset the browser script asks for and throws on anything outside it, and `test/support/chrome.js` drives Chrome through `--dump-dom` with no socket and no client library. `test/dom.test.js` pins down the first harness's own behaviour, because a reader suite is only worth as much as the harness under it.

## Handoffs that create real prerequisites

The reader depends on the foundation's content/runtime interfaces. Final narrative integration depends on an audited storyboard, a working reader, and original scene assets. Hosted release verification depends on the integrated complete essay. Editorial work and original asset development can begin alongside the foundation using these documented contracts.
