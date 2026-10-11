# Cast registry

> **HISTORICAL, as of 11 October 2026.** This registry belongs to the superseded 87-beat build,
> whose figures were drawn from geometry in `src/art/` and placed by the `artId` fields of a content
> document that no longer has them. The rewritten essay carries no cast registry: its figures come
> from twenty inspected generated illustrations, and who appears where is recorded in
> [the coverage matrix](coverage.md) and [the asset workflow](asset-workflow.md).
>
> It is kept, unaltered, because the identities below are the ones the generated drawings continue:
> TJ's tuft, Koj's curl, Vier's angular tuft, and Bob as a fictional stand-in rather than a member.
> That is provenance for the current artwork, not a specification to implement from.

Stable identifiers for every figure the storyboard can place on screen. The reader and the
artwork package both consume this registry; [the storyboard](storyboard.md) refers to these
identifiers and never to a numeric position.

Every figure below is now drawn. [The drawing system](art-system.md) holds the parts, the
compositions, and what each identifier is drawn as; `content/content.json` carries the same
identifiers in its `artId` fields, and validation rejects a cast entry that names a drawing the
artwork package cannot produce.

Identifiers are permanent. A figure can change appearance, gain expressions, or appear in new
scenes without changing its identifier. Removing a figure means removing its scenes, not reusing
its identifier for someone else.

## Roles

| Role | Meaning | Evidence boundary |
| --- | --- | --- |
| `member` | A real contributor to this project | Speaks only positions supplied in, or endorsed from, the group notes. Never given invented events, dates, hardships, or family circumstances. |
| `friend` | A generic fictional stickman introduced conversationally | Illustrates a situation so an argument becomes visible. Never cited as evidence, never a stand-in for a member's life, never presented as a real person. |
| `narrator` | Unseen voice | Introduces people and situations and connects the argument. Has no drawn body. |

## Members

| ID | Display name | Appearance anchor | Position summary (from the notes) | Notes source |
| --- | --- | --- | --- | --- |
| `narrator` | — | Not drawn | Introduces, connects, qualifies, and asks the reader to keep looking | Project brief |
| `tj` | TJ | Small forward tuft on a rounded head | A life worth returning to; defends pleasure and rest that produce nothing; separates feeling good now, life satisfaction, and becoming someone; money shrinks or widens the space happiness can occupy; owns his consumer and tech biases | `docs/notes/2026-10-08-brainstorm.md` lines 63–275 |
| `koj` | Koj | Single curl off the right of a rounded head | Happiness is closer to living well than feeling good; constant positive emotion is unrealistic; fulfillment can come from meaningful difficulty; names relationships, purpose, choice, improvement, leisure, and security | `docs/notes/2026-10-08-brainstorm.md` lines 13–61 |
| `vier` | Vier | Angular tuft, drawn as a short zigzag | Resists a one-sentence definition; happiness as a relationship with life rather than a condition; agency as the thread; society hands out templates for a good life; asks whether freedom from those templates is possible | `docs/notes/2026-10-08-brainstorm.md` lines 277–393 |

Vier's material begins at the unheaded line 277 of the Brainstorm snapshot, immediately after TJ's
"Questions I'm still sitting with" list. It carries no `##` heading of its own, so a reader
skimming heading structure can mistake it for a continuation of TJ's section. It is Vier's
contribution and is attributed to Vier throughout this project.

## Fictional friends

Every figure below is invented for this essay. Each exists to make one argument visible. None is a
measurement, a survey respondent, a member's relative, or a real person's story.

| ID | Display name | Appearance anchor | Explanatory purpose | First scene drawn in |
| --- | --- | --- | --- | --- |
| `bob` | Bob | Plain round head, no anchor | Ordinary enjoyment with no productive outcome; later, the same invitation seen with its conditions visible | `s001` |
| `nessa` | Nessa | Hair framing the face as two arcs | A free evening on the calendar that already contains commuting, chores, and care for someone else | `s059` |
| `dino` | Dino | Three upright bristles on a flat crown | Comfortable circumstances that do not deliver happiness on their own | `s038` |
| `ivy` | Ivy | A short tied tail of hair on the left | Solitude chosen rather than suffered; connection without one prescribed life arrangement | `s055` |
| `marco` | Marco | A cropped cap of hair above the crown | A service that exists on paper but is not usable from where he actually stands | `s068` |

One further figure belongs to the drawings rather than to the cast: `unnamed`, a dashed outline with
no hair and no nametag. It is how a drawing shows "somebody, anybody" — the figures handed an
identical template, the person whose care fills someone else's free evening — without inventing a
person or borrowing a real one. It is never a contributor, never a named friend, and the content
contract rejects a cast entry that tries to be drawn as it.

Only `bob` appears in [the current concept sheet](../assets/concepts/stickman-character-sheet-v1.png).
`nessa`, `dino`, `ivy`, and `marco` were storyboard requirements with no artwork; all four are now
drawn from the same parts, with their own identity anchors. The contributors' drawn appearances
remain provisional stand-ins rather than approved likenesses.

## Expression vocabulary

The existing concept sheet establishes six expression states. The storyboard uses only these names
so the artwork and the reader share one vocabulary.

| ID | Shown as |
| --- | --- |
| `joy` | Open, lifted, laughing or at ease |
| `curiosity` | Leaning in, attentive, asking |
| `sadness` | Lowered, quiet, withdrawn |
| `frustration` | Tense, blocked, pushing against something |
| `fatigue` | Slumped, heavy, out of energy |
| `reflection` | Still, considering, neither happy nor sad |

Expressions attach to a figure in a scene, not to a figure permanently. No member is assigned one
standing emotion, and no member is reduced to one philosophical position. Joy and fatigue can
appear in the same scene, on the same figure or on different ones.

### A seventh drawable state

The artwork can also draw `uncertainty`: mismatched eyes, one brow up and one down, a wavy mouth.

| ID | Shown as | Standing |
| --- | --- | --- |
| `uncertainty` | Unsettled, weighing two answers, not yet decided | Drawable, not part of the editorial vocabulary |

It is deliberately outside the six above. `reflection` is settled consideration — still, weighing,
but not caught — and drawing not-knowing the same way would have made every unsettled beat look
decided. The storyboard continues to use only the six editorial states, and
`tools/check-storyboard.sh` continues to enforce that. A scene reaches the seventh through a cast
expression whose `artId` is `uncertainty`, which is a content decision rather than a new vocabulary
word. See [the drawing system](art-system.md).

Where a scene's meaning depends on something visual, the storyboard records a static description so
the point survives reduced motion, a printed page, and a screen reader.
