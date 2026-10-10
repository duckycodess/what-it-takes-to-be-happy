# Proposal

## Why

The static reader and drawing system currently display a nine-beat non-final fixture, while the audited 87-beat storyboard already holds the full argument. Issue #6 turns that editorial work into the actual readable website without losing its evidence levels, dissent, or accessibility in the transfer.

## What Changes

- Replace fixture chapters, prose, cast, concepts and optional details with the storyboard's opening and six questions in stable `c0`–`c6` / `s001`–`s087` order, with member-endorsed dialogue and authoring-only provenance.
- Carry essential source findings, caveats, class concepts, standpoint, proposals and unresolved questions in the main reading path; preserve audited R01–R32 attribution and evidence levels.
- Match each beat's visible art and emotional state to its explanatory purpose with original drawings, reusing/expanding the existing SVG vocabulary. Draw at least 86 of 87 beats, with `s087` explicitly text-only as a source-register handoff; no pending-art frames or geometry claims that the drawing contradicts.
- Add narrowly supplementary details where justified, plus coverage, visual and reader tests and actual reading-time evidence.

## Capabilities

### New Capabilities

- `integrated-essay`: The published reader carries the complete sourced narrative and consistent presentation/reading/print routes.
- `explanatory-scenes`: Original visual and optional detail states support the authored argument without hiding essential meaning.

### Modified Capabilities

None (this checkout has no existing OpenSpec capability specs; the repository content contract remains authoritative).

## Impact

`content/content.json`, `src/content/schema.js`, `src/content/validate.js`, `src/art/`, `src/runtime/`, `test/`, `README.md`, `docs/content-contract.md` and the specific documentation that currently describes the fixture or art coverage. Setting `status.final: true` also changes the generated robots metadata to indexable; #7 still owns actual release. No backend, new runtime dependency, production deployment or offline-submission obligation. The hosted Vercel site is the deliverable under the 9 October owner amendment; #7 owns publication and removal of `dist/offline.html` from published output.
