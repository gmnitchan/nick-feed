# Feedback Rules

Living document. Updated each time feedback is processed. Fed into card generation as the single source of truth for content constraints.

Last processed: 2026-05-04

---

## Who This Is For

Builder-engineer who uses this app as a casual social media replacement — not for work, but for genuine intellectual stimulation. High bar for "interesting." Appetite for cultural depth beyond tech. Learns Chinese. Loves poetry analysis. Wants to be steered into being the person he wants to be, without it feeling like homework.

---

## How to Process Feedback

When "act on feedback" is triggered, follow these steps in order:

### 1. Classify new signals

| Signal | What it means | Action |
|--------|--------------|--------|
| **Comment: "already know" / "too easy"** | Topic is in Nick's known territory | Add topic pattern to Known Territory; raise depth bar for that card type |
| **Comment: "too tough"** | Content exceeded current level | Add calibration note to Difficulty section for that card type |
| **Comment: "more advanced"** | Knows the basics, wants depth | Note: surface-level treatment failed; go beyond intro on related topics |
| **Comment: feature request** | App improvement idea | Flag separately — not a content rule |
| **Comment: bug report** | Something broken | Flag separately |
| **Like** | Content landed | Reinforce pattern in What Works (topic, depth, style) |
| **Dislike** | Content missed | Note what failed in What Doesn't Work |
| **High dwell (>30s) + expand** | Deep engagement | Strong positive — reinforce topic area and depth level |
| **High dwell, no expand** | Might be left open / ambiguous | Weak signal — don't act on alone |
| **Low dwell (<3s), no expand** | Skipped / not interesting | Weak negative — only act if pattern repeats across multiple cards of same type |
| **Expand but low dwell** | Opened but bounced | Expanded section needs more depth |
| **Retrieved (came back to)** | Re-engagement | Strong positive — the card had lasting value |

### 2. Update rules in the sections below

### 3. Check discovery card feedback — do liked discovery cards cluster into a topic that should become a new type? (See Discovery Pipeline below)

### 4. Update Underexplored Directions based on what types/topics feel stale or overrepresented

### 5. Cross-check wild-seeds.md — move any used seeds to "Used" section

### 6. Run sync checklist (see DESIGN.md) — verify all files agree on card types, counts, and references

### 7. Mark processed date above and log in Processing Log

---

## Discovery Pipeline

Discovery is the exploration type — it surfaces topics that don't fit any existing type. Over time, feedback on discovery cards reveals whether new types should be created.

**When processing discovery feedback, ask:**
- Are multiple liked discovery cards clustering around a common theme?
- Would that theme benefit from its own format/angle (like how "contradict" forces myth→truth structure)?
- If yes, propose a new card type to Nick.

**Discovery cards should NEVER be things that could be classified as another type.** If a discovery card is really an underthehood or origin or history card, it was miscategorized during generation.

---

## Difficulty Calibration

### chinese
- **Level:** Keep it SIMPLE. Everyday stuff only. No advanced grammar, no literary chengyu, no formal/written Chinese.
- **What works:** Common conversational phrases with cultural context (热闹, 马马虎虎, 加油). Cards that explain how a phrase is used socially, not just what it means.
- **What doesn't:** Anything that feels like a textbook lesson. Advanced chengyu (HSK 3+), formal/literary language, complex grammar structures.
- **Right difficulty benchmark:** chinese-010 got a "right level of difficulty" like. Stay at that register.
- Sources: chinese-014 "A bit too tough", chinese-032 "Too difficult. Keep it everyday stuff", chinese-033 "way too advanced. Keep it simple", chinese-010 "Right level of difficulty" (liked)

### discovery
- **Must be genuinely unexpected** — topics that don't fit any other type
- **Not a catch-all.** If it could be classified as another type, it should be.
- **Test:** Is this really unclassifiable? Or is it just a lazy underthehood/origin/history/philosophy card?

### timeless
- Enduring writing: essays, letters, speeches, passages from novels
- **Not philosophy** (systematic thought → use philosophy type) and **not history** (events/periods → use history type)
- Primary source material with analysis — the passage itself is the card, the expanded section is the deep analysis
- Source: timeless-017 "Interested in this but need it to be more advanced"

### insight
- **Skip basics** Nick does professionally: standard engineering management, common software patterns
- **Best when** connecting surprising knowledge to engineering/building practice
- Includes contrarian/counterintuitive practical takes (former "skill" type content)
- Source: insight-013 "Too easy. I do this as part of my job"

### philosophy
- **ADVANCED.** Assume familiarity with intro-level philosophy (see Known Territory)
- Go into tensions, counter-arguments, lesser-known thinkers, non-Western traditions
- Systematic thought: arguments, schools, thought experiments — not just quotes from famous thinkers
- **What works:** Jain epistemology card (philosophy-004) got like + expand + positive comment about the "related mentioned concepts." Cards that connect to other schools/thinkers resonate — the web of connections is the value.
- Source: philosophy-004 "All the related mentioned concepts here are very interesting" (liked, expanded)

### history
- **ADVANCED.** No pop history, no typical history YouTube channel content
- Obscure angles, revisionist takes, non-Western history, paradigm shifts
- Includes content that was previously "paradigm" type — moments when understanding fundamentally shifted

### poetry
- No calibration issues. Highest engagement type by every metric.
- Literary analysis is the value — the criticism, not just the verse
- Range across eras, cultures, styles. Non-Western and non-canonical poets are underexplored.

### whatif
- Specific to real decisions or macro trends, not generic thought experiments

### underthehood
- Strong engagement. Technical deep-dives on everyday systems work well.

### power / untranslatable / contradict / origin
- No calibration feedback yet. Monitor.

---

## Known Territory (topics Nick already knows — go deeper or avoid)

- Bernays / propaganda inventing modern advertising
- Standard Stoic quotes (Marcus Aurelius greatest hits)
- Pop psychology facts (Dunbar number, 10% brain myth at surface level)
- Basic startup advice (ship fast, iterate, README-first)
- Sisyphus / absurdism at intro level
- Memento Mori, Obstacle Is The Way, Socratic wisdom
- Basic engineering management practices
- Well-known "interesting facts" (chess vs atoms, Bitcoin energy)
- Trolley problem at surface level
- Basic existentialism, basic epistemology

---

## What Works (reinforce these patterns)

### By type
- **Poetry:** 3-10x longer dwell than other types. Expands and retrieves actively. The analysis in expanded sections is the real value. (Liked: poetry-021, poetry-034)
- **Chinese:** Cultural context > vocabulary. Engages most with culturally rich cards, not basic greetings. Expands almost every card. (Liked: chinese-021, chinese-024)
- **Underthehood:** 103s dwell on underthehood-008. Deep-dives on everyday systems work.
- **Timeless:** Liked timeless-027 — works when it's not surface-level famous quotes.

### By engagement pattern
- Cards with genuinely deep expanded sections get 30-100s dwell
- Poetry + underthehood + insight cards get the most expands
- Retrieved cards: poetry, chinese, whatif — breadth of re-engagement
- Zero skip rate on insight cards — every one gets at least a few seconds

### Generation priorities
1. Poetry: deep literary analysis, explore non-Western and non-canonical poets
2. Philosophy: advanced — tensions, counter-arguments, non-Western, lesser-known thinkers
3. History: advanced — obscure angles, revisionist, non-Western, paradigm shifts
4. Chinese: maintain format, go deeper into cultural context and etymology
5. Timeless: enduring writing — primary source passages with deep analysis
6. Insight: connect surprising knowledge to building practice; include contrarian practical takes
7. Underthehood: keep building out with everyday systems people don't understand
8. Untranslatable: lean into cultural depth and the "why English lacks this" angle
9. Contradict / Origin: keep expanding — these are fresh and differentiated
10. Power: "invisible systems" angle — connect to things Nick interacts with daily
11. What-if: specific, not generic
12. Discovery: ONLY for genuinely unclassifiable topics. The probe type. Keep it small and weird.
13. ALL types: "too basic" is the worst failure mode — always go deeper than expected

---

## What Doesn't Work (avoid these patterns)

- Surface-level treatment of famous ideas
- Well-known pop-science facts
- Generic startup/engineering advice
- Cards where expanded section is filler rather than genuine depth
- Famous quotes presented without novel analysis
- Using discovery as a catch-all instead of classifying into the right type

---

## Underexplored Directions (push into these for diversity)

Updated each feedback cycle. Cross-reference against existing card titles to find fresh territory.

### Card types that need more volume (as of 434 total cards)
- **philosophy** (NEW) — brand new type, needs initial batch
- **history** (NEW) — brand new type, needs initial batch. Existing paradigm cards (15) serve as seed content.
- **contradict** (14) — strong concept, needs more
- **origin** (16) — needs more
- **power** (16) — room to grow
- **underthehood** (20) — consistently strong dwell times, deserves more
- **untranslatable** (25) — high engagement

### Topic areas barely touched
- Sufi/Persian poetry, haiku/Japanese poetry, beat generation, romantic era, Victorian, modernist, contemporary
- Epidemiology, astronomy, geology, volcanology, cold war tech, biotech, space technology
- Central banking, price theory, development economics
- Philosophy of language, free will, existentialism (deeper than intro), phenomenology, non-Western philosophy (Ubuntu, Confucian ethics, Buddhist logic, Jain epistemology)
- Non-Western history: pre-colonial Africa, Southeast Asian empires, Mesoamerican science, Pacific Islander navigation
- Sign languages, writing systems, pidgins and creoles, translation theory
- Number theory, graph theory, combinatorics, unsolved math problems
- Culinary science, fashion as language, street art, dance, photography theory
- Addiction mechanics, trauma and resilience
- Cybernetics, catastrophe theory, network science, evolutionary dynamics

### Tone/style directions to try
- More non-Western sources across all types
- More primary-source quotes (not just "X said Y" but the actual passage with analysis) — timeless type is built for this
- More "systems that shape your life invisibly" content (strong signal from power + underthehood engagement)

---

## Type Changes Log

| Date | Change |
|------|--------|
| 2026-05-04 | Added philosophy, history. Merged skill→insight, paradigm→history. Redefined discovery as exploration-only probe type. Redefined timeless as enduring writing. |

---

## Processing Log

| Date | Signals processed | Rules changed |
|------|------------------|---------------|
| 2026-05-04 | 7 comments (4 addressed previously, 3 new), 7 likes, dwell/expand/retrieve data through Apr 29 | Initial rules created. Difficulty calibration for chinese, discovery, timeless, insight. Known territory list. Engagement patterns. Type restructure: +philosophy, +history, skill→insight, paradigm→history, discovery redefined. |
| 2026-05-07 | 5 new comments (chinese-033, chinese-010, philosophy-004, chinese-032, underthehood-023) | Chinese difficulty tightened: "keep it simple, everyday stuff only." Philosophy positive signal: connections between schools/thinkers is the value. Feature request: liked cards collection. |
