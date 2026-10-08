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
| P6 | Offline export and Vercel release | Tested single HTML submission and verified hosted site from the same revision | P5 integrated complete essay |

## Dependency evidence

These are implementation input boundaries, not scheduling preferences:

- **P3 requires P2** because the reader consumes the chapter/scene/cast/source contract and browser/build entry points delivered by the foundation. See `docs/architecture.md`, "Content contract" and "Handoffs that create real prerequisites."
- **P5 requires P1, P3, and P4** because completing integration requires the audited narrative, the working reader, and the original illustrations. Placeholder data or art does not count as the complete essay.
- **P6 requires P5** because release checks and submission packaging must cover the integrated complete essay, not an empty shell.
- P1, P2, and P4 have no hard blockers between them. The parent is membership context, not a dependency.

Only these evidenced same-repository edges belong in canonical TicketSpecs/Beads. The publisher has verified the child contracts, classification labels, and dependency edges. Parent membership remains reference context.

## Publication state

The [asset workflow](asset-workflow.md) and [first generated character sheet](../assets/concepts/stickman-character-sheet-v1.png) provide an initial visual seed for P4. Reusable production parts, scene animation, static descriptions, and narrative-specific scene assets still remain in that package. This chat supplies additional generated-art requests as described in [autonomous build](autonomous-build.md).

The original publication left all tickets unqueued. The owner's 9 October overnight-build request separately authorizes #2–#7; the canonical publisher applies exact `agent:ready` for that batch. The parent index remains unqueued. Registration alone does not start implementation; live issue and dispatcher states show whether a package is queued, waiting on a prerequisite, running, or complete.

## Issue index

- [Deliver the illustrated happiness essay: project index](https://github.com/duckycodess/what-it-takes-to-be-happy/issues/1)
- [Draft the complete multi-perspective storyboard and audit its sources](https://github.com/duckycodess/what-it-takes-to-be-happy/issues/2)
- [Establish the static application foundation and editable content contracts](https://github.com/duckycodess/what-it-takes-to-be-happy/issues/3)
- [Build the responsive reader, chapter navigation, sources, and reading view](https://github.com/duckycodess/what-it-takes-to-be-happy/issues/5)
- [Create original emotional stickmen and explanatory scene assets](https://github.com/duckycodess/what-it-takes-to-be-happy/issues/4)
- [Integrate the complete six-chapter essay, dialogue, scenes, and reflection](https://github.com/duckycodess/what-it-takes-to-be-happy/issues/6)
- [Package the offline submission and deploy the reviewed essay to Vercel](https://github.com/duckycodess/what-it-takes-to-be-happy/issues/7)
