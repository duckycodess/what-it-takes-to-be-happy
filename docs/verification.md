# Verification plan

These are concrete acceptance scenarios for the finished essay. Avoid tests that merely mirror rendering code.

> **Amended on 9 October 2026.** The hosted site is the deliverable and the offline HTML file is discontinued, so **no offline check below is an acceptance gate**. Where offline work is recorded, it is a record of a check that ran. [The owner amendment](decisions.md#owner-amendment--9-october-2026) is canonical.

## What the automated suite already checks

`npm run check` runs the content validation, the automated suite, and the build. The build itself refuses to write an output that drops essential content, serves a drawing nobody inspected, or produces an offline file that depends on anything it does not carry.

| Suite | What it covers |
| --- | --- |
| `test/transfer.test.js` | The content document against [the approved script](redesign/approved-scene-script.md) by content hash: every reader-visible sentence in order, speaker labels as elements rather than text, citation normalisation to `[n]`/`Source n`, the approved Sources & Credits copy, the recomputed word count, and that no renderer-written prose and no superseded scaffolding survived. |
| `test/validate.test.js`, `test/cli.test.js` | Every contract rule, each proved by breaking one thing in the real document; and the command's own located, named reporting against a deliberately broken v2 fixture. |
| `test/reorder.test.js` | That links are by identifier, that registries with no authored order may be stored in any order, that source numbers follow first appearance, and that the approved reading order is now the argument rather than a presentational choice. |
| `test/register.test.js` | The published 26-entry page against the 32-entry audit in `docs/research.md`: destination, audit level, the six entries held back, and that a work nobody could open never reaches a reader. |
| `test/coverage.test.js` | Every figure in [the coverage matrix](coverage.md) recomputed from the document: the four assignment parts, the chapters, all 45 scenes and layouts, the sources and where they are cited, the 20 assets and their labels, the invented figures, and the two optional comparisons. |
| `test/render.test.js`, `test/art.test.js` | The markup: the landing carrying only approved copy, scenes in authored order, frameless art with reserved boxes and lazy loading after the first illustration, name anchors in both manifest generations, pair cutouts and their view labels, and the two comparisons. |
| `test/reader.test.js` | The reader's journeys in a scripted DOM: authored order, both boundaries, chapter revisiting, scene and continuous views, deep links, the browser Back button with and without the History API, the optional comparisons, and leaving for a source and coming back to the same place in the same mode. |
| `test/browser.test.js` | The same site in real Chrome, built and linked as it is served. See below. Skips with a stated reason where no browser is installed. |
| `test/build.test.js` | The packaging audits, the artwork actually linked, build determinism, what a normal build does and does not publish, the explicit offline export and the rebuild that clears it, and the preview server over real HTTP. |
| `test/fonts.test.js` | Each committed font file's size and SHA-256, and — read from both `cmap` tables — that every character either page prints is one a packaged face can draw. |
| `test/styles.test.js` | That every view selector which hides something is answered by a print rule or is listed as screen apparatus; measured contrast for every declared colour; reflow, reduced motion, the focus ring on every target the script focuses; and that nothing depending on the project typeface sits outside the region the offline file drops. |
| `test/measure.test.js` | `./tools/count-main-path.sh` against the document's own recorded figure and rule, the per-chapter breakdown, and that the counted text is the reader's own sentences with titles, speaker labels, citation markers and the register excluded. |
| `test/dom.test.js` | The test harness itself, so the reader suite cannot pass on a harness that answers wrongly. |

### Checked in a real browser

*(Historical: this records the superseded 87-beat build. What the current site was checked with is under **What the rewrite integration checked** below.)*

Run on 9 October 2026, headless Chrome 154 on Windows, driven from WSL. The reader's journeys ran against `dist/offline.html` opened through a `file://` URL with nothing served; the typography ran against the hosted build with its linked files beside it. All eleven browser tests ran; none skipped.

- The landing shows the landing. Begin, Next, Back, the two disabled boundaries, chapter shortcuts, and the continuous view all behave, and the beat lands at the top of the window on every arrival rather than below the banner and the chapter list.
- Focus moves to the beat and is **painted**: `outline-style: solid` with a non-zero width on the focused beat. Back, Next, and the view switch all measure at least 44 CSS pixels tall.
- Clicking a disclosure keeps focus on its own summary, leaves the beat where it was, and leaves Next available. A panel the reader opened stays open across both view switches while an untouched one still follows the view.
- A source beside a beat reaches its register entry. The entry the reader followed — not merely the first one in the register — is focused, is inside the window, and carries its own ring. The return control brings them back to the beat they left.
- The skip link does what a skip link is for: focus moves to the essay, and the reader stays on the beat they were reading. So does `#chapters`, and so does a fragment this script does not recognise.
- `history.back()` works on a local file and restores how the reader was reading as well as where they were.
- No horizontal overflow at a 320-pixel layout viewport, measured on the landing, on each of the nine beats in turn, and in the continuous view with the register open. A wide window puts the illustration beside the prose and the chapter list into two columns.
- Every beat draws what the content document says it draws: an inline SVG where a composition is named, the "not made yet" notice only where none is, and in both cases the written description underneath. Every figure's name is HTML text outside the SVG, inside the frame, and above its anchor, checked on all nine beats at phone width.
- With `--force-prefers-reduced-motion`, the browser reported the preference, the condition layer's `animation-name` computed to `none`, and its opacity was already 1 — the explanation the entrance would have animated into is simply there.

#### The project typeface, loaded

- The browser fetched `assets/fonts/FuturaHandwritten.ttf` and parsed it: one `FontFace` for `Futura Handwritten`, `status: "loaded"`, `display: "swap"`, and `document.fonts.check` true.
- The page is drawn with it, not merely told to use it. The same 62-character sentence measures 453 CSS pixels in the project typeface and 497 in the bundled fallback, and what the document inherits measures 453.
- Withholding the font file, and changing nothing else, makes the same face report `status: "error"`, and the page then measures at the fallback's width and stays readable. That is what rules out a `local()` lookup quietly standing in for the file whose provenance is recorded.
- The en dash is drawn, at the fallback's width, because the project typeface has no glyph for it. Which character that is comes from reading both `cmap` tables in `test/fonts.test.js`, not from the browser.
- At a true 320-pixel layout viewport with the real face loaded: no horizontal overflow on the landing or on any of the nine beats, every long paragraph inside the window, and every name above a figure drawn and inside the window.
- At 1440 pixels in the continuous view: the widest line of body prose is 496 CSS pixels and holds about 68 characters, body prose computes to 16 CSS pixels, and leading computes to 1.5. Left at the fallback's 34rem the same line would hold about 75, which is what the retuned measure exists to prevent.
- Both fonts are served byte for byte by the preview server over real HTTP, as `font/ttf`, at the paths the stylesheet asks for.

A note on what the hosted-tree run is and is not: the files are written to a directory and opened through `file://`, not served. Chrome fetches the font over a real request either way, which is what the questions above need, but it is not the deployment's own network. A Windows browser driven from WSL cannot reach a loopback port inside it — both `127.0.0.1` and the WSL interface address time out — so serving the tree to it was not available here.

A note on how the narrow width is measured: a desktop browser window will not go below roughly 500 CSS pixels, so `--window-size=360` silently lays the page out at about 490. The narrow-width tests therefore load the page in a frame of the requested width, which does give it that layout viewport. An earlier pass that missed this reported a phone width it had not actually tested.

That the browser suite drives `dist/offline.html` is a convenience, not a requirement: it is the same renderer the hosted page uses, in one file a browser can open without a server. The `file://` condition is not asked of anything now.

Not yet checked, and still owned by the later packages: a real phone and a real desktop browser, a screen reader, the typeface arriving over the deployment's own network, and anything about the finished prose.

## What the artwork package checked, and how

*(Historical: the browser-drawn artwork described here was replaced by generated illustrations on 11 October 2026. The record is kept as provenance.)*


Checked on 9 October 2026, after the drawings were added. `npm run check` covers the drawing system
itself: every figure in every expression, every composition at every figure count in both settled
states, the absence of any external reference or lettering inside a drawing, the anchors that place
each name above a head, byte-identical output on a second render, and the coverage map against all
87 storyboard beats. The build refuses an output whose drawings reach outside it.

Visual checking was done by rasterising the generated SVG and looking at the result: every figure in
every expression, every composition in both settled states, and then the frames of the built page
with each nametag drawn at its real anchor at a 480-pixel and a 300-pixel frame width. That is what
caught labels colliding with artwork, a figure standing beside a slope rather than on it, a load
drawn over a head, a resting figure that read as a standing one, and a figure left hovering where
its platform had been drawn in the wrong layer.

The rasteriser was a throwaway written for this check, in a scratch directory outside the
repository; it is not committed and nothing depends on it. It supports only the subset of SVG this
project generates — lines, polylines, rectangles, circles, and `M`/`L`/`Q` paths under
translate/scale/rotate transforms — and it renders no text, no dashes, and no CSS, so nametags were
drawn into it as boxes at their real anchors, sized from the stylesheet's own clamp, and dashed
outlines appear solid. It shows the geometry. It does not show the page.

The artwork package had no browser in its environment, so the entrance animation, the reduced-motion
override, the container query that sizes label type, and the print rules were verified there as
rules in the stylesheet and as state in the markup rather than as rendered behaviour. The reader
package does have one, and the browser suite now covers them; what it covers and what it still does
not is below.

### Not checked, and by what

- **A real phone and a real desktop browser.** Headless Chrome at a 320-pixel layout viewport is not a device: it says nothing about touch accuracy, a software keyboard, an address bar that grows and shrinks, or how the page feels in the hand.
- **A screen reader.** The structure is there — one accessible name per beat, no competing live region, semantic controls, a `summary` that keeps its focus — but no assistive technology has read it. "Announced once" is an argument from the markup, not an observation.
- **Print, on paper or in a print preview.** Print is covered by the stylesheet structure test and by the `beforeprint` behaviour test. Neither is a rendered page. Headless Chrome cannot emulate print media without a DevTools connection, which is not available from WSL to a Windows browser.
- **Rapid Next and Back against a running entrance animation**, on a real machine. The stylesheet animates only opacity and transform on a layer that is already in its settled state, and reduced motion is measured as computed style above, but nobody has hammered the controls in a browser and watched what happens.
- **Contrast as perceived**, rather than computed. The ratios are measured from the declared tokens; nothing has been checked against a display or a low-vision reader.
- **The container query that hides a state word on a narrow frame**, as experienced rather than as a rule: the labels were measured for position and containment, not read aloud.
- Anything about the finished prose. *(Superseded: the content document is now the finished essay, and what was checked about it is recorded above.)*

`node ~/.claude/skills/impeccable/scripts/detect.mjs` over the runtime files reports two warnings, both pre-existing and both deliberate: the left rule on a dialogue line and the left rule on a "keep in mind" callout. Both are ordinary essay typography — a quotation rule and a callout rule — rather than the card accent the heuristic is looking for.

No linter or type checker is configured, so none was run; `npm test` runs Node's parser over every source file instead.

## What the integration package checked, and how

*(Historical: this records the 87-beat essay, superseded by the approved rewrite on 11 October 2026.)*

Checked on 10 October 2026, after the storyboard's prose and the drawings were wired into the
content document. Everything below was run in this working environment; what could not be run here
is named at the end rather than left out.

### Automated

`npm run check` passes: 193 tests, 0 failures, **0 skipped** — Chrome is installed here, so the whole
browser suite ran rather than skipping. `./tools/check-storyboard.sh` passes all 21 editorial
checks. `./tools/count-main-path.sh` reports the storyboard corpus at 8,627 words and
`--published` reports the website's at 8,992, which is the 36 to 45 minutes the landing states.
`openspec validate integrate-six-chapter-essay --strict` reports the change valid.

### Looked at, in a real browser

Headless Chrome 154 on Windows, driven from WSL, against the built `dist/`:

- **The landing**, at 1280 pixels: the question in Futura Handwritten, the summary, the three
  contributors' nametags, the opening drawing with TJ, Koj, Vier and Bob, and Bob labelled
  named without a nametag and listed under the drawing as an invented figure. *(Recorded before the
  label work below; the mark moved under the drawing on 10 October.)*
- **Beats at desktop width** (`s010`, `s064`): the drawing beside the prose, the caveat in its own
  callout, the concepts line, the spoken line attributed by nametag.
- **A beat at a true 360-pixel layout viewport** (`s058`, inside a frame of that width, because a
  desktop window will not go below about 500): the drawing above the prose, both labels inside the
  frame, the state word hidden by the container query while the fictional-illustration mark stays
  visible, the Taglish in TJ's line intact, and the progress line reading
  "Beat 58 of 87 / Chapter 5 of 6: Who has room for happiness?".
- **The scriptless route**, by removing the script from a copy of the built page: the continuous
  reading view, the measured estimate ("About 36 to 45 minutes to read."), and the chapter list
  showing *Opening* without a number and the six questions numbered 1 to 6.
- **The print rules, rendered**. Chrome printed the page to PDF with the print stylesheet applied:
  145 pages. To look at what those rules do, the print block was rewritten to `@media all` in a
  copy of the built stylesheet and the result was opened on screen.

  **That is how a real print fault was found.** `.scene-art { max-width: 12cm }` capped the drawing
  but not the frame around it, so on paper the frame stretched to the width of the page while the
  drawing stayed 12cm — and every name, positioned at a percentage of the frame, drifted away from
  the figure it belonged to. The cap now applies to the whole figure, and
  `test/styles.test.js` fails if it is moved back onto the drawing alone. This was invisible to
  every earlier check, because no earlier check rendered the print rules.

### Every beat, looked at

Added on 10 October 2026, after review found that the artwork claim above was wider than the
evidence behind it. The earlier pass had rendered each **composition** once, at its minimum figure
count, which is not what any particular beat shows.

So all 87 beats were looked at as a reader meets them. Each beat's rendered `<figure>` — the
drawing, the names, the invented-figures line and the caption — was taken out of the built
`dist/index.html`, laid into ten contact sheets of nine at 380 pixels each, rasterised in headless
Chrome, and read. That covers every composition at a figure count and settled state a real beat
gives it, because every composition is used by at least one beat.

**It found eight faults that no assertion had caught**, all now fixed:

| Beat | What was wrong |
| --- | --- |
| `s017` | The description put Bob in the first panel; the drawing puts TJ there, because the cast order is the storyboard's. |
| `s022` | The description put TJ on the platform the ranking is done from; the drawing puts Vier there. |
| `s030` | The description made Vier the figure inside the measured frame; the drawing puts Bob there. |
| `s037` | With one figure, the row centred it **behind** the screen, which is the one place in that composition nobody can stand. |
| `s054` | The description called the middle figure tense; the figure drawn tense is the one at the end. |
| `s009`, `s028`, `s067` | A nametag overlapped the artwork underneath it: the middle dial, the first bar of the chart, and the lower row of blocks. |
| `s004`, `s014` | The middle figure's nametag sat inside the framed moment the beat is about. |

**What this did not cover:** a composition at a figure count no beat asks for. Several accept a
wider range than the essay uses. Those counts are covered by the automated checks — every
composition at every count for self-containment, anchors inside the frame, the condition layer
adding rather than redrawing, and nobody standing on scenery only that layer draws — and by nobody
looking at them.

### Where a drawing departs from the storyboard, and why

Added on 10 October 2026, after review found three beats whose artwork says something other than the
storyboard's **Visual purpose** and **Static description**. Correcting the reader-facing description
had made the page honest about the pixels; it had not recorded that an editorial departure happened
at all. Two of the three are now fixed in the drawing rather than in the wording.

**Fixed, because the drawing attributed a feeling to the wrong named person.** `s054` presses one
figure out of shape, and the storyboard gives `frustration` to Koj alone. The composition pressed
its middle slot, and the cast order put Vier there — so the drawing showed Vier under pressure while
the document named Koj as the tense one. `art-overlapping-selves` now fills the **middle place
first**, so the figure pressed is the one the beat is about: Koj. `s053`, which uses the same motif
in its other state, simply has its single named figure in the middle now, which reads at least as
well.

**Fixed, because the motif was claiming something it did not do.** `s030` is one person before and
after an idea of a good life arrives, and both the composition's stated purpose and its settled
description said "the same person" in both panels. Its two slots were one per panel, so with this
beat's cast it drew Vier and then Bob — two people. The composition now puts **both named figures
in the first panel**, playing, and draws the first of them again, grown, inside the frame in the
second. That is what the motif always claimed.

**Not fixed, and recorded instead.** `s017` is the one departure left in the essay, and it is
deliberate:

| What the storyboard's static description says | What the drawing does | Why |
| --- | --- | --- |
| "In the first, Bob plays alone with faceless figures… In the second, the same play with familiar faces around him" | TJ plays in the first court, Bob in the second, with the other players far off in one and close in the other | The beat's cast line is `tj` `bob`, in that order, and the composition gives one court to each. Putting Bob in both would mean either drawing TJ nowhere in his own beat, or reordering a cast line that is editorial source material and not ours to rewrite. The **visual purpose** — the same game with and without familiar figures — is carried by the two courts and the companions, which is what the composition actually holds still. |

Six more beats name a figure in their storyboard static description that their own cast line does
not place: `s015`, `s019`, `s020`, `s023`, `s024`, `s075`. In every one the sentence is recalling an
earlier beat — Bob's afternoon, the instruments from `s010` — rather than saying that figure is in
this frame. The cast line is the authority on who is drawn, and it is what `tools/check-storyboard.sh`
enforces, so the drawings follow it and each beat's own description says who is actually there.
`src/art/storyboard-map.js` was corrected where its note had picked up the looser wording: `s015`
no longer says the instruments are turned on all three of us when the beat places one.

### Names, and where they go

Review also measured something no check had: label boxes. Eight labels on `s086` ran through each
other by up to 48 pixels, and `s068`, `s072` and `s078` were doing the same more quietly — 16
overlapping pairs at a 360-pixel layout and 17 at 1280. The words "fictional illustration" under a
name were 6.7 pixels tall on a phone, which is not a statement anybody can read, and being longer
than any name they were also most of the reason labels collided.

Both are fixed, and measured rather than argued:

- Whether a figure is invented is now said **under** the drawing, at body size, as "Invented
  figures: Bob, Nessa, Marco". A contributor still gets the boxed nametag and an invented figure
  still does not, so the distinction over the drawing survives; the words that explain it are now
  somewhere they fit.
- The renderer decides per drawing whether names fit above the heads, from the composition's own
  anchors and a measured label-width budget. Five beats of 87 move their names into a row under the
  drawing instead, in the order the figures stand in; the other 72 keep them over heads. The list
  is ordered left to right in the DOM too, which is the only association a reader who cannot see
  the drawing has.
- `test/browser.test.js` now walks **all 87 beats at a true 360-pixel layout and at 1280** and
  fails on any pair of label boxes that overlap at either. It measured 0 pairs at both widths after
  the change, and it also fails if the crowded beats stop being the ones that move.

### Read, rather than measured

- Every beat's prose was transferred by comparison rather than by hand, and `test/transfer.test.js`
  is that comparison. The quoted punctuation came through intact, including the em dashes and the
  `∼` inside Kahneman and Deaton's own wording at `s061`; `test/fonts.test.js` now records those
  two characters, and the en dash, as the three the bundled fallback draws because the project
  typeface has no glyph for them.
- One source-backed beat was read in each chapter against its rendered source block — `s008`,
  `s027`, `s039`, `s050`, `s069`, `s080`. Each shows its evidence level in words ("Read in full",
  "Abstract only", "Could not be opened"), phrases what it supports against that level, and carries
  its limitation on the page without following the link. `s039` cites a thread nobody could open and
  shows "Listed in the notes for" rather than a supported claim.
- The ending was read in place: `s083` (four tensions, unresolved), `s084` (each member's own
  remaining question), `s085` (the afternoon with its conditions still visible), `s086` (the closing
  question, unanswered) and `s087`, which is the source note and is the one beat with no drawing —
  no frame, no "not made yet" notice, just the text and the register under it.

### Not checked here, and by what

- **A real phone and a real desktop browser.** Unchanged from below: a 360-pixel frame in headless
  Chrome is not a device.
- **A screen reader.** Unchanged. The invented-figures line and the names are ordinary text in the
  document rather than attributes, and the name list is in left-to-right order so the sequence a
  screen reader hears is the sequence a sighted reader sees — but nothing has read any of it aloud.
- **A paginated print page, looked at.** The PDF renders — 145 pages — but nothing in this
  environment can rasterise it: `pdftoppm` is not installed and headless Chrome will not display a
  PDF to screenshot. So the page breaks, the widow and orphan behaviour, and where a drawing falls
  relative to its caption on paper are **unverified**. What was verified is what the print rules do
  to the layout, by applying them on screen.
- **The deployment.** Nothing here has been served over the deployment's own network, and no
  production build exists. That is [#7](https://github.com/duckycodess/what-it-takes-to-be-happy/issues/7)'s.

## What the rewrite integration checked, and how

Checked on 11 October 2026, after [the approved 45-scene script](redesign/approved-scene-script.md)
was transferred into the website and all nineteen asset handoffs were consumed. Everything below
was run in this working environment; what could not be run here is named at the end rather than
left out.

### Automated

`npm run check` passes: **187 tests, 0 failures, 0 skipped** — Chrome is installed here, so the
whole browser suite ran rather than skipping. It takes about five minutes, most of it spent
rendering the 45.7 MB single-file export several times over.

`node src/tools/transfer.js --check` reports the content document identical to a rebuild from the
approved script, whose SHA-256 is
`a9bd21f3f653a7b177f754cb3d26078227fde34eb130c1a7dce8265eb8f0c97f`. `node src/tools/validate.js`
reports `8 chapter(s), 45 scene(s), 26 source(s), 20 generated asset(s), 4137 main-path words`.
`./tools/count-main-path.sh` recomputes the same 4,137 words — about 17 to 21 minutes at 250 and 200
words a minute, which is the order of magnitude the owner's handoff quotes and which **no reader is
shown**. `./tools/check-storyboard.sh` passes; it is now scoped to the superseded storyboard's own
corpus, because a storyboard check that reached into the rewrite would report the rewrite as a
storyboard fault.

`npm run build` writes `dist/` twice to byte-identical output: 21.3 MB hosted, of which the first
page is 66 KB of HTML plus one eagerly loaded illustration, and a 45.7 MB `dist/offline.html` that
inlines every drawing as base64. That file is retained tooling. Its size is reported rather than
treated as evidence of anything; it is the reason the hosted site links the same files instead.

### Looked at, in a real browser

Headless Chrome on Windows, driven from WSL, against the built hosted site — `index.html` and
`sources.html` with their stylesheet, script, both fonts and all 22 selected PNGs beside them at the
paths they are linked at, so every drawing and both faces are fetched over real requests. All
twenty-two browser tests ran; none skipped.

- **The phone journey at 375px**: the landing shows the landing; Begin, Next, chapter shortcuts, the
  continuous view and the way back all behave; a scene arrives at the top of the window; every
  visible control measures at least 44 CSS pixels tall.
- **Reflow at 360px**, measured on the landing, on each of the 45 scenes in turn, in continuous
  reading, and on the register, where the longest unbroken runs are: no horizontal overflow
  anywhere.
- **Focus**: moving to a scene is painted, not only announced — `outline-style: solid` with a
  non-zero width on the scene Begin opened, on the scene Next moved to, on the scene a chapter link
  jumped to, and on the register entry a citation landed on. Arrow keys walk the scenes. The skip
  link moves focus to the essay and leaves the reader on their scene.
- **Every selected drawing loads** at its inspected dimensions, and every name is browser text over
  its own head, inside the image, unclipped and not overlapping another name, checked at 375px and
  1200px. A prop label sits at its own anchor.
- **Both optional comparisons** switch between two drawn states: `aria-pressed` follows, no
  paragraph disappears, Next stays available, the control is a native button in the tab order, and
  the unshown drawing is fetched only when a reader asks for it.
- **Citation returns at the first, a middle and the final citing scene**: the link carries the scene
  and the reading mode, the entry it names is on screen and ringed, the return control is the
  approved "Back to reading", and following it comes back to the scene that was left. Continuous
  reading restores all 45 scenes.
- **The real face**: the browser fetched `assets/fonts/FuturaHandwritten.ttf`, reported one
  `FontFace` for `Futura Handwritten` with `status: "loaded"` and `display: "swap"`, and the same
  sentence measures the project typeface's width rather than the fallback's — so the essay is drawn
  with it, not merely told to use it. The rules the browser parsed ask for it from this site, with
  no `local()` and no third party. The prose holds its measure at both widths.
- **Reduced motion**: with `--force-prefers-reduced-motion=reduce` the browser reported the
  preference, nothing on the page has an animation name, and the drawings are simply there. There is
  no entrance to suppress.

#### Two things that needed new machinery

**A reader with no scripting.** `--blink-settings=scriptEnabled=false` turns scripting off but also
stops `--dump-dom` producing anything, and `--disable-javascript` is ignored by current builds. The
page is now loaded in a sandboxed frame instead, which denies it scripting while letting the host
read its document: no `js` class, no view ever applied, all 45 scenes and all eight chapter titles
visible, the script-only controls not shown, both states of both comparisons simply present, the
register an ordinary link, and 20,000+ characters of readable text.

**Print.** Emulating the print medium needs a DevTools connection, which a Windows browser driven
from WSL cannot be given. So the page is printed for real: Chrome prints the hosted essay to PDF
with the print stylesheet applied, and the page count is read from the file. The essay prints to
20+ pages and the register to 3+. That rules out the failure the print rules exist to prevent — a
printed page carrying only whichever scene was on screen — without claiming the pagination has been
looked at.

### What this found

Four defects, all fixed in this change, none of which any earlier assertion had caught:

1. **The reader test suite could not report its own results.** A focus assertion compared
   `document.activeElement` to `document.documentElement`; the fixture started it as `null`, and
   formatting the failed comparison expanded a cyclic DOM until the process exhausted 3.5 GB. The
   fixture now answers as a browser does, and focus is read as a short name instead of an element.
2. **`Read again` and `Next` were never hidden.** `.button { display: inline-block }` is an author
   rule and beats the browser's own `[hidden] { display: none }` whatever its specificity, so both
   were on screen for the whole essay.
3. **Focus moved invisibly.** `[tabindex="-1"]:focus { outline: none }` removed the ring from
   exactly the elements the script focuses.
4. **The controls were 39px tall on a phone**, under the 44px a fingertip reliably hits.

A fifth was in the browser harness itself: its driver was injected as an inline script at the end of
the body, which runs *during parsing* and therefore before the page's own deferred script. Every
unframed measurement was being taken from a page whose reader script had not run — which is why an
assertion that a deep link takes no focus had been passing. The driver now waits for `load`, and
that assertion was corrected to what a browser actually does: it focuses the fragment's target
itself, because a scene is focusable so the script can send a reader to it.

### What the exact-head review found

An automated review of the pushed head, plus an independent reviewer, raised four further
defects. All are fixed, each with a regression test, and all four were things assertions had
agreed with rather than caught.

1. **The pair layout was not a pair.** `.art-view` is `display: contents`, so the four items —
   image, label, image, label — were auto-placed in DOM order and the first label took the cell the
   second drawing was meant for. All four `pair` scenes rendered as one column of drawings with a
   caption beside each, on screen and on paper. Measured in Chrome at 1200px before the fix: the
   drawings at `top: 212` and `top: 476`, the first label at `left: 596` beside the first drawing.
   Each item now has an explicit cell. Measured after: both drawings at `top: 212`, `left: 200` and
   `left: 596`, each label directly under its own drawing — and the same with the print rules
   rendered, checked by rewriting the print block to `@media all` and measuring it.
2. **The landing offered reading controls.** `Read continuously` and `Print` sat in the fixed bar
   before Begin had been pressed, so a first-time visitor could switch view or print the essay
   without meeting it. The approved landing is the title, the opening drawing, Begin and Sources &
   Credits. Both controls are now hidden in the landing view and return when there is something to
   read. Sources & Credits stays, because it is on that approved list.
3. **The shared Sources & Credits control discarded the reader's place.** Only numbered citations
   carried `from` and `view`, so following the shared control left `Back to reading` pointed at a
   bare `index.html`. That is worst at `s132`, which cites nothing and where the shared control is
   the only route to the register. The control now carries the scene and the reading mode exactly as
   a citation does. The landing's own copy is deliberately left bare — nothing has been read yet —
   and the single-file export is left alone, because its register is in the same document.
4. **A count was wrong.** Twenty assets supply **22** selected PNGs, not 21: `A16` and `A18` each
   carry two cutouts. Corrected in the renderer, the build, the audit and this document.

One nit was taken as well: a citation's visible label and accessible name are now read from that
source's own register entry rather than composed again in the renderer. The validator already
requires the two to agree with the number, so the markup is unchanged and the approved copy has one
origin instead of two.

### Not checked, and by what

- **A real phone and a real desktop browser.** Headless Chrome at a 360-pixel layout viewport is not
  a device: it says nothing about touch accuracy, a software keyboard, an address bar that grows and
  shrinks, or how the page feels in the hand.
- **A screen reader.** The structure is there — one accessible name per scene, semantic controls,
  `aria-pressed` on the comparisons, one named landmark rather than two with the same name — but no
  assistive technology has read it.
- **Print pagination, as pages.** The page count was read from a PDF; nobody has looked at where the
  breaks fall or whether a drawing is orphaned from the sentence it belongs to.
- **Contrast as perceived**, rather than computed from the declared tokens.
- **The deployment, as a deployment.** *(Superseded on 11 October 2026: the reviewed head was
  released and tested on its deployed URLs a few hours after this was written. What that release
  checked is under [what the hosted release
  checked](#what-the-hosted-release-checked-and-how) below, and the paragraphs here record what was
  true at the time of this integration.)* Vercel builds a **Preview** for each pushed commit on this
  branch, and one exists for the reviewed head with a `success` status. It was **not**
  browser-validated: the preview URL is behind the project's access protection and answers an
  anonymous request with a Vercel login redirect, so nothing was exercised against it.

  The repository has two environments, `Preview` and `production`. **One production deployment
  record exists** — id `6978921582`, for commit `6423ece` ("chore: disable commit and pull request
  attribution"), created 2026-10-10T09:32:17Z — and it carries **zero statuses**: nothing ever
  reported success, failure, or an environment URL for it. So there is a production deployment
  *record*, and there is no production deployment anyone has seen work. No production URL has been
  verified, and none is served from this branch's work.

  Everything checked above was checked against the locally built hosted tree, opened through
  `file://` after being written to a directory — Chrome fetches the fonts and the artwork over real
  requests either way, but it is not the deployment's own network. A Windows browser driven from
  WSL cannot reach a loopback port inside it, so serving the tree to it was not available; what the
  preview server returns over real HTTP is covered in `test/build.test.js`. Release verification
  against a deployed URL is [#7](https://github.com/duckycodess/what-it-takes-to-be-happy/issues/7)'s,
  and nothing here anticipates it.
- **Anything about the approved prose itself**, which is the owner's to review and was approved
  before this integration began.

`node ~/.claude/skills/impeccable/scripts/detect.mjs` over the runtime files reports no findings on
this revision.

Relative links were checked across the **active** documents in `docs/`. The check deliberately stops
at `docs/redesign/`, which holds the immutable approved handoff: that material is imported
unaltered, and `redesign-scene-blueprint.md` records six targets that cannot resolve here — five
absolute paths on the authoring machine where the opening art was inspected, and one link to the
script under the name it was written at before it was imported as `approved-scene-script.md`. Those
are an accurate record of where that work was done. Repairing them would edit an immutable handoff,
so they are left exactly as delivered and excluded from the check rather than silently counted as
passing.

No linter or type checker is configured, so none was run; `npm test` runs Node's parser over every
source file instead.

## What the hosted release checked, and how

Run on 11 October 2026 by the supervising chat, against the deployed site rather than a local tree.
[Delivery](delivery.md#the-released-site--11-october-2026) holds the full record — URLs, deployment
ids, the project settings read back, and where the evidence files live. In short:

- **Public production, unauthenticated**: all 29 published files fetched over HTTPS and compared by
  SHA-256 against the reviewed build; all 29 match. `/offline.html` returns 404. That digest check
  covers the published tree and nothing else. On the protected preview the same fetch gives 27
  digest matches: its access protection injects 163 bytes into each HTML response, so the two pages
  were checked by confirming the reviewed source HTML is intact around that injection instead.
- **Windows Chrome 154 at actual 360 and 1280 CSS-pixel viewports**, on production and on the tested
  preview: landing, Begin, Next, Back, Read again; all eight chapter jumps; all 45 scenes read
  continuously; reading mode carried in the address; Sources & Credits returning to the scene *and*
  the mode; all 22 unique drawings loaded; one `FontFace` for `Futura Handwritten` reported
  `loaded`; stylesheet and script fetched over the deployment's own requests; both comparison
  states.
- **Print, from the deployment**: a 45-page PDF carrying every one of the 45 scene titles and all
  147 approved reader text parts. Pages 1, 23 and 45 of the preview's PDF were looked at.

What it does **not** cover, unchanged from the integration above: a physical phone, any engine other
than Chrome, a physical printer, and a screen reader. The preview was reached with short-lived
same-project authentication; no credential is recorded in this repository.

That release is the revision `67f571d`, not this branch's head.

## What the output cleanup checked, and how

Checked on 11 October 2026, after `npm run build` stopped writing `dist/offline.html` into the
publish directory.

`npm run check` passes: **211 tests, 0 failures, 0 skipped** — Chrome is installed here, so the
whole browser suite ran. `node src/tools/transfer.js --check` reports the content document identical
to a rebuild from the approved script, and `node src/tools/validate.js` reports the same
`8 chapter(s), 45 scene(s), 26 source(s), 20 generated asset(s), 4137 main-path words` as before.
No content, renderer or stylesheet file was touched.

What the three new packaging checks assert. The first two fail on the previous build; the third
pins behaviour that was already correct — no hosted page has ever linked the export — so that a
later change cannot quietly start offering a download the deployment does not serve:

- A normal build publishes the hosted site and **nothing else**: no `offline.html` in the tree, no
  line reporting one written, and the hosted files, both fonts, the bundled licence and the
  drawings all present. It also asserts the build still reports the export as *audited but not
  published*, because the audits are the reason the export is rendered at all.
- An explicit `npm run export:offline` adds **exactly one** file to `dist/` and changes no other
  byte in it, and a following `npm run build` takes that file back out and leaves a tree identical
  to the one it published before. That is what makes "only a normal build's output is deployable"
  something the commands enforce rather than something a person has to remember.
- Neither hosted page mentions `offline.html`, so no reader is offered a download the deployment
  does not serve. The preview server — `dist/` served exactly as a static host would — now answers
  `/offline.html` with a 404 after a normal build, which is the same answer the deployed site gives.

Run by hand as well, because the assertions above are about the build's own output rather than about
what a deploy would carry: a normal build, then an export, then a normal build again, watching the
file appear and disappear; and the 29 published files compared by SHA-256 against the digests
recorded for the production deployment. **All 29 match**, which is the evidence that this change
removes an output without altering the website.

### Not checked, and by what

- **The deployment, from this head.** Nothing built here has been deployed. Automatic production
  builds are still held, and a push may create a *preview*, which is neither production nor
  evidence that production moved.

  **No check here can release that hold.** Since 11 October 2026 every new revision — this one and
  the separately queued readability revision
  [#17](https://github.com/duckycodess/what-it-takes-to-be-happy/issues/17), which neither depends
  on nor blocks it — is **preview-only** until the owner approves the reading experience's
  readability and flow. A reviewed merge is not production-release approval. Production stays at
  `67f571d`, the hold and the project settings stay as they are, and this document will record a
  promotion when one actually happens rather than in advance.
- **Everything the release above could not reach**: a physical phone, another browser engine, a
  physical printer, a screen reader.

## Scenarios for the finished essay

## Argument and source coverage

- Read the complete essay without animation or optional detail. It answers definition, constituents, present-society attainability, and possible change.
- Check all six shared questions and all distinct current perspectives against the content plan and subsequent deltas.
- Confirm the strongest relevant disagreements remain visible and the ending acknowledges unresolved questions.
- Check personal reflection for Koj, TJ, and Vier against supplied or member-endorsed material; invented friends do not become member biography.
- Inspect a source-backed claim in every chapter: its linked source supports that particular statement, the relevant limitation is visible, and the source label is readable on the page without following the link.
- Review income findings, local samples, anecdotal accounts, health-versus-happiness outcomes, and structural mechanisms for the limitations listed in the research register.
- Concepts are explained, applied, and questioned rather than named as decoration.

## Reader behavior

- Begin, Next, Back, first/last boundaries, and chapter shortcuts work in sensible reading order.
- Optional comparison/reveal states do not gate Next or hide the sole explanation of an essential view.
- Opening and closing source/detail surfaces preserve the current scene and return focus to the triggering control.
- Full reading and presentation modes contain the same essential prose, dialogue, findings, caveats, citations, and conclusion.
- Print output contains the complete argument and usable source labels.
- The project typeface, the artwork, the stylesheet, and the browser script all load on the deployed page.

## Artwork and accessibility

- Original character identities and names remain readable on desktop and phone. Emotional changes correspond to the explanation.
- Check a narrow phone layout and a wide desktop layout, including long dialogue and source labels; content reflows without becoming tiny.
- Complete the main path and supplementary surfaces with keyboard alone; verify visible focus and logical reading order.
- With reduced motion or a static scene, the same point remains understandable through text and meaningful visual descriptions.
- Text contrast, controls, labels, and alternate descriptions allow the essay to be read without depending on color or animation alone.

## Hosted release

The release gate is the deployed site. [Delivery](delivery.md#hosted-release-checklist) holds the checklist; these are the scenarios behind it.

- Deploy the reviewed revision, then confirm both the preview and the production URL serve that exact commit. Record the URLs verbatim.
- Exercise all six chapters, navigation, typography and artwork, supplementary details, reading mode, and printing on the deployed site, on a real phone and a real desktop browser.
- Confirm no essential text depends on a third-party request: the font, the artwork, the stylesheet, and the script come from the deployment itself.
- Confirm every source's evidence level, limitation, and caveat is visible on the deployed page.
- Record what is still limited. An unverified font permission, an untested device, or an unresolved submission route is a stated limitation, not an omission.

Offline reading, network-disabled `file://` sessions, and hosted/offline parity are **not** gates. The packaging audits that the single-file output exercises still run under `npm test`, and they are useful there — they prove every required resource is committed and inlined — but no release waits on them.

Run focused automated contract/navigation checks and concrete manual visual checks on the deployed site where appropriate. Broaden testing when failures or new changes justify it.
