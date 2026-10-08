# What Does It Take to Be Happy?

An independently readable illustrated essay for a SOC SCI midterm, created by TJ, Koj, and Vier. Original stickmen, an unseen narrator, and changing scenes explore different good lives and the conditions that make them possible.

The visual and presentation reference is [Nicky Case's The Evolution of Trust](https://ncase.me/trust/). This project uses its presentation rhythm and handwritten aesthetic as inspiration, with original artwork and an original argument about happiness.

**Current status:** the agreed brief, source notes, architecture, and implementation backlog are documented, an initial character concept sheet has been generated, and the static foundation now builds. The essay's chapters, beats, cast, and sources live in one validated content document that renders to a hosted page, a continuous reading and print view, and a self-contained offline file. The content in the repository today is an explicitly non-final fixture: the writing and the artwork are still to come. On 9 October the owner authorized autonomous implementation of the six build packages, automatic merging after verification, and generated-art support from this chat. Application and release progress is tracked on the issues; new unrelated tickets remain unqueued by default.

## Read first

| Document | Purpose |
| --- | --- |
| [Project brief](docs/brief.md) | Audience, thesis, agreed experience, assignment requirements |
| [Decisions](docs/decisions.md) | Confirmed choices and superseded proposals |
| [Architecture](docs/architecture.md) | Content contract, reader, illustration, citations, hosted/offline outputs, implemented tooling |
| [Content contract](docs/content-contract.md) | Every field of `content/content.json`, the validation rules, and how editorial deltas map onto identifiers |
| [Content plan](docs/content-plan.md) | Six shared questions, perspectives, conceptual lenses, coverage |
| [Research register](docs/research.md) | Current source pool, intended claim roles, limitations, audit status |
| [Art direction](docs/art-direction.md) | Original characters, emotions, typography, meaningful scene changes |
| [Asset workflow](docs/asset-workflow.md) | Built-in generation, first character sheet, drawing parts, animation, optional tools |
| [Autonomous build](docs/autonomous-build.md) | Owner authorization, reviewed merges, issue labels, art requests, local supervision |
| [Notes and future updates](docs/notes/README.md) | Imported notes and how to contribute a delta |
| [Delivery](docs/delivery.md) | Vercel hosting and the offline submission file |
| [Verification](docs/verification.md) | Narrative, navigation, accessibility, offline, and release checks |
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
npm run export:offline  # write only dist/offline.html
npm run check           # validate, then test, then build
```

`npm run build` produces two distributions of the same content:

- **`dist/`** — the hosted site. This is the directory a static host publishes.
- **`dist/offline.html`** — one self-contained file. Open it directly from disk, with or without a network; the font, the artwork, the styles, and the script are all embedded. This is the submission artifact.

The build fails if either output loses essential content, if authoring provenance leaks into the product, or if the offline file references anything it does not carry. `dist/` is generated and git-ignored.

## Editing the essay

All of the writing lives in [`content/content.json`](content/content.json), described field by field in [the content contract](docs/content-contract.md). Chapters, beats, cast, sources, concepts, and optional panels are addressed by stable identifiers, so a later note can rewrite, reorder, or move a beat without touching anything around it. Run `npm run validate` after any edit; it reports each problem with its exact location.

The content in the repository today is a **non-final fixture**. Every beat is a structural stand-in, no line states a position held by TJ, Koj, or Vier, and no source carries an audited claim yet.

## Contributing

Add new member notes using [the delta template](docs/notes/delta-template.md), then reconcile the affected story sections and references. Research can be shared among all three contributors; personal claims should remain faithful to what each member endorses. A line spoken as a contributor's own position must point at the note that records it, or validation rejects it.

## Work tracking

Start with the [project index](https://github.com/duckycodess/what-it-takes-to-be-happy/issues/1), [work plan](docs/work-plan.md), and [GitHub issues](https://github.com/duckycodess/what-it-takes-to-be-happy/issues). Six implementation packages have canonical contracts and verified classification labels. The owner's overnight-build request authorizes those six; the index stays unqueued. The installed Agent Flow front door publishes tickets; exact `agent:ready` records implementation authorization.

## Source material

The [group Google Doc](https://docs.google.com/document/d/1NL3B3DEtVc3QeblkBwtClMhwEmDhqnkwZByL2hFDyVU/edit) contains Instructions, Brainstorm, and Website ideas — TJ. Imported snapshots are historical evidence; the confirmed decisions in this repository govern implementation.
