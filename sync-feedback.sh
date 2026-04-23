#!/bin/bash
set -euo pipefail

# Syncs feedback.json (exported from app) into taxonomy.json
# Usage: ./sync-feedback.sh [path-to-feedback.json]

FEEDBACK_FILE="${1:-feedback.json}"

if [ ! -f "$FEEDBACK_FILE" ]; then
  echo "❌ No feedback file found at $FEEDBACK_FILE"
  echo "   Export from app: Settings → Share Feedback File"
  echo "   Then: ./sync-feedback.sh path/to/feedback.json"
  exit 1
fi

python3 << PYEOF
import json

with open("$FEEDBACK_FILE", "r") as f:
    feedback = json.load(f)

with open("cards.json", "r") as f:
    cards = json.load(f)

with open("taxonomy.json", "r") as f:
    taxonomy = json.load(f)

# Build card type lookup
card_types = {c["id"]: c["type"] for c in cards}

# Map card types to taxonomy categories/subtopics
# This is approximate — cards don't store subtopic info
# So we track likes/dislikes at the card-type level
explicit = feedback.get("explicit", {})
comments = feedback.get("comments", {})
passive = feedback.get("passive", {})

likes = sum(1 for v in explicit.values() if v.get("rating") == "like")
dislikes = sum(1 for v in explicit.values() if v.get("rating") == "dislike")
expanded = len(passive.get("expanded", []))
retrieved = len(passive.get("retrieved", []))
skipped = sum(1 for t in passive.get("dwellTimes", {}).values() if t < 1)

print(f"=== FEEDBACK SYNC ===")
print(f"Explicit: {likes} likes, {dislikes} dislikes")
print(f"Passive: {expanded} expanded, {retrieved} retrieved, {skipped} skipped")
print(f"Comments: {len(comments)}")

# Update taxonomy lastUpdated
taxonomy["_meta"]["lastUpdated"] = feedback.get("exportedAt", "unknown")

with open("taxonomy.json", "w") as f:
    json.dump(taxonomy, f, indent=2, ensure_ascii=False)

print(f"\nTaxonomy updated. Run ./generate-plan.sh to see recommendations.")
PYEOF
