# Verification plan

These are concrete acceptance scenarios for the finished essay. Avoid tests that merely mirror rendering code.

> **Amended on 9 October 2026.** The hosted site is the deliverable and the offline HTML file is discontinued, so **no offline check below is an acceptance gate**. Where offline work is recorded, it is a record of a check that ran. [The owner amendment](decisions.md#owner-amendment--9-october-2026) is canonical.

## What the automated suite already checks

`npm run check` runs the content validation, the automated suite, and the build. The build itself refuses to write an output that drops essential content or an offline file that depends on anything it does not carry.

| Suite | What it covers |
| --- | --- |
| `test/validate.test.js`, `test/reorder.test.js`, `test/register.test.js` | Contract rules against a deliberately broken fixture, reordering beats by stable identifier, and the content document agreeing with the source register. |
| `test/render.test.js`, `test/build.test.js`, `test/cli.test.js` | Essential-content coverage, no authoring provenance in any output, the packaging audits, build determinism, and the preview server. |
| `test/reader.test.js` | The reader's journeys: authored order, both boundaries, chapter revisiting, deep links to a beat, a chapter, and a source, the browser Back button with and without the History API, focus on every move, optional panels keeping the reader's own choices, and print opening them and handing the choices back. |
| `test/browser.test.js` | The same journeys in real Chrome against the real `dist/offline.html` through a `file://` URL, plus the questions only a browser can answer. Skips with a stated reason where no browser is installed. |
| `test/styles.test.js` | That every view selector which hides something is answered by a print rule or is listed as screen apparatus; measured contrast for every declared colour; reflow, reduced motion, and the focus ring. |
| `test/dom.test.js` | The test harness itself, so the reader suite cannot pass on a harness that answers wrongly. |

### Checked in a real browser

Run on 9 October 2026, headless Chrome 154 on Windows, driven from WSL, against `dist/offline.html` opened through a `file://` URL with nothing served. All seven browser tests ran; none skipped.

- The landing shows the landing. Begin, Next, Back, the two disabled boundaries, chapter shortcuts, and the continuous view all behave, and the beat lands at the top of the window on every arrival rather than below the banner and the chapter list.
- Focus moves to the beat and is **painted**: `outline-style: solid` with a non-zero width on the focused beat. Back, Next, and the view switch all measure at least 44 CSS pixels tall.
- Clicking a disclosure keeps focus on its own summary, leaves the beat where it was, and leaves Next available. A panel the reader opened stays open across both view switches while an untouched one still follows the view.
- A source beside a beat reaches its register entry. The entry the reader followed — not merely the first one in the register — is focused, is inside the window, and carries its own ring. The return control brings them back to the beat they left.
- The skip link does what a skip link is for: focus moves to the essay, and the reader stays on the beat they were reading. So does `#chapters`, and so does a fragment this script does not recognise.
- `history.back()` works on a local file and restores how the reader was reading as well as where they were.
- No horizontal overflow at a 320-pixel layout viewport, measured on the landing, on each of the nine beats in turn, and in the continuous view with the register open. A wide window puts the illustration beside the prose and the chapter list into two columns.
- Every beat draws what the content document says it draws: an inline SVG where a composition is named, the "not made yet" notice only where none is, and in both cases the written description underneath. Every figure's name is HTML text outside the SVG, inside the frame, and above its anchor, checked on all nine beats at phone width.
- With `--force-prefers-reduced-motion`, the browser reported the preference, the condition layer's `animation-name` computed to `none`, and its opacity was already 1 — the explanation the entrance would have animated into is simply there.

A note on how the narrow width is measured: a desktop browser window will not go below roughly 500 CSS pixels, so `--window-size=360` silently lays the page out at about 490. The narrow-width tests therefore load the page in a frame of the requested width, which does give it that layout viewport. An earlier pass that missed this reported a phone width it had not actually tested.

That the browser suite drives `dist/offline.html` is a convenience, not a requirement: it is the same renderer the hosted page uses, in one file a browser can open without a server. The `file://` condition is not asked of anything now.

Not yet checked, and still owned by the later packages: a real phone and a real desktop browser, a screen reader, the project typeface actually loading, and anything about the finished prose.

## What the artwork package checked, and how


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
- Anything about the finished prose. The content document is still an explicitly non-final fixture.

`node ~/.claude/skills/impeccable/scripts/detect.mjs` over the runtime files reports two warnings, both pre-existing and both deliberate: the left rule on a dialogue line and the left rule on a "keep in mind" callout. Both are ordinary essay typography — a quotation rule and a callout rule — rather than the card accent the heuristic is looking for.

No linter or type checker is configured, so none was run; `npm test` runs Node's parser over every source file instead.

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
