# Scratch transition assets

These three files are Nicky Case's own, copied unchanged from
[The Evolution of Trust](https://github.com/ncase/trust) at commit
`6ec45d73befdb922bd40654dd1c1c903a953562f`, so the page transition is the original erase-and-redraw
rather than an imitation of it:

| File | Original path | Use |
| --- | --- | --- |
| `scratch.png` | `assets/ui/scratch.png` | 2 × 20 frame sprite sheet (1422 × 8000). The left column scribbles over the page, the right column rubs the scribble out. |
| `scratch_in.mp3` | `assets/sounds/scratch_in.mp3` | Played as the page is scribbled over. |
| `scratch_out.mp3` | `assets/sounds/scratch_out.mp3` | Played as the next page is revealed. |

The reference project is dedicated to the public domain under
[CC0](https://github.com/ncase/trust/blob/gh-pages/LICENSE). Its README thanks third-party sources
for music and some sounds; the scratch sounds are not among those it credits separately. Attribution
is not required but is kept here, in `manifest.json`, and in `docs/decisions.md`.

Behaviour follows `js/core/Scratcher.js` and the `.scratcher` rule in `css/slides.css`: frames advance
every 40 ms, each phase's sound starts 100 ms in, and the page changes only between the two phases.
The build refuses to publish these files if their digests differ from `manifest.json`.
