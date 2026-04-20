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
  task: { emoji: '🎯', label: 'Task Nudge', color: 'var(--task)' },
  insight: { emoji: '🧠', label: 'Insight', color: 'var(--insight)' },
  skill: { emoji: '🧩', label: 'Skill Bite', color: 'var(--skill)' },
  whatif: { emoji: '🎲', label: 'What If', color: 'var(--whatif)' },
  timeless: { emoji: '📚', label: 'Timeless', color: 'var(--timeless)' },
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

// --- Rendering ---
function renderCard(card) {
  const el = document.createElement('div');
  el.className = 'card';
  el.dataset.id = card.id;

  const meta = TYPE_META[card.type] || TYPE_META.task;
  const accentColor = meta.color;

  el.innerHTML = `
    <div class="card-accent" style="background: ${accentColor}"></div>
    <div class="card-svg-bg" id="svg-bg-${card.id}"></div>
    <div class="card-content">
      <div class="card-badge" style="color: ${accentColor}; border-color: ${accentColor}">
        ${meta.emoji} ${meta.label}
      </div>
      <h1 class="card-title">${card.title}</h1>
      <p class="card-body">${card.body}</p>
      ${card.expanded ? '<div class="card-expand-indicator">↓ Tap for more</div>' : ''}
      <div class="card-expanded" style="display:none">${card.expanded || ''}</div>
      <div class="card-footer">${card.footer}</div>
    </div>
  `;

  return el;
}

function showCard(card) {
  const container = document.getElementById('card-container');
  container.innerHTML = '';
  if (!card) return;

  const el = renderCard(card);
  container.appendChild(el);
  STATE.currentCard = card;
  STATE.cardAppearedAt = Date.now();

  // Generate SVG background
  if (typeof generateSVG === 'function') {
    const svgBg = document.getElementById(`svg-bg-${card.id}`);
    if (svgBg) svgBg.innerHTML = generateSVG(card.id, card.type);
  }

  updateCounter();
}

function updateCounter() {
  const counter = document.getElementById('card-counter');
  const total = STATE.phase === 'unseen'
    ? STATE.unseenQueue.length + STATE.currentIndex
    : STATE.seenQueue.length + STATE.currentIndex;
  const label = STATE.phase === 'unseen' ? 'new' : 'seen';
  counter.textContent = `${STATE.currentIndex} / ${total} ${label}`;
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
  const unseen = cards.filter(c => !seenIds.has(c.id));
  const seenCards = cards.filter(c => seenIds.has(c.id));
  STATE.unseenQueue = shuffle(unseen);
  STATE.seenQueue = shuffle(seenCards);
  STATE.phase = 'unseen';
  STATE.currentIndex = 0;
  STATE.history = [];
}

const NUDGE_CARD = {
  id: '__nudge__',
  type: 'task',
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
    STATE.history.push(STATE.currentCard);
    STATE.currentIndex++;
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
    if (STATE.seenQueue.length > 0) {
      card = STATE.seenQueue.shift();
    } else {
      STATE.unseenQueue = shuffle(STATE.cards);
      STATE.phase = 'unseen';
      card = STATE.unseenQueue.shift();
    }
  } else {
    // 'seen' phase
    if (STATE.seenQueue.length > 0) {
      card = STATE.seenQueue.shift();
    } else {
      STATE.seenQueue = shuffle(STATE.cards);
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
  const dwell = (Date.now() - STATE.cardAppearedAt) / 1000;
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

// --- Init ---
async function init() {
  const cards = await loadCards();
  if (!cards || cards.length === 0) {
    showErrorCard();
    return;
  }
  STATE.cards = cards;
  buildQueues(cards);
  if (typeof updateStreak === 'function') updateStreak();

  // Show first card
  nextCard();

  // Wire buttons
  document.getElementById('btn-next').addEventListener('click', () => nextCard());
  document.getElementById('btn-back').addEventListener('click', () => prevCard());
  document.getElementById('btn-shuffle').addEventListener('click', () => shuffleQueue());
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

document.addEventListener('DOMContentLoaded', init);
