#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat >&2 <<'EOF'
Usage: wsa_fetch.sh <lesson-url> <slug>

Examples:
  scripts/wsa_fetch.sh \
    https://app.wsatraining.com/courses/phase-one/lessons/drawing-trendlines-2-0-2/ \
    drawing-trendlines-2-0

Environment variables:
  WSA_COOKIES   Path to your authenticated cookies file (default: tmp/wsa_cookies.txt)
  WSA_OUT_DIR   Directory for downloaded media (default: tmp/wsa-media)
  WSA_TRANSCRIPTS  Directory for transcripts (default: tmp/wsa-transcripts)
EOF
  exit 2
}

if [[ "${1:-}" == "" || "${2:-}" == "" ]]; then
  usage
fi

LESSON_URL="$1"
SLUG="$2"
COOKIES_FILE="${WSA_COOKIES:-tmp/wsa_cookies.txt}"
MEDIA_DIR="${WSA_OUT_DIR:-tmp/wsa-media}"
TRANSCRIPT_DIR="${WSA_TRANSCRIPTS:-tmp/wsa-transcripts}"

if [[ ! -f "$COOKIES_FILE" ]]; then
  echo "[!] Cookies file not found: $COOKIES_FILE" >&2
  exit 1
fi

mkdir -p "$MEDIA_DIR" "$TRANSCRIPT_DIR"

VIDEO_PATH="$MEDIA_DIR/${SLUG}.mp4"
AUDIO_PATH="$MEDIA_DIR/${SLUG}.m4a"
TRANSCRIPT_PATH="$TRANSCRIPT_DIR/${SLUG}.txt"

if command -v yt-dlp >/dev/null 2>&1; then
  YTDLP=yt-dlp
elif command -v youtube-dl >/dev/null 2>&1; then
  YTDLP=youtube-dl
else
  echo "[!] yt-dlp (or youtube-dl) is required" >&2
  exit 1
fi

TMP_TEMPLATE="$MEDIA_DIR/${SLUG}.%(ext)s"

echo "[+] Downloading lesson stream → $VIDEO_PATH"
"$YTDLP" \
  --cookies "$COOKIES_FILE" \
  --no-warnings \
  --restrict-filenames \
  --merge-output-format mp4 \
  -f 'bv*+ba/b' \
  -o "$TMP_TEMPLATE" \
  "$LESSON_URL"

DOWNLOADED_FILE=$(ls "$MEDIA_DIR"/${SLUG}.* | head -n 1)
if [[ "$DOWNLOADED_FILE" != "$VIDEO_PATH" ]]; then
  mv "$DOWNLOADED_FILE" "$VIDEO_PATH"
fi

echo "[+] Extracting audio → $AUDIO_PATH"
ffmpeg -hide_banner -loglevel error -y -i "$VIDEO_PATH" -vn -acodec copy "$AUDIO_PATH"

# Resolve API key (env var wins; otherwise read from config)
API_KEY="${OPENAI_API_KEY:-}"
if [[ -z "$API_KEY" ]]; then
  API_KEY=$(python3 - <<'PY'
import json, os, pathlib
cfg = json.loads(pathlib.Path(os.path.expanduser('~/.openclaw/openclaw.json')).read_text())
print(cfg.get('skills', {}).get('entries', {}).get('openai-whisper-api', {}).get('apiKey', ''))
PY
  )
fi

if [[ -z "$API_KEY" ]]; then
  echo "[!] OPENAI_API_KEY not configured (set the env var or add it to openclaw.json)" >&2
  exit 1
fi

TRANSCRIBE_SCRIPT="$HOME/.npm-global/lib/node_modules/openclaw/skills/openai-whisper-api/scripts/transcribe.sh"
if [[ ! -x "$TRANSCRIBE_SCRIPT" ]]; then
  chmod +x "$TRANSCRIBE_SCRIPT"
fi

echo "[+] Transcribing audio → $TRANSCRIPT_PATH"
OPENAI_API_KEY="$API_KEY" "$TRANSCRIBE_SCRIPT" "$AUDIO_PATH" --language en --out "$TRANSCRIPT_PATH" >/dev/null

echo "[✓] Media: $VIDEO_PATH"
echo "[✓] Audio: $AUDIO_PATH"
echo "[✓] Transcript: $TRANSCRIPT_PATH"
