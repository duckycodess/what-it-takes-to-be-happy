#!/usr/bin/env bash
# Measure the storyboard's main-path prose and estimate reading time.
#
#   ./tools/count-main-path.sh             # summary
#   ./tools/count-main-path.sh --chapters  # per-chapter breakdown too
#   ./tools/count-main-path.sh --text      # print the counted text itself
#   ./tools/count-main-path.sh --published # measure content/content.json instead
#
# The default measures the storyboard, which is the editorial corpus. The
# published website is a slightly different corpus: it adds the fourteen
# chapter bridges, and the landing carries s001's question and its names-and-
# time sentence rather than the first beat. `--published` measures that one,
# which is the figure the reader is actually shown. It needs Node, because the
# published corpus is JSON; the storyboard measurement needs nothing but awk.
#
# What counts as main-path prose: every blockquote line inside a scene block.
# That is exactly the narrator text, dialogue, and visible caveats a reader sees
# in presentation view, in the full reading view, and in print.
#
# What is excluded: the document's own explanatory sections before the first
# scene, every metadata field (beat purpose, cast, visual purpose, static
# description, optional detail, transition, provenance, status), chapter
# headers, the chapter index, and the handoff section. Optional detail is
# deliberately excluded because it is supplementary by definition.
#
# Words-per-minute assumptions: 200 and 250, reported as a range. Silent reading
# of ordinary nonfiction is usually placed somewhere in that band, so a single
# number would be false precision. This essay is short-beat text with
# illustrations and caveats, and a reader who stops to look at either will take
# longer than the fast end.

set -u
cd "$(dirname "$0")/.." || exit 2
STORYBOARD=docs/storyboard.md
WPM_SLOW=200
WPM_FAST=250

extract() {
  awk '
    /^#### `s[0-9][0-9][0-9]`/ { inscenes = 1 }
    inscenes && /^[[:space:]]*> / {
      line = $0
      sub(/^[[:space:]]*> /, "", line)
      gsub(/\*\*/, "", line)
      gsub(/\*/, "", line)
      print line
    }
  ' "$STORYBOARD"
}

case "${1:-}" in
  --text) extract; exit 0 ;;
  --published)
    command -v node >/dev/null 2>&1 || { echo "node is required to measure content/content.json" >&2; exit 2; }
    node --input-type=module -e '
      import { readFileSync } from "node:fs";
      const doc = JSON.parse(readFileSync("content/content.json", "utf8"));
      const words = (text) => text.trim().split(/\s+/).filter(Boolean).length;
      let total = 0;
      for (const chapter of doc.chapters) total += words(chapter.opening) + words(chapter.closing);
      for (const scene of doc.scenes) {
        for (const step of scene.mainPath) {
          if (step.kind === "narration") total += words(scene.narration[step.index]);
          else if (step.kind === "limitations") total += words(scene.limitations[step.index]);
          else total += words(scene.dialogue[step.index].text);
        }
      }
      const slow = Math.ceil(total / 200);
      const fast = Math.ceil(total / 250);
      process.stdout.write(`main-path words : ${total}\n`);
      process.stdout.write(`beats           : ${doc.scenes.length}\n`);
      process.stdout.write(`chapter bridges : ${doc.chapters.length * 2}\n`);
      process.stdout.write(`words per minute: 200-250 (assumed)\n`);
      process.stdout.write(`reading estimate: ~${fast}-${slow} minutes\n`);
      process.stdout.write(`shown on landing: ${doc.project.readingTimeEstimate}\n`);
    '
    exit $? ;;
esac

words=$(extract | wc -w)
scenes=$(grep -c '^#### `s[0-9][0-9][0-9]`' "$STORYBOARD")
slow=$(( (words + WPM_SLOW - 1) / WPM_SLOW ))
fast=$(( (words + WPM_FAST - 1) / WPM_FAST ))

printf 'main-path words : %s\n' "$words"
printf 'scenes          : %s\n' "$scenes"
printf 'words per scene : %s (mean)\n' "$(( words / scenes ))"
printf 'words per minute: %s-%s (assumed)\n' "$WPM_SLOW" "$WPM_FAST"
printf 'reading estimate: ~%s-%s minutes\n' "$fast" "$slow"

if [ "${1:-}" = "--chapters" ]; then
  echo
  awk '
    /^## `c[0-9]`/ { if (ch != "") printf "  %-4s %6d words\n", ch, n; ch = $2; gsub(/`/, "", ch); n = 0; inscenes = 0 }
    /^#### `s[0-9][0-9][0-9]`/ { inscenes = 1 }
    /^## Handoff/ { if (ch != "") { printf "  %-4s %6d words\n", ch, n; ch = "" } }
    inscenes && /^[[:space:]]*> / {
      line = $0
      sub(/^[[:space:]]*> /, "", line)
      gsub(/\*\*/, "", line); gsub(/\*/, "", line)
      n += split(line, parts, /[[:space:]]+/)
      if (line ~ /^[[:space:]]*$/) n -= 1
    }
    END { if (ch != "") printf "  %-4s %6d words\n", ch, n }
  ' "$STORYBOARD"
fi
