# Confirmed decisions

The user confirmed the shared brief and subsequently requested repository creation, documentation, canonical tickets, and Vercel as the hosting target. These decisions override earlier proposals in the imported Website ideas tab.

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
| Typography | Futura Handwritten reference typography | Preserve readable long-form text on both layouts |
| Opening | Working question title, emotional stickmen, everyday snapshots, different readings | Opening does not dictate every chapter's method |
| Ending | Concrete changes at several scales plus unresolved questions | Explain tradeoffs and avoid guaranteed-happiness claims |
| Notes | Repository deltas will expand contributions | Reconcile them into the story rather than append an unrelated tail |
| Hosting | Vercel | Keep the offline website submission file too |
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
