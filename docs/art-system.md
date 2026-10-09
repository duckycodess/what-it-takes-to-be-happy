# The drawing system

How the essay's illustrations are made, what a scene can ask for, and what is not drawn yet.

The artwork is authored geometry in [`src/art/`](../src/art/), generated into the markup at build
time as inline SVG. There is no image file to fetch, no drawing library, no font inside a picture,
and no generation service anywhere near the reader: every output contains every line of every
drawing, so the hosted page needs no request to show one. See [the asset workflow](asset-workflow.md) for where the
designs came from and [art direction](art-direction.md) for the look they follow.

## What this is, and what it is not

- It **is** a small set of reusable parts — identities, expressions, postures — and a catalogue of
  explanatory motifs that scenes point at by identifier.
- It is **not** 87 bespoke illustrations. Thirty-four of the storyboard's 87 beats have a motif
  today; the other 53 declare that they have none and are carried by their written description,
  which is also the text alternative, the print illustration, and the reduced-motion equivalent.
  [`src/art/storyboard-map.js`](../src/art/storyboard-map.js) records the decision for every beat,
  and `npm test` fails if a beat is missing from it.
- The contributors' drawn appearances are **provisional stand-ins**, not approved likenesses. They
  came from the generated concept sheet and can change at any time without any identifier changing.

## Four axes

A figure on screen is four separable choices. Nothing else about a person is drawn.

| Axis | Owns | Lives in |
| --- | --- | --- |
| Identity | The hair shape that makes someone recognisable across every state | `FIGURES` in [`figures.js`](../src/art/figures.js) |
| Expression | The face: eyes, brows, mouth, and the head's tilt | `EXPRESSIONS` in the same file |
| Pose | The limbs, and where the hands are so a prop can be held | `POSES` in the same file |
| Placement | Where the figure stands, how large, and which way it faces | the composition |

Expression and pose are independent of identity on purpose. No member is assigned a standing mood,
and any figure can be drawn in any state.

## Figures

| `artId` | Drawn as | Role |
| --- | --- | --- |
| `tj` | A small forward tuft at the crown | member |
| `koj` | A single curl turning off the right of the crown | member |
| `vier` | An angular tuft drawn as a short zigzag | member |
| `bob` | A plain round head with no anchor | friend |
| `nessa` | Hair framing the face as two arcs outside the head | friend |
| `dino` | Three short upright bristles across a flat crown | friend |
| `ivy` | A short tied tail of hair off the left side | friend |
| `marco` | A cropped cap of hair drawn as one arc above the crown | friend |
| `unnamed` | A dashed outline with no anchor and no nametag | scenery |

The contract enforces the boundary rather than trusting it: a `member` cast entry drawn as a friend
figure, a `friend` drawn as a contributor, or anyone drawn as `unnamed` is a validation error
(`ART_ROLE_MISMATCH`). `unnamed` exists so a drawing can show "somebody, anybody" — the figures
handed a template in `art-handed-template`, the person being cared for in
`art-invitation-conditions` — without inventing a person or borrowing a real one.

## Expressions

| `artId` | Drawn as | Storyboard vocabulary |
| --- | --- | --- |
| `joy` | Lifted closed eyes, open smile, restrained cheeks | `joy` |
| `curiosity` | Round eyes, one raised brow, small open mouth, head leaning in | `curiosity` |
| `sadness` | Brows down at the outer ends, mouth turned down | `sadness` |
| `frustration` | Brows down at the inner ends, tight flat mouth, tension marks | `frustration` |
| `fatigue` | Heavy half-lids, flat mouth, head sunk | `fatigue` |
| `reflection` | Eyes aside, one brow raised, mouth barely moved | `reflection` |
| `uncertainty` | Mismatched eyes, one brow up and one down, a wavy mouth | *(no editorial name)* |

[The cast registry](cast.md) defines six editorial states, and the storyboard uses only those six.
`uncertainty` is a seventh **drawable** state, not a seventh editorial one. The brief asks the
drawings to carry not-knowing, and `reflection` is settled consideration rather than being caught
between two answers — drawing them the same way would have quietly made every unsettled beat look
decided. A scene reaches it through a cast expression whose `artId` is `uncertainty`; the
storyboard's six-state vocabulary and `tools/check-storyboard.sh` are unaffected.

Nothing in the system means anything by colour. The cheeks on `joy` are emphasis; remove all colour
and every state still reads.

## Postures

`stand`, `ease`, `walk`, `reach`, `celebrate`, `carry`, `sit` (on the ground, legs out), `slump`,
`point`. A composition
chooses the posture, because the posture belongs to the situation rather than to the person. Each
one declares where its hands are, so a composition can put a load, a template, or a prop into them.

## Compositions

A composition is a motif that explains something, reusable across beats that make the same move. It
declares how many figures it can place and whether it has a **condition layer** — a second layer
that shows what was under the situation all along.

| `artId` | What it shows | Figures | Condition layer |
| --- | --- | --- | --- |
| `art-figure-row` | The cast in the open, nothing else in frame | 1–8 | — |
| `art-opening-question` | The question, with people either side of it | 0–5 | Different answer strokes under each |
| `art-apart-together` | Separate footings, separate voices | 1–4 | The unnamed dashed figure |
| `art-three-readings` | One moment, a path to each reader of it | 1–3 | The paths, each ending in its own shape |
| `art-life-line` | A life as a marked length, not a moment | 0–2 | Stretches of it fenced off |
| `art-two-instruments` | A dial and a ruler aimed at one person | 0–2 | The second instrument and its reading |
| `art-balance` | Two unlike things weighed against each other, and the platform a second figure stands on to do the ranking | 0–2 | The arrow from that platform to the pans |
| `art-two-climbs` | A climb entered beside a climb imposed | 1–2 | The load, in the hands carrying it — or, with one figure, coming down onto the second climb |
| `art-rest-and-the-frame` | Rest with nothing attached to it | 1–2 | The measuring frame somebody draws around that rest |
| `art-handed-template` | The same shape handed to everybody | 1–2 | One of them set down |
| `art-one-screen-two-things` | Contact and ranking on one screen | 1–2 | The ladder inside it |
| `art-invitation-conditions` | An invitation, and the evening it assumed | 1–3 | Travel, tasks, and care, below the line |
| `art-accumulating-care` | Small repeated gestures adding up | 1–3 | What each one cost |
| `art-door-distance` | A door that exists, at different distances | 1–5 | The barrier and the measured gap |
| `art-joy-and-conditions` | A good afternoon, enjoyed | 1–3 | The supports underneath it |
| `art-spread-and-average` | An average drawn over a distribution | 0–2 | The tail it passes over |

Two states settle a composition:

- `situation` — the base layer alone: the scene as it first appears.
- `revealed` — the base layer with its condition layer.

That pair is how a beat returns to an earlier scene and shows what was always inside it: `s057` and
`s058` are the same invitation, `s016` and `s075` the same afternoon, `s019` and `s026` the same
rest, in the two states. Asking a composition for a layer it does not have is a validation error
(`ART_STATE_UNAVAILABLE`), and so is handing it more figures than it can place
(`ART_FIGURE_COUNT`).

**`revealed` only ever adds.** The condition layer arrives on top of a situation that stays exactly
as it was drawn; it never redraws or contradicts it. A test asserts that for every composition at
every figure count, and it is what lets one written description be true of a drawing whether or not
the layer has animated in — and what makes a beat that *removes* something, like the frame around
rest in `s026`, the same drawing in the other state rather than a second drawing that has to agree
with the first. The scenery a figure stands on belongs to the situation for the same reason: a
second test fails if any composition raises a figure onto something only the condition layer draws.

## How a scene asks for a drawing

Three identifiers in [`content/content.json`](../content/content.json), all validated against the
catalogues above. See [the content contract](content-contract.md) for the fields themselves.

```json
{
  "id": "cast-koj", "role": "member", "displayName": "Koj", "artId": "koj",
  "expressions": [{ "id": "ex-tired", "label": "Fatigue", "artId": "fatigue" }]
}
```

```json
"visual": {
  "description": "The invitation still floats above the line ...",
  "artId": "art-invitation-conditions",
  "artState": "revealed",
  "cast": [{ "characterId": "cast-koj", "expressionId": "ex-tired" }]
}
```

`"artId": null` with `"artState": null` is the declared fallback: the beat renders its figures'
names and its description, and says so in the markup with `data-art="none"`.

The figures are placed in the scene's own cast order, so moving a name up the list moves that figure
to the composition's first slot.

### The landing

The opening illustration is authored the same way, in `project.visual`, with the same fields and the
same validation:

```json
"project": {
  "title": "…", "question": "…", "summary": "…", "readingTimeEstimate": null,
  "visual": {
    "description": "Four stickmen stand to either side of a large question mark …",
    "artId": "art-opening-question",
    "artState": "revealed",
    "cast": [
      { "characterId": "cast-tj", "expressionId": "ex-joy" },
      { "characterId": "cast-koj", "expressionId": "ex-tired" }
    ]
  }
}
```

The renderer contains no illustration of its own, including here. Who stands around the question and
what each of them is feeling are editorial decisions — the landing is the one place a reader could
mistake this essay for an argument that happiness is one feeling everybody should be having — so an
opening that picked its own cast would be inventing one, and a caption written in the renderer would
be prose nobody could edit. The build audit requires the landing's description in both outputs, like
any other essential text.

## What reaches the page

```html
<figure class="scene-visual">
  <div class="scene-visual-frame" data-art="art-invitation-conditions" data-art-state="revealed">
    <svg class="scene-art" viewBox="0 0 480 300" aria-hidden="true"> … </svg>
    <ul class="art-labels">
      <li class="art-label" data-role="member" style="--art-x:31.25%;--art-y:43.87%">
        <span class="nametag">Koj</span><span class="expression">Fatigue</span>
      </li>
    </ul>
  </div>
  <figcaption>The invitation still floats above the line …</figcaption>
</figure>
```

- **Names are browser text**, positioned over the drawing from an anchor the composition computed
  above that figure's head. They stay selectable, searchable, and translatable, they grow with the
  reader's own type size, and no drawing contains lettering — a build check rejects `<text>` inside
  any drawing.
- The drawing is `aria-hidden`; the caption is the description, so nothing is announced twice.
- On a narrow frame the state word is removed from sight but kept in the document, because the
  names would otherwise collide; the caption states the same thing for every reader.
- The frame is a container query context, so label type is sized against the drawing's own width.
  A phone gets the same drawing reflowed, not a shrunken desktop stage.

## Motion

The settled state is what the markup contains. The condition layer is already there, already
visible, in print, in a browser with no scripting, in every output, and for a reader who has
asked for reduced motion.

The stylesheet adds one entrance: when a beat is the current one, its condition layer fades and
rises into place over 600ms. It is an addition to a drawing that is already correct, which is what
makes Next and Back safe — the state the animation settles into is the state the markup already
had, so moving between beats quickly cannot strand a drawing half-explained. Under
`prefers-reduced-motion: reduce` the entrance is removed entirely and the same drawing remains.

No script is involved in the artwork. The browser script only chooses which beat is on screen.

## Packaging

Every drawing is inline SVG with no `<image>`, no `<use>`, no identifier, no `url(...)`, no font,
and no link. `auditInlineArtwork` in [`src/build/verify.js`](../src/build/verify.js) enforces all of
that against both outputs on every build, and `src/art/` emits no element identifiers at all, so the
same motif can appear in twenty beats of one document without colliding with itself.

## Provenance

| What | Where it came from |
| --- | --- |
| The identities | Refined from the generated concept sheet, `assets/concepts/stickman-character-sheet-v1.png`, with the exact prompts beside it |
| Every line in the essay | Authored geometry in `src/art/`, hand-written for this project |
| The reference style | [The Evolution of Trust](https://ncase.me/trust/) as a style and presentation reference only; no asset of its is used |
| The concept sheet in the page | Shown in the colophon as provenance, with its own caption saying it is provisional |

The concept sheet is a flattened raster study. It supplied the look, not the parts: no crop of it is
used as a sprite, and it is not an animation rig. The build still embeds it, which is also what
proves a real binary survives the packaging path.

## Changing the artwork

1. **A new expression or figure** — add it to `FIGURES` or `EXPRESSIONS`, then add its identifier to
   the stable-identifier test in [`test/art.test.js`](../test/art.test.js). A new figure must declare
   its `role`, or the cast-boundary rule cannot hold.
2. **A new composition** — add it to `CATALOGUE` in `compositions.js` with its purpose, its figure
   range, and the state it settles into. Point at least one storyboard beat at it; a motif no beat
   uses fails the coverage test.
3. **A beat that gains a drawing** — change its entry in `storyboard-map.js` from a fallback to a
   motif, and set `artId`/`artState` on the scene in `content/content.json`.
4. Run `npm run check` and `./tools/check-storyboard.sh`.

Identifiers are permanent. A drawing may be redrawn; an identifier keeps pointing at the same
explanation.

## Known limitations

- Fifty-three of the 87 beats have no drawing. Each one says, in `storyboard-map.js`, what a drawing
  would have to show.
- The contributors' appearances are provisional and have not been approved by the people they
  represent.
- `art-figure-row` can place eight figures, and eight nametags across one frame is tight: on a
  narrow screen the state words are hidden and only the names remain. No other composition places
  more than five.
- A composition places figures in fixed slots. A beat that needs a genuinely new arrangement needs a
  new composition rather than an option on an existing one; that is deliberate, because an
  arrangement that can mean anything explains nothing.
