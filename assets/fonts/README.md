# Bundled fonts

Two faces, with different rights, different jobs, and different outputs.

## Futura Handwritten — the project typeface, served by the hosted site

| Field | Record |
| --- | --- |
| File | `FuturaHandwritten.ttf` |
| Family | `FuturaHandwritten`, style `Medium`. The stylesheet declares it as `'Futura Handwritten'`, which is the name of the `@font-face` rule rather than a name resolved on the reader's machine. |
| Author | Billy Snyder |
| Obtained from | <https://www.dafont.com/futurahandwritten.font>, through that page's own download link, on 9 October 2026 |
| Archive | `futurahandwritten.zip`, 35,565 bytes, SHA-256 `3f09f1a713d83c8abc0ec07975da87a95c9afdaf0a18ba217a492cbbd2ddd291`, one entry and no others: `FuturaHandwritten.ttf` |
| Size | 51,012 bytes |
| SHA-256 | `15cc7ec3af6ae564792ce94d16c10c7d48eea197470ecb40705de4949bc45465` |
| Format | TrueType, unconverted. The committed file is byte-identical to the archive entry; nothing was subset, re-hinted, or re-compressed, so this one digest covers both the source and what is served. |
| Coverage | 219 code points. Latin, the punctuation this essay uses, and accented characters — but no en dash, which the fallback draws. |
| Permission | The author's note on the page above: *"Feel free to use this font for anything you want. Crediting me would be absolutely wonderful, but I can't expect everyone to do it, so it isn't required."* The owner accepted this direct grant from the author as the basis for using the face on this website, on 9 October 2026. |
| Where it is served | The hosted site only, from `assets/fonts/FuturaHandwritten.ttf` on this project's own origin. It is **not** embedded in `dist/offline.html`, and the build fails if it ever is. |

### What this permission is, and what it is not

It is the author's own words, on the author's own listing, granting use. It is the basis the owner
chose, and the credit it does not require is given anyway, in the colophon of every hosted page.

It is **not** a named public licence. Do not describe this font as CC0, OFL, GPL, or public domain.
Three things in particular were checked and are not true:

| Checked | Finding |
| --- | --- |
| dafont's "100% Free" label | [dafont's own FAQ](https://www.dafont.com/faq.php) says the label above the download button "is just an indication" and points to the archive's readme or the author's site instead. The archive has no readme. So the label is not the licence. |
| The font's own metadata | The `name` table carries a copyright record of `BillySnyderPixelfailurecom`, and **no** licence description (name ID 13) and **no** licence URL (name ID 14). There is no licence text to travel with the file. |
| [ncase/trust](https://github.com/ncase/trust), the reference site | It bundles this font, but its CC0 `LICENSE` covers Nicky Case's own work and its README lists the font separately under third-party resources. Another project shipping the file is not permission from its author. |

That is why the font is served and not redistributed. Serving it is this site using the face, which
is what the author's note is about. Embedding the bytes in a single HTML file and handing that file
to someone else is a copy travelling on its own, with no licence text accompanying it, and nothing
read above establishes a right to do that. `src/build/verify.js` enforces the distinction:
`auditProjectFontIsHostedOnly` fails the build if the offline output contains the font's bytes, a
URL pointing at it, or even its family name in a stack it has no face for.

If that ever changes — a written grant from Billy Snyder, or a licence text accompanying the font —
the offline file can carry it, and the change is to that audit and to this table.

### Replacing or updating it

Record every field in the table above against the file you actually have, not against the one
recorded here. `test/fonts.test.js` pins the size and digest, so a different file fails the suite
until the record is deliberately changed. If a future version is converted — subset, or turned into
WOFF2 — the output is a different file and needs its own size and digest beside the source's, since
the digest of a TrueType original says nothing about a conversion of it.

## DejaVu Sans — the fallback, bundled in every output

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

It has two jobs. On the hosted page it stands behind the project typeface and draws what that face
has no glyph for — on the current content, exactly one character, the en dash, which
`test/fonts.test.js` checks against both `cmap` tables rather than assuming. In `dist/offline.html`
it is the only face, which is why that file carries a second, standalone credit rather than the
hosted one.

Nothing about this file is a design decision. It is the readable floor under the typeface.

## How the two are wired

[`src/build/assets.js`](../../src/build/assets.js) holds both records, the URL placeholder for each
`@font-face` rule, and the markers around the stylesheet's hosted-only region.
[`src/runtime/styles.css`](../../src/runtime/styles.css) declares the fallback at the top, for every
output, and declares the project typeface inside `hosted-only:start` / `hosted-only:end` along with
the measure and leading tuned to it. The build keeps that region for `dist/index.html` and removes
it for `dist/offline.html`, so the offline file cannot name a face it does not carry.

The project typeface's `src` is a URL and nothing else. There is deliberately no `local()`: a font
of the same name installed on a reader's machine would otherwise stand in for the file whose
provenance is recorded here, and no test could tell the two apart.
