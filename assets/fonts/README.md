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

## Futura Handwritten — checked on 9 October 2026, not bundled

The reader package was asked to package the project typeface locally if its redistribution could be established. It was checked and it could not, so the font is **named first in the CSS stack and not shipped**. A reader who already has it installed gets it; everyone else gets the bundled DejaVu Sans. This is recorded here rather than left as a silent omission, and the issue's typography criterion stays unchecked.

What was actually looked at, and what each thing says:

| Checked | Finding |
| --- | --- |
| [dafont listing](https://www.dafont.com/futurahandwritten.font) | Labelled "100% Free". The author's note reads "Feel free to use this font for anything you want", asks for optional credit, and says nothing about redistributing the file. |
| [dafont's own FAQ](https://www.dafont.com/faq.php) | "The licence mentioned above the download button is just an indication. Please look at the readme-files in the archives or check the indicated author's website for details." So the label is not the licence. |
| The downloaded archive | Contains `FuturaHandwritten.ttf` and nothing else. No readme, no licence file. SHA-256 `15cc7ec3af6ae564792ce94d16c10c7d48eea197470ecb40705de4949bc45465`, 51,012 bytes. |
| The font's own metadata | The `name` table carries a copyright record of `BillySnyderPixelfailurecom` and **no** licence description (name ID 13) and **no** licence URL (name ID 14). |
| pixelfailure.com | Reachable, but carries no font page, no terms, and no redistribution statement. |
| [ncase/trust](https://github.com/ncase/trust), the reference site | Does bundle `css/FuturaHandwritten.ttf`, but its CC0 `LICENSE` covers Nicky Case's own work; the README lists the font separately under third-party resources. Another project shipping the file is not permission from its author. |

The blocker is specific, not a general caution. Broad permission to *use* a font is not permission to *redistribute* the file, and this project's offline deliverable embeds the font bytes in a document that is handed to other people — redistribution in the plainest sense. There is also no licence text to travel with it, which is the condition the bundled DejaVu licence exists to satisfy.

What would unblock it: written permission from Billy Snyder to redistribute the file, or a licence text accompanying the font. Either would be recorded in the table at the top of this file with the same fields — file, upstream, obtained from, date, size, SHA-256, licence, redistribution — after which `FONT` in [`src/build/assets.js`](../../src/build/assets.js) points at it and the notice and licence are embedded in both artifacts, exactly as DejaVu's are today.

No lookalike was substituted. All lettering in the essay is browser text, so the typeface is a presentation choice and nothing in the argument depends on it.
