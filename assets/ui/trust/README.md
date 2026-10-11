# Assets from The Evolution of Trust

These four files are Nicky Case's own, copied unchanged from
[The Evolution of Trust](https://github.com/ncase/trust) at commit
`6ec45d73befdb922bd40654dd1c1c903a953562f`, so the page transition and the sound control are the
originals rather than imitations of them:

| File | Original path | Use |
| --- | --- | --- |
| `scratch.png` | `assets/ui/scratch.png` | 2 × 20 frame sprite sheet (1422 × 8000). The left column scribbles over the page, the right column rubs the scribble out. |
| `scratch_in.mp3` | `assets/sounds/scratch_in.mp3` | Played as the page is scribbled over. |
| `scratch_out.mp3` | `assets/sounds/scratch_out.mp3` | Played as the next page is revealed. |
| `sound.png` | `assets/ui/sound.png` | The Sound control: a speaker with waves (on) beside a speaker with a cross (off). |

The reference project is dedicated to the public domain under
[CC0](https://github.com/ncase/trust/blob/gh-pages/LICENSE). Its README thanks third-party sources
for music and some sounds; none of these files is among those it credits separately. Attribution
is not required but is kept here, in `manifest.json`, and in `docs/decisions.md`.

The transition follows `js/core/Scratcher.js` and the `.scratcher` rule in `css/slides.css`: frames
advance every 40 ms, each phase's sound starts 100 ms in, and the page changes only between the two
phases. The Sound control follows `#sound` in the same stylesheet and `js/main.js`: one half of the
sprite at a time, and sound on until the reader turns it off. The original sits in a dark (`#222`)
footer, so its "on" speaker is white; on this site's paper the stylesheet darkens it to the grey of
the "off" one. It stays at the top right because this reader's footer holds only Back and Next.

The build refuses to publish these files if their digests differ from `manifest.json`.
