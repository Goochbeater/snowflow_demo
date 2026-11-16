#!/bin/bash
# VOXEL WORLD — build the single-file html from numbered parts. SLUG comes from world.conf.
#   ./rebuild.sh                 -> build/main.html
#   ./rebuild.sh build/X.html    -> that path (agents: build/<your-agent>.html)
#   ./rebuild.sh --ship          -> build/main.html AND ~/Desktop/$SLUG.html
# Every *.js part is syntax-checked ON ITS OWN. A part that fails is replaced by its
# last good copy (.lastgood/) so one agent's half-typed edit never breaks everyone's build.
# Each part is wrapped in its own block `try { ... } catch(e) { AF.partError(...) }`:
# top-level const/let/function names are therefore PRIVATE to the part. Share via AF.*.
set -u
cd "$(dirname "$0")"
SLUG=world; [ -f world.conf ] && . ./world.conf
SHIP=0; OUT=build/main.html
for a in "$@"; do
  if [ "$a" = "--ship" ]; then SHIP=1; else OUT="$a"; fi
done
mkdir -p build .lastgood "$(dirname "$OUT")"
TMP=$(mktemp -d)
STAMP=$(date '+%Y-%m-%d %H:%M:%S')
BAD=0
{
  cat 00-head.html
  echo '<script id="app-src" type="text/plain">'
  cat 00-prologue.js
  for f in [0-9][0-9]-*.js; do
    [ "$f" = "00-prologue.js" ] && continue
    src="$f"
    # syntax check this part alone, wrapped exactly as it will be emitted
    { echo "const AF={partError(){},partOn(){return true}};const THREE={};"; echo "try { if (AF.partOn('x')) {"; cat "$f"; echo ""; echo "} } catch(e) {}"; } > "$TMP/check.mjs"
    if node --check "$TMP/check.mjs" 2> "$TMP/err.txt"; then
      if grep -q '</script' "$f"; then
        echo "REBUILD: $f contains a closing script tag — using last good copy" >&2
        src=".lastgood/$f"; BAD=1
      else
        cp "$f" ".lastgood/$f"
      fi
    else
      echo "REBUILD: SYNTAX ERROR in $f — using last good copy" >&2
      head -8 "$TMP/err.txt" >&2
      src=".lastgood/$f"; BAD=1
    fi
    [ -f "$src" ] || { echo "REBUILD: no last good copy of $f, skipping it" >&2; continue; }
    echo ""
    echo "// ================================================================ $f"
    echo "try { if (AF.partOn('$f')) {"
    cat "$src"
    echo ""
    echo "} } catch (e) { AF.partError('$f', e); }"
  done
  cat 99-tail.html
} | sed "s/@@BUILD@@/$STAMP/g" > "$TMP/out.html"
mv "$TMP/out.html" "$OUT"
rm -rf "$TMP"
echo "built $OUT ($(wc -c < "$OUT" | tr -d ' ') bytes, $STAMP)$( [ $BAD = 1 ] && echo ' — WITH FALLBACK PARTS')"
if [ $SHIP = 1 ]; then
  # the shipped file is self-contained (three.js embedded): it opens with a double-click, no network needed
  if [ -f tools/vendor/build/three.module.js ] && python3 tools/offline.py "$OUT" "$HOME/Desktop/$SLUG.html" >/dev/null 2>&1; then echo "shipped ~/Desktop/$SLUG.html (self-contained)"; else cp "$OUT" "$HOME/Desktop/$SLUG.html"; echo "shipped ~/Desktop/$SLUG.html (needs the three.js CDN)"; fi
fi
