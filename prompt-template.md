# Card Generation Prompt

## Instructions

Generate [NUMBER] new cards for my personal feed app. Output a JSON array only — no explanation, no markdown code fences.

**CRITICAL: Every card must cover a topic NOT already in my library. Check the "Existing Card Titles" section below. Do not repeat, rephrase, or closely paraphrase any existing topic. If an existing card covers Stoicism, don't make another Stoicism card. If one covers procrastination, don't make another procrastination card. Go wide — find completely different domains, ideas, people, and angles.**

## Card Format

Each card must have:
- `id`: unique string (any format, just unique — check existing IDs below to avoid collisions)
- `type`: one of: insight, whatif, timeless, discovery, poetry, chinese, underthehood, power, untranslatable, philosophy, history, contradict, origin
- `title`: 4-6 words, ALL CAPS, punchy
- `body`: 2-4 sentences. Direct, second-person ("you"), no fluff
- `expanded`: REQUIRED. 3-4 paragraphs of genuine depth. Not filler — real analysis, history, practical application, surprising details. This is where the value lives.
- `footer`: one short line — a source, related project, or prompt
- `image` (optional, timeless only): Unsplash URL in format `https://images.unsplash.com/photo-XXXX?w=800&q=80`

## Card Types

- **insight**: Non-obvious observations and contrarian takes connecting ideas to building practice. Both observational and actionable. (Absorbs former "skill" type.)
- **whatif**: Speculative but grounded question about real decisions or macro trends — not generic thought experiments.
- **timeless**: Enduring writing — passages from essays, letters, speeches, novels. Primary source material with analysis. Not systematic philosophy (that's philosophy type) or historical narrative (that's history type). Think: Montaigne, Seneca's letters, Thoreau's journal, a paragraph from a novel that captures something eternal.
- **discovery**: ONLY for topics that don't fit any other card type. This is the exploration/probe type — surface genuinely unexpected territory. If a topic COULD be classified as another type, it should be. Feedback on discovery cards informs whether new types should be created. The weirder and more unexpected, the better.
- **poetry**: Poem snippet in body (preserve line breaks with \n). Expanded = deep literary analysis. Range across eras, cultures, styles.
- **chinese**: Title format: "汉字 — PĪNYĪN". Body = translation + character breakdown. Expanded = tones, grammar, cultural context, related phrases. Pitch at early-intermediate level (HSK 1-2).
- **underthehood**: How everyday systems actually work — technical deep-dives on things people use but don't understand. Email delivery, GPS, spell check, compression, etc.
- **power**: Hidden power structures and systems that shape daily life invisibly. Pharma pricing, water rights, patent trolls, credit ratings, etc.
- **philosophy**: Systematic thought — thinkers, arguments, schools, thought experiments. ADVANCED: assume familiarity with intro-level philosophy (Stoic greatest hits, Sisyphus, trolley problem). Go into tensions, counter-arguments, lesser-known thinkers, non-Western traditions, connections between schools.
- **history**: Events, periods, and shifts in understanding. ADVANCED: no pop history or things from typical history YouTube channels. Obscure angles, revisionist takes, non-Western history, paradigm shifts. (Absorbs former "paradigm" type.)
- **untranslatable**: Words from other languages with no English equivalent. Body = the word, pronunciation, literal meaning. Expanded = cultural context, usage, why English lacks it.
- **contradict**: "Actually wrong" — widely believed things that are factually incorrect. Not just myths but WHY people believe them and what's actually true.
- **origin**: Origin stories of everyday things. Where did handshakes, tipping, wedding rings come from? The real history, not the folk explanation.

## Tone

- Talk to me like a sharp cofounder, not a life coach
- Be specific and surprising, not generic
- Challenge me, provoke me, make me think
- No corporate speak, no filler, no "it's important to..."

## Feedback Rules (from feedback-rules.md)

[PASTE feedback-rules.md HERE — difficulty calibration, known territory, what works/doesn't, generation priorities. This is the single source of truth for content constraints.]

## Existing Card Titles

**DO NOT create cards covering these topics or anything closely related:**

[PASTE CARD INDEX HERE — from app settings or ./export-index.sh]

## Output

Generate [NUMBER] cards as a JSON array. Aim for variety across all 13 types. Check the feedback rules for which types need more volume and which engagement patterns to reinforce.
