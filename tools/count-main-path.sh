#!/usr/bin/env bash
# Measure the storyboard's main-path prose and estimate reading time.
#
#   ./tools/count-main-path.sh            # summary
#   ./tools/count-main-path.sh --chapters # per-chapter breakdown too
#   ./tools/count-main-path.sh --text     # print the counted text itself
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
