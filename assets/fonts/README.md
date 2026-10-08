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
| Redistribution | Permitted, including inside a larger package, provided the copyright and permission notice travels with it. The licence text is committed beside the file and is embedded in the offline HTML. |

**This is not the essay's typeface.** The agreed reference typography is Futura Handwritten ([art direction](../../docs/art-direction.md)). DejaVu Sans is committed here for one reason: the foundation needed a real, openly licensed binary font to prove that a font can be embedded in the hosted build and in the directly opened offline file with no network request. It is the last fallback in the stack and is replaced when the licensed project typeface is added.

Nothing about this file implies a design decision. Replacing it means dropping the new face into this directory, recording the same fields above, and pointing `FONT` in [`src/build/assets.js`](../../src/build/assets.js) at it.
