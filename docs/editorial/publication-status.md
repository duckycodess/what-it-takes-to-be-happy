# Readability revision: draft publication status

This branch publishes the existing issue #17 implementation for review. It is a draft, not merge-ready or production-approved.

## Current authorization

The owner approved the complete replacement essay and Sources & Credits for integration on 11 October 2026: [recorded approval](https://github.com/duckycodess/what-it-takes-to-be-happy/issues/17#issuecomment-6106923541). Earlier statements that the full copy is unapproved are historical and superseded. The approved documents are preserved verbatim under this directory.

- Essay SHA-256: `b96ca8697becf3f62203341302dddb24f4050257cfc602ef89e78fb6995c524c`.
- Ordered handoff SHA-256: `35a56e6e5aaafce5ba7456f51d68cf72837351b2123ba61952507e506c872c87`.
- Content document SHA-256: `dae4ce545082a7210d4df4550ff0475056abd0783fc12ee803a90dfa9964bc23`.

The content conversion contains eight chapters, 31 parts, 123 paragraphs and 26 sources. The fidelity audit verifies paragraph text, speaker labels, source identities, selected artwork and all 45 historical address relocations. It does not certify application behavior.

Final desktop/phone owner review and production approval remain pending. Keep the production hold; the current tested production revision remains `67f571de34d932d82dfd344e3589982c495b734b`.

## Verification boundary

The captured application and test files match the isolated snapshot tested on 11 October. That snapshot passed validation and build. Separate Chrome checks at 360 and 1280 CSS pixels passed navigation, chapter links, source-return state, continuous reading, print completeness, Futura loading, selected images and horizontal overflow. The phone width was emulated; physical phones and other browser engines were not tested. This is local verification, not hosted acceptance or independent review of this pushed commit.

The full test suite remains failed: **248 tests, 231 passed, 17 failed, zero skipped or cancelled**, exit code 1. This publication does not replace that result with the successful narrower checks.

## Required before merge

- Reconcile eight coverage fixtures that still reference the old scene matrix and identifiers, preserving the assignment coverage requirements.
- Update the approval-guard test's retired document-path expectation without weakening its refusal of altered copy.
- Diagnose seven browser failures: launcher-offset expectation, three unfinished drivers, older artwork/name-count expectations and the retired `s097` pair selector. Do not assume every failure is fixture drift.
- Resolve the corpus emission failure (7,346 versus 8,595 words in the suite). Standalone pipe and file captures produced 52,599 bytes and 8,595 words; they do not clear the full-suite failure.
- Compare rendered Sources paragraph order and the References heading with the approved handoff.
- Update active repository guidance and the content contract for the approved 31-part essay; preserve historical records.
- Obtain genuine passing relevant checks, worker signoff and independent approval of the exact final pushed head. The dispatcher handles merging.
- Prepare a verified hosted preview for owner readability review. Production promotion requires separate owner approval and same-revision release checks.

No additional artwork or retired offline deliverable is required. Preserve research, font and artwork provenance.
