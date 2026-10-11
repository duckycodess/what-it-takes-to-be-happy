# The approved essay, as supplied

This directory holds the owner-approved replacement copy for
[#17](https://github.com/duckycodess/what-it-takes-to-be-happy/issues/17), exactly as it was
handed over on 11 October 2026. Nothing in it is edited here. It is the source the website's
content document is transferred from, in the same way
[the approved scene script](../redesign/approved-scene-script.md) was the source before it.

| File | What it is |
| --- | --- |
| `full-essay-v2.md` | The approved essay as a reader-legible document: eight chapters, 31 parts, and the Sources & Credits page. SHA-256 `b96ca869…c524c`. |
| `full-essay-handoff-v2.json` | The same copy in machine form, with paragraph boundaries, a SHA-256 for every part's copy, stable source identities, the selected artwork with its paragraph anchors, the approved interface strings, and the old-address relocations. SHA-256 `35a56e6e…c872c`. |
| `integration-authorization.json` | The authorization record, binding both checksums. |
| `integration-owner-handoff.md` | What the owner approved, and what is still pending. |

Both checksums are recorded in `src/content/transfer.js` and re-verified on every transfer and on
every `npm run validate`, so the published copy cannot drift from the approved copy without a
check failing.

**Two documents, cross-checked against each other.** The transfer builds the content document from
the JSON, because that is the form with paragraph boundaries and anchors in it; it then asserts
that every part's copy appears verbatim in the Markdown and that the Markdown's own SHA-256 is the
approved one. Neither file is retyped, and a disagreement between them fails rather than ships.

**What is approved, and what is not.** The copy and the Sources & Credits page are approved for
exact integration. The owner's final desktop and phone readability review is **pending**, and
production release is **not authorized**. See
[the amendment in decisions](../decisions.md#owner-amendment--11-october-2026-how-the-essay-is-read).
