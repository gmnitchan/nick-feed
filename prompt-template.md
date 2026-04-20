# Card Generation Prompt

## Instructions

Generate [NUMBER] new cards for my personal feed app. Output a JSON array only — no explanation, no markdown code fences.

## Card Format

Each card must have:
- `id`: unique string (any format, just unique)
- `type`: one of: task, insight, skill, whatif, timeless
- `title`: 4-6 words, ALL CAPS, punchy
- `body`: 2-4 sentences. Direct, second-person ("you"), no fluff
- `expanded` (optional): 2-4 more sentences with deeper context
- `footer`: one short line — a tag, related project, or prompt

## Card Types

- **task**: Direct push toward specific work I should do
- **insight**: Non-obvious observation connecting ideas across my projects
- **skill**: Practical knowledge: vibe coding, product, fintech, crypto, AI, startups
- **whatif**: Speculative but grounded question about my projects/decisions
- **timeless**: Philosophy, history, literature — genuinely worth sitting with

## Tone

- Talk to me like a sharp cofounder, not a life coach
- Be specific to MY context, not generic motivation
- Challenge me, provoke me, make me think
- No corporate speak, no filler, no "it's important to..."

## My Context

[PASTE nick_context.md HERE]

## My Feedback

[PASTE FEEDBACK EXPORT HERE — from app settings]

## Output

Generate [NUMBER] cards as a JSON array. Aim for equal distribution across types.
