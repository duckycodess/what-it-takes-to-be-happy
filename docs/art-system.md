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
- **Eighty-six of the storyboard's 87 beats are drawn.** The eighty-seventh, `s087`, is the source
  register: a readable list rather than an illustrated situation, declared `text-only` in both
  [`src/art/storyboard-map.js`](../src/art/storyboard-map.js) and the content document, so the
  reader gets no frame there rather than an empty one. `npm test` fails if a beat is missing from
  that map.
- It is **not** 86 bespoke illustrations, and does not claim to be. Sixty-six compositions carry
  the 86 beats: fifty-one draw one beat each, and fifteen are reused by two or three beats that
  make the same move — most often one beat in `situation` and a later one in `revealed`, which is
  how a return to an earlier scene shows what was always inside it. The table below says exactly
  which beats share a motif.
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

| `artId` | What it draws | Figures | Condition layer | Beats |
| --- | --- | --- | --- | --- |
| `art-figure-row` | The cast, standing in the open | 1–8 | — | `s055` `s086` |
| `art-opening-question` | The question, with nobody settling it | 0–5 | yes | `s001` `s076` |
| `art-apart-together` | Standing apart, and the figure nobody named | 1–4 | yes | `s002` |
| `art-three-readings` | One moment, read several ways | 1–3 | yes | `s004` `s014` |
| `art-life-line` | A whole life, not one good afternoon | 0–2 | yes | `s007` `s008` `s023` |
| `art-two-instruments` | Two instruments, one person | 0–2 | yes | `s010` `s015` `s050` |
| `art-balance` | Weighing one thing against another | 0–2 | yes | `s020` `s022` |
| `art-two-climbs` | A climb entered, and a climb imposed | 1–2 | yes | `s025` |
| `art-rest-and-the-frame` | Rest, and the frame somebody draws around it | 1–2 | yes | `s019` `s026` |
| `art-handed-template` | The shape everyone is handed | 1–2 | yes | `s031` `s044` |
| `art-one-screen-two-things` | One screen, two things happening | 1–2 | yes | `s037` |
| `art-invitation-conditions` | An invitation, and what is under it | 1–3 | yes | `s057` `s058` `s059` |
| `art-accumulating-care` | Small repeated care, and where it comes from | 1–3 | yes | `s047` `s056` |
| `art-door-distance` | The same door, at different distances | 1–5 | yes | `s068` `s069` `s072` |
| `art-joy-and-conditions` | A good afternoon, with its supports drawn in | 1–3 | yes | `s016` `s075` `s085` |
| `art-spread-and-average` | The average, and the people it is drawn over | 0–2 | yes | `s065` `s080` |
| `art-three-panels` | Three ordinary hours, side by side | 1–3 | — | `s003` |
| `art-sequence-of-states` | One person, several states, one continuous line | 1–1 | — | `s005` |
| `art-list-as-objects` | A list drawn as the things it names | 1–2 | — | `s006` |
| `art-three-dials` | Three readings that need not agree | 0–2 | — | `s009` |
| `art-cleared-space` | Room to turn around, not an empty life | 1–2 | — | `s011` |
| `art-blocks-that-split` | Words that crack when you stand on them | 1–1 | yes | `s012` |
| `art-writing-the-line` | Drawing the line you are standing on | 1–1 | yes | `s013` |
| `art-same-game-two-ways` | The same game, with and without the people | 1–2 | yes | `s017` |
| `art-two-evenings` | Two evenings, one of them heavier | 1–1 | — | `s018` |
| `art-ranked-before-weighing` | The pans were set before anything was put in them | 0–1 | — | `s021` |
| `art-three-threads` | Three threads running through one ordinary thing | 1–2 | — | `s024` |
| `art-one-block-grows` | A day with one block taking the rest | 1–2 | — | `s027` |
| `art-pyramid-and-partial-fills` | The staircase, and what the paper actually says | 1–1 | yes | `s028` |
| `art-ring-of-four` | Four things in a ring, with nothing on top | 1–3 | — | `s029` |
| `art-grown-into-a-frame` | The frame that arrives later | 1–2 | yes | `s030` |
| `art-paths-erased` | Five ways out, one still drawn | 1–2 | yes | `s032` |
| `art-own-leash` | Holding your own leash | 1–1 | — | `s033` |
| `art-desire-with-a-trail` | A want, with where it came from behind it | 0–1 | — | `s034` |
| `art-four-answers` | One purchase, four different answers | 1–2 | — | `s035` |
| `art-two-columns-that-leak` | Two columns that do not hold | 1–2 | — | `s036` |
| `art-claim-against-its-size` | The headline, and the finding drawn to scale | 1–2 | — | `s038` |
| `art-shared-timeline` | One timeline, four different grounds | 1–4 | yes | `s039` |
| `art-one-burden-lifted` | One weight off, the rest where they were | 1–2 | yes | `s040` `s060` |
| `art-second-pressure` | The trouble, and the pressure added to it | 1–2 | yes | `s041` |
| `art-split-face` | Two feelings on one face | 1–1 | yes | `s042` |
| `art-set-points` | Five lines, and not all of them come back | 0–1 | — | `s043` |
| `art-equal-panels` | A milestone and an ordinary exchange, at the same size | 1–2 | — | `s045` |
| `art-quoted-panel-outside` | A panel kept outside the room | 1–2 | — | `s046` |
| `art-care-undone` | The same small acts, taken away one at a time | 1–2 | yes | `s048` |
| `art-weak-ties-scatter` | The people who are not your closest | 1–2 | yes | `s049` |
| `art-shared-table` | A table, and the league table in the corner | 0–3 | — | `s051` |
| `art-messages-one-way` | Messages travelling mostly one way | 1–2 | yes | `s052` |
| `art-overlapping-selves` | Selves whose outlines run into each other | 1–3 | yes | `s053` `s054` |
| `art-short-box-long-statement` | A short sentence, and the one that will not fit in it | 1–2 | — | `s061` |
| `art-curves-replaced` | One curve, replaced by several that behave differently | 0–1 | yes | `s062` |
| `art-one-number-four-situations` | One number, four situations | 1–4 | — | `s063` |
| `art-smile-and-bill` | A smile and an unpaid bill, both at full weight | 1–2 | — | `s064` |
| `art-pouring-twice` | The same pour, from a full container and from a nearly empty one | 1–2 | — | `s066` |
| `art-hour-moved` | An hour that moved rather than vanished | 1–3 | yes | `s067` |
| `art-connected-positions` | Positions that hold each other up | 0–3 | yes | `s070` |
| `art-self-as-enterprise` | A person with a business attached to them | 1–2 | yes | `s071` |
| `art-frame-they-had-not-noticed` | The frame around the people talking | 1–3 | yes | `s073` |
| `art-icon-over-a-gap` | An icon laid across a gap it does not cover | 1–2 | yes | `s074` |
| `art-offered-not-handed` | Set down within reach, not handed over | 1–3 | — | `s077` |
| `art-bench-no-purchase` | A bench you can sit on without buying anything | 1–4 | — | `s078` |
| `art-barrier-reduced` | The barrier made smaller, and still drawn | 1–2 | yes | `s079` |
| `art-empty-evidence-column` | The proposals, and the column that is empty | 0–2 | — | `s081` |
| `art-two-kinds-of-effort` | Two kinds of effort at the same obstacle | 1–3 | — | `s082` |
| `art-facing-pairs` | Pairs that did not close the gap | 1–4 | — | `s083` |
| `art-questions-above` | A question where a conclusion would be | 1–3 | yes | `s084` |

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

`"artId": null` with `"artState": null` needs `"artAbsence"` to say why. `pending` renders the
figures' names, the description, and a notice, marked in the markup with `data-art="none"`;
`text-only` renders no frame at all, because an empty bordered box reads as a drawing that failed
to arrive. Finished content may not contain `pending`. See [the content
contract](content-contract.md).

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
  <div class="scene-visual-frame" data-art="art-invitation-conditions" data-art-state="revealed" data-labels="over">
    <svg class="scene-art" viewBox="0 0 480 300" aria-hidden="true"> … </svg>
    <ul class="art-labels">
      <li class="art-label" data-role="member" style="--art-x:31.25%;--art-y:43.87%">
        <span class="nametag">Koj</span><span class="expression">Fatigue</span>
      </li>
    </ul>
  </div>
  <p class="figure-fiction"><span class="label">Invented figures</span> Bob, Nessa</p>
  <figcaption>The invitation still floats above the line …</figcaption>
</figure>
```

A crowded beat is the same markup with `data-labels="list"`, the `--art-x`/`--art-y` positions
dropped, and the labels in left-to-right order.

- **Names are browser text**, positioned over the drawing from an anchor the composition computed
  above that figure's head. They stay selectable, searchable, and translatable, they grow with the
  reader's own type size, and no drawing contains lettering — a build check rejects `<text>` inside
  any drawing.
- **Where they go is measured, not assumed.** The renderer compares the composition's anchors
  against a label-width budget taken from real measurements, and where a pair would collide or run
  off the edge it moves the whole set into a row under the drawing, ordered left to right. The
  frame says which it did, in `data-labels`. A browser test measures every label box on every beat
  at a phone width and a desktop width and fails on any overlap.
- **Which figures are invented is said under the drawing**, at reading size, rather than beside a
  name where it was six and a half pixels tall on a phone. The nametag still marks a contributor
  and its absence still marks an invented figure.
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

- One of the 87 beats has no drawing, and that is a decision rather than a gap: `s087` is the
  source register. The content contract will not let finished content carry a beat whose drawing is
  merely `pending`.
- The contributors' appearances are provisional and have not been approved by the people they
  represent.
- `art-figure-row` can place eight figures, and eight labels across one frame does not fit at all.
  The renderer measures that from the anchors and moves the whole set into a row under the drawing
  instead; five beats of 87 are laid out that way. No other composition places more than five.
- `art-split-face` draws the second half of a face at fixed offsets from the figure's own head, so
  it lines up only where the scene gives that figure a state the head does not tilt in. `joy` and
  `frustration` are the two, and `s042` uses `joy`.
- A composition places figures in fixed slots. A beat that needs a genuinely new arrangement needs a
  new composition rather than an option on an existing one; that is deliberate, because an
  arrangement that can mean anything explains nothing.
