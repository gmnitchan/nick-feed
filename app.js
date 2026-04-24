if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js');
}

// app.js — Card Feed App

const STATE = {
  cards: [],
  unseenQueue: [],
  seenQueue: [],
  history: [],
  currentCard: null,
  currentIndex: 0,
  phase: 'unseen', // 'unseen' | 'nudge' | 'seen'
  expanded: false,
  cardAppearedAt: null,
};

const STORAGE_KEYS = {
  seen: 'nickfeed_seen',
  streak: 'nickfeed_streak',
  feedback: 'nickfeed_feedback',
  passive: 'nickfeed_passive',
};

const TYPE_META = {
  insight: { emoji: '🧠', label: 'Insight', color: 'var(--insight)' },
  skill: { emoji: '🧩', label: 'Skill Bite', color: 'var(--skill)' },
  whatif: { emoji: '🎲', label: 'What If', color: 'var(--whatif)' },
  timeless: { emoji: '📚', label: 'Timeless', color: 'var(--timeless)' },
  discovery: { emoji: '🔭', label: 'Discovery', color: 'var(--discovery)' },
  poetry: { emoji: '✒️', label: 'Poetry', color: 'var(--poetry)' },
  chinese: { emoji: '🇨🇳', label: 'Chinese', color: 'var(--chinese)' },
  underthehood: { emoji: '⚙️', label: 'Under the Hood', color: 'var(--underthehood)' },
  untranslatable: { emoji: '🌐', label: 'Untranslatable', color: 'var(--untranslatable)' },
  power: { emoji: '🏛', label: 'How Power Works', color: 'var(--power)' },
  paradigm: { emoji: '💡', label: 'Paradigm Shift', color: 'var(--paradigm)' },
};

// --- Storage helpers ---
function storageAvailable() {
  try { localStorage.setItem('__test', '1'); localStorage.removeItem('__test'); return true; }
  catch { return false; }
}

function loadStorage(key) {
  if (!storageAvailable()) return null;
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}

function saveStorage(key, data) {
  if (!storageAvailable()) return;
  localStorage.setItem(key, JSON.stringify(data));
}

// --- Utility ---
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(dateStr1, dateStr2) {
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  return Math.floor((d2 - d1) / 86400000);
}

// --- Card loading ---
async function loadCards() {
  try {
    const res = await fetch('cards.json');
    if (!res.ok) throw new Error('fetch failed');
    return await res.json();
  } catch {
    return null;
  }
}

// --- Type-specific body rendering ---
function renderBodyForType(card) {
  if (card.type === 'chinese') {
    return renderChineseBody(card);
  }
  if (card.type === 'poetry') {
    return renderPoetryBody(card);
  }
  if (card.type === 'timeless') {
    return renderTimelessBody(card);
  }
  // Default rendering
  return `<h1 class="card-title">${card.title}</h1>
    <p class="card-body">${card.body}</p>`;
}

function renderChineseBody(card) {
  const lines = card.body.split('\n').filter(l => l.trim());
  const translation = lines[0] || '';
  const breakdown = lines.slice(1).join('<br>');
  const parts = card.title.split('—');
  const chars = (parts[0] || '').trim();
  const pinyin = (parts[1] || '').trim();
  return `<div class="chinese-hero">
      <div class="chinese-chars">${chars}</div>
      <div class="chinese-pinyin">${pinyin}</div>
      <div class="chinese-meaning">${translation}</div>
      <button class="tts-btn" onclick="speakChinese('${chars.replace(/'/g, "\\'")}')">🔊</button>
    </div>
    <p class="card-body">${breakdown}</p>`;
}

function renderPoetryBody(card) {
  const verseHtml = card.body.replace(/\n/g, '<br>');
  // Store raw lines as JSON in data attribute for line-by-line pacing
  const lines = card.body.split('\n').filter(l => l.trim());
  const linesJson = JSON.stringify(lines).replace(/"/g, '&quot;');
  return `<h1 class="card-title">${card.title}</h1>
    <div class="poetry-verse">${verseHtml}</div>
    <button class="tts-btn tts-btn--poetry" onclick="togglePoetry(this)" data-lines="${linesJson}">🔊 Listen</button>`;
}

function renderTimelessBody(card) {
  // Pick the most evocative word from the title for the background
  const words = card.title.split(/\s+/);
  const heroWord = words.reduce((a, b) => a.length >= b.length ? a : b, '');
  // Pick a thematic icon based on content keywords
  const iconMap = [
    [/stoic|marcus|seneca|epictetus/i, '🏛'],
    [/tree|plant|grow|seed/i, '🌳'],
    [/water|fish|ocean|river/i, '🌊'],
    [/fire|forge|steel|burn/i, '🔥'],
    [/death|die|mortal|skull/i, '💀'],
    [/teach|learn|wisdom|know/i, '🕯'],
    [/wood|chop|zen|buddha/i, '☯'],
    [/dao|tao|eastern|lao/i, '☯'],
    [/tool|axe|gift|tech/i, '⚒'],
    [/time|clock|moment/i, '⏳'],
    [/war|came|first/i, '🕊'],
    [/suffer|imagine|fear/i, '🌑'],
    [/ship|iterate|build/i, '⚡'],
  ];
  let icon = '📜';
  const fullText = card.title + ' ' + card.body;
  for (const [pattern, emoji] of iconMap) {
    if (pattern.test(fullText)) { icon = emoji; break; }
  }
  return `<div class="timeless-hero">
      <div class="timeless-hero-word">${heroWord}</div>
      <div class="timeless-hero-icon">${icon}</div>
      <div class="timeless-hero-line"></div>
    </div>
    <h1 class="card-title">${card.title}</h1>
    <p class="card-body">${card.body}</p>`;
}

// --- Rendering ---
function renderCard(card) {
  const el = document.createElement('div');
  el.className = 'card';
  if (card.isNudge) el.classList.add('card--nudge');
  el.dataset.id = card.id;

  const meta = TYPE_META[card.type] || TYPE_META.discovery;
  const accentColor = meta.color;

  el.classList.add(`card--${card.type}`);

  const bodyHtml = renderBodyForType(card);
  const expandedHtml = card.expanded ? card.expanded.replace(/\n/g, '<br>') : '';

  const isNew = STATE.neverSeenIds && STATE.neverSeenIds.has(card.id);

  el.innerHTML = `
    <div class="card-accent" style="background: ${accentColor}"></div>
    <div class="card-svg-bg" id="svg-bg-${card.id}"></div>
    <div class="card-content">
      <div class="card-badge-row">
        <div class="card-badge" style="color: ${accentColor}; border-color: ${accentColor}">
          ${meta.emoji} ${meta.label}
        </div>
        ${isNew ? '<div class="card-new-badge">NEW</div>' : ''}
      </div>
      ${bodyHtml}
      ${card.expanded ? '<div class="card-expand-indicator">↓ Tap for more</div>' : ''}
      <div class="card-expanded" style="display:none">${expandedHtml}</div>
      <div class="card-footer">${card.footer}</div>
    </div>
  `;

  return el;
}

function showCard(card) {
  // Stop any playing TTS when navigating
  if (typeof stopPoetry === 'function') stopPoetry();
  speechSynthesis.cancel();

  const container = document.getElementById('card-container');
  container.innerHTML = '';
  STATE.expanded = false;
  if (!card) return;

  const el = renderCard(card);
  container.appendChild(el);

  // Entry animation
  el.style.transform = 'scale(0.95)';
  el.style.opacity = '0';
  requestAnimationFrame(() => {
    el.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s';
    el.style.transform = 'scale(1)';
    el.style.opacity = '1';
  });

  STATE.currentCard = card;
  STATE.cardAppearedAt = Date.now();

  // Generate SVG background
  if (typeof generateSVG === 'function') {
    const svgBg = document.getElementById(`svg-bg-${card.id}`);
    if (svgBg) svgBg.innerHTML = generateSVG(card.id, card.type);
  }

  updateCounter();
  updateFeedbackButtons();
  saveSession();
}

function updateCounter() {
  const counter = document.getElementById('card-counter');
  if (STATE.phase === 'unseen') {
    counter.textContent = `${STATE.currentIndex} / ${STATE.phaseTotal} new`;
  } else if (STATE.phase === 'nudge') {
    counter.textContent = '';
  } else {
    counter.textContent = `${STATE.currentIndex} / ${STATE.phaseTotal} seen`;
  }
}

// --- Seen state ---
function pruneSeen() {
  const seen = loadStorage(STORAGE_KEYS.seen) || {};
  const today = todayStr();
  const pruned = {};
  for (const [id, date] of Object.entries(seen)) {
    if (daysBetween(date, today) <= 14) pruned[id] = date;
  }
  saveStorage(STORAGE_KEYS.seen, pruned);
  return pruned;
}

function markSeen(cardId) {
  const seen = loadStorage(STORAGE_KEYS.seen) || {};
  seen[cardId] = todayStr();
  saveStorage(STORAGE_KEYS.seen, seen);
}

// --- Queue setup ---
function buildQueues(cards) {
  const seen = pruneSeen();
  const seenIds = new Set(Object.keys(seen));

  // Also check passive dwell times — these persist indefinitely and are
  // the true record of every card ever viewed, even after the 14-day
  // seen window expires
  const passive = loadStorage(STORAGE_KEYS.passive) || { expanded: [], retrieved: [], dwellTimes: {} };
  const everViewed = new Set(Object.keys(passive.dwellTimes || {}));

  // A card is "unseen" only if it has NEVER been viewed (no dwell time)
  // AND is not in the 14-day seen window
  const unseen = cards.filter(c => !seenIds.has(c.id) && !everViewed.has(c.id));
  const seenCards = cards.filter(c => seenIds.has(c.id) || everViewed.has(c.id));

  // Track which IDs are truly new for the NEW badge
  STATE.neverSeenIds = new Set(unseen.map(c => c.id));

  STATE.unseenQueue = shuffle(unseen);
  STATE.seenQueue = shuffle(seenCards);
  STATE.phase = 'unseen';
  STATE.currentIndex = 0;
  STATE.phaseTotal = unseen.length;
  STATE.history = [];
}

const NUDGE_CARD = {
  id: '__nudge__',
  type: 'insight',
  title: "YOU'VE SEEN EVERYTHING",
  body: "Time to generate a fresh batch. Open Claude on your laptop and run the prompt template.",
  footer: "Run ./add-cards.sh after",
  isNudge: true,
};

function nextCard() {
  // Record dwell time for current card
  if (STATE.currentCard && !STATE.currentCard.isNudge) {
    recordDwell(STATE.currentCard.id);
  }

  if (STATE.currentCard && !STATE.currentCard.isNudge) {
    markSeen(STATE.currentCard.id);
    if (STATE.neverSeenIds) STATE.neverSeenIds.delete(STATE.currentCard.id);
    STATE.history.push(STATE.currentCard);
    STATE.currentIndex++;

    // Auto-sync feedback every 10 cards
    if (STATE.currentIndex % 10 === 0) {
      autoSyncFeedback();
    }
  }

  let card = null;
  if (STATE.phase === 'unseen') {
    if (STATE.unseenQueue.length > 0) {
      card = STATE.unseenQueue.shift();
    } else {
      STATE.phase = 'nudge';
      card = NUDGE_CARD;
    }
  } else if (STATE.phase === 'nudge') {
    STATE.phase = 'seen';
    STATE.currentIndex = 0;
    // Exclude cards already shown this session from the seen queue
    const sessionIds = new Set(STATE.history.map(c => c.id));
    const filtered = STATE.seenQueue.filter(c => !sessionIds.has(c.id));
    STATE.seenQueue = filtered.length > 0 ? filtered : shuffle(STATE.cards);
    STATE.phaseTotal = STATE.seenQueue.length;
    if (STATE.seenQueue.length > 0) {
      card = STATE.seenQueue.shift();
    } else {
      STATE.seenQueue = shuffle(STATE.cards);
      card = STATE.seenQueue.shift();
    }
  } else {
    // 'seen' phase
    if (STATE.seenQueue.length > 0) {
      card = STATE.seenQueue.shift();
    } else {
      // Reshuffle seen cards, excluding ones shown this session
      const sessionIds = new Set(STATE.history.map(c => c.id));
      if (STATE.currentCard) sessionIds.add(STATE.currentCard.id);
      const recyclable = STATE.cards.filter(c => !sessionIds.has(c.id));
      STATE.seenQueue = shuffle(recyclable.length > 0 ? recyclable : STATE.cards);
      card = STATE.seenQueue.shift();
    }
  }

  showCard(card);
}

function prevCard() {
  if (STATE.history.length === 0) return;

  // Record dwell
  if (STATE.currentCard && !STATE.currentCard.isNudge) {
    recordDwell(STATE.currentCard.id);
  }

  // Push current card back to front of appropriate queue
  if (STATE.currentCard && !STATE.currentCard.isNudge) {
    if (STATE.phase === 'unseen') STATE.unseenQueue.unshift(STATE.currentCard);
    else STATE.seenQueue.unshift(STATE.currentCard);
  }

  const prev = STATE.history.pop();
  STATE.currentIndex = Math.max(0, STATE.currentIndex - 1);

  // Record as retrieved (passive signal)
  recordRetrieved(prev.id);

  showCard(prev);
}

function shuffleQueue() {
  if (STATE.phase === 'unseen') {
    STATE.unseenQueue = shuffle(STATE.unseenQueue);
  } else if (STATE.phase === 'seen') {
    STATE.seenQueue = shuffle(STATE.seenQueue);
  }
}

function recordDwell(cardId) {
  if (!STATE.cardAppearedAt) return;
  let dwell = (Date.now() - STATE.cardAppearedAt) / 1000;
  // Cap at 2 minutes — anything longer means the user left the app
  dwell = Math.min(dwell, 120);
  const passive = loadStorage(STORAGE_KEYS.passive) || { expanded: [], retrieved: [], dwellTimes: {} };
  passive.dwellTimes[cardId] = parseFloat(dwell.toFixed(1));
  saveStorage(STORAGE_KEYS.passive, passive);
}

function recordRetrieved(cardId) {
  const passive = loadStorage(STORAGE_KEYS.passive) || { expanded: [], retrieved: [], dwellTimes: {} };
  if (!passive.retrieved.includes(cardId)) {
    passive.retrieved.push(cardId);
  }
  saveStorage(STORAGE_KEYS.passive, passive);
}

// --- Explicit Feedback ---
function setupFeedbackButtons() {
  document.getElementById('btn-like').addEventListener('click', () => recordFeedback('like'));
  document.getElementById('btn-dislike').addEventListener('click', () => recordFeedback('dislike'));
}

function recordFeedback(rating) {
  if (!STATE.currentCard || STATE.currentCard.isNudge) return;
  const feedback = loadStorage(STORAGE_KEYS.feedback) || {};
  feedback[STATE.currentCard.id] = { rating, date: todayStr() };
  saveStorage(STORAGE_KEYS.feedback, feedback);

  // Visual confirmation
  const btn = rating === 'like' ? document.getElementById('btn-like') : document.getElementById('btn-dislike');
  btn.style.transform = 'scale(1.3)';
  btn.style.background = rating === 'like' ? '#1a3a00' : '#3a1a1a';
  setTimeout(() => { btn.style.transform = ''; btn.style.background = ''; }, 300);
}

function updateFeedbackButtons() {
  const feedback = loadStorage(STORAGE_KEYS.feedback) || {};
  const btnLike = document.getElementById('btn-like');
  const btnDislike = document.getElementById('btn-dislike');
  const container = document.getElementById('feedback-buttons');
  const btnComment = document.getElementById('btn-comment');

  if (STATE.currentCard && STATE.currentCard.isNudge) {
    container.style.visibility = 'hidden';
    btnComment.style.visibility = 'hidden';
  } else {
    container.style.visibility = 'visible';
    btnComment.style.visibility = 'visible';
    const existing = STATE.currentCard ? feedback[STATE.currentCard.id] : null;
    btnLike.style.background = existing?.rating === 'like' ? '#1a3a00' : '';
    btnDislike.style.background = existing?.rating === 'dislike' ? '#3a1a1a' : '';
    // Show dot indicator if card has a comment
    const comments = loadStorage('nickfeed_comments') || {};
    btnComment.classList.toggle('has-comment', !!(STATE.currentCard && comments[STATE.currentCard.id]));
  }
}

// --- Comments ---
function setupCommentButton() {
  document.getElementById('btn-comment').addEventListener('click', () => {
    if (!STATE.currentCard || STATE.currentCard.isNudge) return;
    openCommentModal();
  });
  document.getElementById('comment-save').addEventListener('click', saveComment);
  document.getElementById('comment-cancel').addEventListener('click', closeCommentModal);
}

function openCommentModal() {
  const comments = loadStorage('nickfeed_comments') || {};
  const existing = comments[STATE.currentCard.id] || '';
  document.getElementById('comment-input').value = existing;
  document.getElementById('comment-overlay').style.display = 'flex';
  document.getElementById('comment-input').focus();
}

function saveComment() {
  const text = document.getElementById('comment-input').value.trim();
  const comments = loadStorage('nickfeed_comments') || {};
  if (text) {
    comments[STATE.currentCard.id] = text;
  } else {
    delete comments[STATE.currentCard.id];
  }
  saveStorage('nickfeed_comments', comments);
  closeCommentModal();
  updateFeedbackButtons();
}

function closeCommentModal() {
  document.getElementById('comment-overlay').style.display = 'none';
}

// --- Feedback Export ---
function generateFeedbackExport() {
  const feedback = loadStorage(STORAGE_KEYS.feedback) || {};
  const passive = loadStorage(STORAGE_KEYS.passive) || { expanded: [], retrieved: [], dwellTimes: {} };
  const today = todayStr();

  const likes = [];
  const dislikes = [];
  for (const [id, data] of Object.entries(feedback)) {
    const card = STATE.cards.find(c => c.id === id);
    if (!card) continue;
    if (data.rating === 'like') likes.push(card);
    else dislikes.push(card);
  }

  const groupByType = (cards) => {
    const groups = {};
    for (const c of cards) { groups[c.type] = (groups[c.type] || 0) + 1; }
    return Object.entries(groups).map(([t, n]) => `${t} (${n})`).join(', ');
  };

  const titles = (cards) => cards.map(c => `"${c.title}"`).join(', ');

  const expandedCards = passive.expanded.map(id => STATE.cards.find(c => c.id === id)).filter(Boolean);
  const retrievedCards = passive.retrieved.map(id => STATE.cards.find(c => c.id === id)).filter(Boolean);
  const skipped = Object.entries(passive.dwellTimes || {})
    .filter(([_, t]) => t < 1)
    .map(([id]) => STATE.cards.find(c => c.id === id))
    .filter(Boolean);

  let output = `=== NICK'S FEED PREFERENCES (as of ${today}) ===\n\n`;
  output += `EXPLICIT LIKES (${likes.length} cards):\n`;
  output += `- Types: ${groupByType(likes) || 'none yet'}\n`;
  output += `- Titles: ${titles(likes) || 'none yet'}\n\n`;
  output += `EXPLICIT DISLIKES (${dislikes.length} cards):\n`;
  output += `- Types: ${groupByType(dislikes) || 'none yet'}\n`;
  output += `- Titles: ${titles(dislikes) || 'none yet'}\n\n`;
  output += `PASSIVE SIGNALS:\n`;
  output += `- Expanded (high interest): ${expandedCards.length} cards — ${titles(expandedCards) || 'none'}\n`;
  output += `- Retrieved (went back to re-read): ${retrievedCards.length} cards — ${titles(retrievedCards) || 'none'}\n`;
  output += `- Speed-skipped (<1s): ${skipped.length} cards — ${titles(skipped) || 'none'}\n\n`;

  // Comments
  const comments = loadStorage('nickfeed_comments') || {};
  const commentEntries = Object.entries(comments);
  if (commentEntries.length > 0) {
    output += `COMMENTS (${commentEntries.length}):\n`;
    for (const [id, text] of commentEntries) {
      const card = STATE.cards.find(c => c.id === id);
      const title = card ? card.title : id;
      output += `- "${title}": ${text}\n`;
    }
    output += '\n';
  }

  output += `=== USE THIS TO CALIBRATE NEW CARDS ===`;

  return output;
}

function setupSettings() {
  document.getElementById('btn-settings').addEventListener('click', () => {
    document.getElementById('settings-overlay').style.display = 'flex';
  });
  document.getElementById('btn-close-settings').addEventListener('click', () => {
    document.getElementById('settings-overlay').style.display = 'none';
  });
  document.getElementById('btn-export').addEventListener('click', async () => {
    const text = generateFeedbackExport();
    await navigator.clipboard.writeText(text);
    document.getElementById('btn-export').textContent = 'Copied!';
    setTimeout(() => { document.getElementById('btn-export').textContent = 'Copy Feedback Summary'; }, 2000);
  });
  document.getElementById('btn-restart').addEventListener('click', () => {
    clearSession();
    buildQueues(STATE.cards);
    nextCard();
    document.getElementById('settings-overlay').style.display = 'none';
  });
  document.getElementById('btn-sync-feedback').addEventListener('click', () => syncFeedbackToGitHub());
  document.getElementById('btn-save-token').addEventListener('click', () => {
    const token = document.getElementById('github-token-input').value.trim();
    if (token) {
      saveStorage('nickfeed_github_token', token);
      document.getElementById('btn-save-token').textContent = 'Saved!';
      document.getElementById('github-token-input').value = '';
      setTimeout(() => { document.getElementById('btn-save-token').textContent = 'Save Token'; }, 1500);
    }
  });
  // Show token status
  const savedToken = loadStorage('nickfeed_github_token');
  if (savedToken) {
    document.getElementById('github-token-input').placeholder = 'Token saved ✓ (enter new to replace)';
  }
  document.getElementById('btn-export-index').addEventListener('click', async () => {
    const index = generateCardIndex();
    await navigator.clipboard.writeText(index);
    document.getElementById('btn-export-index').textContent = 'Copied!';
    setTimeout(() => { document.getElementById('btn-export-index').textContent = 'Copy Card Index (for generation)'; }, 2000);
  });
  document.getElementById('btn-view-feedback').addEventListener('click', () => {
    document.getElementById('settings-overlay').style.display = 'none';
    const text = generateFeedbackExport();
    document.getElementById('feedback-view-content').textContent = text;
    document.getElementById('feedback-view-overlay').style.display = 'flex';
  });
  document.getElementById('btn-close-feedback-view').addEventListener('click', () => {
    document.getElementById('feedback-view-overlay').style.display = 'none';
  });
}

// --- Streak ---
function updateStreak() {
  const streakData = loadStorage(STORAGE_KEYS.streak) || { count: 0, lastOpen: null };
  const today = todayStr();

  if (!streakData.lastOpen) {
    streakData.count = 1;
  } else if (streakData.lastOpen === today) {
    // No change
  } else if (daysBetween(streakData.lastOpen, today) === 1) {
    streakData.count++;
  } else {
    streakData.count = 1;
  }

  streakData.lastOpen = today;
  saveStorage(STORAGE_KEYS.streak, streakData);
  renderStreak(streakData.count);
}

function renderStreak(count) {
  document.getElementById('streak').textContent = `🔥 ${count}`;
}

// --- Expand/Collapse ---
function setupExpandHandler() {
  // Expand is now triggered by tapping the expand indicator or the middle zone
  // Handled inline in setupTapNavigation — middle tap area
}

// Called from tap navigation when middle zone is tapped
function handleExpandTap(e) {
  const card = document.querySelector('.card');
  if (!card) return;
  const cardData = STATE.currentCard;
  if (!cardData || !cardData.expanded) return;

  if (!STATE.expanded) {
    expandCard(card);
  } else {
    collapseCard(card);
  }
}

function expandCard(cardEl) {
  STATE.expanded = true;
  cardEl.classList.add('card--expanded');
  const expandedContent = cardEl.querySelector('.card-expanded');
  const indicator = cardEl.querySelector('.card-expand-indicator');
  if (expandedContent) expandedContent.style.display = 'block';
  if (indicator) indicator.style.display = 'none';
  cardEl.style.overflow = 'auto';
  cardEl.style.touchAction = 'pan-y';

  // Record passive signal
  const passive = loadStorage(STORAGE_KEYS.passive) || { expanded: [], retrieved: [], dwellTimes: {} };
  if (!passive.expanded.includes(STATE.currentCard.id)) {
    passive.expanded.push(STATE.currentCard.id);
    saveStorage(STORAGE_KEYS.passive, passive);
  }
}

function collapseCard(cardEl) {
  STATE.expanded = false;
  cardEl.classList.remove('card--expanded');
  const expandedContent = cardEl.querySelector('.card-expanded');
  const indicator = cardEl.querySelector('.card-expand-indicator');
  if (expandedContent) expandedContent.style.display = 'none';
  if (indicator) indicator.style.display = 'block';
  cardEl.style.overflow = 'hidden';
  cardEl.style.touchAction = 'none';
  cardEl.scrollTop = 0;
}

// --- Tap Navigation (IG Stories style) ---
function setupTapNavigation() {
  const cardArea = document.getElementById('card-area');

  cardArea.addEventListener('click', (e) => {
    if (STATE.expanded) return;

    const rect = cardArea.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const threshold = rect.width * 0.35;

    if (x < threshold) {
      // Tap left side — go back
      prevCard();
    } else if (x > rect.width - threshold) {
      // Tap right side — go forward
      nextCard();
      if (navigator.vibrate) navigator.vibrate(8);
    } else {
      // Tap middle — expand/collapse
      handleExpandTap(e);
    }
  });
}

// --- Init ---
async function init() {
  const cards = await loadCards();
  if (!cards || cards.length === 0) {
    showErrorCard();
    return;
  }
  STATE.cards = cards;

  // Check for new cards before restoring session
  const passive = loadStorage(STORAGE_KEYS.passive) || { expanded: [], retrieved: [], dwellTimes: {} };
  const everViewed = new Set(Object.keys(passive.dwellTimes || {}));
  const brandNewCards = cards.filter(c => !everViewed.has(c.id));

  if (brandNewCards.length > 0) {
    // New cards exist — start fresh with them at the front
    clearSession();
    buildQueues(cards);
  } else {
    // No new cards — try to restore session
    const restored = restoreSession(cards);
    if (!restored) {
      buildQueues(cards);
    } else {
      updateStreak();
      if (!storageAvailable()) {
        document.getElementById('app-name').textContent = 'NICK FEED (no storage)';
      }
      showCard(STATE.currentCard);
      // skip the nextCard() call below
      setTimeout(() => { document.getElementById('splash').classList.add('hidden'); }, 1500);
      document.getElementById('btn-next').addEventListener('click', () => nextCard());
      document.getElementById('btn-back').addEventListener('click', () => prevCard());
      setupTapNavigation();
      setupExpandHandler();
      setupFeedbackButtons();
      setupCommentButton();
      setupSettings();
      autoSyncFeedback();
      return; // early return — session restored
    }
  }

  updateStreak();

  if (!storageAvailable()) {
    document.getElementById('app-name').textContent = 'NICK FEED (no storage)';
  }

  nextCard();

  setTimeout(() => {
    document.getElementById('splash').classList.add('hidden');
  }, 1500);

  // Wire buttons
  document.getElementById('btn-next').addEventListener('click', () => nextCard());
  document.getElementById('btn-back').addEventListener('click', () => prevCard());
  setupTapNavigation();
  setupExpandHandler();
  setupFeedbackButtons();
  setupCommentButton();
  setupSettings();

  // Auto-sync on app open
  autoSyncFeedback();
}

function showErrorCard() {
  const container = document.getElementById('card-container');
  container.innerHTML = `
    <div class="card card--error">
      <div class="card-content">
        <h1 class="card-title">NO CARDS LOADED</h1>
        <p class="card-body">Check your connection or add cards with the generation script.</p>
      </div>
    </div>
  `;
}

// --- GitHub Feedback Sync ---
async function syncFeedbackToGitHub() {
  const statusEl = document.getElementById('sync-status');
  const token = loadStorage('nickfeed_github_token');

  if (!token) {
    statusEl.textContent = '⚠️ Set your GitHub token below first';
    statusEl.style.color = '#FF8A00';
    return;
  }

  statusEl.textContent = 'Syncing...';
  statusEl.style.color = 'var(--text-muted)';

  const feedbackData = {
    explicit: loadStorage(STORAGE_KEYS.feedback) || {},
    passive: loadStorage(STORAGE_KEYS.passive) || { expanded: [], retrieved: [], dwellTimes: {} },
    comments: loadStorage('nickfeed_comments') || {},
    streak: loadStorage(STORAGE_KEYS.streak) || {},
    exportedAt: new Date().toISOString(),
  };

  const content = btoa(unescape(encodeURIComponent(JSON.stringify(feedbackData, null, 2))));
  const repo = 'gmnitchan/nick-feed';
  const path = 'feedback.json';
  const apiUrl = `https://api.github.com/repos/${repo}/contents/${path}`;

  try {
    // Check if file exists (need SHA to update)
    let sha = null;
    const existing = await fetch(apiUrl, {
      headers: { 'Authorization': `token ${token}` }
    });
    if (existing.ok) {
      const data = await existing.json();
      sha = data.sha;
    }

    // Create or update
    const body = {
      message: `Sync feedback from app — ${todayStr()}`,
      content: content,
      committer: { name: 'Nick Feed App', email: 'noreply@nickfeed.app' }
    };
    if (sha) body.sha = sha;

    const res = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      statusEl.textContent = '✅ Synced!';
      statusEl.style.color = 'var(--accent)';
    } else {
      const err = await res.json();
      statusEl.textContent = `❌ ${err.message || 'Failed'}`;
      statusEl.style.color = '#FF4444';
    }
  } catch (e) {
    statusEl.textContent = `❌ ${e.message}`;
    statusEl.style.color = '#FF4444';
  }

  setTimeout(() => { statusEl.textContent = ''; }, 4000);
}

// --- Session Persistence ---
function saveSession() {
  if (!STATE.currentCard) return;
  const session = {
    currentCardId: STATE.currentCard.id,
    unseenIds: STATE.unseenQueue.map(c => c.id),
    seenIds: STATE.seenQueue.map(c => c.id),
    historyIds: STATE.history.map(c => c.id),
    phase: STATE.phase,
    currentIndex: STATE.currentIndex,
    phaseTotal: STATE.phaseTotal,
    savedAt: Date.now(),
  };
  saveStorage('nickfeed_session', session);
}

function restoreSession(cards) {
  const session = loadStorage('nickfeed_session');
  if (!session || !session.currentCardId) return false;

  // Don't restore sessions older than 24 hours
  if (Date.now() - session.savedAt > 24 * 60 * 60 * 1000) return false;

  const cardMap = {};
  for (const c of cards) cardMap[c.id] = c;

  // Rebuild queues from saved IDs (filter out cards that may have been deleted)
  const unseenQueue = session.unseenIds.map(id => cardMap[id]).filter(Boolean);
  const seenQueue = session.seenIds.map(id => cardMap[id]).filter(Boolean);
  const history = session.historyIds.map(id => cardMap[id]).filter(Boolean);
  const currentCard = cardMap[session.currentCardId];

  if (!currentCard) return false;

  // Check for new cards added since last session — prepend them to unseen
  const knownIds = new Set([
    session.currentCardId,
    ...session.unseenIds,
    ...session.seenIds,
    ...session.historyIds,
  ]);
  const passive = loadStorage(STORAGE_KEYS.passive) || { expanded: [], retrieved: [], dwellTimes: {} };
  const everViewed = new Set(Object.keys(passive.dwellTimes || {}));
  const brandNew = cards.filter(c => !knownIds.has(c.id) && !everViewed.has(c.id));

  STATE.unseenQueue = [...shuffle(brandNew), ...unseenQueue];
  STATE.seenQueue = seenQueue;
  STATE.history = history;
  STATE.phase = session.phase;
  STATE.currentIndex = session.currentIndex;
  STATE.phaseTotal = session.phaseTotal + brandNew.length;
  STATE.neverSeenIds = new Set([...brandNew.map(c => c.id), ...unseenQueue.filter(c => !everViewed.has(c.id)).map(c => c.id)]);
  STATE.currentCard = currentCard;

  return true;
}

function clearSession() {
  if (storageAvailable()) localStorage.removeItem('nickfeed_session');
}

// --- Auto Sync ---
function autoSyncFeedback() {
  const token = loadStorage('nickfeed_github_token');
  if (!token) return; // No token = skip silently

  const feedbackData = {
    explicit: loadStorage(STORAGE_KEYS.feedback) || {},
    passive: loadStorage(STORAGE_KEYS.passive) || { expanded: [], retrieved: [], dwellTimes: {} },
    comments: loadStorage('nickfeed_comments') || {},
    streak: loadStorage(STORAGE_KEYS.streak) || {},
    exportedAt: new Date().toISOString(),
  };

  const content = btoa(unescape(encodeURIComponent(JSON.stringify(feedbackData, null, 2))));
  const repo = 'gmnitchan/nick-feed';
  const path = 'feedback.json';
  const apiUrl = `https://api.github.com/repos/${repo}/contents/${path}`;

  // Fire and forget — don't block the UI
  fetch(apiUrl, { headers: { 'Authorization': `token ${token}` } })
    .then(res => res.ok ? res.json() : null)
    .then(data => {
      const body = {
        message: `Auto-sync feedback — ${todayStr()}`,
        content: content,
        committer: { name: 'Nick Feed App', email: 'noreply@nickfeed.app' },
      };
      if (data && data.sha) body.sha = data.sha;
      return fetch(apiUrl, {
        method: 'PUT',
        headers: { 'Authorization': `token ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    })
    .catch(() => {}); // Fail silently
}

// --- Card Index Export ---
function generateCardIndex() {
  const byType = {};
  for (const card of STATE.cards) {
    if (!byType[card.type]) byType[card.type] = [];
    byType[card.type].push(`- [${card.id}] ${card.title}`);
  }
  let output = `=== EXISTING CARD INDEX (${STATE.cards.length} cards) ===\n\n`;
  for (const [type, titles] of Object.entries(byType)) {
    output += `${type.toUpperCase()} (${titles.length}):\n`;
    output += titles.join('\n') + '\n\n';
  }
  output += `=== DO NOT REPEAT THESE TOPICS ===`;
  return output;
}

// --- Text-to-Speech ---
function speakChinese(text) {
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN';
  utterance.rate = 0.7;
  utterance.pitch = 1;
  const voices = speechSynthesis.getVoices();
  const zhVoice = voices.find(v => v.lang.startsWith('zh'));
  if (zhVoice) utterance.voice = zhVoice;
  speechSynthesis.speak(utterance);
}

// --- Poetry TTS with line-by-line pacing and pause/resume ---
const POETRY_TTS = {
  active: false,
  paused: false,
  lines: [],
  lineIndex: 0,
  btn: null,
  timeoutId: null,
};

function togglePoetry(btn) {
  if (POETRY_TTS.active && POETRY_TTS.btn === btn) {
    if (POETRY_TTS.paused) {
      resumePoetry();
    } else {
      pausePoetry();
    }
    return;
  }

  // Start new reading
  stopPoetry();
  const lines = JSON.parse(btn.dataset.lines);
  POETRY_TTS.active = true;
  POETRY_TTS.paused = false;
  POETRY_TTS.lines = lines;
  POETRY_TTS.lineIndex = 0;
  POETRY_TTS.btn = btn;
  btn.textContent = '⏸ Pause';
  speakNextLine();
}

function speakNextLine() {
  if (!POETRY_TTS.active || POETRY_TTS.paused) return;
  if (POETRY_TTS.lineIndex >= POETRY_TTS.lines.length) {
    stopPoetry();
    return;
  }

  const line = POETRY_TTS.lines[POETRY_TTS.lineIndex];
  const utterance = new SpeechSynthesisUtterance(line);
  utterance.lang = 'en-GB';
  utterance.rate = 0.65;
  utterance.pitch = 0.85;
  utterance.volume = 1;

  const voices = speechSynthesis.getVoices();
  const enVoice = voices.find(v => v.lang === 'en-GB' && /female/i.test(v.name))
    || voices.find(v => v.lang === 'en-GB')
    || voices.find(v => v.lang.startsWith('en'));
  if (enVoice) utterance.voice = enVoice;

  utterance.onend = () => {
    POETRY_TTS.lineIndex++;
    // Pause between lines — longer pause for empty lines (stanza breaks)
    const nextLine = POETRY_TTS.lines[POETRY_TTS.lineIndex];
    const pauseMs = (!nextLine || nextLine.trim() === '') ? 1200 : 600;
    // Skip empty lines (stanza breaks) but keep the pause
    if (nextLine && nextLine.trim() === '') {
      POETRY_TTS.lineIndex++;
    }
    POETRY_TTS.timeoutId = setTimeout(() => speakNextLine(), pauseMs);
  };

  speechSynthesis.speak(utterance);
}

function pausePoetry() {
  POETRY_TTS.paused = true;
  speechSynthesis.cancel();
  if (POETRY_TTS.timeoutId) clearTimeout(POETRY_TTS.timeoutId);
  if (POETRY_TTS.btn) POETRY_TTS.btn.textContent = '▶️ Resume';
}

function resumePoetry() {
  POETRY_TTS.paused = false;
  if (POETRY_TTS.btn) POETRY_TTS.btn.textContent = '⏸ Pause';
  speakNextLine();
}

function stopPoetry() {
  speechSynthesis.cancel();
  if (POETRY_TTS.timeoutId) clearTimeout(POETRY_TTS.timeoutId);
  if (POETRY_TTS.btn) POETRY_TTS.btn.textContent = '🔊 Listen';
  POETRY_TTS.active = false;
  POETRY_TTS.paused = false;
  POETRY_TTS.lines = [];
  POETRY_TTS.lineIndex = 0;
  POETRY_TTS.btn = null;
  POETRY_TTS.timeoutId = null;
}

// --- Visibility change: reset dwell timer when app goes to background/foreground ---
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    // App went to background — record dwell now with accurate time
    if (STATE.currentCard && !STATE.currentCard.isNudge && STATE.cardAppearedAt) {
      recordDwell(STATE.currentCard.id);
      STATE.cardAppearedAt = null; // prevent double-recording
    }
  } else if (document.visibilityState === 'visible') {
    // App came back — restart the timer for the current card
    if (STATE.currentCard) {
      STATE.cardAppearedAt = Date.now();
    }
  }
});

// Preload voices (needed on some browsers)
if (speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();
}

document.addEventListener('DOMContentLoaded', init);
