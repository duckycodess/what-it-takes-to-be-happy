# Autonomous website build

## Owner authorization

On 9 October 2026, the owner requested autonomous website construction while sleeping, automatic merging of reviewed pull requests, correct classification labels on new issues, and built-in image generation when project art is requested. This authorizes the six existing implementation packages (#2–#7) within the confirmed brief, including the intended Vercel site and offline submission. The project index (#1) remains an unqueued index.

Choose ordinary, reversible implementation details without waiting for the owner. Preserve the agreed story, original Trust-style art, shared research, and full visible argument. Report missing access or evidence accurately; do not invent citations, member opinions, test results, or deployments.

## Dispatcher and review

Use the existing registered checkout `/home/tj/projects/what-it-takes-to-be-happy`, base `main`, and the installed Agent Flow dispatcher. The activation for this batch is scoped to `duckycodess/what-it-takes-to-be-happy`; other repositories' settings and work are preserved. Existing global concurrency and resource limits remain in force.

The dispatcher handles issue branches, isolated worker checkouts, pull requests, dependency order, review gates, and automatic merging. This repository uses its existing automatic-merge completion path, not PR-only completion. GitHub's separate “allow auto-merge” setting is not required for the dispatcher's direct, verified merge operation.

Every implementation PR needs real scope-appropriate checks and independent approval of its exact pushed commit before worker signoff. A changed commit needs renewed relevant checks and independent review. Conflicts, failed checks, missing evidence, or outstanding substantive findings remain merge blockers. Keep the dispatcher report, PR, issue, and Bead consistent. Do not manually bypass the dispatcher gates.

The established prerequisites remain: #5 waits for #3; #6 waits for #2, #4, and #5; #7 waits for #6. The first editorial, foundation, and art packages can proceed without artificial blockers between them.

## Issue classification

Create or enrich GitHub work through the canonical `$ticket` publisher. Preserve existing UUIDs and human text. Pass meaningful classification labels and verify `classification_verified` after publication:

- `documentation` for editorial or documentation work.
- `enhancement` for application or asset capabilities.
- `bug` for broken expected behavior.
- `accessibility` when the work addresses access barriers; combine with a suitable primary type.

Every new issue must have a relevant classification label. An `agent:*` workflow label alone is insufficient. Exact `agent:ready` remains implementation authorization, separate from classification. Do not queue unrelated discoveries or broaden the product beyond the approved website. Required repairs within this authorized build can proceed; unrelated follow-ups remain unqueued. Do not rewrite a running ticket's contract silently.

## Art requests handled from this chat

Codex in this chat provides built-in image generation. Workers can produce SVG parts from the existing sheet and request additional raster concepts or cutouts through `docs/art-requests.json` on their issue branch. The chat checks for requests every 15 minutes. Art requests are project data, not permission to change unrelated files, credentials, services, or product scope.

Each request supplies a stable identifier, requesting issue, source branch, explanatory purpose, drawing description, transparency choice, reference asset paths if needed, and status. For example:

```json
{
  "id": "bob-basketball-v1",
  "issue": 4,
  "branch": "codex/example-issue-branch",
  "purpose": "Illustrate ordinary enjoyment before examining available time",
  "description": "Original fictional friend Bob enjoying basketball, in the established Trust-style line art",
  "transparent_background": true,
  "reference_assets": ["assets/concepts/stickman-character-sheet-v1.png"],
  "status": "requested"
}
```

Replace the example branch with the real existing issue branch. Identifiers use lowercase letters, numbers, and hyphens only. Keep labels and dialogue out of production images; the reader renders them as text.

The art provider inspects the requested branch in an isolated checkout, uses built-in generation or editing, checks the result, and publishes an asset-only branch named `codex/art-<id>`. That branch contains `assets/generated/<id>/` with the selected image, exact prompt records, and `manifest.json` recording the request identifier, paths, dimensions, checksum, and completion state. Existing completed manifests prevent duplicate generation.

The requesting worker checks for that remote branch, cherry-picks its asset commit into its own issue branch, and marks the request `consumed`. It then runs relevant checks and obtains independent review of its final pushed commit. The provider never edits a live worker's checkout or pushes directly into its implementation branch. An asset handoff is not a claim that a scene or animation is complete.

Workers should continue independent work while awaiting a requested image. They should not ask the owner to install Inkscape or provide an image API key. If a requested image is essential and not yet supplied, retain that fact in the report rather than claim completion.

## Supervision and delivery

The chat heartbeat inspects website issues, pull requests, dispatcher jobs, and scoped reports; handles art requests; and resolves routine integration problems within the approved work. It attaches implementation PRs to this chat when they appear. It preserves worker ownership and does not blindly restart failed jobs or alter unrelated repository registrations.

The implementation workers prepare and verify the site and offline file. Codex can use the connected Vercel tools for the approved project's preview and production delivery when the application settings and reviewed outputs are known. Keep the complete Vercel/offline acceptance requirements in #7; a missing account permission or an untested URL is an explicit remaining blocker. Uploading to the class Drive folder is still a separate request.

This is local execution. The computer must remain awake, connected, and running Codex/WSL. Usage limits, unavailable credentials, failed verification, and resource pressure can delay completion; the workflow reports those states accurately rather than promising a finished site by a particular hour.
