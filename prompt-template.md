# Card Generation Prompt

## Instructions

Generate [NUMBER] new cards for my personal feed app. Output a JSON array only — no explanation, no markdown code fences.

**CRITICAL: Every card must cover a topic NOT already in my library. Check the "Existing Card Titles" section below. Do not repeat, rephrase, or closely paraphrase any existing topic. If an existing card covers Stoicism, don't make another Stoicism card. If one covers procrastination, don't make another procrastination card. Go wide — find completely different domains, ideas, people, and angles.**

## Card Format

Each card must have:
- `id`: unique string (any format, just unique — check existing IDs below to avoid collisions)
- `type`: one of: insight, skill, whatif, timeless, discovery, poetry, chinese
- `title`: 4-6 words, ALL CAPS, punchy
- `body`: 2-4 sentences. Direct, second-person ("you"), no fluff
- `expanded`: REQUIRED. 3-4 paragraphs of genuine depth. Not filler — real analysis, history, practical application, surprising details. This is where the value lives.
- `footer`: one short line — a source, related project, or prompt
- `image` (optional, timeless only): Unsplash URL in format `https://images.unsplash.com/photo-XXXX?w=800&q=80`

## Card Types

- **insight**: Non-obvious observation connecting ideas across projects or domains
- **skill**: Practical, applicable knowledge: vibe coding, product, fintech, crypto, AI, startups
- **whatif**: Speculative but grounded question about projects or decisions
- **timeless**: Philosophy, history, literature — genuinely worth sitting with. Include an `image` field with a relevant Unsplash URL.
- **discovery**: Content I didn't ask for. Explore random domains: science, anthropology, economics, music, architecture, biology, military history, linguistics, art, mathematics, psychology, geography, food, sport, medicine, law, design, etc. The goal is to find what I don't know I'm interested in.
- **poetry**: Poem snippet in body (preserve line breaks with \n). Expanded = deep literary analysis. Range across eras, cultures, styles.
- **chinese**: Title format: "汉字 — PĪNYĪN". Body = translation + character breakdown. Expanded = tones, grammar, cultural context, related phrases. Pitch at early-intermediate level (HSK 1-2).

## Tone

- Talk to me like a sharp cofounder, not a life coach
- Be specific and surprising, not generic
- Challenge me, provoke me, make me think
- No corporate speak, no filler, no "it's important to..."

## My Context

[PASTE nick_context.md HERE]

## My Feedback

[PASTE FEEDBACK EXPORT HERE — from app settings]

## Existing Card Titles

**DO NOT create cards covering these topics or anything closely related:**

[PASTE CARD INDEX HERE — from app settings or ./export-index.sh]

## Output

Generate [NUMBER] cards as a JSON array. Aim for variety across types. Prioritize discovery and poetry — these are where freshness matters most.
