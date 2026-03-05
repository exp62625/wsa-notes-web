#!/usr/bin/env python3
import argparse
import json
import os
from datetime import date
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parent.parent
NOTES_ROOT = ROOT / "notes" / "wallstreet-academy"
TEMPLATE_PATH = NOTES_ROOT / "templates" / "lesson.md"
NOTES_JSON = NOTES_ROOT / "site" / "notes.json"
TRANSCRIPTS_DIR = NOTES_ROOT / "transcripts"


def load_template():
    if not TEMPLATE_PATH.exists():
        raise SystemExit(f"Template not found: {TEMPLATE_PATH}")
    return TEMPLATE_PATH.read_text()


def ensure_entry(data, args):
    existing = next((item for item in data if item.get("id") == args.id), None)
    if existing and not args.force_json:
        print(f"[i] notes.json already has id '{args.id}', skipping JSON update")
        return data

    record = {
        "id": args.id,
        "module": args.module,
        "lesson": args.lesson,
        "teacher": args.teacher,
        "status": "in-progress",
        "updated": None,
        "tags": args.tags,
        "summary": args.summary,
        "q_and_a": [],
        "links": {
            "video": args.video or None,
            "notes": f"content/{args.module_dir}/{args.slug}.md"
        }
    }
    if existing:
        idx = data.index(existing)
        data[idx] = record
        print(f"[+] Updated existing notes.json entry for {args.id}")
    else:
        data.append(record)
        print(f"[+] Added notes.json entry for {args.id}")
    return data


def write_markdown(args, template):
    module_dir = NOTES_ROOT / args.module_dir
    module_dir.mkdir(parents=True, exist_ok=True)
    note_path = module_dir / f"{args.slug}.md"

    if note_path.exists() and not args.force_note:
        print(f"[i] Note already exists at {note_path}, skipping (use --force-note to overwrite)")
        return note_path

    filled = template.format(
        LESSON=args.lesson,
        MODULE_NAME=args.module,
        TRANSCRIPT_REFERENCE=args.transcript or "(add path)"
    )
    note_path.write_text(filled)
    print(f"[+] Wrote note template → {note_path}")
    return note_path


def copy_transcript(args):
    if not args.transcript:
        return None
    src = Path(args.transcript)
    if not src.exists():
        print(f"[!] Transcript not found: {src}")
        return None
    TRANSCRIPTS_DIR.mkdir(parents=True, exist_ok=True)
    dest = TRANSCRIPTS_DIR / f"{args.slug}.txt"
    shutil.copy2(src, dest)
    print(f"[+] Copied transcript → {dest}")
    return dest


def main():
    parser = argparse.ArgumentParser(description="Scaffold a WSA lesson note + notes.json entry.")
    parser.add_argument("--id", required=True, help="notes.json id (e.g., phase-one-drawing-trendlines-2-0)")
    parser.add_argument("--module", required=True, help="Module label (e.g., 'Phase One')")
    parser.add_argument("--module-dir", required=True, help="Module folder (e.g., module-01)")
    parser.add_argument("--lesson", required=True, help="Lesson title")
    parser.add_argument("--slug", required=True, help="Filename slug")
    parser.add_argument("--video", default="", help="Lesson video URL")
    parser.add_argument("--teacher", default="Cue")
    parser.add_argument("--tags", nargs="*", default=[])
    parser.add_argument("--summary", default="")
    parser.add_argument("--transcript", help="Path to transcript to archive (optional)")
    parser.add_argument("--force-note", action="store_true")
    parser.add_argument("--force-json", action="store_true")
    args = parser.parse_args()

    template = load_template()
    note_path = write_markdown(args, template)
    copy_transcript(args)

    if NOTES_JSON.exists():
        data = json.loads(NOTES_JSON.read_text())
    else:
        data = []
    data = ensure_entry(data, args)
    NOTES_JSON.write_text(json.dumps(data, indent=2) + "\n")
    print(f"[✓] notes.json updated at {NOTES_JSON}")

    if note_path:
        print("Next steps:")
        print(f"  - Fill out {note_path} with your distilled notes")
        print("  - Run scripts/wsa_publish.sh when you’re ready to deploy")


if __name__ == "__main__":
    main()
