#!/usr/bin/env bash
# Measure the essay's main-path prose and report a reading-time range.
#
#   ./tools/count-main-path.sh             # summary
#   ./tools/count-main-path.sh --chapters  # per-chapter breakdown too
#   ./tools/count-main-path.sh --text      # print the counted text itself
#   ./tools/count-main-path.sh --rule      # print the counting rule alone
#
# The corpus is content/content.json, which is the approved 45-scene script
# transferred into the website. The counting rule is not defined here: it is
# `WORD_COUNT_RULE` in src/content/transfer.js, the same rule the document
# records in its own `measure` field and the same one `countWords` applies.
# This script reuses both, so the command line and the published figure cannot
# drift apart, and neither can be tuned without changing the other.
#
# What counts: reader-visible narration and dialogue in all 45 scenes. What is
# excluded: speaker labels, citation markers, scene and chapter titles,
# interface strings and the whole Sources & Credits page. A word is a run of
# characters between whitespace, so a hyphenated or apostrophised word counts
# once.
#
# Words-per-minute assumptions: 200 and 250, reported as a range, because
# silent reading of ordinary nonfiction is usually placed somewhere in that
# band and a single number would be false precision. The owner's approved
# handoff quotes about 20.7 minutes at 200 words a minute. Nothing in this
# range is displayed to a reader: the site makes no reading-time promise, and
# the approved copy is never trimmed to reach a number printed here.
#
# The superseded 87-beat storyboard corpus is no longer measured. That build's
# material is historical; `docs/storyboard.md` and ./tools/check-storyboard.sh
# are kept as its record.

set -u
cd "$(dirname "$0")/.." || exit 2

command -v node >/dev/null 2>&1 || { echo "node is required to measure content/content.json" >&2; exit 2; }

MODE="${1:-}" exec node --input-type=module -e '
  import { readFileSync } from "node:fs";
  import { countWords, WORD_COUNT_RULE } from "./src/content/transfer.js";

  const mode = process.env.MODE ?? "";
  const doc = JSON.parse(readFileSync("content/content.json", "utf8"));

  if (mode === "--rule") {
    process.stdout.write(`${WORD_COUNT_RULE}\n`);
    process.exit(0);
  }

  /* The counted text itself, so the number can be checked by reading it. */
  if (mode === "--text") {
    for (const scene of doc.scenes) {
      for (const block of scene.blocks) {
        const text = block.parts.filter((part) => part.text !== undefined).map((part) => part.text).join("");
        if (text.trim() !== "") process.stdout.write(`${text}\n`);
      }
    }
    process.exit(0);
  }

  const words = countWords(doc.scenes);
  const slow = Math.ceil(words / 200);
  const fast = Math.ceil(words / 250);

  process.stdout.write(`main-path words : ${words}\n`);
  process.stdout.write(`scenes          : ${doc.scenes.length}\n`);
  process.stdout.write(`chapters        : ${doc.chapters.length}\n`);
  process.stdout.write(`words per scene : ${Math.round(words / doc.scenes.length)} (mean)\n`);
  process.stdout.write(`words per minute: 200-250 (assumed)\n`);
  process.stdout.write(`reading estimate: ~${fast}-${slow} minutes (not shown to readers)\n`);
  process.stdout.write(`recorded in document: ${doc.measure.words}\n`);
  process.stdout.write(`rule            : ${WORD_COUNT_RULE}\n`);

  if (words !== doc.measure.words) {
    process.stderr.write(`FAIL content/content.json records ${doc.measure.words} words; the rule counts ${words}.\n`);
    process.exit(1);
  }

  if (mode === "--chapters") {
    const sceneById = new Map(doc.scenes.map((scene) => [scene.id, scene]));
    process.stdout.write("\n");
    for (const chapter of doc.chapters) {
      const scenes = chapter.sceneIds.map((id) => sceneById.get(id));
      process.stdout.write(`  ${chapter.id.padEnd(4)} ${String(countWords(scenes)).padStart(6)} words  ${chapter.title}\n`);
    }
  }
'
