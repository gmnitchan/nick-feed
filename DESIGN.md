# Nick Feed — Design Summary

Last updated: 2026-04-23 | 92 cards | 33 commits

## What It Is

A personal, mobile-first PWA that replaces Instagram/YouTube/Facebook as a procrastination outlet. Instead of mindless consumption, it serves thought-provoking content in an addictive card interface. Designed to learn what Nick actually engages with and evolve accordingly.

**Live at:** https://gmnitchan.github.io/nick-feed/
**Installed as:** Home screen app on iPhone via Safari → Add to Home Screen

---

## Architecture

```
Vanilla HTML/CSS/JS — no framework, no build step, no backend

index.html ─── App shell, PWA meta, splash screen, settings overlays
styles.css ─── All styles (563 lines), type-specific card formatting
app.js ─────── Core logic (862 lines): state machine, rendering, feedback, TTS
svg-gen.js ─── Generative SVG backgrounds (154 lines), 7 type-specific patterns
sw.js ──────── Service worker, network-first for all resources
cards.json ─── Card library (92 cards, loaded at runtime)
manifest.json ─ PWA manifest (standalone, dark theme)
fonts/ ──────── Plus Jakarta Sans (self-hosted woff2, 3 weights)
```

**Hosting:** GitHub Pages (free), auto-deploys on push to main
**Offline:** Full offline support via service worker (network-first, falls back to cache)

---

## Card Types

| Type | Emoji | Color | Count | Custom Rendering |
|------|-------|-------|-------|-----------------|
| Discovery | 🔭 | #FF5CBE (pink) | 29 | Default layout, angular SVG |
| Timeless | 📚 | #F5E6D3 (warm white) | 16 | Hero image (Unsplash) with gradient fade, italic title |
| Poetry | ✒️ | #E8C547 (gold) | 13 | Gold left-border verse, italic text, TTS recitation |
| Chinese | 🇨🇳 | #FF4444 (red) | 11 | Large centered characters, pinyin below, TTS pronunciation |
| Insight | 🧠 | #00D4FF (cyan) | 9 | Default layout, neural-net SVG |
| Skill | 🧩 | #A855F7 (purple) | 7 | Default layout, grid SVG |
| What If | 🎲 | #FF8A00 (orange) | 7 | Default layout, branching SVG |

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
- Tap right 35% of screen → next card
- Tap left 35% → previous card
- Tap middle 30% → expand/collapse card
- No swipe gestures (removed — didn't feel right on mobile)

### Card Behavior
- Cards show preview state (fits one screen)
- Tap middle to expand → reveals deeper content, scrollable
- Tap middle again to collapse
- Entry animation: scale 0.95→1.0 with spring easing

### Feed State Machine
1. App opens → fetch cards.json
2. Prune localStorage `seen` entries older than 14 days
3. Split into unseen vs seen → shuffle unseen → serve
4. When unseen exhausted → show nudge card ("generate more!")
5. After nudge → recycle seen cards

### Header
- App name (left) + card counter "14 / 87 new" (center) + streak "🔥 3" (right) + settings gear

### Footer
- ← Back | 👎 👍 | 💬 Comment | → Next

---

## Visual Design

- **Vibe:** Dark, minimal, content-forward (Tinder-inspired)
- **Background:** Near-black (#0a0a0a)
- **Primary accent:** Acid green (#B8FF00)
- **Font:** Plus Jakarta Sans — titles weight 800 (1.85rem), body weight 400 (1.1rem)
- **Card background:** #141414 with 4px colored accent bar at top
- **Generative SVG backgrounds:** Each card has a unique procedural pattern generated from card ID hash. Pattern style varies by type. Low opacity (0.06-0.12).
- **Safe area:** Header respects iPhone notch/Dynamic Island via `env(safe-area-inset-top)`

---

## Feedback System

### Explicit
- 👍 / 👎 buttons on every card (persists indefinitely in localStorage)
- 💬 Comment button opens modal for freeform text per card

### Passive (automatic)
- **Dwell time:** seconds spent on each card
- **Expanded:** tracks which cards user tapped to read more
- **Retrieved:** tracks which cards user went back to re-read
- **Speed-skipped:** cards with <1s dwell (implied disinterest)

### Sync to GitHub
- "Sync Feedback to GitHub" button in settings
- Pushes `feedback.json` to the repo via GitHub API
- Requires one-time GitHub personal access token setup (stored in localStorage)
- Claude reads `feedback.json` directly when generating new cards

### Export Options
- "View Feedback Summary" — scrollable in-app display
- "Copy Feedback Summary" — formatted text to clipboard
- "Copy Card Index" — all existing titles grouped by type (for generation)

---

## Text-to-Speech

### Chinese
- 🔊 button on each card, below pinyin
- Uses Web Speech API with `zh-CN` language, 0.7x rate
- Speaks the Chinese characters only

### Poetry
- "🔊 Listen" button below verse
- Line-by-line recitation with pacing:
  - 0.65x rate, 0.85 pitch, British English voice
  - 600ms pause between lines
  - 1200ms pause at stanza breaks
- Pause/resume toggle (⏸ Pause / ▶️ Resume)
- Auto-stops when navigating to another card

---

## Content Generation System

### Taxonomy (`taxonomy.json`)
- 14 categories, 154 subtopics
- Each subtopic tracks: card count, likes, dislikes, active/inactive status
- Categories: science, history, philosophy, economics, psychology, technology, engineering_craft, product_startup, arts_culture, systems_complexity, language_linguistics, mathematics, poetry_eras, chinese_language

### Wild Seeds (`wild-seeds.md`)
- 60+ anti-obvious generation prompts
- Organized by theme: obscure professions, weird intersections, forgotten places, etc.
- 25% of each generation batch drawn from wild seeds
- Seeds moved to "Used" section after generation

### User Profile (`user-profile.md`)
- Auto-generated from feedback data
- Tracks what works, what doesn't, and generation rules
- Updated each time feedback is analyzed

### Generation Workflow (fully automated from Claude Code)
1. `git pull` latest feedback.json
2. Run engagement analysis against user-profile.md
3. Run `./generate-plan.sh` for coverage gaps
4. Read taxonomy.json + wild-seeds.md + cards.json
5. Generate cards targeting zero-coverage subtopics + wild seeds
6. Cross-reference all existing titles to prevent overlap
7. Update taxonomy.json counts
8. Commit and push → live in ~30s

### Card Ingestion Script (`add-cards.sh`)
- Reads clipboard (pbpaste), validates JSON schema
- Checks required fields, valid types, duplicate IDs
- Appends to cards.json, commits, pushes

### Helper Scripts
- `./generate-plan.sh` — shows coverage gaps, recommends next batch
- `./export-index.sh` — outputs all card titles grouped by type
- `./sync-feedback.sh` — imports feedback.json into taxonomy

---

## Streak System

- Tracks consecutive days the app is opened
- localStorage: `{ count: N, lastOpen: "YYYY-MM-DD" }`
- Yesterday → increment. Today → no change. Older → reset to 1.
- Displayed in header: "🔥 N"

---

## PWA Details

- `manifest.json`: standalone display, dark theme (#0a0a0a), "Nick Feed"
- Service worker: network-first for all resources (simplicity over cache-first)
- Cache busted via `?v=N` query params on CSS/JS references
- Icons: 192px and 512px PNG with "NF" lettermark in acid green on dark
- Offline: works fully with cached cards, new cards load when online

---

## Key Design Decisions & Evolution

1. **Started as Tinder-style swipe → changed to IG-stories tap.** Swipe didn't feel right on mobile. Tap left/right is simpler and more natural.

2. **Removed "Task Nudge" card type.** User didn't want direct productivity pushes. Replaced with "Discovery" — exploratory content to find unknown interests.

3. **Added Poetry and Chinese types** based on user request. Each got custom rendering: verse formatting with gold border, hero Chinese characters with TTS.

4. **Content freshness is a core constraint.** Taxonomy system with 154 subtopics prevents topic repetition. Wild seeds force obscure territory. The app must feel fresh for years, not weeks.

5. **Build from feedback, not assumptions.** The original spec assumed what Nick would like. The actual system learns from engagement data. Discovery cards exist specifically to probe unknown preferences.

6. **Feedback sync via GitHub API** eliminated the last manual step. The entire loop from consumption → feedback → generation → deployment is now automated.

7. **"Too basic" is the worst failure mode.** Nick's comment on a card he spent 9s reading. The bar for "interesting" is very high. Every card must pass the test: would a typical educated person already know this? If yes, don't generate it.

---

## File Inventory

| File | Size | Purpose |
|------|------|---------|
| app.js | 28KB | Core app logic, 862 lines |
| cards.json | 122KB | 92 card library |
| styles.css | 10KB | All styles, 563 lines |
| svg-gen.js | 5KB | Generative SVG, 154 lines |
| taxonomy.json | 21KB | 154 subtopics with coverage tracking |
| wild-seeds.md | 4KB | 60+ anti-obvious generation prompts |
| user-profile.md | 3KB | Inferred preferences from feedback |
| prompt-template.md | 3KB | Card generation prompt for Claude |
| index.html | 3KB | App shell |
| feedback.json | 3KB | Synced from iPhone |
| add-cards.sh | 2KB | Clipboard → validate → commit → push |
| generate-plan.sh | 3KB | Coverage analysis + batch recommendations |
| export-index.sh | 1KB | Card title export |
| sync-feedback.sh | 2KB | Feedback → taxonomy sync |
| sw.js | 1KB | Service worker |
| manifest.json | 0.3KB | PWA manifest |
| fonts/ | 81KB | Plus Jakarta Sans (3 weights) |
| icons | 17KB | 192px, 512px PNG + SVG + favicon |
