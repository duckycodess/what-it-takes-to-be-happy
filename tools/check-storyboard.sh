#!/usr/bin/env bash
# Editorial consistency checks for the storyboard, cast registry, and research register.
# No application tooling is required; this uses only coreutils, grep, and awk.
#
#   ./tools/check-storyboard.sh
#
# Exits non-zero and prints every failure it finds.
#
# HISTORICAL. docs/storyboard.md is the superseded 87-beat build's editorial
# corpus, and this script keeps that record internally consistent. The website
# is now the approved 45-scene script in content/content.json; what describes
# *it* is docs/coverage.md, checked by test/coverage.test.js, and
# ./tools/count-main-path.sh, which measures the published document. This
# script deliberately no longer reads either of them: a storyboard check that
# reached into the current build would report the rewrite as a storyboard
# fault.

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

# Identifiers are permanent, so a removed scene leaves a gap. Two declared lines make that
# checkable instead of merely promised: a high-water mark, and a list of retired identifiers.
# The invariant is that s001..mark is exactly (in use) union (retired), and the two do not overlap.
# That is what actually rejects reuse -- the mark alone cannot, since a freed number sits below it.
highwater=$(grep -oE '^- Highest scene identifier assigned: `s[0-9]{3}`' "$STORYBOARD" | grep -oE 's[0-9]{3}')
retired_line=$(grep -E '^- Retired scene identifiers: ' "$STORYBOARD" | head -1)
if [ -z "$highwater" ]; then
  problem "$STORYBOARD does not declare a highest scene identifier assigned"
elif [ -z "$retired_line" ]; then
  problem "$STORYBOARD does not declare a retired scene identifier list (use 'none' when empty)"
else
  retired=$(printf '%s' "$retired_line" | grep -oE 's[0-9]{3}' | sort -u)
  in_use=$(printf '%s\n' "$scene_ids" | sort -u)
  span=$(seq -f 's%03g' 1 "$(printf '%s' "$highwater" | tr -d 's' | sed 's/^0*//')")

  reused=$(comm -12 <(printf '%s\n' "$in_use") <(printf '%s\n' "$retired"))
  over=$(printf '%s\n' "$in_use" "$retired" | grep -v '^$' | sort -u | awk -v hw="$highwater" '$0 > hw')
  unaccounted=$(comm -23 <(printf '%s\n' "$span" | sort) \
                         <(printf '%s\n' "$in_use" "$retired" | grep -v '^$' | sort -u))

  if [ -n "$reused" ]; then
    problem "retired scene identifiers are back in use: $(printf '%s' "$reused" | tr '\n' ' ')"
  elif [ -n "$over" ]; then
    problem "scene identifiers above the declared high-water mark $highwater: $(printf '%s' "$over" | tr '\n' ' ')"
  elif [ -n "$unaccounted" ]; then
    problem "numbers below the high-water mark $highwater that are neither in use nor retired: $(printf '%s' "$unaccounted" | tr '\n' ' ')"
  else
    n_ret=$(printf '%s\n' "$retired" | grep -c . || true)
    ok "identifiers are permanent: $n_unique in use, $n_ret retired, none reused, high-water mark $highwater"
  fi

  # Monotonicity needs the previous revision, so skip cleanly when there is not one.
  prev=$(git show HEAD:"$STORYBOARD" 2>/dev/null | grep -oE '^- Highest scene identifier assigned: `s[0-9]{3}`' | grep -oE 's[0-9]{3}')
  if [ -z "$prev" ]; then
    ok "high-water mark monotonicity: no committed previous revision to compare against (skipped)"
  elif [ "$highwater" \< "$prev" ]; then
    problem "high-water mark went backwards: $prev at HEAD, $highwater now"
  else
    ok "high-water mark has not gone backwards since HEAD ($prev -> $highwater)"
  fi
fi

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
  /^## Chapter index/ { inindex = 1; next }
  /^## / && !/^## Chapter index/ { inindex = 0 }
  inindex && /^\| `c[0-9]` \|/ {
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

# --- every dialogue speaker is present in that scene's cast --------------------
absent=$(awk '
  /^#### `s[0-9][0-9][0-9]`/ { id = $2; gsub(/`/, "", id); cast = "" }
  /^- Cast:/ { cast = $0 }
  /^  - `[a-z-]+` — / {
    sp = $2; gsub(/`/, "", sp)
    if (index(cast, "`" sp "`") == 0) print id " " sp
  }
' "$STORYBOARD")
if [ -n "$absent" ]; then
  problem "dialogue speakers absent from their scene's cast list:"
  printf '%s\n' "$absent" | sed 's/^/      /'
else
  ok "every dialogue speaker appears in its scene's cast list"
fi

# --- every dialogue line declares its standing and its notes ------------------
bad_standing=$(awk '
  /^#### `s[0-9][0-9][0-9]`/ { id = $2; gsub(/`/, "", id) }
  /^  - `[a-z-]+` — / {
    if ($0 !~ /member-endorsed \(Brainstorm [0-9]+/ &&
        $0 !~ /member-endorsed \(delta: [^)]+\)/ &&
        $0 !~ /fictional illustration/)
      print id ": " $0
  }
' "$STORYBOARD")
if [ -n "$bad_standing" ]; then
  problem "dialogue lines without a standing and a notes reference:"
  printf '%s\n' "$bad_standing" | sed 's/^/      /'
else
  ok "every dialogue line declares member-endorsed with a notes or delta source, or fictional illustration"
fi

# --- every source has an evidence record with the required fields ------------
missing_rec=$(awk '
  /^### R[0-9][0-9] / { if (id != "") check(id); id = $2; cit=acc=pas=sup=lim=sce=0; next }
  /^- \*\*Citation:\*\*/ { cit = 1 }
  /^- \*\*Access:\*\*/   { acc = 1 }
  /^- \*\*Passage locator and quotation:\*\*/ { pas = 1 }
  /^- \*\*Supported claim:\*\*/ { sup = 1 }
  /^- \*\*Limitation:\*\*/ { lim = 1 }
  /^- \*\*Scenes:\*\*/ { sce = 1 }
  /^## / { if (id != "") check(id); id = "" }
  END { if (id != "") check(id) }
  function check(i) {
    if (!cit) print i " citation"
    if (!acc) print i " access"
    if (!pas) print i " passage-locator"
    if (!sup) print i " supported-claim"
    if (!lim) print i " limitation"
    if (!sce) print i " scenes"
  }
' "$RESEARCH")
if [ -n "$missing_rec" ]; then
  problem "evidence records missing required fields:"
  printf '%s\n' "$missing_rec" | sed 's/^/      /'
else
  ok "every evidence record carries citation, access, passage locator, claim, limitation, scenes"
fi

rec_ids=$(grep -oE '^### R[0-9]{2} ' "$RESEARCH" | grep -oE 'R[0-9]{2}' | sort -u)
no_record=$(comm -23 <(printf '%s\n' "$known_src") <(printf '%s\n' "$rec_ids"))
if [ -n "$no_record" ]; then
  problem "sources in the register table with no evidence record: $(printf '%s' "$no_record" | tr '\n' ' ')"
else
  ok "every source in the register table has an evidence record"
fi

# --- a source's declared scenes match where the storyboard cites it ----------
awk '
  /^#### `s[0-9][0-9][0-9]`/ { id = $2; gsub(/`/, "", id) }
  /^- (Planned s|S)ources\/concepts:/ {
    line = $0
    while (match(line, /R[0-9][0-9]/)) {
      print substr(line, RSTART, RLENGTH) " " id
      line = substr(line, RSTART + RLENGTH)
    }
  }
' "$STORYBOARD" | sort -u > /tmp/.sb_cites.$$
awk '
  /^### R[0-9][0-9] / { id = $2 }
  /^- \*\*Scenes:\*\*/ {
    line = $0
    while (match(line, /s[0-9][0-9][0-9]/)) {
      print id " " substr(line, RSTART, RLENGTH)
      line = substr(line, RSTART + RLENGTH)
    }
  }
' "$RESEARCH" | sort -u > /tmp/.sb_decl.$$
if ! diff -q /tmp/.sb_cites.$$ /tmp/.sb_decl.$$ >/dev/null; then
  problem "source-to-scene mapping disagrees between $STORYBOARD and $RESEARCH:"
  diff /tmp/.sb_decl.$$ /tmp/.sb_cites.$$ | sed 's/^/      /'
else
  ok "source-to-scene mapping agrees between the storyboard and the register"
fi
rm -f /tmp/.sb_cites.$$ /tmp/.sb_decl.$$

# --- no source is cited without a review status ------------------------------
no_status=$(awk -F'|' '/^\| R[0-9][0-9] \|/ { gsub(/[ `]/, "", $2); if ($5 !~ /verified-full|verified-abstract|verified-locator|not-accessed/) print $2 }' "$RESEARCH")
if [ -n "$no_status" ]; then
  problem "register rows without a recognised review status: $(printf '%s' "$no_status" | tr '\n' ' ')"
else
  ok "every register row carries a recognised review status"
fi

# --- the review status rollup matches the register table ----------------------
awk -F'|' '/^\| R[0-9][0-9] \|/ { gsub(/[ `]/, "", $2); st = $5; gsub(/[ `]/, "", st); sub(/\(.*/, "", st); print st }' "$RESEARCH" |
  sort | uniq -c | awk '{ printf "%s %s\n", $2, $1 }' | sort > /tmp/.sb_tally.$$
awk -F'|' '/^\| `(verified-full|verified-abstract|verified-locator|not-accessed)` \|/ {
    st = $2; gsub(/[ `]/, "", st); n = $3; gsub(/[ ]/, "", n)
    if (n ~ /^[0-9]+$/) printf "%s %s\n", st, n
  }' "$RESEARCH" | sort > /tmp/.sb_rollup.$$
if ! diff -q /tmp/.sb_tally.$$ /tmp/.sb_rollup.$$ >/dev/null; then
  problem "the review status rollup disagrees with the register table (rollup vs actual):"
  diff /tmp/.sb_rollup.$$ /tmp/.sb_tally.$$ | sed 's/^/      /'
else
  ok "the review status rollup matches the register table ($(wc -l < /tmp/.sb_tally.$$) statuses)"
fi
rm -f /tmp/.sb_tally.$$ /tmp/.sb_rollup.$$

# --- the stated dialogue distribution matches the actual lines ----------------
awk '
  /^## `c[0-9]`/ { ch = $2; gsub(/`/, "", ch) }
  /^## Handoff/ { ch = "" }
  ch != "" && /^  - `[a-z-]+` — / { sp = $2; gsub(/`/, "", sp); n[ch "|" sp]++ }
  END { for (k in n) { split(k, a, "|"); printf "%s %s %d\n", a[1], a[2], n[k] } }
' "$STORYBOARD" | sort > /tmp/.sb_speak.$$
for f in "$STORYBOARD"; do
  awk -F'|' '/^\| `c[0-9]` \| [0-9]+ \| [0-9]+ \| [0-9]+ \|/ {
      ch = $2; gsub(/[ `]/, "", ch)
      k = $3; gsub(/[ ]/, "", k); t = $4; gsub(/[ ]/, "", t); v = $5; gsub(/[ ]/, "", v)
      if (k > 0) printf "%s koj %s\n", ch, k
      if (t > 0) printf "%s tj %s\n", ch, t
      if (v > 0) printf "%s vier %s\n", ch, v
    }' "$f" | sort > /tmp/.sb_claim.$$
  if [ ! -s /tmp/.sb_claim.$$ ]; then
    problem "$f states no dialogue distribution table"
  elif ! diff -q /tmp/.sb_speak.$$ /tmp/.sb_claim.$$ >/dev/null; then
    problem "the dialogue distribution stated in $f disagrees with the actual lines:"
    diff /tmp/.sb_claim.$$ /tmp/.sb_speak.$$ | sed 's/^/      /'
  else
    ok "dialogue distribution stated in $f matches the actual lines"
  fi
done
rm -f /tmp/.sb_speak.$$ /tmp/.sb_claim.$$

# --- the storyboard's stated reading estimate matches its own prose ----------
# Measured here rather than by ./tools/count-main-path.sh, which now measures
# the published website. The rule is the storyboard's: every blockquote line
# inside a scene block, at 200 and 250 words a minute.
sb_words=$(awk '
  /^#### `s[0-9][0-9][0-9]`/ { inscenes = 1 }
  inscenes && /^[[:space:]]*> / {
    line = $0
    sub(/^[[:space:]]*> /, "", line)
    gsub(/\*\*/, "", line); gsub(/\*/, "", line)
    print line
  }
' "$STORYBOARD" | wc -w)
m_lo=$(( (sb_words + 249) / 250 ))
m_hi=$(( (sb_words + 199) / 200 ))
stated=$(grep -oE 'Roughly [0-9]+ to [0-9]+ minutes' "$STORYBOARD" | head -1)
s_lo=$(printf '%s' "$stated" | awk '{print $2}')
s_hi=$(printf '%s' "$stated" | awk '{print $4}')
if [ -z "$stated" ]; then
  problem "no reading estimate found on the landing scene of $STORYBOARD"
elif [ "$s_lo" != "$m_lo" ] || [ "$s_hi" != "$m_hi" ]; then
  problem "landing scene says ${s_lo}-${s_hi} minutes but its own prose measures ${m_lo}-${m_hi}"
else
  ok "reading estimate on the landing scene matches the storyboard's own prose (${m_lo}-${m_hi} min)"
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
