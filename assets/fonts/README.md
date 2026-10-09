# Bundled fonts

## DejaVu Sans — temporary fallback, not the project's typeface

| Field | Record |
| --- | --- |
| File | `DejaVuSans.ttf` |
| Family | DejaVu Sans, Book |
| Upstream | <https://dejavu-fonts.github.io/> |
| Obtained from | Debian/Ubuntu package `fonts-dejavu-core` 2.37-8build1, `/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf` |
| Added | 9 October 2026 |
| Size | 759,720 bytes |
| SHA-256 | `b4c632e3cdf9acc7f28758fb5a323c8524d7fc6660d46904d9b6cbe2809c419c` |
| Licence | Bitstream Vera Fonts Copyright; DejaVu changes in the public domain. Full text in [`DejaVuSans.LICENSE.txt`](DejaVuSans.LICENSE.txt). |
| Redistribution | Permitted, including inside a larger package, provided the copyright and permission notice travels with it. The licence text is committed beside the file and is rendered into every output that embeds the font. |

**This is not the essay's typeface.** The agreed reference typography is Futura Handwritten ([art direction](../../docs/art-direction.md)), retained by the 9 October owner amendment. DejaVu Sans is committed here for one reason: the foundation needed a real, openly licensed binary font to prove that a font can be served from the build with no third-party request. It is the last fallback in the stack and is replaced when the project typeface is added — which needs that font author's actual applicable permission first, since serving a webfont is redistribution. Issue [#5](https://github.com/duckycodess/what-it-takes-to-be-happy/issues/5) owns both.

Nothing about this file implies a design decision. Replacing it means dropping the new face into this directory, recording the same fields above, and pointing `FONT` in [`src/build/assets.js`](../../src/build/assets.js) at it.
