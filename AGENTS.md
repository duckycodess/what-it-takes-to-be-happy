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

- Build an independently readable illustrated essay about happiness, not a game or a traveler/map experience.
- Preserve distinct perspectives, disagreements, meaningful caveats, and inward reflection. Do not compress the project into one universal definition of happiness.
- Use original stickman artwork, emotional expression, and the agreed typography. Identify TJ, Koj, and Vier with names above their heads; fictional friends are illustrations, not evidence or invented member biographies.
- Research is shared group material. Preserve source attribution and member-endorsed positions when redistributing dialogue or incorporating new notes.
- Essential arguments, concepts, findings, and limitations belong in the main reading path. Supplemental interactions remain optional.
- Support phones, desktop, chapter revisiting, a complete reading/print view, a self-contained offline website file, and Vercel hosting.
- Future note updates belong in `docs/notes/` and must be reconciled into the story and source register. Do not reintroduce the superseded fixed neighborhood route or arbitrary word/scene limits.
- No application stack has been selected. Choose the smallest implementation that satisfies `docs/architecture.md`; do not add backend features to this static essay without a new requirement.
- Current checkout contains documentation, workflow setup, initial character concepts, and the audited editorial storyboard (`docs/storyboard.md`, `docs/cast.md`, `docs/coverage.md`). Read `docs/asset-workflow.md` before producing illustrations or motion. The editorial package adds two real commands, `./tools/check-storyboard.sh` and `./tools/count-main-path.sh`; no application build, lint, or test commands exist yet, so document real ones when implementation adds them.

## Authorized autonomous build

The owner requested overnight autonomous implementation and automatic merging on 9 October 2026. Read `docs/autonomous-build.md`. Choose routine reversible details without waiting for owner input; keep all work within the confirmed website brief. The dispatcher merges reviewed, verified PRs into `main`; never bypass its checks or manufacture exact-commit review evidence.

Every new GitHub issue needs meaningful classification labels through the canonical `$ticket` publisher, with `classification_verified` checked. Use `bug`, `documentation`, `enhancement`, and `accessibility` according to scope; `agent:*` labels alone do not classify work. Preserve existing labels and contracts. Unrelated discoveries remain unqueued.

For additional generated art, add a request to `docs/art-requests.json` on the issue branch. This chat supplies built-in generation through isolated `codex/art-<id>` asset branches; the requesting worker incorporates the asset commit and reviews its own final commit. Continue independent work while waiting. Do not require the owner to learn Inkscape or provide a generation key.
