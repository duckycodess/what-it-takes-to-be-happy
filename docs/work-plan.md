# Work plan

Repository/documentation setup is complete when the seed documents and source snapshots are pushed. The work below is application/editorial implementation, tracked through one unqueued parent index and six canonical child tickets. On 9 October the owner authorized autonomous implementation of those six packages. Future notes are inputs, not a reason to block all current work.

## Packages

| Key | Work package | Deliverable | Real prerequisites |
| --- | --- | --- | --- |
| P0 | Project index | Links to the six packages and the agreed outcomes | None; an index does not block children |
| P1 | Editorial storyboard and source audit | Complete six-question storyboard, supported claims, visible limits, reflection, shared voices | Existing source notes and brief |
| P2 | Static foundation and content contracts | Small implementation, stable chapter/scene/cast/source interfaces, actual documented commands | Existing architecture contract |
| P3 | Reader and reading views | Responsive landing, Next/Back, chapter shortcuts, sources, optional detail, reading/print view | P2 content/runtime interfaces |
| P4 | Original artwork and explanatory scene assets | Emotional original cast, illustrations, motion/static descriptions following the storyboard | Existing art/content plans; can begin alongside P1/P2 |
| P5 | Complete narrative integration | Reviewed story and original scenes wired into reader, with full visible coverage | P1 audited storyboard, P3 working reader, P4 original scene assets |
| P6 | Vercel release | Verified hosted preview and production site built from the reviewed revision | P5 integrated complete essay |

## Dependency evidence

These are implementation input boundaries, not scheduling preferences:

- **P3 requires P2** because the reader consumes the chapter/scene/cast/source contract and browser/build entry points delivered by the foundation. See `docs/architecture.md`, "Content contract" and "Handoffs that create real prerequisites."
- **P5 requires P1, P3, and P4** because completing integration requires the audited narrative, the working reader, and the original illustrations. Placeholder data or art does not count as the complete essay.
- **P6 requires P5** because release checks must cover the integrated complete essay on the deployed site, not an empty shell.
- P1, P2, and P4 have no hard blockers between them. The parent is membership context, not a dependency.

Only these evidenced same-repository edges belong in canonical TicketSpecs/Beads. The publisher has verified the child contracts, classification labels, and dependency edges. Parent membership remains reference context.

## Publication state

The [asset workflow](asset-workflow.md) and [first generated character sheet](../assets/concepts/stickman-character-sheet-v1.png) provide an initial visual seed for P4. Reusable production parts, scene animation, static descriptions, and narrative-specific scene assets still remain in that package. This chat supplies additional generated-art requests as described in [autonomous build](autonomous-build.md).

The original publication left all tickets unqueued. The owner's 9 October overnight-build request separately authorizes #2–#7; the canonical publisher applies exact `agent:ready` for that batch. The parent index remains unqueued. Registration alone does not start implementation; live issue and dispatcher states show whether a package is queued, waiting on a prerequisite, running, or complete.

## Owner amendment — issue #12

[#12, Record hosted-only delivery and retain the agreed Futura typography](https://github.com/duckycodess/what-it-takes-to-be-happy/issues/12), amends the packages above without rewriting their canonical ticket text. [The decisions record](decisions.md#owner-amendment--9-october-2026) is the canonical statement; this table names which clauses it supersedes, so a worker reading an older ticket can see what no longer applies.

| Amended | Clause now superseded | What applies instead |
| --- | --- | --- |
| [#1](https://github.com/duckycodess/what-it-takes-to-be-happy/issues/1) index | The agreed outcome including a self-contained offline submission file | The hosted Vercel site is the deliverable; the index otherwise stands |
| [#5](https://github.com/duckycodess/what-it-takes-to-be-happy/issues/5) reader | Any acceptance tied to offline font distribution | #5 owns verifying the font author's actual applicable permission and implementing real Futura Handwritten web typography. The reference project's CC0 covers Nicky Case's own work, not this font |
| [#6](https://github.com/duckycodess/what-it-takes-to-be-happy/issues/6) integration | Offline parity as an integration criterion | #6 owns the complete essay integration; the hosted page is what the integrated essay must be correct in |
| [#7](https://github.com/duckycodess/what-it-takes-to-be-happy/issues/7) release | Offline export, network-disabled `file://` acceptance, and hosted/offline parity as release gates | #7 owns exact-revision hosted preview and production verification, and owns removing `dist/offline.html` from the published output and any production download link. That code change is **not yet made** — the current build still writes it |

Everything the amendment leaves alone stays as written: the original Trust-style artwork, names above heads as browser text, phone and desktop reflow, chapter revisiting, the full reading and print view, and every visible finding and caveat. The canonical issue bodies, the TicketSpec UUIDs, and the real Beads dependency edges are unchanged; this amendment is recorded here rather than by rewriting any package's contract.

## Issue index

- [Deliver the illustrated happiness essay: project index](https://github.com/duckycodess/what-it-takes-to-be-happy/issues/1)
- [Draft the complete multi-perspective storyboard and audit its sources](https://github.com/duckycodess/what-it-takes-to-be-happy/issues/2)
- [Establish the static application foundation and editable content contracts](https://github.com/duckycodess/what-it-takes-to-be-happy/issues/3)
- [Build the responsive reader, chapter navigation, sources, and reading view](https://github.com/duckycodess/what-it-takes-to-be-happy/issues/5)
- [Create original emotional stickmen and explanatory scene assets](https://github.com/duckycodess/what-it-takes-to-be-happy/issues/4)
- [Integrate the complete six-chapter essay, dialogue, scenes, and reflection](https://github.com/duckycodess/what-it-takes-to-be-happy/issues/6)
- [Package the offline submission and deploy the reviewed essay to Vercel](https://github.com/duckycodess/what-it-takes-to-be-happy/issues/7) — title predates the amendment; the offline half is retired, see the table above
- [Record hosted-only delivery and retain the agreed Futura typography](https://github.com/duckycodess/what-it-takes-to-be-happy/issues/12) — the amendment itself
