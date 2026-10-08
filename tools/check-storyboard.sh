#!/usr/bin/env bash
# Editorial consistency checks for the storyboard, cast registry, and research register.
# No application tooling is required; this uses only coreutils, grep, and awk.
#
#   ./tools/check-storyboard.sh
#
# Exits non-zero and prints every failure it finds.

set -u
cd "$(dirname "$0")/.." || exit 2

STORYBOARD=docs/storyboard.md
CAST=docs/cast.md
RESEARCH=docs/research.md

fail=0
problem() { printf 'FAIL: %s\n' "$*"; fail=1; }
ok()      { printf 'ok:   %s\n' "$*"; }

for f in "$STORYBOARD" "$CAST" "$RESEARCH"; do
  [ -f "$f" ] || { problem "missing $f"; exit 1; }
done

# --- scene identifiers -------------------------------------------------------
scene_ids=$(grep -oE '^#### `s[0-9]{3}`' "$STORYBOARD" | grep -oE 's[0-9]{3}')
n_scenes=$(printf '%s\n' "$scene_ids" | grep -c .)
n_unique=$(printf '%s\n' "$scene_ids" | sort -u | grep -c .)
if [ "$n_scenes" -ne "$n_unique" ]; then
  problem "duplicate scene identifiers: $(printf '%s\n' "$scene_ids" | sort | uniq -d | tr '\n' ' ')"
else
  ok "$n_scenes scene identifiers, all unique"
fi

expected=$(seq -f 's%03g' 1 "$n_scenes")
gaps=$(comm -13 <(printf '%s\n' "$scene_ids" | sort) <(printf '%s\n' "$expected" | sort))
[ -z "$gaps" ] || problem "scene identifiers are not contiguous from s001; missing: $(printf '%s' "$gaps" | tr '\n' ' ')"
[ -n "$gaps" ] || ok "scene identifiers run contiguously s001-$(printf '%s\n' "$scene_ids" | sort | tail -1)"

# --- scenes appear in reading order inside the file --------------------------
sorted=$(printf '%s\n' "$scene_ids" | sort)
if [ "$scene_ids" != "$sorted" ]; then
  problem "scene blocks are not in ascending order in $STORYBOARD"
else
  ok "scene blocks appear in ascending order"
fi

# --- chapter index agrees with the chapter sections --------------------------
awk '
  /^## `c[0-9]`/ { ch = substr($2, 2, 2); gsub(/`/, "", ch); next }
  /^#### `s[0-9][0-9][0-9]`/ && ch != "" { count[ch]++ }
  END { for (c in count) printf "%s %d\n", c, count[c] }
' "$STORYBOARD" | sort > /tmp/.sb_actual.$$
awk -F'|' '
  /^\| `c[0-9]` \|/ {
    gsub(/[ `]/, "", $2); gsub(/[ ]/, "", $4); printf "%s %s\n", $2, $4
  }
' "$STORYBOARD" | sort > /tmp/.sb_index.$$
if ! diff -q /tmp/.sb_actual.$$ /tmp/.sb_index.$$ >/dev/null; then
  problem "chapter index scene counts disagree with the chapter sections:"
  diff /tmp/.sb_index.$$ /tmp/.sb_actual.$$ | sed 's/^/      /'
else
  ok "chapter index counts match the chapter sections"
fi
rm -f /tmp/.sb_actual.$$ /tmp/.sb_index.$$

# --- required fields on every scene -----------------------------------------
missing_fields=$(awk '
  /^#### `s[0-9][0-9][0-9]`/ {
    if (id != "") check(id)
    id = $2; gsub(/`/, "", id)
    beat = vis = cast = src = stat = 0
    next
  }
  /^- Beat purpose:/   { beat = 1 }
  /^- Visual purpose:/ { vis  = 1 }
  /^- Cast:/           { cast = 1 }
  /^- Planned sources\/concepts:/ { src = 1 }
  /^- Sources\/concepts:/         { src = 1 }
  /^- Status:/         { stat = 1 }
  END { if (id != "") check(id) }
  function check(i) {
    if (!beat) print i " beat-purpose"
    if (!vis)  print i " visual-purpose"
    if (!cast) print i " cast"
    if (!src)  print i " sources"
    if (!stat) print i " status"
  }
' "$STORYBOARD")
if [ -n "$missing_fields" ]; then
  problem "scenes missing required fields:"
  printf '%s\n' "$missing_fields" | sed 's/^/      /'
else
  ok "every scene carries beat purpose, visual purpose, cast, sources, and status"
fi

# --- cast identifiers resolve ------------------------------------------------
known_cast=$(grep -oE '^\| `[a-z-]+` \|' "$CAST" | grep -oE '[a-z-]+' | sort -u)
used_cast=$(grep -E '^- Cast:' "$STORYBOARD" | grep -oE '`[a-z-]+`' | tr -d '`' | sort -u)
unknown=$(comm -23 <(printf '%s\n' "$used_cast") <(printf '%s\n' "$known_cast"))
if [ -n "$unknown" ]; then
  problem "storyboard uses cast or expression identifiers absent from $CAST: $(printf '%s' "$unknown" | tr '\n' ' ')"
else
  ok "all cast and expression identifiers resolve against $CAST"
fi

# --- expression names come from the fixed vocabulary -------------------------
known_expr="joy curiosity sadness frustration fatigue reflection"
used_expr=$(grep -E '^- Cast:' "$STORYBOARD" | grep -oE '\(`[a-z, `]+`\)' | grep -oE '[a-z]+' | sort -u)
bad_expr=""
for e in $used_expr; do
  case " $known_expr " in
    *" $e "*) ;;
    *) bad_expr="$bad_expr $e" ;;
  esac
done
if [ -n "$bad_expr" ]; then
  problem "unknown expression states:$bad_expr (vocabulary: $known_expr)"
else
  ok "every expression state used comes from the six-state vocabulary"
fi

# --- source identifiers resolve ---------------------------------------------
known_src=$(grep -oE '^\| R[0-9]{2} \|' "$RESEARCH" | grep -oE 'R[0-9]{2}' | sort -u)
used_src=$(grep -oE 'R[0-9]{2}' "$STORYBOARD" | sort -u)
unknown_src=$(comm -23 <(printf '%s\n' "$used_src") <(printf '%s\n' "$known_src"))
if [ -n "$unknown_src" ]; then
  problem "storyboard cites source identifiers absent from $RESEARCH: $(printf '%s' "$unknown_src" | tr '\n' ' ')"
else
  ok "all cited source identifiers resolve against $RESEARCH"
fi

# --- relative links resolve --------------------------------------------------
for f in "$STORYBOARD" "$CAST"; do
  grep -oE '\]\(([^)#:]+)(#[^)]*)?\)' "$f" | sed -E 's/^\]\(//; s/\)$//; s/#.*$//' | sort -u |
  while read -r target; do
    [ -n "$target" ] || continue
    case "$target" in http*|mailto:*) continue ;; esac
    [ -e "$(dirname "$f")/$target" ] || printf 'FAIL: broken relative link in %s: %s\n' "$f" "$target"
  done
done | tee /tmp/.sb_links.$$
[ -s /tmp/.sb_links.$$ ] && fail=1
[ -s /tmp/.sb_links.$$ ] || ok "relative links in the storyboard and cast registry resolve"
rm -f /tmp/.sb_links.$$

echo
if [ "$fail" -ne 0 ]; then
  echo "storyboard checks FAILED"
  exit 1
fi
echo "storyboard checks passed"
