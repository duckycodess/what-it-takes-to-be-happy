# Content contract

The essay's chapters, scenes, reader copy, artwork register and Sources & Credits page live in one
JSON document: [`content/content.json`](../content/content.json). The hosted site, the continuous
reading and print view, and the retained single-file output are all generated from that one
document. Since [the 9 October amendment](decisions.md#owner-amendment--9-october-2026) the hosted
site is the deliverable; one document still feeds every output.

Schema identifier: `happiness-essay-content/v3`. The machine definition is
[`src/content/schema.js`](../src/content/schema.js) and
[`src/content/validate.js`](../src/content/validate.js). This page is the editor's version of the
same rules; changing one without the other is a contract break.

Run `npm run validate` after every edit. It checks the document against the approved script and
then against the contract, prints a located, named error for each problem, and exits nonzero, so a
broken document cannot reach a build.

## What this document is, and is not

**It is a transfer, not a manuscript.** Every reader-facing sentence in it comes from
[the approved essay](editorial/full-essay-v2.md) and [ordered handoff](editorial/full-essay-handoff-v2.json), plus the explicit [polish amendment](editorial/polish-amendment.json), whose content hashes the document
records and `node src/tools/transfer.js --check` re-verifies. `src/content/transfer.js` builds the
document from those approved files; nothing is typed into `content/content.json` by hand.

That is the single most important rule here, and most of the others follow from it: **no field in
this contract asks for prose a renderer or an editor would have to write.** The earlier
`happiness-essay-content/v1` document had a project question, a summary, a reading-time estimate,
chapter openings and closings, and optional detail-panel bodies. The approved script contains no
such copy, and inventing it is exactly what this rewrite removed. Those fields are gone rather than
left empty, so that nothing can quietly fill them.

*(The v1 contract described the superseded 87-beat build. Its document shape is recorded in this
file's history and in [the storyboard](storyboard.md); nothing in the current build reads it.)*

## What is in the repository today

`content/content.json` is the **complete essay**: eight chapters, 31 parts (`s201`–`s231`) in their
authored order, 26 numbered sources, and 34 inspected generated passage assets and two separate decorative UI bitmaps. It measures 8,595 main-path
words under the rule it records. All 45 former scene addresses relocate to their corresponding new part; source identities keep their meanings.

## Document shape

```
{
  "schema":      "happiness-essay-content/v3",
  "source":      { essay: { path, sha256 }, handoff: { path, sha256 }, supersedes: { path, sha256 } },           // the approved script, by content hash
  "interface":   { ... },                    // the original fourteen interface strings plus the owner-approved Sound label
  "landing":     { title, beginLabel, beginSceneId, sourcesLabel, visual },
  "chapters":    [ ... ],
  "scenes":      [ ... ],
  "assets":      [ ... ],
  "sourcesPage": { title, intro, classNote, credits, creditItems, methodNote, returnLabel, sources },
  "relocations": [ { from, to } ],           // all former addresses
  "measure":     { words, rule }
}
```

There is no `status`, no `project`, no `cast`, no `concepts`, no `details`, no `interactions` and no
`provenance` registry. Dialogue provenance is editorial material and stays in the approved script's
own table; the reader is told, in the approved Sources & Credits copy, that the dialogue
reconstructs endorsed positions from group notes.

## Identifiers

| Thing | Rule |
| --- | --- |
| Scene | `s201`–`s231`, matching `^s\d{3}$`, unique, in authored reading order |
| Chapter | `c1`–`c8`, numbered by position, each anchored at the scene the approved script anchors it at |
| Asset | A brief reference `A01`–`A18` or `B01`–`B14`, optionally suffixed `a`/`b` for a two-state comparison |
| Asset folder | A lowercase hyphenated id under `assets/generated/` |
| Source | A register identity `R01`–`R32` from [the audit](research.md), carried in the data |

Links are by identifier. The order of the `scenes` array **is** the reading order, and the chapters
must list exactly those scenes in exactly that order: the approved sequence is the argument, so a
reordering is a change to the essay and is reported (`READING_ORDER`, `ANCHOR_MISMATCH`,
`SCENE_UNREACHABLE`, `SCENE_ASSIGNED_TWICE`, `CHAPTER_MISMATCH`). Registries with no authored order,
such as `assets`, may be stored in any order.

## A scene

```
{
  "id": "s201",
  "title": "Nothing to show for it",
  "chapterId": "c1",
  "blocks": [ { kind, speaker, parts: [ { text } | { citation } ] } ],
  "visual": { layout, views: [ { ref, image, label } ], control, afterBlock }
}
```

- A **block** is `narration` or `dialogue`. Narration has no speaker; dialogue names exactly one of
  `TJ`, `Koj`, `Vier`. A speaker label is an element in the markup, never part of the sentence.
- A **part** is either `{ text }` or `{ citation: n }`, never both. A block of citations with no
  text is rejected: a citation supports a sentence, it is not one.
- A citation renders as the approved visible label `[n]` with the accessible name `Source n`. The
  authoring marker `[^07]` never reaches the page.
- Every scene has at least one block. There is no empty scene and no scene whose point is made only
  by its title.

### The drawing

`layout` is `support`, `comparison`, `pair` or `text`.

| Layout | What it means |
| --- | --- |
| `support` | One drawing beside its approved anchor paragraph on desktop and after that paragraph on phones |
| `comparison` | Two optional states, each using its inspected image and browser labels |
| `pair` | Two drawings with the exact view labels that scene specifies, side by side on desktop and stacked in label order on a phone |
| `text` | No drawing at all. A theory- or source-heavy scene carries no decorative substitute. |

`afterBlock` is how many blocks precede the drawing; it follows the ordered handoff's explicit anchor paragraph. A placement past
the end of the scene is reported.

`control` is `null` except on the two optional comparisons (`s213`, `s219`), where it holds the two
exact approved state labels. A comparison is never a `pair`, a `pair` is never optional, and no
sentence is hidden in either state.

## An asset

```
{ ref, id, manifestGeneration, assetBranch, images: [ { path, width, height, sha256, alt } ], labels: [ ... ] }
```

Each image is a **selected, inspected** file: its recorded width, height and SHA-256 are the ones
the handoff was inspected at, and its `alt` is the exact approved alternative text. An asset may
only serve files from its own folder, and an unselected provenance output may never be published.

A `label` is browser text anchored over the image — `name` for a person, `prop` for a labelled
object — positioned at the fractions the asset was inspected at (`x`, `yDesktop`, `yPhone`, each
between 0 and 1). No lettering is baked into a bitmap.

`manifestGeneration` is `a01` or `a02-a18`. The opening asset was delivered under an older manifest
shape whose name anchors were recorded per-axis; the rest carry a `y_fraction` per label. Both are
normalised here, and both are checked — neither generation is silently skipped.

## Sources

The reader's page carries 26 entries, numbered by **preserved source identity**, not renumbered by first appearance in the revised reading order. Each
entry records:

| Field | Rule |
| --- | --- |
| `number` | Its position, which must equal its index + 1 |
| `sourceId` | Its `R` identity from [the audit](research.md), unique |
| `auditStatus` | `verified-full`, `verified-abstract` or `verified-locator` |
| `label`, `accessibleName` | `[n]` and `Source n`, matching the number |
| `citation`, `url` | The approved bibliographic line, and an `http(s)` destination |
| `note` | The access note, which states what was actually read |

There is no `not-accessed` level in this contract, because a work nobody could open may not become
a reader-facing authority. The six register entries the reader's page does not carry — five never
opened, and `R18`, which the rewritten argument no longer cites — stay audited in
[docs/research.md](research.md). `test/register.test.js` checks the page against that audit;
`test/coverage.test.js` checks it against [the coverage matrix](coverage.md).

Every citation must resolve to an entry, and every entry must support a claim: a dangling citation
and an uncited entry are both reported.

## Measurement

`measure` records a number **and the rule that produced it**, because a number alone invites
tuning. The rule is `WORD_COUNT_RULE` in `src/content/transfer.js`: reader-visible narration and
dialogue of the 31 main-path parts, whitespace-separated, excluding speaker labels, citation
markers, scene and chapter titles, interface strings and the Sources & Credits page.

`./tools/count-main-path.sh` recomputes it from the same function and fails if the document's
recorded figure has drifted. **No figure is shown to a reader**: the approved script displays no
reading-time promise, and approved copy is never trimmed to reach a number.

## What the validator checks

`npm run validate` is two commands. `node src/tools/transfer.js --check` rebuilds the document from
the approved script and refuses any difference. `node src/tools/validate.js` then checks the
contract above and prints every problem it finds, each with the path that locates it:

```
FAIL test/fixtures/invalid-content.json: 19 error(s)
  .scenes[1].blocks  EMPTY_SCENE: every scene completes its titled point
  .chapters  SCENE_UNREACHABLE: s089 is in no chapter and no reader would reach it
  .assets[0].images[0].sha256  INVALID_CHECKSUM: must be the inspected SHA-256 of the selected file
  ...
```

[`test/fixtures/invalid-content.json`](../test/fixtures/invalid-content.json) is a deliberately
broken document carrying one of each kind of fault, so the command's own reporting is tested rather
than assumed.

## Explicit polish amendment

Transfer verifies the immutable original essay and handoff hashes, then applies the separately hash-bound issue #20 amendment. Only its exact Sources removals, three rich-text credit list items, `Sound` label and fourteen originally text-only visual mappings may change. Every main-path block, speaker, scene title, chapter order, source identity and old-address relocation remains inherited verbatim. The amended Sources intro is an empty list; an unamended document still requires its original intro. Decorative UI assets are verified by the build from their own manifest and do not become passage illustrations. A second hash-bound owner amendment, `docs/editorial/reader-amendment.json`, then empties every source's `note` and the `methodNote` (only the formatted citations remain; `auditStatus` is kept) and adds `landing.credit`, the owner-supplied credit footnote. Validation accepts those empty notes only when `source.readerAmendment` records it.
