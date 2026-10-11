# Confirmed decisions

The user confirmed the shared brief and subsequently requested repository creation, documentation, canonical tickets, and Vercel as the hosting target. These decisions override earlier proposals in the imported Website ideas tab.

> **The 9 October 2026 owner amendment below is canonical.** It changes what this project delivers.
> Read it before the table.
>
> **A second owner amendment, on 11 October 2026, changes how the essay is read**: the chapter rail
> and its phone drawer, a reading footer of Back and Next alone, no visible Print control, broader
> prose, smaller contextual artwork, and no red ring around a whole scene. It is
> [further down this page](#owner-amendment--11-october-2026-how-the-essay-is-read) and governs the
> reader's interface. It does not touch the approved copy, and the replacement prose it anticipates
> is **not** approved and **not** integrated.

## Owner amendment — 9 October 2026

Late on 9 October 2026 the owner changed the delivery brief directly: *"For font, we continue with
our agreed front. We discontinue offline html and prioritize the website itself."* "Front" is the
agreed Futura Handwritten typography. Where any other document in this repository still describes
the delivery differently, this section governs and that document is out of date.

| Amended | Now | Before the amendment |
| --- | --- | --- |
| Deliverable | The hosted Vercel website **is** the deliverable | A hosted site *and* a self-contained offline HTML submission file |
| Offline HTML | Discontinued. Not a submission artifact, not a release gate, not an acceptance criterion | `dist/offline.html` was the submission artifact and a release gate |
| Typography | Futura Handwritten, retained, and to be implemented as real web typography | Futura Handwritten (unchanged by the amendment) |

What the amendment does **not** change: the original Trust-style artwork, names above heads as
browser text, phone and desktop layouts that reflow rather than shrink, chapter revisiting, the
complete reading and print view, and every visible finding, caveat, and limitation. Nothing
editorial is retired here, and no substitute typeface is accepted.

### Older offline references, and what each one now means

Offline reading was a real requirement for most of this repository's history, and the work done
under it was real work. Three kinds of reference to it survive, meaning three different things:

- **Historical implementation evidence.** The network-disabled `file://` checks recorded in
  [delivery](delivery.md) and [verification](verification.md), and the batches described in
  [the foundation plan](foundation-plan.md), record checks that actually ran on 9 October 2026
  against the non-final fixture. They stay as written. They say what was tested then; they are not
  a gate anything must still pass.
- **Retained tooling.** `npm run export:offline` still exists and still works, and the single-file
  packaging tests and the deliberately broken fixture still run. They are kept because they exercise
  real inlining and completeness rules cheaply, not because a submission file is owed. Removing
  working test infrastructure to erase the history is not part of this amendment.
- **Imported notes.** [`docs/notes/`](notes/README.md) records what the members and the assignment
  actually said at the time. Those snapshots are evidence and are never rewritten.

### Settled since the amendment

- **Futura Handwritten is loaded, and the permission behind it was read.** The basis is the author's
  own note on [his font page](https://www.dafont.com/futurahandwritten.font) — *"Feel free to use
  this font for anything you want"* — which the owner accepted on 9 October 2026 as the basis for
  this website's use of the face. The file was taken from that page's own download link and its
  archive, size, and digest are recorded in
  [`assets/fonts/README.md`](../assets/fonts/README.md). Billy Snyder is credited in the colophon of
  every hosted page, although his note says credit is not required.

  Three things this is **not**, each checked rather than assumed: it is not CC0, OFL, or any other
  named public licence; it does not derive from Nicky Case's separate CC0 declaration, which covers
  his own work and lists this font as a third-party resource; and dafont's "100% Free" label is not
  a licence, by dafont's own FAQ. Nor does retiring the offline file create any additional right.

  What follows from that, and is enforced by the build: the face is **served by this site** from its
  own origin, and is **kept out** of any file handed to someone else. Serving it is already a form
  of distribution — the hosted page sends the font file to every reader's browser — so the hosted
  use rests on the grant above, not on a distinction between linking and embedding. Keeping it out
  of the single-file output is a deliberate scope choice: it holds the font inside the one context
  the owner approved, a page served from this origin with the author credited.
  `auditProjectFontIsHostedOnly` fails the build if the offline output carries the font's bytes, a
  URL pointing at it, or even its family name. The bundled DejaVu Sans, which *is* covered by a
  licence that permits redistribution, remains behind it on the hosted page and is the only face the
  offline file carries.
  Owned by [#5](https://github.com/duckycodess/what-it-takes-to-be-happy/issues/5).

### Still open, and owned elsewhere

- **The build still writes `dist/offline.html`.** As of this amendment `npm run build` emits it into
  the publish directory and prints it as the offline submission file. Dropping it from the published
  output, and ensuring no production page offers a download link to it, is a code change owned by
  [#7](https://github.com/duckycodess/what-it-takes-to-be-happy/issues/7). It has not happened yet,
  and this documentation amendment did not change any application code.
- **How the hosted essay reaches the class is unresolved.** [The instruction
  snapshot](notes/2026-10-08-instructions.md) asks for a digital file in the class Google Drive
  midterm folder, and nobody in this repository can withdraw that requirement. Retiring the offline
  file removes the artifact that answered it. Whether the group submits a link, a printed or exported
  copy, or something else is the owner's and the class's decision; no Drive upload is in scope here.

This amendment is recorded as [#12](https://github.com/duckycodess/what-it-takes-to-be-happy/issues/12)
and amends [#1](https://github.com/duckycodess/what-it-takes-to-be-happy/issues/1),
[#5](https://github.com/duckycodess/what-it-takes-to-be-happy/issues/5),
[#6](https://github.com/duckycodess/what-it-takes-to-be-happy/issues/6), and
[#7](https://github.com/duckycodess/what-it-takes-to-be-happy/issues/7) without rewriting their
canonical ticket text; [the work plan](work-plan.md) names the clauses it supersedes.

## Owner amendment — 11 October 2026: how the essay is read

The owner read the integrated website and changed the reader's interface. The complaint was
specific: the illustrations dominated the page, the prose ran in a strip too narrow to read
comfortably, and every move through the essay drew a red outline around the whole scene. The
settled interview that followed asked for blog-like prose with supporting illustrations, a
collapsible chapter sidebar on a wide screen and a compact drawer on a phone, and a reading footer
carrying Back and Next alone. Published as
[#17](https://github.com/duckycodess/what-it-takes-to-be-happy/issues/17).

Where an earlier document in this repository still describes the superseded chrome — a toolbar
carrying Print and the view switch, a chapter list as a row of links above the essay, a narrow
column, or a focus ring forced onto every scene — this section governs and that document is out of
date on those points.

| Amended | Now | Before the amendment |
| --- | --- | --- |
| Chapter navigation | A rail of chapters **and their parts** beside the essay on a wide screen, collapsible as a whole with a launcher that brings it back; the same list as a dismissible drawer at phone width | One row of eight chapter titles above the essay, always on screen in every view |
| Reading footer | Back and Next, and nothing else | Back, Next, Read again, the view switch, Print and Sources & Credits in one fixed bar |
| `Read continuously`, `Sources & Credits` | A separate secondary section of the rail and the drawer | In the reading footer |
| `Read again` | With the final passage, at the end of the essay | In the reading footer |
| Print control | Removed. A browser's own print command still produces the complete essay, which is what the print rules are for | A visible `Print` button |
| Progress indication | `aria-current` on the part being read, and nothing visible beyond it | Already none; unchanged, and no counter may be added |
| Prose measure | 35rem with the project typeface, about 64 characters a line measured in Chrome | 31rem, about 57 |
| Illustration | Held to its own column — 18rem beside the passage on a wide screen, 24rem otherwise — and placed beside the related passage above 78rem, under it below | As wide as the essay column, up to 48rem |
| Scene focus ring | `.scene:focus-visible` only, so a keyboard reader still sees where they are and a pointer move does not outline the reading column | `.scene:focus`, which painted a red ring on every Next |

What the amendment does **not** change: the approved 45-scene copy, which is untouched; the scene
and source identifiers; paginated Next/Back as the default; the fragment as the reader's place and
the query as their reading mode; `Futura Handwritten`; frameless artwork with names as browser text;
the two optional comparisons; complete continuous reading; and complete browser printing. No
reader-facing string was invented for the new controls: the rail and its launcher carry the approved
`Chapters`, each part is labelled with that scene's own approved title, and each chapter's expand
control is named by the chapter title beside it through `aria-labelledby`. State is `aria-expanded`
and `aria-current`, not a word.

`interface.print` stays in [the content document](../content/content.json) because that document is
a transfer of [the approved script](redesign/approved-scene-script.md), not a record of this
interface; what changed is the interface. The build's coverage audit therefore no longer requires
that one string to appear in an output, and `src/build/verify.js` names it and `backToReading` as
the only two exceptions, so a control that goes missing by accident still fails a build.

### Still open under this amendment

- **The replacement prose is not integrated and is not approved.** The interview also settled that
  the chat would draft richer exact-copy Markdown for the owner to review as an outline, a developed
  middle chapter, and then a full essay. None of those gates has been met. The website continues to
  carry the approved 45-scene copy verbatim, and no part of a draft may be integrated until the
  owner has approved all of it. A layout revision is not copy approval.
- **The new revision is preview-only.** Nothing here authorises a production deployment, and a
  reviewed merge is not a promotion. Release verification against a deployed URL remains
  [#7](https://github.com/duckycodess/what-it-takes-to-be-happy/issues/7)'s, whose contract this
  amendment does not touch.

## Confirmed choices

| Area | Confirmed choice | Reason or boundary |
| --- | --- | --- |
| Form | Independently readable illustrated website | No live narrator is required |
| Pace | Next/Back presentation beats | Reader controls progression |
| Scope | Substantial depth, approximately 15–30 minutes | Preserve distinct perspectives; no fixed scene/word cap |
| Backbone | Unseen narrator introduces situations and connects ideas | The traveler/map proposal was replaced |
| Voices | Narrator plus occasional member dialogue | Preserve real disagreements and inward reflection |
| Cast | TJ, Koj, Vier; names above heads | Accessories and equal word quotas are not required |
| Examples | Generic fictional stickman friends | Do not convert illustrative situations into biography or evidence |
| Research ownership | Shared group research can support any avatar | Retain source attribution and member-endorsed positions |
| Story organization | Six shared questions woven across perspectives | Do not split into three isolated essays |
| Argument | Different good lives, real small joys, unequal sustaining conditions | Preserve nuance and remaining questions |
| Scene behavior | Develop existing scenes or introduce new ones as appropriate | Illustrations carry explanatory meaning |
| Emotions | Different emotional states, changing with context | No implication that happiness requires constant smiling |
| Interaction | Optional explanation-specific comparisons/reveals/thoughts | Essential content stays on the main path; Next stays available |
| Evidence | Main findings, concepts, and caveats visible | Supplemental detail may expand |
| Theory | Explain, apply, and question | Distinguish original theory, classroom shorthand, and group interpretation |
| Setting | Filipino/student starting point, broader circumstances later | Examine standpoint rather than universalize it |
| Tone | Warm/playful where appropriate, reflective for difficult subjects | Keep one visual language |
| Navigation | Next/Back, chapter revisiting, full reading/print view | All views preserve the complete argument |
| Devices | Desktop and phones | Reflow rather than shrink |
| Art | Original stickman drawings in the reference style | Reference assets are not the project's character library |
| Asset creation | Built-in image generation for the first character sheets and concepts | The user requested it directly; close visual match to Trust's style |
| Drawing tools | Codex handles asset production; Inkscape is optional | No requirement for the user to learn a drawing editor or install a connector |
| Motion workflow | Reusable drawing parts and expressions, animated in the browser | A PNG concept sheet does not itself provide an animation rig |
| Typography | Futura Handwritten reference typography | Retained by the amendment above; preserve readable long-form text on both layouts |
| Opening | Working question title, emotional stickmen, everyday snapshots, different readings | Opening does not dictate every chapter's method |
| Ending | Concrete changes at several scales plus unresolved questions | Explain tradeoffs and avoid guaranteed-happiness claims |
| Notes | Repository deltas will expand contributions | Reconcile them into the story rather than append an unrelated tail |
| Hosting | Vercel | The hosted site is the deliverable; the offline file is discontinued by the amendment above |
| Work tracking | Publish agreed work through the ticket front door | Ordinary tickets remain unqueued |
| Autonomous build | Owner authorized the six implementation packages on 9 October | Routine reversible choices proceed within the confirmed brief |
| PR completion | Automatic dispatcher merge after verified checks and independent review | Keep exact-commit review and dependency gates |
| New issue labels | Relevant classification labels are mandatory and verified | Workflow labels do not replace issue type |
| Art support | This chat polls project requests and supplies built-in-generated assets | Isolated asset branches preserve active worker ownership |

## Superseded proposals

- A controllable traveler, a map, guided walking, and a fixed neighborhood route.
- The earlier Court → Bench → Market → Waiting shed → Workshop → Plaza loop.
- A fixed six-stop implementation or fixed 1,200–1,800-word limit. Six current chapters are organizing questions, not six scenes.
- Treating a third member's contribution as pending: Vier's notes are already present.
- Long prose restricted to a different typeface simply because the older map proposal preferred it.
- One opening assumption or one explanatory method governing the whole story.
- A self-contained offline HTML file as a submission deliverable, and offline/hosted parity as a
  release gate. Retired by the 9 October owner amendment above; the export command and the
  packaging tests are retained as tooling.

## Implementation discretion

Framework, bundler, storage format, and production editing tools were not mandated. Built-in image generation is the chosen starting point for visual concepts. SVG components, browser motion, Anime.js, and Rough.js are production options described in [the asset workflow](asset-workflow.md), not installed dependencies.

The foundation package made these choices, all reversible:

| Choice | Made | Reason |
| --- | --- | --- |
| Runtime | Node 24, pinned by `.nvmrc` and `engines` | Only the build and the checks need it; the deployed essay is static files. |
| Dependencies | None at all; the committed lockfile has no packages | Nothing should stand between the authored content and a file that must open from a local disk with no network. |
| Content format | One JSON document, `content/content.json` | Editable by hand, diffable, and checkable; see [the content contract](content-contract.md). |
| Validation | A dependency-light validator with a nonzero exit code | Broken references and invented positions fail before a build, not during review. |
| Rendering | One renderer; the whole essay is in the markup, and the browser script only chooses what is visible | Print, a scriptless browser, and the offline file all keep the complete argument for free. |
| Browser script | A classic script, not an ES module | Module loading is blocked for `file://` documents. |
| Checks | Node's built-in test runner, plus `node --check` over every source file | No linter, formatter, or type checker is configured; this is the honest substitute. |
| Fallback font | DejaVu Sans, committed with its licence | A temporary stand-in that proves a real font embeds in both outputs. Not the project typeface. |

Several rows in this section and the next were argued from the offline requirement, which the
amendment above retires. They record why each choice was made at the time and are left as written.
The choices themselves still stand on their own: no dependency has since earned its place, a static
essay with one page, one stylesheet, and one script still does not need a toolchain, and inline
artwork still costs the hosted page no request.

The artwork package then made these, equally reversible:

| Choice | Made | Reason |
| --- | --- | --- |
| Drawing format | Authored SVG geometry, generated into the markup | A scene costs the offline file no request and no asset, and the same motif can appear in twenty beats without colliding with itself. |
| Animation | One CSS entrance over a layer that is already settled in the markup | Print, no scripting, and reduced motion all need the finished drawing anyway; a timeline library would have earned nothing and cost the offline file a dependency. |
| Expression vocabulary | The six editorial states, plus `uncertainty` as a seventh *drawable* state | The brief asks the drawings to carry not-knowing, and `reflection` is settled consideration. The storyboard's six-state vocabulary is unchanged. |
| Scene coverage | Reusable motifs chosen per beat, with declared fallbacks | 33 of 87 beats have a drawing; the rest say what one would have to show. A map claiming 87 bespoke illustrations would be false. |
| Concept sheet | Kept, moved into the colophon as provenance | It is a flattened study, not production art; it belongs beside the credits rather than on the landing. |
| Landing illustration | Authored in the content document, like every other drawing | The opening is where a reader could most easily be told that happiness is one feeling; who stands around the question is an editorial decision, not a renderer's. |
| Layer model | A revealed state only ever adds to its situation | One description stays true of a drawing whether or not the layer has animated in, and a beat that removes something is the same drawing in the other state. |

Actual commands are in the [README](../README.md) and [architecture](architecture.md); the hosting settings are in [delivery](delivery.md).

The source audit for the editorial package was carried out on 9 October 2026. Every retained source now has an
evidence record with its review status in [the research register](research.md): 13 verified in the full work, 11 at
article-abstract level, 3 from a publisher's book description only (R15, R16, R29), and 5 not opened at all (R11,
R14, R21, R22, R30). The scenes that touch any of those say so in reader-visible text; where R21 and R30 could not
be opened, the concepts they originate are carried by R31 and R32 and the substitution is disclosed to the reader. The
authored main path is [the storyboard](storyboard.md), with [the cast registry](cast.md) and
[the coverage matrix](coverage.md).
