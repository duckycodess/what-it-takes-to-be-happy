# What Does It Take to Be Happy?

An independently readable illustrated essay for a SOC SCI midterm, created by TJ, Koj, and Vier. Original stickmen, an unseen narrator, and changing scenes explore different good lives and the conditions that make them possible.

The visual and presentation reference is [Nicky Case's The Evolution of Trust](https://ncase.me/trust/). This project uses its presentation rhythm and handwritten aesthetic as inspiration, with original artwork and an original argument about happiness.

> **The deliverable is the hosted website.** On 9 October 2026 the owner discontinued the self-contained offline HTML submission and kept the agreed Futura Handwritten typography. [The owner amendment](docs/decisions.md#owner-amendment--9-october-2026) is canonical; older offline references in these documents are historical evidence or retained tooling.

**Current status:** the agreed brief, source notes, architecture, and implementation backlog are documented; an initial character concept sheet has been generated; the editorial package is drafted — an 87-scene storyboard whose sources were audited on 9 October 2026: 13 verified in the full work, 11 at article-abstract level, 3 from a publisher's book description only, and 5 that could not be opened, with every scene touching a limited or unopened source saying so in its own reader-visible text; and the static foundation now builds. The original artwork is built too: eight figures, seven drawable expressions, and sixteen explanatory scene compositions, authored as SVG geometry and generated into both outputs, with names rendered above heads as browser text; 34 of the storyboard's 87 beats are mapped to a composition and the remaining 53 record what a drawing would have to show. The essay's chapters, beats, cast, and sources live in one validated content document that renders to a hosted page, a continuous reading and print view, and the retained single-file output. The content document in the repository today is still an explicitly non-final fixture: the storyboard's prose and the artwork have not been wired into it yet. No deployment exists yet, the project typeface is not loaded yet, and the production build is held until the reviewed complete essay passes its hosted release checks. On 9 October the owner authorized autonomous implementation of the six build packages, automatic merging after verification, and generated-art support from this chat, then amended the brief to hosted-only delivery. Application and release progress is tracked on the issues; new unrelated tickets remain unqueued by default.

## Read first

| Document | Purpose |
| --- | --- |
| [Project brief](docs/brief.md) | Audience, thesis, agreed experience, assignment requirements |
| [Decisions](docs/decisions.md) | The canonical 9 October owner amendment, confirmed choices, and superseded proposals |
| [Architecture](docs/architecture.md) | Content contract, reader, illustration, citations, hosted output, implemented tooling |
| [Content contract](docs/content-contract.md) | Every field of `content/content.json`, the validation rules, and how editorial deltas map onto identifiers |
| [Content plan](docs/content-plan.md) | Six shared questions, perspectives, conceptual lenses, coverage |
| [Storyboard](docs/storyboard.md) | The authored main path: chapters, scenes, exact prose, dialogue, visible caveats, visual purpose |
| [Cast registry](docs/cast.md) | Stable identifiers for the three members and the fictional friends, and the six expression states |
| [Coverage matrix](docs/coverage.md) | Assignment parts, six questions, lenses, and member positions mapped to scenes; reading measurement; delta inventory |
| [Research register](docs/research.md) | Per-source evidence record: what was actually opened, the supported claim, the limitation, and a review-status rollup |
| [Art direction](docs/art-direction.md) | Original characters, emotions, typography, meaningful scene changes |
| [Asset workflow](docs/asset-workflow.md) | Built-in generation, first character sheet, drawing parts, animation, optional tools |
| [Drawing system](docs/art-system.md) | The original figures, expressions, postures, and scene compositions; how a scene asks for one; what is drawn and what is not |
| [Autonomous build](docs/autonomous-build.md) | Owner authorization, reviewed merges, issue labels, art requests, local supervision |
| [Notes and future updates](docs/notes/README.md) | Imported notes and how to contribute a delta |
| [Delivery](docs/delivery.md) | Vercel hosting, the recorded project settings, and the release checklist |
| [Verification](docs/verification.md) | Narrative, navigation, accessibility, and hosted release checks |
| [Work plan](docs/work-plan.md) | Implementation packages and evidenced prerequisites |

## Narrative questions

1. What counts as happiness?
2. Must enjoyment become meaningful or productive?
3. Whose definition are we following?
4. How do relationships help, and when does care become pressure?
5. Who has room for happiness?
6. What could change, and what do we still disagree about?

The working synthesis is that happiness takes different forms: small joys matter, while security, time, relationships, and freedom shape who can sustain them. The story preserves disagreement rather than declaring one definition correct.

## Running it

Node 24 (`.nvmrc` pins 24.15.0). There are no dependencies: `npm ci` only verifies the committed lockfile.

```
npm ci
npm run validate        # check content/content.json against the contract
npm test                # contract, renderer, packaging, and preview checks
npm run build           # write dist/
npm run preview         # serve dist/ at http://localhost:4173
npm run export:offline  # write only dist/offline.html (retained tooling)
npm run check           # validate, then test, then build
```

`npm run build` writes two outputs from the same content:

- **`dist/`** — the hosted site. This is the directory Vercel publishes, and it is the deliverable.
- **`dist/offline.html`** — one self-contained file with the font, the artwork, the styles, and the script embedded. The 9 October amendment **discontinued this as a deliverable**; it is kept because it exercises the inlining and completeness rules cheaply. The build still writes it into `dist/`, and taking it out of the published output is [#7](https://github.com/duckycodess/what-it-takes-to-be-happy/issues/7)'s code change, not yet made.

The build fails if either output loses essential content, if authoring provenance leaks into the product, or if the single-file output references anything it does not carry. `dist/` is generated and git-ignored.

## Editing the essay

All of the writing lives in [`content/content.json`](content/content.json), described field by field in [the content contract](docs/content-contract.md). Chapters, beats, cast, sources, concepts, and optional panels are addressed by stable identifiers, so a later note can rewrite, reorder, or move a beat without touching anything around it. Run `npm run validate` after any edit; it reports each problem with its exact location.

Each source carries the evidence level the audit actually reached — read in full, abstract only, publisher or catalogue description only, or not opened — and the contract refuses to let a source claim more than its level supports. The reader shows that level beside every citation, and a test fails if the content document and [the register](docs/research.md) drift apart.

The content document in the repository today is a **non-final fixture**. Every beat is a structural stand-in and no line states a position held by TJ, Koj, or Vier. [The storyboard](docs/storyboard.md) holds the authored prose; wiring it into the content document belongs to the integration package.

## Contributing

Add new member notes using [the delta template](docs/notes/delta-template.md), then reconcile the affected story sections and references. Research can be shared among all three contributors; personal claims should remain faithful to what each member endorses. A line spoken as a contributor's own position must point at the note that records it, or validation rejects it.

Two editorial commands check the storyboard and the register. They need nothing beyond coreutils, grep, and awk:

```sh
./tools/check-storyboard.sh    # storyboard, cast, and research-register consistency
./tools/count-main-path.sh     # main-path word count and reading estimate (--chapters, --text)
```

## Work tracking

Start with the [project index](https://github.com/duckycodess/what-it-takes-to-be-happy/issues/1), [work plan](docs/work-plan.md), and [GitHub issues](https://github.com/duckycodess/what-it-takes-to-be-happy/issues). Six implementation packages have canonical contracts and verified classification labels. The owner's overnight-build request authorizes those six; the index stays unqueued. The installed Agent Flow front door publishes tickets; exact `agent:ready` records implementation authorization.

## Source material

The [group Google Doc](https://docs.google.com/document/d/1NL3B3DEtVc3QeblkBwtClMhwEmDhqnkwZByL2hFDyVU/edit) contains Instructions, Brainstorm, and Website ideas — TJ. Imported snapshots are historical evidence; the confirmed decisions in this repository govern implementation.
