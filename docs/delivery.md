# Hosted and offline delivery

Vercel is the agreed hosting target. A self-contained website file remains the submission artifact, because the assignment requests a digital file in the class Google Drive folder. These are two distributions of the same essay.

## Current state

The repository now contains the static foundation: a validated content document, the shared renderer, and a build that emits both distributions. There is still no Vercel project linkage and no deployed website, and the content is an explicitly non-final fixture. The delivery ticket owns the released outputs once the integrated essay exists.

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

If the Vercel project's runtime list does not offer 24.x at release time, 22.x is a safe fallback: Node only runs the build, and the deployed output is static files. Confirm the actual available versions when the project is provisioned; this table records intent, not a verified deployment.

The build is deterministic — nothing records a timestamp, a random value, or a machine path — so a redeploy of the same commit produces byte-identical files. A preview deployment and the production deployment of one commit are therefore comparable byte for byte.

## What the build produces

| Path | Role |
| --- | --- |
| `dist/index.html` | The hosted page. Links `styles.css`, `reader.js`, and the asset files so a browser can cache them. |
| `dist/styles.css`, `dist/reader.js` | The shared stylesheet and browser script. |
| `dist/assets/fonts/` | The bundled fallback font and its licence text. |
| `dist/assets/illustrations/` | Committed artwork. |
| `dist/offline.html` | The self-contained submission file. Everything is embedded; it opens straight from disk. |

`dist/offline.html` is currently about 4.3 MB, almost all of it the embedded concept illustration and the fallback font in base64. Watch that number as real artwork is added: scalable line art should shrink it, and the release ticket should record the final size.

On 9 October 2026, connected Vercel reads verified authenticated personal account `duckycodess`. No teams or existing project matching `what-it-takes-to-be-happy` were returned. The owner has authorized this website's Vercel delivery. Once the foundation's actual build/output settings exist, the supervising Codex chat can provision the intended project through that connection, then verify preview and production against the reviewed complete essay. These observations do not claim that a deployment already exists.

## Vercel path

Use a Vercel static deployment for the implemented application. The official [deployment documentation](https://vercel.com/docs/deployments) supports Git, CLI, and other deployment paths. [Vercel's GitHub integration](https://vercel.com/docs/git/vercel-for-github) supplies preview deployments for review and a production branch for the final site.

Prefer ordinary Git integration when suitable rather than adding a custom deploy pipeline for this static essay. Once application tooling exists, record the actual project root, build command if needed, output directory, team/project, production branch, and verified URLs. A docs-only repository should not be presented as a finished website deployment.

Before release, verify the intended Vercel account/team, project, commit, and environment. Use existing authenticated access. Do not store authentication secrets in the repository. Record a tested preview, then the final production URL and associated revision.

## Offline submission path

Generate one HTML file with the complete narrative, member names, visible findings and limitations, source metadata, font, artwork, styles, and required scripts embedded. It should open directly in a browser without a local server and remain readable with networking disabled.

The offline file must include Next/Back, chapter revisiting, optional supplementary detail, and the complete reading/print view. External source destinations may require connectivity; their context and bibliographic labels must remain visible offline. No runtime fetch of Google Docs, fonts, images, or scene data may be essential.

Use the same reviewed story revision for hosted and offline packaging. Both outputs come from one build of one content document, and the build fails if either output loses essential content or if the offline file references anything it does not carry. A hosted-only service worker cache does not meet the direct-file requirement.

Commands:

```
npm ci                  # install (no dependencies; just verifies the lockfile)
npm run validate        # content contract check
npm test                # validator, renderer, packaging, and preview checks
npm run build           # both outputs into dist/
npm run export:offline  # dist/offline.html only
npm run preview         # serve dist/ at http://localhost:4173
```

Offline behaviour verified on 9 October 2026 against `dist/offline.html` opened through a `file://` URL in headless Chrome with name resolution disabled (`--host-resolver-rules="MAP * ~NOTFOUND"`) and the proxy pointed at a dead port: the landing, Begin, Next, Back, arrow keys, chapter shortcuts, the reading view, the embedded illustration, and the embedded font all worked, and printing from a single beat still produced the complete 13-page essay.

## Release record

Record the following when the delivery ticket is completed:

- Reviewed Git revision and checks performed.
- Verified Vercel preview/production target and URL.
- Offline filename, author names, size, and revision.
- Successful network-disabled local-file reading checks.
- Any actual remaining limitation affecting submission or reading.

The group uploads the digital file to the class midterm folder unless a separate upload request is made. The stated assignment deadline is 9 October 2026 at 11:59 PM; its text does not specify timezone.
