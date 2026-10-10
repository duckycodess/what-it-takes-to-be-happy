# Tasks

## 1. Editorial contract and integration

- [x] 1.1 Add and document required ordered `mainPath` references and explicit `visual.artAbsence`, with validator and renderer tests for all kinds, missing/duplicate/out-of-range indexes and final pending-art rejection; verify `npm run validate` and targeted contract/render tests. Commit as one logical contract batch.
- [ ] 1.2 Transfer all 87 beats, c0–c6 bridges and eight cast entries; split s001 landing text without repetition, preserve authored blockquote order with `mainPath` and add chapter provenance; verify test/script compares all storyboard paragraphs/dialogue/caveats in order with only documented landing/bridge exceptions and no fixture prose.
- [ ] 1.3 Map R01–R32 unchanged, endorsed lines to original Brainstorm note positions and all storyboard lenses to concept entries with drafted explanation/application/question; verify `npm run validate`, register test and coverage audit against `docs/coverage.md`/`docs/research.md` including source limits. Document final content in `docs/content-contract.md`.
- [ ] 1.4 Add storyboard-justified optional details on the ten named beats and a register handoff for s087; count actual JSON landing + bridges + main prose and reconcile the storyboard/coverage/landing estimate. Verify `./tools/count-main-path.sh`, measured JSON count test and that no essential content lives only in a disclosure. Update README fixture claims and the test assumptions for final IDs and reading time.

## 2. Explanatory presentation

- [ ] 2.1 Provide truthful original motif coverage for at least 86/87 beats and label fictional friends distinctly; s087 is intentionally text-only without an empty/pending frame. Verify coverage map and composed-state tests, original nametags/accessibility test and no pending-art frames in final HTML. Update `docs/art-system.md` and `docs/asset-workflow.md` with actual counts; if generated art is needed, use the documented request/isolated asset-branch route.
- [ ] 2.2 Preserve accessible chapter labels (Opening, 1–6), ordering, details, keyboard and static/reduced-motion states; deliberately update fixture-indexed reader/browser/font tests, verify targeted tests for navigation, optional detail, all 87 beats and fallback glyphs, and update scoped runtime docs.

## 3. Integration evidence

- [ ] 3.1 Run `./tools/check-storyboard.sh`, `./tools/count-main-path.sh`, `npm run check`, `openspec validate integrate-six-chapter-essay --strict`; verify all pass or record honest blockers.
- [ ] 3.2 Inspect final prose/art at narrow and wide viewport, keyboard navigation, reduced motion, and print via structure/beforeprint tests (record if rendered print unavailable); audit representative source-backed beats across chapters and the ending. Record measured outcomes and environmental caveats in `docs/verification.md`.
