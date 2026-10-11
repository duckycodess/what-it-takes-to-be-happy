# What Does It Take to Be Happy?

An independently readable illustrated essay for a SOC SCI midterm, created by TJ, Koj, and Vier. Original stickmen, an unseen narrator, and changing scenes explore different good lives and the conditions that make them possible.

The visual and presentation reference is [Nicky Case's The Evolution of Trust](https://ncase.me/trust/). This project uses its presentation rhythm and handwritten aesthetic as inspiration, with original artwork and an original argument about happiness.

> **The deliverable is the hosted website.** On 9 October 2026 the owner discontinued the self-contained offline HTML submission and kept the agreed Futura Handwritten typography. [The owner amendment](docs/decisions.md#owner-amendment--9-october-2026) is canonical; older offline references in these documents are historical evidence or retained tooling.

**Current status:** the essay is live at **<https://what-it-takes-to-be-happy.vercel.app>**, built from `67f571d` and tested on the deployed site on 11 October 2026 — navigation, chapters, continuous reading, the register, the real typeface, all 22 drawings and a complete 45-page print, at 360 and 1280 CSS pixels in Chrome. [Delivery](docs/delivery.md#the-released-site--11-october-2026) is the record, including what was *not* checked: no physical phone, no other browser engine, no physical printer. The website is the approved 45-scene script transferred into one validated content document — eight chapters, 4,137 main-path words, 26 published source entries from a 32-entry audit, and twenty generated assets supplying 22 selected drawings with names rendered above heads as browser text. Automatic production builds from Git are still held on purpose, so **a newer commit here is not what the public URL serves**. Since 11 October 2026 every new revision is **preview-only** until the owner approves the reading experience's readability and flow — that covers this repository's current output cleanup and the separately queued readability revision, [#17](https://github.com/duckycodess/what-it-takes-to-be-happy/issues/17) — so a reviewed merge is not production-release approval, production stays at `67f571d`, and the hold and the Vercel settings stay as they are. On 9 October the owner authorized autonomous implementation of the six build packages, automatic merging after verification, and generated-art support from this chat, then amended the brief to hosted-only delivery. The 87-beat build that preceded the rewrite is historical: [the storyboard](docs/storyboard.md), [the cast registry](docs/cast.md) and [the drawing system](docs/art-system.md) record it as provenance, not as what ships.

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
npm run build           # write the hosted site to dist/
npm run preview         # serve dist/ at http://localhost:4173
npm run export:offline  # write only dist/offline.html (retained tooling, not published)
npm run check           # validate, then test, then build
```

`npm run build` renders two outputs from the same content and publishes one:

- **`dist/`** — the hosted site, and the whole of what the build writes. This is the directory Vercel publishes, and it is the deliverable.
- **`dist/offline.html`** — one self-contained file with the font, the artwork, the styles, and the script embedded. The 9 October amendment **discontinued this as a deliverable**, so no build publishes it; `npm run export:offline` writes it when it is wanted. It is kept because it exercises the inlining and completeness rules cheaply, and every build still renders and audits it — those audits are what prove the hosted page's own resources are all committed and accounted for.

A normal build clears `dist/` first, so an export left in there cannot reach a deploy; only a normal build's output is publishable. The build fails if either output loses essential content, if authoring provenance leaks into the product, or if the single-file output references anything it does not carry. `dist/` is generated and git-ignored.

## Reading it

Both outputs open on the question, with Begin, the contributors' names, and the chapter list. From there a reader moves beat by beat with Next and Back or the arrow keys, revisits any chapter from its first beat, opens optional panels without losing their place, and can switch to the continuous view that reads the whole essay straight through. Every scene, every chapter, and every source entry has a web address, so a reader can be sent to one and the browser's Back button walks their moves in reverse — including from the single-file export opened off a disk.

The register is reachable from the landing, from the chapter list in any view, and from every citation beside a beat; each citation keeps the evidence level and the limitation in place rather than hiding them behind the link. With scripting unavailable, in print, and in the continuous view, the whole essay is simply there, which is the same document in each case.

The essay is set in **Futura Handwritten** by Billy Snyder, served from this site's own origin — prose, dialogue, headings, and the names above the figures alike. It is used under the author's note on [his font page](https://www.dafont.com/futurahandwritten.font): *"Feel free to use this font for anything you want."* He says credit is not required; the colophon of every hosted page gives it anyway. That note is the whole basis for the hosted use, accepted by the owner on 9 October 2026; it is not a named public licence, and the font is not CC0 or OFL. Serving a webfont does send the file to every reader's browser, so the hosted page rests on that grant rather than on a distinction between linking and embedding. The font is nonetheless kept out of the single-file output, which carries the licensed DejaVu Sans alone — a deliberate choice to hold the file inside the context the owner approved. The full record — source, archive, checksums, what was checked and what it does not say — is in [`assets/fonts/README.md`](assets/fonts/README.md). DejaVu Sans also stands behind the project typeface on the hosted page and draws the one character it has no glyph for. All lettering is browser text.

`npm test` includes a browser suite that runs in headless Chrome. Every journey is driven against the real hosted build — `index.html` and `sources.html` with their stylesheet, script, both fonts and all 22 selected drawings beside them at the paths they are linked at — so a webfont or a drawing the browser never had to fetch proves nothing. *(Until the rewrite the journeys ran against `dist/offline.html` through a `file://` URL, and only the typography used the hosted tree.)* It needs no packages and no configuration, finds a browser through `CHROME_PATH` or the usual locations, and skips with a stated reason when none is installed. [Verification](docs/verification.md) records what actually ran.

## Editing the essay

All of the writing lives in [`content/content.json`](content/content.json), described field by field in [the content contract](docs/content-contract.md). Chapters, beats, cast, sources, concepts, and optional panels are addressed by stable identifiers, so a later note can rewrite, reorder, or move a beat without touching anything around it. Run `npm run validate` after any edit; it reports each problem with its exact location.

Each source carries the evidence level the audit actually reached — read in full, abstract only, publisher or catalogue description only, or not opened — and the contract refuses to let a source claim more than its level supports. The reader shows that level beside every citation, and a test fails if the content document and [the register](docs/research.md) drift apart.

The content document in the repository today is the **approved 45-scene essay**: every scene's narration, dialogue and visible caveats in the order the owner approved them to read in, the published source entries at the levels the audit actually reached, and the selected drawings. `test/transfer.test.js` rebuilds the document from [the approved script](docs/redesign/approved-scene-script.md) and compares the two, and the build refuses to publish a document that is not what that script transfers to — so approved copy cannot drift into unapproved copy unnoticed, on either path.

*(Historical: the same guarantee previously held between the document and [the 87-beat storyboard](docs/storyboard.md), which the approved rewrite superseded on 11 October 2026.)*

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
