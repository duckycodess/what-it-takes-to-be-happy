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

The initial publication preserved a failed result: **248 tests, 231 passed, 17 failed**, exit code 1. That historical result was repaired; it was not replaced by narrower checks.

The repair verification ran `npm run check` successfully: **249 tests passed, zero failed, skipped or cancelled**, followed by a successful normal hosted build. Coverage now describes all 31 approved parts; stale browser drivers use current identifiers and measure the rendered pair anchors, including wrappers using `display: contents`. The corpus command writes synchronously so a piped export cannot lose its final paragraphs. The approval-guard test mutates a scratch checkout rather than the real corpus another suite may read.

The Sources page now follows the approved paragraph order and includes References. Keyboard passage focus marks its title without outlining the whole reading column; interactive control focus remains visible. The immutable essay, ordered handoff and content document checksums above are unchanged. A separate editorial audit passed all 123 paragraphs, 26 sources and 45 historical address relocations.

## Required before merge and release

- Obtain genuine independent approval of the exact final pushed head, plus manager signoff and dispatcher merge gates. Passing implementation checks do not manufacture that evidence.
- Verify the hosted preview of that same revision, including network-loaded fonts/artwork, source return, phone/desktop reading and complete print.
- Obtain owner final readability/layout approval and separate production release approval. Production remains at the recorded baseline until an approved same-revision release is tested and promoted.

No additional artwork or retired offline deliverable is required. Preserve research, font and artwork provenance.
