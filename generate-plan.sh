#!/bin/bash
set -euo pipefail

# Analyzes taxonomy coverage and recommends what to generate next
python3 << 'PYEOF'
import json

with open("taxonomy.json", "r") as f:
    taxonomy = json.load(f)

with open("cards.json", "r") as f:
    cards = json.load(f)

total_cards = len(cards)
wild_budget = taxonomy["_meta"]["wildBudget"]

print(f"=== GENERATION PLAN ({total_cards} cards in library) ===\n")

# Find zero-coverage subtopics (highest priority)
zero_coverage = []
low_coverage = []
high_engagement = []
low_engagement = []

for category, subtopics in taxonomy["categories"].items():
    for subtopic, data in subtopics.items():
        if data["status"] != "active":
            continue
        if data["cards"] == 0:
            zero_coverage.append(f"  {category}/{subtopic}")
        elif data["cards"] <= 1:
            low_coverage.append(f"  {category}/{subtopic} ({data['cards']} cards)")

        if data["liked"] > 0:
            ratio = data["liked"] / max(data["cards"], 1)
            high_engagement.append((ratio, f"  {category}/{subtopic} ({data['liked']}/{data['cards']} liked)"))
        if data["disliked"] > data["liked"] and data["cards"] >= 2:
            low_engagement.append(f"  {category}/{subtopic} ({data['disliked']}/{data['cards']} disliked)")

print(f"ZERO COVERAGE — prioritize these ({len(zero_coverage)} subtopics):")
for item in zero_coverage[:20]:
    print(item)
if len(zero_coverage) > 20:
    print(f"  ... and {len(zero_coverage) - 20} more")

print(f"\nLOW COVERAGE — 1 card only ({len(low_coverage)} subtopics):")
for item in low_coverage[:10]:
    print(item)

if high_engagement:
    high_engagement.sort(reverse=True)
    print(f"\nHIGH ENGAGEMENT — expand these:")
    for _, item in high_engagement[:10]:
        print(item)

if low_engagement:
    print(f"\nLOW ENGAGEMENT — consider deprioritizing:")
    for item in low_engagement:
        print(item)

# Category summary
print(f"\n--- CATEGORY COVERAGE ---")
for category, subtopics in taxonomy["categories"].items():
    total = sum(s["cards"] for s in subtopics.values())
    active = sum(1 for s in subtopics.values() if s["status"] == "active")
    covered = sum(1 for s in subtopics.values() if s["cards"] > 0)
    print(f"  {category}: {total} cards across {covered}/{active} subtopics")

# Recommendation
batch_size = 20
wild_count = int(batch_size * wild_budget)
taxonomy_count = batch_size - wild_count

print(f"\n=== RECOMMENDED BATCH: {batch_size} cards ===")
print(f"  {taxonomy_count} from zero-coverage subtopics")
print(f"  {wild_count} from wild-seeds.md")
print(f"\nSuggested zero-coverage targets:")
# Pick from categories with least coverage
cat_coverage = {}
for category, subtopics in taxonomy["categories"].items():
    zeros = [s for s, d in subtopics.items() if d["cards"] == 0 and d["status"] == "active"]
    if zeros:
        total = sum(d["cards"] for d in subtopics.values())
        cat_coverage[category] = (total, zeros)

for cat, (total, zeros) in sorted(cat_coverage.items(), key=lambda x: x[1][0]):
    pick = zeros[:2]
    for s in pick:
        print(f"  → {cat}/{s}")

PYEOF
