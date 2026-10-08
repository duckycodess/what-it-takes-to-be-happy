# Work plan

Repository/documentation setup is complete when the seed documents and source snapshots are pushed. The work below is application/editorial implementation, tracked through one unqueued parent index and six canonical child tickets. Future notes are inputs, not a reason to block all current work.

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

Only these evidenced same-repository edges belong in canonical TicketSpecs/Beads. The issue index will be filled with actual publication URLs after the tickets exist.

## Publication state

All tickets are unqueued. Exact `agent:ready` is reserved for a later explicit authorization. Registration alone does not start implementation, and the parent index is not an implementation task.

## Issue index

Actual issue links will be added after canonical publication.
