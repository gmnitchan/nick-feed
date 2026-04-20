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

// --- Init (basic, will be expanded in Task 4) ---
async function init() {
  const cards = await loadCards();
  if (!cards || cards.length === 0) {
    showErrorCard();
    return;
  }
  STATE.cards = cards;
  // For now just show first card
  showCard(cards[0]);
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
