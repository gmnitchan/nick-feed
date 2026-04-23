#!/bin/bash
set -euo pipefail

# Export all existing card titles grouped by type — for use in generation prompts
python3 << 'EOF'
import json

with open("cards.json", "r") as f:
    cards = json.load(f)

by_type = {}
for card in cards:
    t = card["type"]
    if t not in by_type:
        by_type[t] = []
    by_type[t].append(f"- [{card['id']}] {card['title']}")

output = f"=== EXISTING CARD INDEX ({len(cards)} cards) ===\n\n"
for t, titles in sorted(by_type.items()):
    output += f"{t.upper()} ({len(titles)}):\n"
    output += "\n".join(titles) + "\n\n"
output += "=== DO NOT REPEAT THESE TOPICS ==="

print(output)
EOF
