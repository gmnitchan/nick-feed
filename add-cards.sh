#!/bin/bash
set -euo pipefail

CARDS_FILE="cards.json"

# Read from clipboard
INPUT=$(pbpaste)

if [ -z "$INPUT" ]; then
  echo "❌ Clipboard is empty"
  exit 1
fi

# Validate JSON array
if ! echo "$INPUT" | python3 -c "import sys,json; cards=json.load(sys.stdin); assert isinstance(cards,list)" 2>/dev/null; then
  echo "❌ Clipboard does not contain a valid JSON array"
  exit 1
fi

# Validate schema and check duplicates
python3 << 'EOF'
import json, sys

VALID_TYPES = {"insight", "skill", "whatif", "timeless", "discovery", "poetry", "chinese"}
REQUIRED_FIELDS = {"id", "type", "title", "body", "footer"}

with open("cards.json", "r") as f:
    existing = json.load(f)

existing_ids = {c["id"] for c in existing}

import subprocess
new_cards = json.loads(subprocess.run(["pbpaste"], capture_output=True, text=True).stdout)

errors = []
valid_cards = []

for i, card in enumerate(new_cards):
    missing = REQUIRED_FIELDS - set(card.keys())
    if missing:
        errors.append(f"Card {i}: missing fields {missing}")
        continue
    if card["type"] not in VALID_TYPES:
        errors.append(f"Card {i}: invalid type '{card['type']}'")
        continue
    if card["id"] in existing_ids:
        errors.append(f"Card {i}: duplicate id '{card['id']}'")
        continue
    existing_ids.add(card["id"])
    valid_cards.append(card)

if errors:
    print("⚠️  Validation issues:")
    for e in errors:
        print(f"  {e}")
    if not valid_cards:
        print("❌ No valid cards to add")
        sys.exit(1)
    print(f"\n✅ Adding {len(valid_cards)} valid cards (skipping {len(errors)} invalid)")
else:
    print(f"✅ All {len(valid_cards)} cards valid")

existing.extend(valid_cards)

with open("cards.json", "w") as f:
    json.dump(existing, f, indent=2, ensure_ascii=False)

print(f"📦 cards.json now has {len(existing)} total cards")
EOF

# Git commit and push
CARD_COUNT=$(echo "$INPUT" | python3 -c 'import sys,json;print(len(json.load(sys.stdin)))')
git add cards.json
git commit -m "Add ${CARD_COUNT} new cards"
git push

echo "🚀 Pushed! GitHub Pages will deploy in ~30s"
