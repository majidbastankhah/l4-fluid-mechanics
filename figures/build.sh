#!/usr/bin/env bash
# Build every TikZ figure in figures/src/ into figures/build/<name>.pdf and .svg
#   .svg is used by the website, .pdf by the printable PDF version of the notes.
# Requirements: pdflatex (TeX Live) and pdftocairo (poppler-utils).
# Usage:  bash figures/build.sh            (all figures)
#         bash figures/build.sh ch1-couette (one figure)
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
SRC="$HERE/src"; OUT="$HERE/build"; TMP="$(mktemp -d)"
mkdir -p "$OUT"
names=("$@")
if [ ${#names[@]} -eq 0 ]; then
  for f in "$SRC"/*.tex; do names+=("$(basename "$f" .tex)"); done
fi
for n in "${names[@]}"; do
  {
    cat "$HERE/preamble.tex"
    echo '\begin{document}'
    cat "$SRC/$n.tex"
    echo '\end{document}'
  } > "$TMP/$n.tex"
  if pdflatex -interaction=nonstopmode -halt-on-error -output-directory "$TMP" "$TMP/$n.tex" > "$TMP/$n.log" 2>&1; then
    cp "$TMP/$n.pdf" "$OUT/$n.pdf"
    pdftocairo -svg "$OUT/$n.pdf" "$OUT/$n.svg"
    echo "built  $n"
  else
    echo "FAILED $n (see log below)"; tail -20 "$TMP/$n.log"; exit 1
  fi
done
rm -rf "$TMP"
