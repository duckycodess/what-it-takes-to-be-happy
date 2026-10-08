# Verification plan

These are concrete acceptance scenarios for the finished essay. Avoid tests that merely mirror rendering code.

## What the foundation already checks

`npm run check` runs the content validation, the automated suite, and the build. The suite covers the contract rules against a deliberately broken fixture, reordering beats by stable identifier, the renderer's coverage of essential content, the absence of authoring provenance in any output, the packaging audits, build determinism, and the preview server. The build itself refuses to write an output that drops essential content or an offline file that depends on anything it does not carry.

Checked by hand on 9 October 2026 against `dist/offline.html` opened through a `file://` URL in headless Chrome with name resolution disabled and the proxy pointed at a dead port: the landing, Begin, Next, Back, arrow keys, chapter shortcuts, the current-chapter marker, the reading view, the optional panels opening and closing, focus moving to the current beat, the embedded illustration, and the embedded font. Printing from inside a single beat still produced the complete essay. The layout reflows without horizontal overflow at a 360-pixel-wide document and composes into two columns on a wide screen.

Not yet checked, and still owned by the later packages: a real phone and a real desktop browser, a screen reader, contrast measurement, and anything about the finished prose.

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

**No browser was available in this environment.** The entrance animation, the reduced-motion
override, the container query that sizes label type, and the print rules were verified as rules in
the built stylesheet and as state in the markup, not as rendered behaviour. Confirming them in a
real phone and desktop browser — including that rapid Next/Back settles every drawing correctly —
remains open, and belongs with the reader and release checks below.

## Scenarios for the finished essay

## Argument and source coverage

- Read the complete essay without animation or optional detail. It answers definition, constituents, present-society attainability, and possible change.
- Check all six shared questions and all distinct current perspectives against the content plan and subsequent deltas.
- Confirm the strongest relevant disagreements remain visible and the ending acknowledges unresolved questions.
- Check personal reflection for Koj, TJ, and Vier against supplied or member-endorsed material; invented friends do not become member biography.
- Inspect a source-backed claim in every chapter: its linked source supports that particular statement, the relevant limitation is visible, and the source label remains available offline.
- Review income findings, local samples, anecdotal accounts, health-versus-happiness outcomes, and structural mechanisms for the limitations listed in the research register.
- Concepts are explained, applied, and questioned rather than named as decoration.

## Reader behavior

- Begin, Next, Back, first/last boundaries, and chapter shortcuts work in sensible reading order.
- Optional comparison/reveal states do not gate Next or hide the sole explanation of an essential view.
- Opening and closing source/detail surfaces preserve the current scene and return focus to the triggering control.
- Full reading and presentation modes contain the same essential prose, dialogue, findings, caveats, citations, and conclusion.
- Print output contains the complete argument and usable source labels.

## Artwork and accessibility

- Original character identities and names remain readable on desktop and phone. Emotional changes correspond to the explanation.
- Check a narrow phone layout and a wide desktop layout, including long dialogue and source labels; content reflows without becoming tiny.
- Complete the main path and supplementary surfaces with keyboard alone; verify visible focus and logical reading order.
- With reduced motion or a static scene, the same point remains understandable through text and meaningful visual descriptions.
- Text contrast, controls, labels, and alternate descriptions allow the essay to be read without depending on color or animation alone.

## Offline and hosted outputs

- Export the reviewed revision, disconnect networking, and open the HTML through a local-file browser URL in a clean browser session.
- Exercise all six chapters, navigation, embedded typography/art, supplementary details, reading mode, and printing without essential network requests.
- Compare hosted and offline outputs for the same content revision, complete conclusion, and sources.
- Verify the Vercel preview and final production URL on phone and desktop. Record the intended team/project, environment, commit, and observed result.

Run focused automated contract/navigation checks and concrete manual visual/offline checks where appropriate. Broaden testing when failures or new changes justify it.
