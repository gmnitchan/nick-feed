# Nick Feed — Design Summary

Last updated: 2026-05-04

## What It Is

A personal, mobile-first PWA that replaces Instagram/YouTube/Facebook as a procrastination outlet. Instead of mindless consumption, it serves thought-provoking content in an addictive card interface. Designed to learn what Nick actually engages with and evolve accordingly.

**Live at:** https://gmnitchan.github.io/nick-feed/
**Installed as:** Home screen app on iPhone via Safari > Add to Home Screen

---

## Architecture

```
Vanilla HTML/CSS/JS — no framework, no build step, no backend

index.html ─── App shell, PWA meta, splash screen, settings overlays
styles.css ─── All styles (~600 lines), type-specific card formatting
app.js ─────── Core logic (~1100 lines): state machine, rendering, feedback, TTS
svg-gen.js ─── Generative SVG backgrounds (~160 lines), per-type patterns
sw.js ──────── Service worker, network-first for all resources
cards.json ─── Card library (loaded at runtime)
manifest.json ─ PWA manifest (standalone, dark theme)
fonts/ ──────── Plus Jakarta Sans (self-hosted woff2, 3 weights)
```

**Hosting:** GitHub Pages (free), auto-deploys on push to main
**Offline:** Full offline support via service worker (network-first, falls back to cache)

---

## Card Types

13 active types + 2 legacy. Each has an emoji, accent color, and SVG pattern defined in `app.js` and `svg-gen.js`. Colors defined as CSS variables in `styles.css`.

| Type | Description |
|------|-------------|
| poetry | Poem snippet + deep literary analysis. TTS recitation. |
| chinese | Character breakdown + cultural context. TTS pronunciation. HSK 1-2. Spaced repetition with "Learned" button. |
| philosophy | Systematic thought — advanced. Thinkers, arguments, schools, non-Western traditions. |
| history | Events, periods, paradigm shifts — advanced. Obscure, revisionist, non-Western. |
| timeless | Enduring writing — passages from essays, letters, speeches, novels with analysis. Custom hero-word rendering. |
| insight | Non-obvious observations + contrarian practical takes. (Absorbs former skill type.) |
| underthehood | How everyday systems actually work — technical deep-dives |
| power | Hidden power structures shaping daily life |
| untranslatable | Words from other languages with no English equivalent |
| contradict | Widely believed things that are factually wrong — myth + why believed + truth |
| origin | Origin stories of everyday things |
| whatif | Speculative but grounded questions |
| discovery | Exploration probe — ONLY for topics that don't fit any other type. Feedback on discovery cards informs new type creation. |

**Legacy types** (still render, no longer generated): `skill` (→insight), `paradigm` (→history)

### Card Data Model
```json
{
  "id": "discovery-001",
  "type": "discovery",
  "title": "CARD TITLE IN ALL CAPS",
  "body": "2-4 sentence preview.",
  "expanded": "3-4 paragraphs of genuine depth. Required.",
  "footer": "Source or tag",
  "image": "https://images.unsplash.com/... (optional, timeless only)"
}
```

---

## UX

### Navigation (IG Stories style)
- Tap right 35% of screen > next card
- Tap left 35% > previous card
- Tap middle 30% > expand/collapse card
- No swipe gestures

### Card Behavior
- Cards show preview state (fits one screen)
- Tap middle to expand > reveals deeper content, scrollable
- Tap middle again to collapse
- Entry animation: scale 0.95>1.0 with spring easing

### Feed State Machine
1. App opens > fetch cards.json
2. Prune localStorage `seen` entries older than 14 days
3. Split into unseen vs seen > shuffle unseen > serve
4. When unseen exhausted > show nudge card ("generate more!")
5. After nudge > recycle seen cards

### Header
- App name (left) + card counter (center) + streak (right) + settings gear

### Footer
- Back | Dislike / Like | Comment | Next

---

## Visual Design

- **Vibe:** Dark, minimal, content-forward
- **Background:** Near-black (#0a0a0a)
- **Primary accent:** Acid green (#B8FF00)
- **Font:** Plus Jakarta Sans — titles weight 800 (1.85rem), body weight 400 (1.1rem)
- **Card background:** #141414 with 4px colored accent bar at top
- **Generative SVG backgrounds:** Each card has a unique procedural pattern from card ID hash. Pattern style varies by type. Low opacity (0.06-0.12).
- **Safe area:** Header respects iPhone notch/Dynamic Island via `env(safe-area-inset-top)`

---

## Feedback System

### Explicit
- Like / Dislike buttons on every card (persists in localStorage)
- Comment button opens modal for freeform text per card
- Comments capture context snapshot: dwell time, expanded state, rating, and date at time of writing

### Passive (automatic)
- **Dwell time:** seconds spent on each card (capped at 2 min, pauses on background)
- **Expanded:** tracks which cards user tapped to read more
- **Retrieved:** tracks which cards user went back to
- **Session log:** timestamped events (view, back, expand, like, dislike, comment), capped at 500

### Sync to GitHub
- Auto-syncs `feedback.json` to repo every 10 cards viewed
- Manual sync also available in settings
- Uses GitHub API with personal access token (stored in localStorage)

### Export Options
- "View Feedback Summary" — scrollable in-app display
- "Copy Feedback Summary" — formatted text to clipboard
- "Copy Card Index" — all existing titles grouped by type (for generation)

---

## Text-to-Speech

### Chinese
- Speaker button on each card, below pinyin
- Web Speech API with `zh-CN` language, 0.7x rate

### Poetry
- "Listen" button below verse
- Line-by-line recitation: 0.65x rate, 0.85 pitch, British English
- 600ms pause between lines, 1200ms at stanza breaks
- Pause/resume toggle, auto-stops on card navigation

---

## Content Generation System

### Source of Truth Files

| File | Role |
|------|------|
| `feedback-rules.md` | Single source of truth for all generation constraints: difficulty calibration, known territory, engagement patterns, generation priorities, underexplored directions. Updated when feedback is processed. |
| `prompt-template.md` | Card generation prompt template. References feedback-rules.md and existing card titles. |
| `wild-seeds.md` | Anti-obvious generation prompts for discovery. Seeds moved to "Used" after generating. |
| `feedback.json` | Raw feedback data synced from app. Input only. |

### Archived Files
| File | Status |
|------|--------|
| `taxonomy.json` | Archived 2026-05-04. Was coverage tracking, replaced by Underexplored Directions in feedback-rules.md. |
| `archived/sync-feedback.sh` | Archived 2026-05-04. Synced feedback into taxonomy. |
| `archived/generate-plan.sh` | Archived 2026-05-04. Read taxonomy for coverage gaps. |

### Generation Workflow (two-phase with semantic dedup)
1. Read `feedback-rules.md` for constraints and priorities
2. Read `wild-seeds.md` for discovery prompts
3. Rebuild embedding index: `python3 dedup.py build`
4. **Phase 1:** Generate 50-100 card skeletons (no expanded sections) — fast, cheap
5. **Dedup:** Run `python3 dedup.py check skeletons.json -v` to reject semantic duplicates against all existing cards
6. **Phase 2:** Generate expanded sections for surviving cards in batches of 10-15
7. Merge into cards.json, rebuild index, commit and push
8. Move used wild seeds to "Used" section
9. Live on GitHub Pages in ~30s

Triggered by saying "generate cards" — no manual steps required.

### Semantic Dedup (`dedup.py`)
- Uses ONNX MiniLM-L6-v2 model (~80MB, runs locally)
- Embeds title + first sentence of body for each card
- Rejects new cards with cosine similarity > 0.75 to any existing card
- Scales to 10,000+ cards (embedding comparison is O(n) matrix multiply)
- Index stored in `dedup-index.npz` (gitignored, rebuilt from cards.json)

### Helper Scripts
- `./export-index.sh` — outputs all card titles grouped by type
- `./add-cards.sh` — clipboard > validate JSON schema > append to cards.json > commit > push
- `python3 dedup.py build` — rebuild embedding index
- `python3 dedup.py check FILE -v` — check new cards against index

---

## Feedback Processing Workflow

When "act on feedback" is triggered (see `feedback-rules.md` for full process):
1. Read new signals from `feedback.json`
2. Classify per signal table in feedback-rules.md
3. Update rules: difficulty, known territory, what works/doesn't, underexplored directions
4. Cross-check wild-seeds.md for used-but-not-moved seeds
5. Run sync checklist (see below)
6. Log what changed

---

## Sync Checklist

Run during feedback processing to prevent drift across files:

- [ ] All 13 active card types listed in `prompt-template.md` Card Types section?
- [ ] All 13 active card types listed in `prompt-template.md` type field?
- [ ] All 13 active card types in `add-cards.sh` VALID_TYPES? (legacy types excluded)
- [ ] Used wild seeds moved to "Used" in `wild-seeds.md`?
- [ ] `feedback-rules.md` Underexplored Directions card counts still accurate?
- [ ] Any discovery cards getting liked in clusters? Consider proposing a new type.
- [ ] Any new card types added since last check? If so, update: prompt-template.md, add-cards.sh, feedback-rules.md, app.js TYPE_META, svg-gen.js colors+generators, styles.css CSS variables, DESIGN.md card types table

---

## Streak System

- Tracks consecutive days the app is opened
- localStorage: `{ count: N, lastOpen: "YYYY-MM-DD" }`
- Yesterday > increment. Today > no change. Older > reset to 1.
- Displayed in header

---

## PWA Details

- `manifest.json`: standalone display, dark theme (#0a0a0a), "Nick Feed"
- Service worker: network-first for all resources
- Cache busted via `?v=N` query params on CSS/JS references
- Icons: 192px and 512px PNG with "NF" lettermark in acid green on dark
- Offline: works fully with cached cards, new cards load when online
