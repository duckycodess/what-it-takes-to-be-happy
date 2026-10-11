<!-- agent-workflow:start -->
Shared workflow v1: `$agentize` onboards/upgrades this repository; `$ticket` creates GitHub work.
After upstream `/grill-me`, `ticket it` uses this conversation; `queue it` authorizes implementation.
Tickets are unqueued by default. Exact `agent:ready` authorizes autonomous implementation.
Portable policy/commands: `.agent/workflow.json`. Shared skills and runtime stay user installed.
Read existing project rules/specs/tests; use Serena when available and OpenSpec when warranted.
Backend merge policy remains separate; onboarding does not launch, restart, or merge work.
<!-- agent-workflow:end -->

# Project guidance

Read `docs/brief.md`, `docs/decisions.md`, and the relevant architecture/content document before changing this project. The confirmed conversation brief takes precedence over superseded proposals in imported notes.

**The owner amendment dated 9 October 2026 at the top of `docs/decisions.md` is canonical and governs delivery.** The hosted Vercel website is the deliverable; the self-contained offline HTML file is discontinued. Futura Handwritten is retained. Where an older document still asks for an offline submission, the amendment wins.

- Build an independently readable illustrated essay about happiness, not a game or a traveler/map experience.
- Preserve distinct perspectives, disagreements, meaningful caveats, and inward reflection. Do not compress the project into one universal definition of happiness.
- Use original stickman artwork, emotional expression, and the agreed typography. Identify TJ, Koj, and Vier with names above their heads; fictional friends are illustrations, not evidence or invented member biographies.
- Research is shared group material. Preserve source attribution and member-endorsed positions when redistributing dialogue or incorporating new notes.
- Essential arguments, concepts, findings, and limitations belong in the main reading path. Supplemental interactions remain optional.
- Support phones, desktop, chapter revisiting, and a complete reading/print view on the Vercel-hosted site. The offline website file is no longer a deliverable; `npm run export:offline` and the single-file packaging tests are retained tooling, not a release gate.
- Future note updates belong in `docs/notes/` and must be reconciled into the story and source register. Do not reintroduce the superseded fixed neighborhood route or arbitrary word/scene limits.
- No application stack has been selected. Choose the smallest implementation that satisfies `docs/architecture.md`; do not add backend features to this static essay without a new requirement.
- Current checkout contains documentation, workflow setup, the generated illustrations (`assets/`), and the static application (`content/`, `src/`, `test/`). The website is a transfer of the approved 45-scene script: `docs/redesign/approved-scene-script.md` is the source, `docs/redesign/authorization.md` is the authorization, `docs/content-contract.md` is the current `happiness-essay-content/v2` contract, and `docs/coverage.md` audits what the essay covers. Read `docs/asset-workflow.md` before producing illustrations. Real commands: `./tools/count-main-path.sh` measures the published main path, and `npm run validate`, `npm test`, `npm run build`, `npm run preview`, `npm run export:offline`, `npm run check` run the application. `npm run build` publishes the hosted site alone; `npm run export:offline` is what writes `dist/offline.html`, every build still audits that output without publishing it, and a normal build clears an earlier export back out, so only a normal build's `dist/` is deployable. The site was released and tested on 11 October 2026 at `67f571d`; `docs/delivery.md` holds that record, and a newer source revision is not that deployment. No linter or type checker is configured; `npm test` runs Node's parser over every source file instead.
- The 87-beat build that preceded the rewrite is historical, not current: `docs/storyboard.md`, `docs/cast.md`, `docs/art-system.md` and `./tools/check-storyboard.sh` record it, and `src/art/` is gone. Read them as provenance; do not implement from them.

## Authorized autonomous build

The owner requested overnight autonomous implementation and automatic merging on 9 October 2026. Read `docs/autonomous-build.md`. Choose routine reversible details without waiting for owner input; keep all work within the confirmed website brief. The dispatcher merges reviewed, verified PRs into `main`; never bypass its checks or manufacture exact-commit review evidence.

Every new GitHub issue needs meaningful classification labels through the canonical `$ticket` publisher, with `classification_verified` checked. Use `bug`, `documentation`, `enhancement`, and `accessibility` according to scope; `agent:*` labels alone do not classify work. Preserve existing labels and contracts. Unrelated discoveries remain unqueued.

For additional generated art, add a request to `docs/art-requests.json` on the issue branch. This chat supplies built-in generation through isolated `codex/art-<id>` asset branches; the requesting worker incorporates the asset commit and reviews its own final commit. Continue independent work while waiting. Do not require the owner to learn Inkscape or provide a generation key.

## Commit and PR authoring

The owner requested this policy on 10 October 2026: do not add `Co-Authored-By` trailers, AI/tool attribution, generated-by footers, or assistant session links to commit messages or pull request titles/descriptions. Describe the work and its verification directly. Check both commit messages and the final PR text before publishing; `.claude/settings.json` also disables automatic attribution.

Preserve font, artwork, research, dependency, and source provenance required by this project's existing guidance. This authoring preference does not remove source credits or review evidence and does not authorize rewriting published history during ordinary worker execution.
