# Art direction

## Reference and original work

Use [The Evolution of Trust](https://ncase.me/trust/) as the presentation and typographic reference: expressive stickman line art, a clean background, strong centered opening typography, and illustrations that change alongside an explanation. Create original characters, poses, compositions, scene assets, and prose.

The user explicitly wants a close match to that drawing style. Start from the opening-page figures: large white rounded heads, tiny dot or curved eyes, compact tapered bodies, short legs, sparse arms, and slightly imperfect charcoal outlines. Use restrained pink cheeks or other emphasis when useful. Avoid turning the cast into detailed human illustrations.

The reference source [defines Futura Handwritten](https://github.com/ncase/trust/blob/gh-pages/css/slides.css), and the 9 October owner amendment **retained it**: it is the project typeface, and no substitute face is accepted. It is now **loaded**, served from this site's own origin as a linked asset, and it sets the whole essay — prose, dialogue, headings, and the names above the figures — not only the display lines. The bundled DejaVu Sans stands behind it for anything it has no glyph for.

Its [font page](https://www.dafont.com/futurahandwritten.font) identifies Billy Snyder as the author, and that page is the primary permission to read and record before the font ships. The [reference repository](https://github.com/ncase/trust) declares Nicky Case's own work CC0 and lists third-party resources separately; **that declaration says nothing about this font, and the two must never be conflated.** Serving a webfont from the hosted site is redistribution, so it needs the author's actual applicable permission and whatever notice that permission requires. Do not assert a web-embedding grant that has not been read. The permission that was read and accepted is the author's own note on that page — "Feel free to use this font for anything you want" — recorded in full, with the archive's checksums and what the metadata does and does not say, in [`assets/fonts/README.md`](../assets/fonts/README.md). The credit the author says is not required is given in the colophon of every hosted page. That grant is what the hosted serving rests on, which matters because serving does pass the bytes to every visitor. The font is nonetheless kept out of the single-file output, holding it inside the one context the owner approved rather than in a document that circulates with no record attached. Original drawings remain the agreed choice.

The measure and the leading were retuned to the real face rather than left where the fallback had them: Futura Handwritten sets the same sentence about 9% narrower, and its x-height is smaller, so the column is 31rem rather than 34rem and the leading 1.5 rather than 1.6. Both numbers are measured in a browser in `test/browser.test.js`, which fails if a line drifts outside a comfortable measure.

## Cast and emotional vocabulary

- TJ, Koj, and Vier have original stickman appearances and names above their heads. Nametags are the chosen identification method; accessories are optional.
- Generic fictional friends use simple original figures and may receive names when introduced. A fictional friend's example is distinct from a contributor's real reflection.
- Use expressions and posture for curiosity, joy, fatigue, frustration, sadness, uncertainty, connection, and relief. These can coexist or change across beats.
- Do not reduce a member to one philosophical position or one permanent emotion. Each may reflect, qualify, or reconsider.
- Keep names and dialogue legible text rather than baked into an image.

An [initial generated character sheet](../assets/concepts/stickman-character-sheet-v1.png) now explores TJ, Koj, Vier, and fictional friend Bob across six emotions. Its avatar details are provisional; the sheet is a visual concept rather than an approved likeness or production rig. Names are baked into this review sheet only. See [the asset workflow and exact prompts](asset-workflow.md) for generation, production preparation, animation, and provenance.

## Landing

Working title: **What Does It Take to Be Happy?** Surround the centered question with stickmen expressing different emotions or engaged in ordinary activities. Use Begin, member names, and an estimated reading time after the prose is measured. Opening art should support the broad question, not imply one correct emotional state.

## Scenes that carry meaning

Choose a composition from the current claim. Examples are possibilities, not a locked storyboard:

- Reveal time, care work, or transport behind an invitation to meet friends.
- Show a chosen challenge differently from an obligation someone cannot refuse.
- Compare the value a device opens with pressure to keep up, without declaring all objects shallow.
- Let ordinary repeated care accumulate across several beats, then show effort and boundaries.
- Revisit a joyful scene after its sustaining conditions have been explained.

Some beats reuse the scene and change expression, props, or framing. Others need a new scene. Motion illustrates the relationship; it does not replace written reasoning or research.

## Layout, motion, and readability

Use clear dark linework, a clean light background, and restrained emphasis appropriate to the reference. Built-in image generation is the chosen concept-art starting point. Exact color tokens, transition effects, and production editing tools remain implementation choices; the user does not need to learn Inkscape.

On desktop, compose text and illustration together. On phones, rearrange them with readable names and controls. Avoid shrinking a desktop stage into a tiny image. Maintain legibility for substantial prose in the chosen handwritten typography.

Keep motion readable and tied to the current beat. Reduced-motion/static equivalents preserve meaning. Optional clicks, taps, or comparisons have keyboard alternatives and never gate Next. Difficult material uses more reflective pacing while retaining the same visual language.

Audio is optional later. Text and visuals carry the complete experience.
