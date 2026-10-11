# Proposal

## Why

The 87-beat site repeats explanations, uses manually drawn production art and frames, and has apparatus in the main flow. The owner approved a replacement 45-scene script and opening art at the immutable handoff commit `a68180cf3e44e65f1a1771f023e044e34c361d7e`; integration must not improvise copy or substitute art.

## What Changes

- Replace the old presentation with s088–s132 in the handoff's eight chapters, exact reader and Sources & Credits copy, and the numbered claim-to-source map.
- Use inspected generated art, browser-text names/dialogue, frameless responsive layout and still states; make two comparisons optional.
- Retain scene traversal, chapter revisiting, continuous/scriptless/print completeness and font, with a separate source page that restores scene and mode.
- Retire old-scene transfer contracts and replace them with exact approved-copy and asset-integrity tests; update active guidance, retaining historical records.
- **Gate:** Only A01 exists now. The remaining 19 art records (A02–A18 including a/b refs; A16 and A18 each require separate usable pair cutouts) need inspected asset-only handoffs with prompts, checksums and anchors. Prepare source checks and `docs/art-requests.json` on the issue branch while waiting; do not hand-draw substitutes or treat incomplete art as optional. No production integration before all required art arrives.

## Capabilities

### New Capabilities

- `approved-essay`: Authoritative copy, citation, visual and interaction parity across all reader routes.
- `sources-return`: Claim-level numbered links, separate full credits and restoration of reading context.

### Modified Capabilities

None in the base specs; the older in-flight six-chapter change is historical, not a canonical spec.

## Impact

`content/`, `src/content/`, `src/art/` (retire old geometry and storyboard map), `src/runtime/`, `src/build/`, `test/`, `docs/`, `assets/generated/`, `openspec/`. The application remains static and dependency-light. No release or offline deliverable change (#7 owns removing the export from publish output). No production deployment.
