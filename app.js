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

  if (STATE.currentCard && STATE.currentCard.isNudge) {
    container.style.visibility = 'hidden';
  } else {
    container.style.visibility = 'visible';
    const existing = STATE.currentCard ? feedback[STATE.currentCard.id] : null;
    btnLike.style.background = existing?.rating === 'like' ? '#1a3a00' : '';
    btnDislike.style.background = existing?.rating === 'dislike' ? '#3a1a1a' : '';
  }
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
  const cardArea = document.getElementById('card-area');
  let pointerDownX = 0, pointerDownY = 0;

  cardArea.addEventListener('pointerdown', (e) => {
    pointerDownX = e.clientX;
    pointerDownY = e.clientY;
  });

  cardArea.addEventListener('click', (e) => {
    const card = document.querySelector('.card');
    if (!card) return;
    const cardData = STATE.currentCard;
    if (!cardData || !cardData.expanded) return;

    // Don't trigger if pointer moved (swipe gesture)
    if (Math.abs(e.clientX - pointerDownX) > 10 || Math.abs(e.clientY - pointerDownY) > 10) return;

    if (!STATE.expanded) {
      expandCard(card);
    } else {
      // Tap top area to collapse
      const rect = card.getBoundingClientRect();
      if (e.clientY < rect.top + 80) {
        collapseCard(card);
      }
    }
  });
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

// --- Swipe Gestures ---
function setupSwipeHandler() {
  const cardArea = document.getElementById('card-area');
  let startX = 0, startY = 0, currentX = 0, isDragging = false, cardEl = null;

  cardArea.addEventListener('pointerdown', (e) => {
    if (STATE.expanded) return;
    cardEl = document.querySelector('.card');
    if (!cardEl) return;
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    currentX = 0;
    cardEl.style.transition = 'none';
    cardArea.setPointerCapture(e.pointerId);
  });

  cardArea.addEventListener('pointermove', (e) => {
    if (!isDragging || !cardEl) return;
    currentX = e.clientX - startX;
    const rotation = (currentX / window.innerWidth) * 8;
    cardEl.style.transform = `translateX(${currentX}px) rotate(${rotation}deg)`;

    // Drag indicators
    const threshold = window.innerWidth * 0.1;
    const leftInd = document.getElementById('drag-indicator-left');
    const rightInd = document.getElementById('drag-indicator-right');
    if (currentX < -threshold) {
      leftInd.style.opacity = Math.min(1, Math.abs(currentX) / (window.innerWidth * 0.3));
      rightInd.style.opacity = '0';
    } else if (currentX > threshold) {
      rightInd.style.opacity = Math.min(1, currentX / (window.innerWidth * 0.3));
      leftInd.style.opacity = '0';
    } else {
      leftInd.style.opacity = '0';
      rightInd.style.opacity = '0';
    }
  });

  cardArea.addEventListener('pointerup', (e) => {
    if (!isDragging || !cardEl) return;
    isDragging = false;
    const threshold = window.innerWidth * 0.3;

    document.getElementById('drag-indicator-left').style.opacity = '0';
    document.getElementById('drag-indicator-right').style.opacity = '0';

    if (currentX > threshold) {
      // Swipe right — dismiss
      animateDismiss(cardEl, 'right', () => {
        nextCard();
        if (navigator.vibrate) navigator.vibrate(8);
      });
    } else if (currentX < -threshold && STATE.history.length > 0) {
      // Swipe left — go back
      animateDismiss(cardEl, 'left', () => prevCard());
    } else {
      // Snap back
      cardEl.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      cardEl.style.transform = 'translateX(0) rotate(0deg)';
    }
  });
}

function animateDismiss(el, direction, callback) {
  const x = direction === 'right' ? window.innerWidth * 1.5 : -window.innerWidth * 1.5;
  const rot = direction === 'right' ? 15 : -15;
  el.style.transition = 'transform 0.35s cubic-bezier(0.55, 0, 0.1, 1)';
  el.style.transform = `translateX(${x}px) rotate(${rot}deg)`;
  setTimeout(callback, 350);
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
  updateStreak();

  // Show first card
  nextCard();

  // Wire buttons
  document.getElementById('btn-next').addEventListener('click', () => nextCard());
  document.getElementById('btn-back').addEventListener('click', () => prevCard());
  document.getElementById('btn-shuffle').addEventListener('click', () => shuffleQueue());
  setupSwipeHandler();
  setupExpandHandler();
  setupFeedbackButtons();
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
