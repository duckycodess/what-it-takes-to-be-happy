# Hosted delivery

Vercel hosting is the deliverable. The 9 October owner amendment discontinued the self-contained offline HTML submission file; [the decisions record](decisions.md#owner-amendment--9-october-2026) is canonical, and this page implements it. Offline evidence recorded further down is kept as a record of checks that ran, not as a requirement.

## Current state

The repository contains the static foundation: a validated content document, the shared renderer, and a build that writes `dist/`. The content is an explicitly non-final fixture, no deployment of the essay exists, and production builds are held (below). The delivery ticket, [#7](https://github.com/duckycodess/what-it-takes-to-be-happy/issues/7), owns the released site once the integrated essay exists.

## Build settings for the Vercel project

These are the actual settings the committed build needs. They are recorded in [`vercel.json`](../vercel.json) as well, so the dashboard and the repository cannot drift apart.

| Setting | Value | Where it comes from |
| --- | --- | --- |
| Framework preset | Other / none | The essay is plain static HTML, CSS, and one browser script. |
| Root directory | `./` (repository root) | `package.json` and `vercel.json` are at the root. |
| Install command | `npm ci` | Installs exactly the committed `package-lock.json`. There are no dependencies, so it is near-instant. |
| Build command | `npm run build` | Validates the content, renders both outputs, and runs the packaging checks. Any failure fails the deployment. |
| Output directory | `dist` | Created by the build; it is git-ignored. |
| Node.js version | 24.x | `engines.node` in `package.json`. `.nvmrc` pins `24.15.0` for local work. |
| Production branch | `main` | The repository default. |

If the Vercel project's runtime list does not offer 24.x at release time, 22.x is a safe fallback: Node only runs the build, and the deployed output is static files. Confirm the actual available versions at release; this table records the settings, not a verified deployment.

### The provisioned project

Reported by the supervising chat on 9 October 2026. It supersedes the earlier same-day account reading noted under [what the build produces](#what-the-build-produces):

| Field | Value |
| --- | --- |
| Account | `duckycodess` |
| Team | `team_6bsC76CkYmknE1L4zfG0u6iv` (`tjs-projects-647180a9`) |
| Project | `prj_GwupwQaDFXj1qTtDhvFmvBatdQAo` |
| Install / build / output | `npm ci`, `npm run build`, `dist` |
| Node, root, production branch | 24.x, repository root, `main` |

These identifiers are supervision-reported, not verified from this worktree. They identify where the site will be deployed; they do not claim that the essay has been deployed.

**A production hold is in force.** Production builds are currently skipped on purpose, so that a non-final fixture cannot become the group's public essay. Any preview that exists is foundation work, not the finished essay. The hold is released only when the reviewed complete essay passes the hosted release checks below, and releasing it is [#7](https://github.com/duckycodess/what-it-takes-to-be-happy/issues/7)'s call. Nothing in this repository should be read as a claim that a final essay has been released.

The build is deterministic — nothing records a timestamp, a random value, or a machine path — so a redeploy of the same commit produces byte-identical files. A preview deployment and the production deployment of one commit are therefore comparable byte for byte.

## What the build produces

| Path | Role |
| --- | --- |
| `dist/index.html` | The hosted page. Links `styles.css`, `reader.js`, and the asset files so a browser can cache them. |
| `dist/styles.css`, `dist/reader.js` | The shared stylesheet and browser script. |
| `dist/assets/fonts/` | The project typeface, the bundled fallback font, and the fallback's licence text. |
| `dist/assets/illustrations/` | Committed artwork. |
| `dist/offline.html` | The single self-contained file. **No longer a deliverable**, and the build still writes it into the publish directory; see below. |

`dist/offline.html` is currently about 3.4 MB, almost all of it the embedded concept illustration and the fallback font in base64. It carries the fallback and no other face: the project typeface is served by the hosted site under a grant to use it, which is not a grant to hand the file to someone else, and the build fails if a trace of it reaches that output. Since the 9 October amendment it is retained tooling: the packaging audits that produce it also prove the hosted page's resources are all committed and accounted for, which is worth keeping cheaply. It is not submitted, its size is not a release concern, and hosted/offline parity is not an acceptance criterion.

Taking it out of the published `dist/` — and making sure no production page offers a download link to it — is a code change owned by [#7](https://github.com/duckycodess/what-it-takes-to-be-happy/issues/7). **It has not been made.** `npm run build` on the current revision still writes `dist/offline.html` and still prints it as the offline submission file. That line is now wrong, and correcting it belongs with the same code change.

An earlier reading on 9 October 2026 found authenticated personal account `duckycodess` with no teams and no project matching `what-it-takes-to-be-happy`. That observation is superseded by the provisioned project recorded above, which was reported later the same day.

## Vercel path

Use a Vercel static deployment for the implemented application. The official [deployment documentation](https://vercel.com/docs/deployments) supports Git, CLI, and other deployment paths. [Vercel's GitHub integration](https://vercel.com/docs/git/vercel-for-github) supplies preview deployments for review and a production branch for the final site.

Prefer ordinary Git integration when suitable rather than adding a custom deploy pipeline for this static essay. Once application tooling exists, record the actual project root, build command if needed, output directory, team/project, production branch, and verified URLs. A docs-only repository should not be presented as a finished website deployment.

Before release, verify the intended Vercel account/team, project, commit, and environment against the table above. Use existing authenticated access. Do not store authentication secrets in the repository. Record a tested preview, then the production URL and the exact revision it was built from.

## What the hosted page must carry

The hosted page must be self-sufficient against its own committed resources: the project font, the artwork, the stylesheet, and the browser script are served from the deployment, not from a third party, and no essential text waits on a runtime fetch of Google Docs, a font service, an image host, or scene data. External source destinations stay ordinary links; their labels, claim context, and limitations are readable without following them.

The project typeface is Futura Handwritten by Billy Snyder, served from this origin under the author's own note on [his font page](https://www.dafont.com/futurahandwritten.font): "Feel free to use this font for anything you want." The record — source, archive checksums, and the three things that were checked and are *not* true of it — is in [`assets/fonts/README.md`](../assets/fonts/README.md), and the credit the author says is not required appears in the colophon of every hosted page. It is not a named public licence, so the face is served by this site and never embedded in a file handed to someone else.

Commands:

```
npm ci                  # install (no dependencies; just verifies the lockfile)
npm run validate        # content contract check
npm test                # validator, renderer, packaging, and preview checks
npm run build           # both outputs into dist/
npm run export:offline  # dist/offline.html only (retained tooling, not a deliverable)
npm run preview         # serve dist/ at http://localhost:4173
```

### Historical offline evidence

Recorded on 9 October 2026, before the amendment, against `dist/offline.html` opened through a `file://` URL in headless Chrome with name resolution disabled (`--host-resolver-rules="MAP * ~NOTFOUND"`) and the proxy pointed at a dead port: the landing, Begin, Next, Back, arrow keys, chapter shortcuts, the reading view, the embedded illustration, and the embedded font all worked, and printing from a single beat still produced the complete 13-page essay. This is a record of a check that ran against the non-final fixture. It is not a release gate, and nothing is required to reproduce it.

## Hosted release checklist

Complete this for the reviewed, integrated essay, not for a fixture. Offline submission and hosted/offline parity are deliberately absent.

- The exact commit the release was built from, and the checks that passed on it.
- The actual preview URL, and the actual production URL, each recorded verbatim rather than described.
- Both URLs confirmed to serve that exact commit.
- The project typeface, the artwork, the stylesheet, and the browser script all actually loading on the deployed page — observed on the deployment, not inferred from the build. The build and the browser suite check that the font loads and sets the page from a local copy of the hosted tree; that is not the same as watching it arrive over the deployment's own network.
- Reading and navigation exercised on a real phone and a real desktop browser: Begin, Next, Back, the first and last boundaries, chapter shortcuts, and the optional panels.
- The full reading view and the printed output, each carrying the complete argument.
- Every source's evidence level, limitation, and caveat visible on the deployed page.
- Any remaining limitation, stated plainly — an unchecked device or an unresolved submission route is a limitation, not a footnote.

Until every line above is real, the site is not released. A preview of the foundation is not the essay.

## Submitting it

[The instruction snapshot](notes/2026-10-08-instructions.md) asks for a digital file in the class Google Drive midterm folder, with member names in the file or filename. The amendment discontinued the file that answered that. **How a hosted website is handed in is unresolved**, and this repository cannot resolve it: whether the group submits a link, an exported copy, or something else is the owner's and the class's decision. No Drive upload is in scope here, and the requirement is recorded rather than quietly dropped. The stated deadline is 9 October 2026 at 11:59 PM; its text does not specify a timezone.
