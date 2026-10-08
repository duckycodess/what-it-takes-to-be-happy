# Content contract

The essay's chapters, scenes, cast, sources, concepts, optional detail, interactions, and authoring provenance live in one JSON document: [`content/content.json`](../content/content.json). The hosted site, the continuous reading and print view, and the offline file are all generated from that single document.

Schema identifier: `happiness-essay-content/v1`. The machine definition is [`src/content/schema.js`](../src/content/schema.js) and [`src/content/validate.js`](../src/content/validate.js). This page is the editor's version of the same rules; changing one without the other is a contract break.

Run `npm run validate` after every edit. It prints a located, named error for each problem and exits nonzero, so a broken document cannot reach a build.

## What is in the repository today

`content/content.json` is a **non-final fixture**. It exists so the foundation could be built, validated, rendered, packaged, and checked before the essay is written. Every chapter connection, scene, dialogue line, and illustration note in it is a structural stand-in, `status.final` is `false`, and the reader shows that notice to anyone who opens the page. The storyboard package writes the real chapters; the integration package replaces the fixture scenes.

Nothing in the fixture states a position held by TJ, Koj, or Vier, and no source in it claims more than the audit actually established. Those are contract rules, not fixture habits — see *Member positions* and *Evidence levels* below. The sources in the fixture are the real audited ones from [the register](research.md), carried at one of each evidence level.

## Document shape

```
{
  "schema":   "happiness-essay-content/v1",
  "status":   { final, label, notice },
  "project":  { title, question, summary, readingTimeEstimate },
  "chapters": [ ... ],   "scenes":       [ ... ],
  "cast":     [ ... ],   "sources":      [ ... ],
  "concepts": [ ... ],   "details":      [ ... ],
  "interactions": [ ... ],
  "provenance":   [ ... ]
}
```

Unknown fields are rejected rather than ignored, so a typo surfaces instead of silently deleting content.

### `status`

| Field | Type | Meaning |
| --- | --- | --- |
| `final` | boolean | Whether the content is the finished essay. |
| `label` | string | Short badge text, shown in the reader while `final` is `false`. |
| `notice` | string, required while `final` is `false` | The honest sentence readers see about the state of the draft. |

### `project`

| Field | Type | Meaning |
| --- | --- | --- |
| `title` | string | Working title, used as the page title and landing heading. |
| `question` | string | The large centred question on the landing view. |
| `summary` | string | The working synthesis shown on the landing view. |
| `readingTimeEstimate` | string or `null` | Stays `null` until real prose can actually be measured. |

### `chapters[]`

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | identifier | Stable chapter identifier. |
| `title` | string | Chapter name used for the chapter shortcuts. |
| `question` | string | The shared question this chapter organises. |
| `opening` | string | The connection **into** this chapter from the previous argument. |
| `closing` | string | The connection **out of** this chapter into the next. |
| `sceneIds` | identifier[] | The chapter's beats, **in reading order**. |

`opening` and `closing` are required. They are what keep six questions reading as one argument instead of six separate essays, and they are the first thing a reordering delta has to rewrite.

### `scenes[]`

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | identifier | Stable beat identifier. |
| `chapterId` | identifier | The owning chapter. Must agree with the chapter that lists this scene. |
| `title` | string | Short beat title, used in the reading view and as a heading. |
| `narration` | string[] | **Essential** narrative paragraphs. At least one must be non-empty. |
| `dialogue` | object[] | Optional spoken lines (see below). |
| `visual` | object | `description` plus `cast` appearances (see below). |
| `conceptIds` | identifier[] | Class concepts this beat explains, applies, or questions. |
| `sourceIds` | identifier[] | Sources whose labels and limits belong on this beat. |
| `limitations` | string[] | Caveats that must stay visible on the main reading path. |
| `detailIds` | identifier[] | Optional expandable detail carried by this beat. |
| `interactionIds` | identifier[] | Optional reveals attached to this beat. |

`narration` is the main reading path. It must carry the beat on its own, with dialogue, illustration, and every optional surface removed — that is exactly what the print and reduced-motion routes fall back to.

#### `scenes[].visual`

| Field | Type | Meaning |
| --- | --- | --- |
| `description` | string | What the illustration shows. This doubles as the text alternative and as the reduced-motion equivalent, so it is never optional. |
| `artId` | identifier or `null` | The composition the beat is drawn with, from [the drawing system](art-system.md). `null` declares that this beat has no drawing yet. |
| `artState` | `situation`, `revealed`, or `null` | Which layers are settled: the situation alone, or the situation with the condition layer that explains it. `null` when `artId` is `null`. |
| `cast[].characterId` | identifier | Who appears. |
| `cast[].expressionId` | identifier | Which of that character's own expressions they wear. |

The scene's cast order is the order the composition places figures in, so moving a name up the list
moves that figure to the first slot.

`artId: null` is a legitimate, declared state rather than an omission: the figures are still named
and `description` still carries the beat, exactly as it does in print and under reduced motion.
A scene may not ask a composition for a layer it does not have, or hand it more figures than it can
place; both are rejected.

#### `scenes[].dialogue[]`

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | identifier | Stable line identifier, so a provenance record or a delta can address one line. |
| `speakerId` | identifier | A cast entry. |
| `text` | string | The spoken line. |
| `stance` | `member-endorsed` or `fictional-illustration` | See *Member positions*. |
| `sourceIds` | identifier[] | Research this line draws on. Research is shared; attribution stays with the source. |
| `provenanceId` | identifier or `null` | The authoring record behind the line. |

### `cast[]`

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | identifier | Stable cast identifier. |
| `role` | `member` or `friend` | A contributor, or an invented figure used to make a situation concrete. |
| `displayName` | string | The name rendered as text above the avatar. Never baked into an image. |
| `appearance` | string | How the original drawing identifies this figure. |
| `artId` | identifier | Which figure of [the drawing system](art-system.md) draws this character. A contributor must be drawn as a contributor and an invented friend as an invented friend; the unnamed outline belongs to the drawings and to nobody in the cast. |
| `expressions[]` | `{ id, label, artId }` | The emotional states this figure can be drawn in. `artId` is the drawable state behind the label. |

Expression identifiers are scoped to their character, so every figure can have an `ex-tired`. Every other identifier in the document is globally unique.

### `sources[]`

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | identifier | Keeps the `R01`…`R32` identifiers from the [source register](research.md). |
| `label` | string | How the source is named to readers. |
| `url` | string | The original destination. Must be an `http://` or `https://` address. |
| `type` | string | Primary text, research, gray literature, external personal accounts, and so on. |
| `intendedRole` | string | Why the notes list this source. Not a claim that it supports anything. |
| `limitation` | string | The caveat that travels with the source. |
| `reviewStatus` | an evidence level, below | How far the source was actually checked. |
| `evidenceBasis` | string or `null` | What was actually opened and read, and when. |
| `citation` | string or `null` | Bibliographic detail. |
| `supportedClaim` | string or `null` | What the material that was read supports. |

#### Evidence levels

These are the levels the [source audit](research.md) recorded. The distinctions are the point: a publisher's description of a book is not a passage from it, and an abstract establishes only what the abstract itself states.

| `reviewStatus` | What it means | `evidenceBasis` + `citation` | `supportedClaim` | Shown to the reader as |
| --- | --- | --- | --- | --- |
| `unreviewed` | Nothing has been opened yet. | must be `null` | must be `null` | Not checked yet |
| `not-accessed` | The work could not be opened. | required | must be `null` | Could not be opened |
| `verified-locator` | Only a publisher, catalogue, or index page was read. | required | required | Publisher or catalogue description only |
| `verified-abstract` | Only the authors' own abstract was read. | required | required | Abstract only |
| `verified-full` | The relevant passage was read in the full work. | required | required | Read in full |

A source at `unreviewed` or `not-accessed` **cannot** state a `supportedClaim`: nothing inside the work was read, so it supports nothing. The validator rejects one.

The three `verified-*` levels all state what they support, and the reader is told what that claim rests on. The renderer prefixes it with "The passage read supports", "The abstract supports", or "The publisher's description supports" according to the level, so a description-level or abstract-level reading can never be presented as a passage-level one. Where there is no supported claim, the reader is shown `intendedRole` instead, prefixed with "Listed in the notes for".

Keep `reviewStatus` and `url` in step with [the register](research.md); a test compares the two and fails if they drift apart.

### `concepts[]`

| Field | Type | Meaning |
| --- | --- | --- |
| `id`, `name` | identifier, string | The class concept. |
| `status` | `planned` or `drafted` | Whether its treatment is written. |
| `explanation`, `application`, `question` | string or `null` | Explain it, apply it, question it. |
| `sourceIds` | identifier[] | Where the concept comes from. |

All three treatment fields are `null` while `status` is `planned`, and all three are required once it is `drafted`. The agreed treatment is to explain, apply, *and* question a concept rather than name it as decoration, so the contract will not accept two out of three.

### `details[]` and `interactions[]`

| `details[]` | Type | Meaning |
| --- | --- | --- |
| `id`, `title` | identifier, string | The optional panel. |
| `body` | string[] | Longer supporting text. |
| `sourceIds` | identifier[] | Sources cited inside the panel. |

| `interactions[]` | Type | Meaning |
| --- | --- | --- |
| `id` | identifier | The optional reveal. |
| `surface` | `scene-detail` or `source-detail` | Which reader surface it attaches to. |
| `purpose` | string | The explanatory reason it exists. |
| `trigger` | string | What activates it. |
| `keyboard` | string | Its keyboard behaviour. Required. |
| `staticEquivalent` | string | How the same material reads with the reveal unused. Required. |
| `detailId` | identifier | The detail it reveals. |

Each detail and each interaction belongs to exactly one scene, and an interaction may only reveal a detail that its own scene already lists in `detailIds`. An optional reveal can therefore never be the only route to an explanation — the validator rejects that arrangement rather than trusting the renderer to be careful.

### `provenance[]`

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | identifier | Stable record identifier. |
| `appliesTo` | identifier | The chapter, scene, dialogue line, source, concept, or detail it explains. |
| `note` | string | Why this content says what it says. |
| `sourceNote` | string | The note or delta file that supports it. |

**Provenance is authoring material and is never published.** It does not appear in the hosted page, the reading view, print output, or the offline file, and a build-time check fails if any of it leaks. Readers see citations and real context; they never see editorial workflow.

## Member positions

A dialogue line marked `member-endorsed` speaks for TJ, Koj, or Vier. Such a line **must** carry a `provenanceId` pointing at a provenance record, which in turn names the note or delta where that contributor said it. A line without that record is rejected as an invented position.

Lines marked `fictional-illustration` are spoken by invented figures such as Bob. They make a situation concrete. They are not evidence, not population data, and not any contributor's biography.

Research is shared group material: any avatar may draw on a source another member found, as long as the citation stays attached to the source and the spoken position matches what that member endorses.

## Identifiers and editorial deltas

Identifiers are ASCII alphanumerics in hyphen-separated groups: `ch-what-counts`, `sc-ordinary-afternoon`, `dl-bob-tired-and-pleased`, `R02`. They are unique across the whole document, except for expression identifiers, which are unique within their character.

Nothing in the contract refers to an array position. Reading order comes from `chapters[].sceneIds`; chapter order comes from the order of `chapters`. A delta therefore maps onto identifiers:

| Editorial change | What to edit |
| --- | --- |
| Rewrite a beat | The `scenes[]` entry with that `id`. Its position in the file does not matter. |
| Reorder beats in a chapter | That chapter's `sceneIds` only. |
| Move a beat to another chapter | The chapter's `sceneIds`, the new chapter's `sceneIds`, and the scene's `chapterId`. The validator reports it if you forget one. |
| Insert a beat | Add the scene with a new `id`, then list that `id` where it belongs in `sceneIds`. |
| Remove a beat | Delete the scene and its `sceneIds` entry, plus any detail, interaction, or provenance record that only it used. |
| Add a contributor's position | Add the provenance record first, then the dialogue line pointing at it. |
| Record a source audit | Set `reviewStatus` to the level actually reached, then record `evidenceBasis` and `citation`, and `supportedClaim` if the level allows one. |
| Draft a concept's treatment | Set `status` to `drafted` and write all three of `explanation`, `application`, `question`. |
| Give a beat a drawing | Set `visual.artId` to a composition and `visual.artState` to the state it settles into, and rewrite `visual.description` to describe what is actually drawn. |
| Take a drawing away | Set both `visual.artId` and `visual.artState` to `null`. The description carries the beat. |

Keep an existing identifier pointing at the same thing. If a source is replaced by a different work, add a new identifier rather than repointing the old one.

## Validation rules

`npm run validate` reports these codes. Each error names a path such as `scenes[4].dialogue[0].speakerId`.

| Code | Reported when |
| --- | --- |
| `SCHEMA_MISMATCH` | The `schema` field is not `happiness-essay-content/v1`. |
| `NOT_AN_OBJECT`, `NOT_AN_ARRAY`, `NOT_A_STRING`, `NOT_A_BOOLEAN` | A field has the wrong type. |
| `MISSING_FIELD`, `UNKNOWN_FIELD` | A required field is absent, or an unrecognised one is present. |
| `EMPTY_STRING`, `EMPTY_ARRAY` | Required text or a required list is blank. |
| `INVALID_ID` | An identifier does not match the naming rule. |
| `DUPLICATE_ID` | An identifier is reused, including an expression repeated within a character. |
| `UNKNOWN_REFERENCE`, `WRONG_REFERENCE_KIND`, `DUPLICATE_REFERENCE` | A reference points at nothing, at the wrong kind of entry, or is listed twice. |
| `INVALID_ENUM` | A role, stance, review status, concept status, or interaction surface is not one of the allowed values. |
| `EMPTY_ESSENTIAL_SCENE` | A scene has no essential narration. |
| `SCENE_ORPHANED` | A scene is in no chapter's reading order. |
| `SCENE_CLAIMED_TWICE` | A scene appears in more than one chapter order, or twice in one. |
| `SCENE_CHAPTER_MISMATCH` | A scene's `chapterId` disagrees with the chapter that orders it. |
| `UNKNOWN_EXPRESSION` | A scene asks a character for an expression it does not have. |
| `UNKNOWN_ART_REFERENCE` | A character, an expression, or a scene names a drawing the artwork package cannot produce. |
| `ART_ROLE_MISMATCH` | A contributor is drawn as an invented friend, or the reverse, or anyone is drawn as the unnamed outline. |
| `ART_STATE_UNAVAILABLE` | A scene asks a composition for a condition layer it does not have, or declares a state for a beat that has no drawing. |
| `ART_FIGURE_COUNT` | A scene gives a composition more or fewer figures than it can place. |
| `UNSUPPORTED_MEMBER_POSITION` | A `member-endorsed` line has no provenance record. |
| `INVALID_SOURCE_URL` | A source destination is not an `http://` or `https://` address. |
| `UNSUPPORTED_SOURCE_CLAIM` | A source states what it supports at an evidence level where nothing inside the work was read. |
| `UNVERIFIED_SOURCE_RECORD` | An `unreviewed` source records a citation or an evidence basis. |
| `UNDRAFTED_CONCEPT_TEXT` | A `planned` concept carries treatment text. |
| `INTERACTION_DETAIL_NOT_IN_SCENE` | An optional reveal is the only route to its detail. |
| `UNUSED_ENTRY`, `ENTRY_CLAIMED_TWICE` | A detail or interaction is referenced by no scene, or by several. |
| `INVALID_JSON`, `UNREADABLE` | The document could not be parsed or opened. |

[`test/fixtures/invalid-content.json`](../test/fixtures/invalid-content.json) is a document broken on purpose; `npm test` asserts that every one of those situations is actually caught.
