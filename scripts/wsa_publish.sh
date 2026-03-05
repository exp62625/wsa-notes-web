#!/usr/bin/env bash
set -euo pipefail

ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
SITE_DIR="$ROOT/notes/wallstreet-academy/site"
PUBLISH_DIR="$ROOT/publish/wsa-notes-web"
CONTENT_DEST="$PUBLISH_DIR/content"

if [[ ! -d "$SITE_DIR" ]]; then
  echo "[!] Site directory not found: $SITE_DIR" >&2
  exit 1
fi

rm -rf "$PUBLISH_DIR"
mkdir -p "$PUBLISH_DIR"

rsync -a --exclude '.DS_Store' "$SITE_DIR/" "$PUBLISH_DIR/"

mkdir -p "$CONTENT_DEST"
shopt -s nullglob
for module in "$ROOT"/notes/wallstreet-academy/module-*; do
  if [[ -d "$module" ]]; then
    base=$(basename "$module")
    mkdir -p "$CONTENT_DEST/$base"
    rsync -a "$module/" "$CONTENT_DEST/$base/"
  fi
done
shopt -u nullglob

echo "[✓] Copied site + markdown content to $PUBLISH_DIR"
echo "Next steps: commit + push publish/wsa-notes-web → GitHub Pages"
