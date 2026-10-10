# Asset creation and animation workflow

## Chosen starting point

Use Codex's built-in image generation to create the first character sheets and visual concepts. The user asked for drawings closely matching the visual style of [The Evolution of Trust](https://ncase.me/trust/), with original characters and the happiness essay's own scenes. The user does not need to learn drawing software or install an additional connector to begin.

The target is the reference's opening-page stickmen: large white rounded heads, compact bodies, short legs, simple expressive eyes, slightly imperfect dark outlines, generous white space, and restrained color. See [art direction](art-direction.md). Match the reference's visual language and presentation rhythm; build our own cast, compositions, and argument.

## First generated sheet

![Original TJ, Koj, Vier, and Bob concept avatars, each shown joyful, curious, sad, frustrated, tired, and reflective.](../assets/concepts/stickman-character-sheet-v1.png)

| Field | Record |
| --- | --- |
| Asset | [stickman-character-sheet-v1.png](../assets/concepts/stickman-character-sheet-v1.png) |
| Created | 8 October 2026 |
| Method | Built-in image generation, followed by one targeted built-in edit |
| Generation prompt | [Exact initial prompt](../assets/concepts/stickman-character-sheet-v1.prompt.txt) |
| Edit prompt | [Exact edit prompt](../assets/concepts/stickman-character-sheet-v1.edit-prompt.txt) |
| Dimensions | 1536 × 1024 pixels |
| SHA-256 | `ffb60fd660fe36ceb6d83fa74437850ebaa2803b6e2039f83208ad696b6dd8bc` |
| Cast | TJ, Koj, Vier, and fictional friend Bob |
| Expressions | Joy, curiosity, sadness, frustration, fatigue, calm reflection |
| Visual identity | TJ has a small tuft, Koj a curl, Vier an angular tuft, Bob a plain round head |
| Status | Initial visual concept; contributor appearances are provisional |

The edit removed Bob's hair tufts so the generic friend is distinct from TJ. The final image was inspected for consistent identities, the six expressions, readable names above heads, and the intended simple style. This is a concept sheet, not a finished animation or a separated production sprite library. Its lettering illustrates placement; the website will render names, dialogue, and headings as selectable browser text. It does not supply the website's Futura Handwritten font.

## What is built now

The production drawing system exists and is described in [the drawing system](art-system.md). In
short: eight original figures, seven drawable expressions, nine postures, and sixty-six explanatory
compositions, all authored as geometry in [`src/art/`](../src/art/) and generated into the markup as
inline SVG. The renderer places names above heads as browser text, the build refuses any drawing
that reaches outside the document or carries its own lettering, and every output contains every line
of every drawing.

Eighty-six of the storyboard's 87 beats are mapped to a composition;
[`src/art/storyboard-map.js`](../src/art/storyboard-map.js) records the decision for every beat, and
a test fails if a beat is missing from that record. The one that is not drawn, `s087`, is the source
register, and it is declared text-only rather than pending, so the reader sees a readable list
rather than an empty frame. No generated image was needed for any of it: every line is authored
geometry, so `docs/art-requests.json` has no request from this package. The concept sheet below is
where the identities came from, and it is still packaged into both outputs — in the colophon,
labelled as the provisional study it is.

The steps below are the route that was followed, and the route to follow for anything added next.

## From drawings to moving scenes

1. **Establish the look.** Start with the generated sheet and refine specific appearance details as member feedback arrives. Keep each member recognizable across emotions. Preserve prompts and versioned selected outputs in the repository.
2. **Build one representative scene.** For example, introduce a fictional friend enjoying basketball, then reveal how available time or an obligation changes the situation. Use the audited storyboard to choose the actual claim and scene. The prose carries the argument; the drawing makes its relationships visible.
3. **Prepare reusable parts.** Rebuild the chosen simple line art as scalable components where useful: head, face, body, arms, legs, and scene props. SVG is a suitable browser format for these shapes. Codex can author the SVG directly. Generated PNG concepts do not automatically become editable rigs or consistent animation frames. *Done:* `src/art/figures.js` holds the identities, faces, and postures as separate axes; `src/art/compositions.js` holds the scene motifs and their props.
4. **Animate the explanation.** Use expression swaps, small limb rotations, pose changes, movement, fades, or prop reveals tied to the current beat. Begin with browser CSS or Web Animations for simple transitions. Anime.js is an optional open-source helper if coordinated timelines warrant it. Next/Back changes the story state; essential reading never waits for an animation to finish. *Done, and deliberately small:* a composition's condition layer is already settled in the markup, and one CSS entrance fades it in when a beat becomes current. No library was needed, and because the animation settles into the state the markup already has, rapid Next/Back cannot leave a drawing half-explained. Reduced motion removes the entrance and keeps the drawing.
5. **Reuse and expand.** Extend the cast and scene vocabulary across the six shared questions. Some beats change one scene; others introduce a new composition. Static poses and descriptions retain the same meaning when motion is reduced.
6. **Package the hosted output.** Commit production assets locally and include them in Vercel's static output; the retained single-file output gets them from the same render. The reader does not call an image generator, connector, or remote design tool at runtime.

The reusable component library, the explanatory scene vocabulary, and the scene set are now built,
and what each beat is drawn with is recorded beat by beat rather than estimated.

**What has actually been looked at**, as opposed to checked by assertion: all 87 beats, as the
reader meets them. Each beat's rendered figure — the drawing, the names over or under it, the
invented-figures line, and the caption — was taken out of the built page, laid out in contact
sheets, rasterised in Chrome, and read. That is every composition at the figure count and settled
state at least one real beat gives it, because every composition is used by a beat.

**What has not:** a composition at a figure count no beat asks for. Several accept a range wider
than the essay uses, and those counts are covered by the automated checks — self-containment,
name anchors inside the frame, the condition layer adding rather than redrawing, nobody standing on
scenery only that layer draws — rather than by anyone looking at them. What the looking caught, and
what it did not cover, is recorded in [verification](verification.md).

The owner subsequently requested ongoing generated-art support while the website is built autonomously. Workers can submit requests in [art-requests.json](art-requests.json); this chat checks every 15 minutes and supplies isolated asset branches for workers to incorporate. See [the autonomous build handoff](autonomous-build.md).

## Tools and their roles

| Tool | Plain-language role | Project position |
| --- | --- | --- |
| Built-in image generation | Draws character sheets and scene concepts from our descriptions; can revise selected images | Chosen authoring starting point; already available |
| SVG authored by Codex | Describes clean scalable drawing parts that the website can move and reuse | **In use.** The whole production system is authored SVG geometry in `src/art/`, inlined at build time |
| [Inkscape](https://inkscape.org/) | Free, open-source drawing editor for manually adjusting SVG shapes | Optional behind-the-scenes editor; no user learning requirement |
| Browser CSS / Web Animations | Moves, rotates, fades, and reveals drawing parts | **In use.** One CSS entrance for a condition layer that is already settled in the markup |
| [Anime.js](https://github.com/juliangarnier/anime) | MIT-licensed library for coordinating browser and SVG animations | Not installed. The one transition the scenes need did not warrant a dependency on the page's critical path |
| [Rough.js](https://github.com/rough-stuff/rough) | MIT-licensed library that draws sketch-like shapes in SVG or Canvas | Not installed, for the same reason. The sketch quality comes from the authored line work |

Image generation is an available authoring service, not an open-source library. Open-source drawing and animation tools can support the website without requiring every authoring step to be open source. No new library or editor has been installed or selected as a mandatory dependency. Record actual versions and license notices when dependencies are added.

## What the reference used

The [reference's README](https://github.com/ncase/trust/blob/gh-pages/README.md) credits PIXI.js for graphics, Howler.js for audio, Tween.js for animation, Balloon.css for tooltips, Q for promises, MinPubSub for events, Pegasus for loading, and Futura Handwritten for typography. Its Tween.js link points to CreateJS TweenJS. This is historical reference information, not a requirement to duplicate the full stack. Our essay can use a smaller static reader because its visual explanation does not need the reference's game simulation.

The README declares Nicky Case's work CC0 and lists third-party resources separately; that declaration does not extend to Futura Handwritten, whose permission comes from its own author. Keep reference provenance, generated-asset provenance, font provenance, and actual dependency licenses explicit as those assets are added.

## MCP and connector use

MCP is a way for Codex to operate a connected tool. It is not an animation format and does not need to run inside the website. The built-in image generator already covers the initial drawing request.

Discovery surfaced optional Figma, Runway, Higgsfield, and Adobe Express integrations; none was installed for this project. No direct Inkscape or Blender integration surfaced in that search. A connector could help later if a concrete task needs a design document or video workflow, but this stickman website can be authored with built-in generation and repository assets. Pre-rendered video is not required for changing expressions and explanatory scenes.

## Asset checks and handoff

- Member names stay above heads and remain real text in the website. Generated concept-sheet labels are not production UI.
- All members can express different moods; visual identity does not assign a permanent personality or philosophical position.
- Store meaningful scene descriptions and a static final pose alongside motion behavior.
- Check linework, faces, labels, and composition at phone and desktop sizes.
- Preserve transparent backgrounds when generating production cutouts; the first contact sheet intentionally has a white background.
- Serve assets and the font from the deployment itself, never from a third party. Add a library only when its role and required license notice are recorded; a font is redistribution and needs the author's actual applicable permission.
- Keep concepts separate from integrated production assets; document what has actually been generated, drawn, animated, and tested.
- Record provisional likenesses as provisional wherever they are shown. The contributors' drawn
  appearances came from a generated study and are stand-ins, not approved portraits; the colophon
  says so to the reader and [the cast registry](cast.md) says so to whoever edits next.
