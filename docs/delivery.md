# Hosted delivery

Vercel hosting is the deliverable. The 9 October owner amendment discontinued the self-contained offline HTML submission file; [the decisions record](decisions.md#owner-amendment--9-october-2026) is canonical, and this page implements it. Offline evidence recorded further down is kept as a record of checks that ran, not as a requirement.

## Current state

The essay is live at **<https://what-it-takes-to-be-happy.vercel.app>**, built from
`67f571de34d932d82dfd344e3589982c495b734b`. What was deployed, what was checked on it, and what was
not, is [the release record](#the-released-site--11-october-2026) below.

That revision is **not** this branch's work. The source in this checkout is ahead of it: `npm run
build` no longer writes `dist/offline.html` into the publish directory, which is the code change
[#7](https://github.com/duckycodess/what-it-takes-to-be-happy/issues/7) owns. **Nothing built from
this head has been deployed**, and the automatic production build hold described below is still
engaged, so a push does not change what the public URL serves. The hosted files this head produces
are byte-identical to the 29 files verified in production — the change removes an output, it does
not touch the website — but identical bytes are not a deployment, and this document does not record
one until a supervised release actually happens.

## Build settings for the Vercel project

These are the actual settings the committed build needs. They are recorded in [`vercel.json`](../vercel.json) as well, so the dashboard and the repository cannot drift apart.

| Setting | Value | Where it comes from |
| --- | --- | --- |
| Framework preset | Other / none | The essay is plain static HTML, CSS, and one browser script. |
| Root directory | `./` (repository root) | `package.json` and `vercel.json` are at the root. |
| Install command | `npm ci` | Installs exactly the committed `package-lock.json`. There are no dependencies, so it is near-instant. |
| Build command | `npm run build` | Validates the content, renders the hosted site, audits it and the unpublished export, and writes `dist/`. Any failure fails the deployment. |
| Output directory | `dist` | Created by the build; it is git-ignored. |
| Node.js version | 24.x | `engines.node` in `package.json`. `.nvmrc` pins `24.15.0` for local work. |
| Production branch | `main` | The repository default. |

These are the settings the project was read back as carrying on 11 October 2026, when the site was released. If the runtime list ever stops offering 24.x, 22.x is a safe fallback: Node only runs the build, and the deployed output is static files.

### The provisioned project

Reported by the supervising chat on 9 October 2026. It supersedes the earlier same-day account reading noted under [what the build produces](#what-the-build-produces):

| Field | Value |
| --- | --- |
| Account | `duckycodess` |
| Team | `team_6bsC76CkYmknE1L4zfG0u6iv` (`tjs-projects-647180a9`) |
| Project | `prj_GwupwQaDFXj1qTtDhvFmvBatdQAo` |
| Install / build / output | `npm ci`, `npm run build`, `dist` |
| Node, root, production branch | 24.x, repository root, `main` |

These identifiers are supervision-reported rather than read from this worktree, and they were verified against the account before anything was changed there. They are where the site [was deployed on 11 October](#the-released-site--11-october-2026).

**A production hold is in force**, and it survived the release. It is the project-level *ignored
build step* command:

```sh
if [ "$VERCEL_ENV" = "production" ]; then exit 0; else exit 1; fi
```

Exit 0 tells Vercel to skip the build, so every **production** build triggered from Git is skipped
while previews still build. The live site is there because a tested prebuilt output was uploaded and
promoted under supervision, not because a push built it. The hold is deliberately still engaged: it
is what stops the then-current build — which still wrote `dist/offline.html` into the publish
directory — from republishing that file automatically. Releasing it belongs to a supervised release
of the cleaned output, after this change is reviewed and verified for its exact head, and it is not
this branch's to release. A pushed commit may produce a **Preview** deployment automatically; a
preview is not production, and its URL is not evidence that the public site moved.

The build is deterministic — nothing records a timestamp, a random value, or a machine path — so a redeploy of the same commit produces byte-identical files. A preview deployment and the production deployment of one commit are therefore comparable byte for byte.

## The released site — 11 October 2026

Deployed and tested by the supervising chat at 2026-10-11T04:34:46Z, after the owner merged
[PR #16](https://github.com/duckycodess/what-it-takes-to-be-happy/pull/16) and asked for a
deployment. Everything below is what was actually observed on a deployed URL.

| | |
| --- | --- |
| Public production URL | <https://what-it-takes-to-be-happy.vercel.app> |
| Production deployment | `https://what-it-takes-to-be-happy-756xfa5p9-tjs-projects-647180a9.vercel.app`, id `dpl_3i39kDMHHdYdZbXVW6TpydWG9Ldu` |
| Tested preview | `https://what-it-takes-to-be-happy-qufj66vzk-tjs-projects-647180a9.vercel.app`, id `dpl_BRuehcbtuzKZWQYqTheb4jdg2SYV` |
| Source revision | `67f571de34d932d82dfd344e3589982c495b734b` — the merge of #16, whose tree is identical to the independently reviewed head `57193eadaff1ee8563e307d718352f12a9b82566` |
| Where | Account `duckycodess`, team `team_6bsC76CkYmknE1L4zfG0u6iv` (`tjs-projects-647180a9`), project `prj_GwupwQaDFXj1qTtDhvFmvBatdQAo` — each verified before anything was changed |
| Settings in force | Framework *Other*, root `./`, `npm ci`, `npm run build`, output `dist`, Node 24.x, production branch `main` — the table above, read back from the project |

**How it got there.** The production deployment is a promotion of a tested prebuilt static output,
built from an isolated git archive of that exact merge rather than from a working tree. No source
file and no reader copy was changed to make it. One file was left out of the package by hand:
`offline.html`. That omission is why `/offline.html` answers 404 on the live site, and it says
nothing about what `npm run build` did at that revision — at `67f571d` it still wrote the file, and
removing it is this branch's change.

**Checked over public HTTP, unauthenticated.** All **29** published files were fetched from the
production URL and their SHA-256 digests compared against the reviewed build: all 29 match. That is
the whole published tree — `index.html`, `sources.html`, `styles.css`, `reader.js`, both fonts, the
bundled font's licence and all 22 selected PNGs — and no other path was hashed. `/offline.html`
returns 404; so does `/favicon.ico`, which the site does not carry.

**Checked in a real browser**, Windows Chrome 154, at actual 360 and 1280 CSS-pixel viewports, on
both the production and the preview deployment:

- The landing, Begin, Next, Back and Read again; all eight chapter jumps; all 45 scenes read
  continuously.
- Reading mode carried in the address, and Sources & Credits returning to the scene *and* the mode
  it was left from.
- All 22 unique drawings loaded over the deployment's own requests; one `FontFace` for
  `Futura Handwritten` reported `loaded`, with the bundled fallback unused; the stylesheet and the
  browser script fetched as real responses rather than from a local copy.
- Both optional comparison states.
- **Print, complete**: the deployed essay printed to a 45-page PDF containing every one of the 45
  scene titles and all 147 approved reader text parts. Pages 1, 23 and 45 of the preview's PDF were
  looked at; nothing was clipped or missing on them.

The preview is behind the project's access protection and was reached with short-lived same-project
OIDC authentication, origin-scoped in the browser. Production was tested with no credentials at all.
No token is recorded here or anywhere else in this repository, and none should be.

**Limits, stated rather than omitted.** No physical phone — 360 pixels was an emulated viewport. No
browser engine other than Chrome. No physical printer; the print evidence is a PDF and three
rasterised pages of one. Nothing here says anything about a screen reader.

**Where the evidence is.** The supervising chat's `hosting-check` working directory holds
`release-verification.json`, `release-package.json`, `preview-release-verification.json`,
`production-deployment-readback.json`, `production-http-verification.json`,
`issue7-release-handoff.md`, and the `preview-evidence/` and `production-evidence/` captures. Those
files are **outside this repository** and are not reproducible from it; the deployment ids, the
revision and the digests above are recorded here so the record survives without them.

## What the build produces

| Path | Role |
| --- | --- |
| `dist/index.html`, `dist/sources.html` | The essay and the separate Sources & Credits page. They link `styles.css`, `reader.js`, and the asset files so a browser can cache them. |
| `dist/styles.css`, `dist/reader.js` | The shared stylesheet and browser script. |
| `dist/assets/fonts/` | The project typeface, the bundled fallback font, and the fallback's licence text. |
| `dist/assets/generated/` | The 22 selected drawings, as the committed files the pages link. |

`npm run build` writes those files and **nothing else**: 21.3 MB in total, 29 files, of which the
first page is 66 KB of HTML plus the one eagerly loaded illustration.

`dist/offline.html` is no longer among them. The single self-contained file is retained tooling, and
only `npm run export:offline` writes it; a normal build clears `dist/` first, so a file an export
left behind cannot reach a deploy. Every build still **renders and audits** it in memory — those
packaging audits are what prove the hosted page's resources are all committed and accounted for, so
they are worth running on the path a deployment actually takes — and the build reports its 45.7 MB
as audited but not published. The export carries the bundled fallback and no other face: the
project typeface is served by the hosted site under the author's own grant and is deliberately kept
out of a file that would circulate on its own, so the build fails if a trace of it reaches that
output. It is not submitted, its size is not a release concern, and hosted/offline parity is not an
acceptance criterion.

Two consequences worth stating plainly, because both are easy to get wrong:

- **Only the output of a normal build is publishable.** `npm run export:offline` adds a 45.7 MB file
  to the same directory. Uploading a prebuilt `dist/` that an export has since been run in would
  publish it. Rebuild before deploying — `test/build.test.js` checks that the rebuild takes the file
  back out — or let Vercel run `npm run build` itself.
- **No hosted page links the export.** A deployment that does not serve `/offline.html` and a page
  that offers it as a download would be a broken promise to a reader, so both pages are checked for
  that link, and the preview server — which serves `dist/` exactly as a static host does — is
  checked to answer `/offline.html` with a 404 after a normal build.

This is the code change [#7](https://github.com/duckycodess/what-it-takes-to-be-happy/issues/7)
owns, and it is made here. It is **not** what produced the 404 on the deployed site: that release
was a manual package of the same reviewed build with `offline.html` left out by hand, at a revision
whose own `npm run build` still wrote the file.

An earlier reading on 9 October 2026 found authenticated personal account `duckycodess` with no teams and no project matching `what-it-takes-to-be-happy`. That observation is superseded by the provisioned project recorded above, which was reported later the same day.

## Vercel path

Use a Vercel static deployment for the implemented application. The official [deployment documentation](https://vercel.com/docs/deployments) supports Git, CLI, and other deployment paths. [Vercel's GitHub integration](https://vercel.com/docs/git/vercel-for-github) supplies preview deployments for review and a production branch for the final site.

Prefer ordinary Git integration when suitable rather than adding a custom deploy pipeline for this static essay. Once application tooling exists, record the actual project root, build command if needed, output directory, team/project, production branch, and verified URLs. A docs-only repository should not be presented as a finished website deployment.

Before release, verify the intended Vercel account/team, project, commit, and environment against the table above. Use existing authenticated access. Do not store authentication secrets in the repository. Record a tested preview, then the production URL and the exact revision it was built from.

## What the hosted page must carry

The hosted page must be self-sufficient against its own committed resources: the project font, the artwork, the stylesheet, and the browser script are served from the deployment, not from a third party, and no essential text waits on a runtime fetch of Google Docs, a font service, an image host, or scene data. External source destinations stay ordinary links; their labels, claim context, and limitations are readable without following them.

The project typeface is Futura Handwritten by Billy Snyder, served from this origin under the author's own note on [his font page](https://www.dafont.com/futurahandwritten.font): "Feel free to use this font for anything you want." The record — source, archive checksums, and the three things that were checked and are *not* true of it — is in [`assets/fonts/README.md`](../assets/fonts/README.md), and the credit the author says is not required appears on the hosted Sources & Credits page, which
names the face, links its font page and attributes it to Billy Snyder. *(Until 10 October it
appeared in a colophon on every page; the approved script puts credits there instead and allows no
credits footer in a scene.)* It is not a named public licence — not CC0, not OFL — and it is the whole basis for serving the face here, since a webfont is delivered to every reader's browser. The file is deliberately kept out of any output handed to someone else, which holds it inside the context the owner approved.

Commands:

```
npm ci                  # install (no dependencies; just verifies the lockfile)
npm run validate        # content contract check
npm test                # validator, renderer, packaging, and preview checks
npm run build           # the hosted site into dist/, and nothing else
npm run export:offline  # dist/offline.html only (retained tooling, not published)
npm run preview         # serve dist/ at http://localhost:4173
```

### Historical offline evidence

Recorded on 9 October 2026, before the amendment, against `dist/offline.html` opened through a `file://` URL in headless Chrome with name resolution disabled (`--host-resolver-rules="MAP * ~NOTFOUND"`) and the proxy pointed at a dead port: the landing, Begin, Next, Back, arrow keys, chapter shortcuts, the reading view, the embedded illustration, and the embedded font all worked, and printing from a single beat still produced the complete 13-page essay. This is a record of a check that ran against the non-final fixture. It is not a release gate, and nothing is required to reproduce it.

## Hosted release checklist

Complete this for the reviewed, integrated essay, not for a fixture. Offline submission and hosted/offline parity are deliberately absent. [The release record](#the-released-site--11-october-2026) is this list answered for `67f571d`; the state after each line is what that release reached, and the same list applies again to any later release.

- The exact commit the release was built from, and the checks that passed on it. **Done:** `67f571de34d932d82dfd344e3589982c495b734b`.
- The actual preview URL, and the actual production URL, each recorded verbatim rather than described. **Done**, with their deployment ids.
- Both URLs confirmed to serve that exact commit. **Done** by digest: all 29 published files on each match the reviewed build.
- The project typeface, the artwork, the stylesheet, and the browser script all actually loading on the deployed page — observed on the deployment, not inferred from the build. **Done:** `Futura Handwritten` reported `loaded`, all 22 drawings fetched, the stylesheet and script fetched, over the deployment's own requests.
- Reading and navigation exercised on a real phone and a real desktop browser: Begin, Next, Back, the first and last boundaries, chapter shortcuts, and the optional panels. **Partly:** all of it at 360 and 1280 CSS pixels in Windows Chrome 154. A 360-pixel viewport is not a phone, and one engine is not two.
- The full reading view and the printed output, each carrying the complete argument. **Done:** 45 scenes read continuously, and a 45-page PDF carrying all 45 scene titles and all 147 approved reader text parts. Nobody has used a physical printer.
- Every source's evidence level, limitation, and caveat visible on the deployed page. **Done** through the register and the citations exercised on the deployment.
- Any remaining limitation, stated plainly — an unchecked device or an unresolved submission route is a limitation, not a footnote. **Done**, in the record and under *Submitting it* below.

Until every line above is real, the site is not released. A preview of the foundation is not the essay. The lines marked *partly* are limitations of a released site, not permission to skip them next time.

## Submitting it

[The instruction snapshot](notes/2026-10-08-instructions.md) asks for a digital file in the class Google Drive midterm folder, with member names in the file or filename. The amendment discontinued the file that answered that. **How a hosted website is handed in is unresolved**, and this repository cannot resolve it: whether the group submits a link, an exported copy, or something else is the owner's and the class's decision. No Drive upload is in scope here, and the requirement is recorded rather than quietly dropped. The stated deadline is 9 October 2026 at 11:59 PM; its text does not specify a timezone.
