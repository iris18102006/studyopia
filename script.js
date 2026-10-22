// ============ STATE ============
const DEFAULT_STATE = {
  coins: 50, xp: 0, level: 1,
  streak: 0, lastStudyDate: null,
  minutesStudied: 0, cardsReviewed: 0, cardsCorrect: 0, questsDone: 0,
  subjects: [
    { id: 1, name: 'Biology', emoji: '🌿', color: '#4ECFA8', bg: '#E1F5EE', xp: 0 },
    { id: 2, name: 'Math', emoji: '🔢', color: '#5B9CF6', bg: '#EAF1FF', xp: 0 },
    { id: 3, name: 'History', emoji: '📜', color: '#FF7A3D', bg: '#FFF0E8', xp: 0 },
  ],
  flashcards: [
    { id: 1, subjectId: 1, q: 'What is photosynthesis?', a: 'The process plants use to convert sunlight into glucose using CO₂ and water.' },
    { id: 2, subjectId: 1, q: 'What is the powerhouse of the cell?', a: 'The mitochondria — produces ATP energy for the cell.' },
    { id: 3, subjectId: 2, q: 'What is the Pythagorean theorem?', a: 'a² + b² = c² — relates the sides of a right triangle.' },
  ],
  notes: [],
  quests: [],
  pomoCompleted: 0, pomoMinutes: 0,
  weekStreak: [false,false,false,false,false,false,false],
  inventory: [],
  activeMascot: null,
  activeTheme: null,
  xpMultiplier: 1,
  xpMultiplierExpiry: null,
  streakShield: false,
};

// Load state and migrate old saves
let state = JSON.parse(localStorage.getItem('studyopia') || 'null') || JSON.parse(JSON.stringify(DEFAULT_STATE));
// Ensure all new fields exist for old saves
Object.keys(DEFAULT_STATE).forEach(key => {
  if (state[key] === undefined) state[key] = JSON.parse(JSON.stringify(DEFAULT_STATE[key]));
});
// Ensure inventory is an array
if (!Array.isArray(state.inventory)) state.inventory = [];

const LEVEL_XP = [0,100,250,450,700,1000,1400,1900,2500,3200];
const MASCOTS = ['🥦','🍊','🍓','🍇','🥝','🌽','🍆','🍑'];
const EMOJIS = ['📚','🔬','🌿','🔢','📜','🎭','🎨','🌍','⚗️','🎵','💻','🧠','✈️','🏛️','🔭','🧮','📐','🦋','🌊','🦁'];
const COLORS = [
  {bg:'#E1F5EE',border:'#4ECFA8'},
  {bg:'#EAF1FF',border:'#5B9CF6'},
  {bg:'#FFF0E8',border:'#FF7A3D'},
  {bg:'#FFE8F2',border:'#FF6B9D'},
  {bg:'#F0EAFF',border:'#9B72F6'},
  {bg:'#FFFAE0',border:'#FFD166'},
  {bg:'#FFE8E8',border:'#FF5B5B'},
  {bg:'#E8F4FF',border:'#1A91F0'},
];

// SHOP CATALOG
const SHOP_ITEMS = [
  { id: 'mascot_broccoli', name: 'Broccoli Buddy', emoji: '🥦', desc: 'Your default study companion', price: 0, type: 'mascot', permanent: true },
  { id: 'mascot_orange', name: 'Orange Pal', emoji: '🍊', desc: 'A zesty friend for focus time', price: 30, type: 'mascot', permanent: true },
  { id: 'mascot_strawberry', name: 'Berry Buddy', emoji: '🍓', desc: 'Sweet and motivating', price: 50, type: 'mascot', permanent: true },
  { id: 'mascot_grape', name: 'Grape Guru', emoji: '🍇', desc: 'Wise and concentrated', price: 75, type: 'mascot', permanent: true },
  { id: 'mascot_corn', name: 'Corn Champ', emoji: '🌽', desc: 'Pops with productivity', price: 100, type: 'mascot', permanent: true },
  { id: 'mascot_eggplant', name: 'Eggplant Elite', emoji: '🍆', desc: 'For the dedicated scholar', price: 150, type: 'mascot', permanent: true },
  { id: 'boost_2x', name: '2x XP Potion', emoji: '⚡', desc: 'Double XP for 24 hours', price: 40, type: 'boost', permanent: false, effect: '2x XP' },
  { id: 'boost_streak', name: 'Streak Shield', emoji: '🛡️', desc: 'Protects your streak for 1 missed day', price: 60, type: 'boost', permanent: false, effect: 'Streak Protect' },
  { id: 'theme_galaxy', name: 'Galaxy Theme', emoji: '🌌', desc: 'A cosmic dark palette', price: 120, type: 'theme', permanent: true },
  { id: 'theme_sunset', name: 'Sunset Theme', emoji: '🌅', desc: 'Warm orange & pink tones', price: 120, type: 'theme', permanent: true },
  { id: 'badge_crown', name: 'Crown Badge', emoji: '👑', desc: 'Show off your royal status', price: 200, type: 'badge', permanent: true },
  { id: 'badge_star', name: 'Star Badge', emoji: '⭐', desc: 'Shine bright in the garden', price: 200, type: 'badge', permanent: true },
];

let selectedEmoji = '📚', selectedColorIdx = 0;

function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}

function save() { localStorage.setItem('studyopia', JSON.stringify(state)); }

// ============ THEME / DARK MODE ============
function initTheme() {
  // Check if user has an active theme from inventory
  const activeTheme = state.activeTheme;
  if (activeTheme === 'theme_galaxy') {
    setTheme('galaxy');
    return;
  }
  if (activeTheme === 'theme_sunset') {
    setTheme('sunset');
    return;
  }
  const saved = localStorage.getItem('studyopia-theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (prefersDark ? 'dark' : 'light');
  setTheme(theme);
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
  localStorage.setItem('studyopia-theme', theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  // If currently using a shop theme, switch to light/dark instead
  if (current === 'galaxy' || current === 'sunset') {
    setTheme('dark');
    state.activeTheme = null; // Clear shop theme when manually toggling
    save();
    return;
  }
  setTheme(current === 'dark' ? 'light' : 'dark');
}

document.getElementById('themeToggle').addEventListener('click', toggleTheme);

// ============ SOUND ============
let audioCtx = null;
function ensureAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playTimerEndSound() {
  ensureAudio();
  const now = audioCtx.currentTime;
  const freqs = [659.25, 880.00];
  freqs.forEach((f, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = f;
    gain.gain.setValueAtTime(0, now + i * 0.25);
    gain.gain.linearRampToValueAtTime(0.25, now + i * 0.25 + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.25 + 0.6);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now + i * 0.25);
    osc.stop(now + i * 0.25 + 0.6);
  });
  const osc2 = audioCtx.createOscillator();
  const gain2 = audioCtx.createGain();
  osc2.type = 'triangle';
  osc2.frequency.value = 440;
  gain2.gain.setValueAtTime(0, now);
  gain2.gain.linearRampToValueAtTime(0.08, now + 0.1);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
  osc2.connect(gain2);
  gain2.connect(audioCtx.destination);
  osc2.start(now);
  osc2.stop(now + 1.2);
}

function playPurchaseSound() {
  ensureAudio();
  const now = audioCtx.currentTime;
  [523.25, 659.25, 783.99].forEach((f, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = f;
    gain.gain.setValueAtTime(0, now + i * 0.1);
    gain.gain.linearRampToValueAtTime(0.2, now + i * 0.1 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.3);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now + i * 0.1);
    osc.stop(now + i * 0.1 + 0.3);
  });
}

function playEquipSound() {
  ensureAudio();
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 880;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.15, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.2);
}

// ============ XP & LEVELS ============
function addXP(amount, label) {
  const now = Date.now();
  if (state.xpMultiplierExpiry && now < state.xpMultiplierExpiry) {
    amount = Math.round(amount * state.xpMultiplier);
  } else {
    state.xpMultiplier = 1;
    state.xpMultiplierExpiry = null;
  }
  state.xp += amount;
  state.coins += Math.floor(amount / 2);
  while (state.level < LEVEL_XP.length - 1 && state.xp >= LEVEL_XP[state.level]) {
    state.level++;
    showReward('🌟', `Level Up! You're now Level ${state.level}!`);
  }
  save();
  updateXPBar();
  updateCoins();
  if (label) showReward('✨', `+${amount} XP — ${label}`);
}

function updateXPBar() {
  const lvl = state.level;
  const curr = state.xp - LEVEL_XP[Math.min(lvl-1, LEVEL_XP.length-1)];
  const need = (LEVEL_XP[Math.min(lvl, LEVEL_XP.length-1)] || LEVEL_XP[LEVEL_XP.length-1]) - LEVEL_XP[Math.min(lvl-1, LEVEL_XP.length-1)];
  const pct = Math.min(100, Math.round((curr / need) * 100));
  document.getElementById('xpFill').style.width = pct + '%';
  document.getElementById('xpLabel').textContent = state.xp + ' XP';
  document.getElementById('xpNext').textContent = '/ ' + LEVEL_XP[Math.min(lvl, LEVEL_XP.length-1)];
  document.getElementById('levelBadge').textContent = 'Level ' + state.level;
}

function updateCoins() {
  document.getElementById('coinCount').textContent = state.coins;
  const shopCount = document.getElementById('shopCoinCount');
  if (shopCount) shopCount.textContent = state.coins;
}

// ============ REWARD BANNER ============
let rewardTimeout;
function showReward(icon, text) {
  const b = document.getElementById('rewardBanner');
  document.getElementById('rewardIcon').textContent = icon;
  document.getElementById('rewardText').textContent = text;
  b.classList.add('show');
  clearTimeout(rewardTimeout);
  rewardTimeout = setTimeout(() => b.classList.remove('show'), 3000);
}

// ============ NAVIGATION ============
function navigate(screen) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('screen-' + screen).classList.add('active');
  document.querySelector(`[data-screen="${screen}"]`).classList.add('active');
  const titles = { dashboard:'Dashboard', garden:'Subject Garden', flashcards:'Flashcard Battle', pomodoro:'Focus Timer', notes:'Notes', shop:'Reward Shop' };
  document.getElementById('pageTitle').textContent = titles[screen] || screen;
  if (screen === 'dashboard') renderDashboard();
  if (screen === 'garden') renderGarden();
  if (screen === 'notes') renderNotes();
  if (screen === 'flashcards') { populateSubjectDropdowns(); loadBattleDeck(); renderManage(); }
  if (screen === 'shop') { renderShop(); renderInventory(); renderActiveEffects(); }
  document.getElementById('sidebar').classList.remove('open');
}

document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => navigate(btn.dataset.screen));
});

document.getElementById('menuBtn').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

// ============ DASHBOARD ============
function renderDashboard() {
  document.getElementById('statStreak').textContent = state.streak;
  document.getElementById('statMinutes').textContent = state.minutesStudied;
  document.getElementById('statCards').textContent = state.cardsReviewed;
  document.getElementById('statQuests').textContent = state.questsDone;
  renderStreakCalendar();
  renderQuests();
  renderDashSubjects();
}

function renderStreakCalendar() {
  const days = ['M','T','W','T','F','S','S'];
  const row = document.getElementById('streakRow');
  row.innerHTML = '';
  const today = new Date().getDay();
  const todayIdx = today === 0 ? 6 : today - 1;
  days.forEach((d, i) => {
    const el = document.createElement('div');
    el.className = 'streak-day' + (state.weekStreak[i] ? ' done' : '') + (i === todayIdx ? ' today' : '');
    el.textContent = d;
    row.appendChild(el);
  });
}

function renderDashSubjects() {
  const grid = document.getElementById('dashSubjects');
  if (!state.subjects.length) { grid.innerHTML = '<div class="empty-state"><div class="empty-icon">🌱</div><p>No subjects yet — go plant some!</p></div>'; return; }
  grid.innerHTML = state.subjects.slice(0,4).map(s => subjectCardHTML(s, true)).join('');
}

// ============ QUESTS ============
const QUEST_TEMPLATES = [
  { id:'fc5', name:'Review 5 flashcards', xp:30, check: () => state.cardsReviewed >= (state._questBase?.cards||0) + 5 },
  { id:'pomo1', name:'Complete a focus session', xp:50, check: () => state.pomoCompleted >= (state._questBase?.pomo||0) + 1 },
  { id:'addcard', name:'Add 2 new flashcards', xp:25, check: () => state.flashcards.length >= (state._questBase?.fcs||0) + 2 },
  { id:'note1', name:'Write a note', xp:20, check: () => state.notes.length >= (state._questBase?.notes||0) + 1 },
  { id:'fc10', name:'Review 10 flashcards', xp:60, check: () => state.cardsReviewed >= (state._questBase?.cards||0) + 10 },
];

function initQuests() {
  if (!state.quests || !state.quests.length) {
    state._questBase = { cards: state.cardsReviewed, pomo: state.pomoCompleted, fcs: state.flashcards.length, notes: state.notes.length };
    state.quests = QUEST_TEMPLATES.slice(0,4).map(q => ({ id: q.id, done: false }));
    save();
  }
}

function resetQuests() {
  state._questBase = { cards: state.cardsReviewed, pomo: state.pomoCompleted, fcs: state.flashcards.length, notes: state.notes.length };
  state.quests = QUEST_TEMPLATES.slice(0,4).map(q => ({ id: q.id, done: false }));
  save(); renderQuests();
}

function renderQuests() {
  initQuests();
  const list = document.getElementById('questList');
  list.innerHTML = '';
  state.quests.forEach((q, i) => {
    const tmpl = QUEST_TEMPLATES.find(t => t.id === q.id);
    if (!tmpl) return;
    const done = q.done || tmpl.check();
    if (done && !q.done) {
      q.done = true;
      state.questsDone++;
      addXP(tmpl.xp, tmpl.name);
    }
    const el = document.createElement('div');
    el.className = 'quest-item' + (done ? ' done' : '');
    el.innerHTML = `
      <div class="quest-check ${done ? 'done' : ''}">
        ${done ? '✓' : ''}
      </div>
      <div class="quest-name">${tmpl.name}</div>
      <div class="quest-xp">+${tmpl.xp} XP</div>
    `;
    list.appendChild(el);
  });
  save();
}

// ============ GARDEN ============
function subjectCardHTML(s, mini=false) {
  const maxXP = 500;
  const pct = Math.min(100, Math.round((s.xp / maxXP) * 100));
  return `<div class="subject-card" style="background:${s.bg};border-color:${s.color}" onclick="navigate('flashcards')">
    <span class="subject-emoji">${s.emoji}</span>
    <div class="subject-name">${escapeHTML(s.name)}</div>
    <div class="subject-progress"><div class="subject-progress-fill" style="width:${pct}%"></div></div>
    <div class="subject-xp-label">${s.xp} XP · ${pct}% mastered</div>
  </div>`;
}

function renderGarden() {
  const grid = document.getElementById('gardenGrid');
  grid.innerHTML = state.subjects.map(s => subjectCardHTML(s)).join('');
  grid.innerHTML += `<div class="add-subject-btn" onclick="openSubjectModal()">
    <span style="font-size:36px">🌱</span>
    <span>Plant New Subject</span>
  </div>`;
}

function openSubjectModal() {
  selectedEmoji = '📚'; selectedColorIdx = 0;
  const eg = document.getElementById('emojiGrid');
  eg.innerHTML = EMOJIS.map(e => `<span class="emoji-opt${e===selectedEmoji?' selected':''}" onclick="selectEmoji('${e}',this)">${e}</span>`).join('');
  const cg = document.getElementById('colorGrid');
  cg.innerHTML = COLORS.map((c,i) => `<div class="color-opt${i===0?' selected':''}" style="background:${c.border}" onclick="selectColor(${i},this)"></div>`).join('');
  document.getElementById('subjectModal').classList.add('open');
}

function selectEmoji(e, el) {
  selectedEmoji = e;
  document.querySelectorAll('.emoji-opt').forEach(x => x.classList.remove('selected'));
  el.classList.add('selected');
}
function selectColor(i, el) {
  selectedColorIdx = i;
  document.querySelectorAll('.color-opt').forEach(x => x.classList.remove('selected'));
  el.classList.add('selected');
}

function saveSubject() {
  const name = document.getElementById('subjectName').value.trim();
  if (!name) return;
  const c = COLORS[selectedColorIdx];
  state.subjects.push({ id: Date.now(), name, emoji: selectedEmoji, color: c.border, bg: c.bg, xp: 0 });
  document.getElementById('subjectName').value = '';
  save();
  closeModal('subjectModal');
  renderGarden();
  populateSubjectDropdowns();
  showReward('🌱', `${name} planted in your garden!`);
  addXP(20, 'New subject added');
}

// ============ FLASHCARDS ============
let battleDeck = [], battleIdx = 0, battleCorrect = 0, battleWrong = 0, cardFlipped = false;

function populateSubjectDropdowns() {
  const opts = state.subjects.map(s => `<option value="${s.id}">${s.emoji} ${escapeHTML(s.name)}</option>`).join('');
  const allOpts = `<option value="all">All Subjects</option>` + opts;
  ['battleSubjectFilter','newCardSubject','noteSubjectTag','noteSubjectSel'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const prev = el.value;
    el.innerHTML = id === 'battleSubjectFilter' ? allOpts : (id === 'newCardSubject' ? `<option value="">Select subject...</option>` + opts : (id === 'noteSubjectTag' ? `<option value="">All Subjects</option>` + opts : opts));
    el.value = prev || (id === 'battleSubjectFilter' ? 'all' : '');
  });
}

function loadBattleDeck() {
  const filter = document.getElementById('battleSubjectFilter')?.value || 'all';
  let deck = filter === 'all' ? [...state.flashcards] : state.flashcards.filter(c => String(c.subjectId) === String(filter));
  deck = deck.sort(() => Math.random() - 0.5);
  battleDeck = deck; battleIdx = 0; battleCorrect = 0; battleWrong = 0; cardFlipped = false;

  document.getElementById('fcResult').style.display = 'none';
  document.getElementById('flashcard').style.display = 'block';
  document.getElementById('fcControls').style.display = 'none';
  document.getElementById('flashcard').classList.remove('flipped');

  if (!deck.length) {
    document.getElementById('fcQuestion').textContent = 'No cards in this subject. Add some!';
    document.getElementById('fcAnswer').textContent = '';
    renderFCDots();
    return;
  }
  showCard();
}

function showCard() {
  if (battleIdx >= battleDeck.length) { endBattle(); return; }
  const card = battleDeck[battleIdx];
  document.getElementById('fcQuestion').textContent = card.q;
  document.getElementById('fcAnswer').textContent = card.a;
  document.getElementById('flashcard').classList.remove('flipped');
  document.getElementById('fcControls').style.display = 'none';
  cardFlipped = false;
  renderFCDots();
}

function flipCard() {
  if (battleIdx >= battleDeck.length) return;
  cardFlipped = !cardFlipped;
  document.getElementById('flashcard').classList.toggle('flipped', cardFlipped);
  document.getElementById('fcControls').style.display = cardFlipped ? 'flex' : 'none';
}

function answerCard(correct) {
  if (correct) { battleCorrect++; }
  else { battleWrong++; }
  state.cardsReviewed++;
  if (correct) state.cardsCorrect++;
  const card = battleDeck[battleIdx];
  const subj = state.subjects.find(s => s.id === card.subjectId);
  if (subj && correct) subj.xp += 15;
  battleIdx++;
  save();
  renderFCDots();
  showCard();
}

function renderFCDots() {
  const dots = document.getElementById('fcDots');
  dots.innerHTML = battleDeck.map((_, i) => {
    let cls = 'fc-dot';
    if (i < battleIdx) cls += (battleCorrect > i || (i < battleIdx && battleWrong === 0)) ? '' : '';
    return `<div class="${cls}" id="dot-${i}"></div>`;
  }).join('');
}

function endBattle() {
  document.getElementById('flashcard').style.display = 'none';
  document.getElementById('fcControls').style.display = 'none';
  document.getElementById('fcResult').style.display = 'block';
  const pct = battleDeck.length ? Math.round((battleCorrect / battleDeck.length) * 100) : 0;
  const emoji = pct >= 80 ? '🎉' : pct >= 50 ? '😊' : '😅';
  document.getElementById('fcResultEmoji').textContent = emoji;
  document.getElementById('fcResultTitle').textContent = pct >= 80 ? 'Amazing Work!' : pct >= 50 ? 'Good Job!' : 'Keep Practicing!';
  document.getElementById('fcResultSub').textContent = `${battleCorrect} correct out of ${battleDeck.length} cards (${pct}%)`;
  const xpGain = battleCorrect * 15 + (pct >= 80 ? 30 : 0);
  addXP(xpGain, 'Flashcard Battle');
  renderQuests();
}

function addFlashcard() {
  const subjectId = parseInt(document.getElementById('newCardSubject').value);
  const q = document.getElementById('newCardQ').value.trim();
  const a = document.getElementById('newCardA').value.trim();
  if (!q || !a || !subjectId) { showReward('⚠️', 'Fill in all fields!'); return; }
  state.flashcards.push({ id: Date.now(), subjectId, q, a });
  document.getElementById('newCardQ').value = '';
  document.getElementById('newCardA').value = '';
  save();
  showReward('⚡', 'Flashcard added! +10 XP');
  addXP(10, 'Card created');
  renderManage();
  renderQuests();
}

function renderManage() {
  const list = document.getElementById('fcManageList');
  if (!state.flashcards.length) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">⚡</div><p>No flashcards yet — add some!</p></div>';
    return;
  }
  list.innerHTML = state.flashcards.map(c => {
    const subj = state.subjects.find(s => s.id === c.subjectId) || { emoji:'❓', name:'Unknown', color:'#ccc', bg:'#f5f5f5' };
    return `<div class="fc-list-item" style="border-left:4px solid ${subj.color}">
      <span style="font-size:20px">${subj.emoji}</span>
      <div style="flex:1"><div class="fc-q">${escapeHTML(c.q)}</div><div class="fc-a">${escapeHTML(c.a)}</div></div>
      <button class="delete-btn" onclick="deleteCard(${c.id})">🗑️</button>
    </div>`;
  }).join('');
}

function deleteCard(id) {
  state.flashcards = state.flashcards.filter(c => c.id !== id);
  save(); renderManage();
}

function switchFCTab(tab) {
  document.querySelectorAll('#screen-flashcards .tab').forEach((t,i) => t.classList.toggle('active', ['battle','manage','add'][i] === tab));
  document.getElementById('fc-battle').style.display = tab === 'battle' ? 'block' : 'none';
  document.getElementById('fc-manage').style.display = tab === 'manage' ? 'block' : 'none';
  document.getElementById('fc-add').style.display = tab === 'add' ? 'block' : 'none';
  if (tab === 'manage') renderManage();
}

// ============ POMODORO ============
let pomoInterval = null, pomoRunning = false, pomoSeconds = 25*60, pomoTotal = 25*60, pomoMode = 'work';
const pomoMascots = { work: ['🥦','🍊','🍓','🍇'], break: ['😴','☕','🌿','🌸'] };

function setPomoDuration(min, mode, btn) {
  document.querySelectorAll('.screen#screen-pomodoro .tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  pomoMode = mode;
  pomoSeconds = min * 60;
  pomoTotal = min * 60;
  updatePomoDisplay();
  if (pomoRunning) { clearInterval(pomoInterval); pomoRunning = false; document.getElementById('pomoStartBtn').textContent = '▶ Start'; }
}

function togglePomo() {
  if (pomoRunning) {
    clearInterval(pomoInterval);
    pomoRunning = false;
    document.getElementById('pomoStartBtn').textContent = '▶ Start';
    document.getElementById('pomoMascot').className = 'pomo-mascot';
    document.getElementById('pomoPhase').textContent = 'PAUSED';
  } else {
    pomoRunning = true;
    document.getElementById('pomoStartBtn').textContent = '⏸ Pause';
    document.getElementById('pomoMascot').className = 'pomo-mascot working';
    document.getElementById('pomoPhase').textContent = pomoMode === 'work' ? 'FOCUSING' : 'RESTING';
    markTodayStudied();
    pomoInterval = setInterval(tickPomo, 1000);
  }
}

function tickPomo() {
  if (pomoSeconds <= 0) {
    clearInterval(pomoInterval);
    pomoRunning = false;
    document.getElementById('pomoStartBtn').textContent = '▶ Start';
    document.getElementById('pomoMascot').className = 'pomo-mascot resting';
    document.getElementById('pomoPhase').textContent = 'DONE!';
    const minDone = Math.round(pomoTotal / 60);
    if (pomoMode === 'work') {
      state.pomoCompleted++;
      state.minutesStudied += minDone;
      document.getElementById('pomoCompletedCount').textContent = state.pomoCompleted;
      document.getElementById('pomoTotalMin').textContent = state.minutesStudied;
      addXP(50, `${minDone} min focus session!`);
      const dots = document.querySelectorAll('.pomo-dot');
      const idx = Math.min(state.pomoCompleted - 1, dots.length - 1);
      if (dots[idx]) dots[idx].classList.add('done');
      renderQuests();
    }
    playTimerEndSound();
    save();
    return;
  }
  pomoSeconds--;
  updatePomoDisplay();
}

function updatePomoDisplay() {
  const m = Math.floor(pomoSeconds / 60), s = pomoSeconds % 60;
  document.getElementById('pomoTime').textContent = String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
  const pct = 1 - (pomoSeconds / pomoTotal);
  const circumference = 596.9;
  document.getElementById('pomoProgress').style.strokeDashoffset = circumference * (1 - pct);
  const mascotArr = pomoMascots[pomoRunning ? pomoMode : 'work'];
  let activeEmoji = null;
  if (state.activeMascot) {
    const item = SHOP_ITEMS.find(i => i.id === state.activeMascot);
    if (item) activeEmoji = item.emoji;
  }
  const mascotIdx = Math.floor((Date.now() / 10000)) % mascotArr.length;
  document.getElementById('pomoMascot').textContent = activeEmoji || mascotArr[mascotIdx];
}

function resetPomo() {
  clearInterval(pomoInterval); pomoRunning = false;
  pomoSeconds = pomoTotal;
  document.getElementById('pomoStartBtn').textContent = '▶ Start';
  document.getElementById('pomoMascot').className = 'pomo-mascot';
  document.getElementById('pomoPhase').textContent = 'READY';
  updatePomoDisplay();
}

function markTodayStudied() {
  const today = new Date().toDateString();
  if (state.lastStudyDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (state.lastStudyDate === yesterday) state.streak++;
    else if (state.lastStudyDate !== today) state.streak = 1;
    state.lastStudyDate = today;
    const dayIdx = new Date().getDay();
    const idx = dayIdx === 0 ? 6 : dayIdx - 1;
    state.weekStreak[idx] = true;
    save();
  }
}

// ============ NOTES ============
function openNoteModal() {
  const sel = document.getElementById('noteSubjectSel');
  sel.innerHTML = state.subjects.map(s => `<option value="${escapeHTML(s.name)}">${s.emoji} ${escapeHTML(s.name)}</option>`).join('');
  document.getElementById('noteContent').value = '';
  document.getElementById('noteModal').classList.add('open');
}

function saveNote() {
  const content = document.getElementById('noteContent').value.trim();
  const subject = document.getElementById('noteSubjectSel').value;
  if (!content) return;
  state.notes.unshift({ id: Date.now(), subject, content, date: new Date().toLocaleDateString() });
  save();
  closeModal('noteModal');
  renderNotes();
  showReward('📝', 'Note saved! +10 XP');
  addXP(10, 'Note taken');
  renderQuests();
}

function renderNotes() {
  const filter = document.getElementById('noteSubjectTag')?.value || '';
  const list = document.getElementById('notesList');
  let notes = filter ? state.notes.filter(n => String(n.subjectId) === filter || n.subject === filter) : state.notes;
  if (!notes.length) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">📝</div><p>No notes yet — start writing!</p></div>';
    return;
  }
  list.innerHTML = notes.map(n => {
    const subj = state.subjects.find(s => s.name === n.subject);
    const color = subj ? subj.color : 'var(--mint)';
    return `<div class="note-card" style="border-left-color:${color}">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
        <span class="note-subject-tag" style="background:${subj?.bg||'var(--mint-light)'};color:${color}">${subj?.emoji||'📝'} ${escapeHTML(n.subject||'General')}</span>
        <div style="display:flex;gap:8px;align-items:center">
          <span style="font-size:12px;color:var(--text-muted);font-weight:700">${n.date}</span>
          <button class="delete-btn" onclick="deleteNote(${n.id})">🗑️</button>
        </div>
      </div>
      <div style="font-size:15px;font-weight:600;line-height:1.6;white-space:pre-wrap">${escapeHTML(n.content)}</div>
    </div>`;
  }).join('');
}

function deleteNote(id) {
  state.notes = state.notes.filter(n => n.id !== id);
  save(); renderNotes();
}

// ============ SHOP ============
function switchShopTab(tab, btn) {
  document.querySelectorAll('#screen-shop .tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('shop-panel').style.display = tab === 'shop' ? 'block' : 'none';
  document.getElementById('inventory-panel').style.display = tab === 'inventory' ? 'block' : 'none';
  if (tab === 'inventory') { renderInventory(); renderActiveEffects(); }
  if (tab === 'shop') renderShop();
}

function renderShop() {
  const grid = document.getElementById('shopGrid');
  if (!grid) return;
  if (!Array.isArray(state.inventory)) state.inventory = [];

  grid.innerHTML = SHOP_ITEMS.map(item => {
    const owned = state.inventory.some(inv => inv.id === item.id);
    const canAfford = state.coins >= item.price;
    const isLocked = item.price > 0 && !canAfford && !owned;
    const isFree = item.price === 0;
    return `
      <div class="shop-item ${owned ? 'owned' : ''} ${isLocked ? 'locked' : ''}">
        ${owned ? '<span class="shop-badge">OWNED</span>' : ''}
        <span class="shop-emoji">${item.emoji}</span>
        <div class="shop-name">${item.name}</div>
        <div class="shop-desc">${item.desc}</div>
        <div class="shop-price">${isFree ? 'FREE' : '🪙 ' + item.price}</div>
        ${owned 
          ? `<button class="btn btn-secondary" disabled>Owned</button>`
          : `<button class="btn btn-primary" ${isLocked ? 'disabled' : ''} onclick="buyItem('${item.id}')">${isLocked ? 'Locked' : (isFree ? 'Claim' : 'Buy')}</button>`
        }
      </div>
    `;
  }).join('');
}

function buyItem(itemId) {
  const item = SHOP_ITEMS.find(i => i.id === itemId);
  if (!item) return;
  if (!Array.isArray(state.inventory)) state.inventory = [];
  if (state.inventory.some(inv => inv.id === itemId)) return;
  if (state.coins < item.price) { showReward('❌', 'Not enough coins!'); return; }

  state.coins -= item.price;
  state.inventory.push({ id: item.id, acquired: Date.now(), qty: item.permanent ? 1 : 1 });
  save();
  updateCoins();
  renderShop();
  playPurchaseSound();
  showReward('🛒', `Bought ${item.name}!`);
}

function renderInventory() {
  const grid = document.getElementById('inventoryGrid');
  if (!grid) return;
  if (!Array.isArray(state.inventory) || !state.inventory.length) {
    grid.innerHTML = '<div class="empty-state" style="padding:24px;width:100%"><div class="empty-icon" style="font-size:40px">🎒</div><p>Your bag is empty — visit the shop!</p></div>';
    return;
  }
  grid.innerHTML = state.inventory.map(inv => {
    const item = SHOP_ITEMS.find(i => i.id === inv.id);
    if (!item) return '';
    const isActiveMascot = state.activeMascot === item.id;
    const isActiveTheme = state.activeTheme === item.id;
    const isActive = isActiveMascot || isActiveTheme;
    let action = '';
    if (item.type === 'mascot') action = isActiveMascot ? 'Equipped' : 'Equip';
    else if (item.type === 'theme') action = isActiveTheme ? 'Active' : 'Activate';
    else if (item.type === 'boost') action = 'Use';
    else action = 'Owned';
    return `
      <div class="inventory-item ${isActive ? 'active' : ''}" onclick="useItem('${item.id}')">
        <span class="inv-emoji">${item.emoji}</span>
        <span class="inv-name">${item.name}</span>
        ${item.permanent ? '' : `<span class="inv-qty">x${inv.qty || 1}</span>`}
        <span style="font-size:12px;font-weight:800;color:var(--mint-dark)">${action}</span>
      </div>
    `;
  }).join('');
}

function useItem(itemId) {
  const item = SHOP_ITEMS.find(i => i.id === itemId);
  if (!item) return;

  if (item.type === 'mascot') {
    state.activeMascot = itemId;
    save();
    playEquipSound();
    showReward('🎭', `${item.name} is now your mascot!`);
    renderInventory();
    updatePomoDisplay();
    return;
  }

  if (item.type === 'theme') {
    state.activeTheme = itemId;
    // Apply the theme
    if (itemId === 'theme_galaxy') {
      setTheme('galaxy');
    } else if (itemId === 'theme_sunset') {
      setTheme('sunset');
    }
    save();
    playEquipSound();
    showReward('🎨', `${item.name} activated!`);
    renderInventory();
    return;
  }

  if (item.type === 'boost') {
    const invItem = state.inventory.find(i => i.id === itemId);
    if (!invItem || (invItem.qty !== undefined && invItem.qty <= 0)) return;
    if (invItem.qty !== undefined) invItem.qty--;
    if (invItem.qty !== undefined && invItem.qty <= 0) {
      state.inventory = state.inventory.filter(i => i.id !== itemId);
    }
    if (item.id === 'boost_2x') {
      state.xpMultiplier = 2;
      state.xpMultiplierExpiry = Date.now() + 24 * 60 * 60 * 1000;
      showReward('⚡', '2x XP active for 24 hours!');
    } else if (item.id === 'boost_streak') {
      state.streakShield = true;
      showReward('🛡️', 'Streak shield active!');
    }
    save();
    renderInventory();
    renderActiveEffects();
    playEquipSound();
    return;
  }
}

function renderActiveEffects() {
  const container = document.getElementById('activeEffects');
  if (!container) return;
  const effects = [];
  const now = Date.now();

  if (state.xpMultiplierExpiry && now < state.xpMultiplierExpiry) {
    const hoursLeft = Math.ceil((state.xpMultiplierExpiry - now) / (60 * 60 * 1000));
    effects.push({ icon: '⚡', text: `2x XP — ${hoursLeft}h left`, color: 'var(--yellow)' });
  } else {
    state.xpMultiplier = 1;
    state.xpMultiplierExpiry = null;
  }

  if (state.streakShield) {
    effects.push({ icon: '🛡️', text: 'Streak Shield — protects 1 missed day', color: 'var(--blue)' });
  }

  if (!effects.length) {
    container.innerHTML = '<div class="empty-state" style="padding:24px"><div class="empty-icon" style="font-size:40px">✨</div><p>No active boosts right now</p></div>';
    return;
  }

  container.innerHTML = effects.map(e => `
    <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--mint-light);border-radius:var(--radius-sm);margin-bottom:8px">
      <span style="font-size:24px">${e.icon}</span>
      <span style="font-weight:700;font-size:14px">${e.text}</span>
    </div>
  `).join('');
}

// ============ MODALS ============
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
document.querySelectorAll('.modal-overlay').forEach(m => {
  m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); });
});

// ============ KEYBOARD SHORTCUTS ============
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
  }
});

const SCREEN_KEYS = { '1':'dashboard', '2':'garden', '3':'flashcards', '4':'pomodoro', '5':'notes', '6':'shop' };

function isTyping(e) {
  return ['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName) || document.querySelector('.modal-overlay.open');
}

document.addEventListener('keydown', e => {
  if (isTyping(e) || e.ctrlKey || e.metaKey || e.altKey) return;
  if (SCREEN_KEYS[e.key]) navigate(SCREEN_KEYS[e.key]);
  if (e.code === 'Space') {
    const active = document.querySelector('.screen.active')?.id;
    if (active === 'screen-pomodoro') { e.preventDefault(); togglePomo(); }
    if (active === 'screen-flashcards' && document.getElementById('fc-battle').style.display !== 'none') {
      e.preventDefault(); flipCard();
    }
  }
});

// ============ INIT ============
function init() {
  initTheme();
  updateXPBar();
  updateCoins();
  populateSubjectDropdowns();
  renderDashboard();
  updatePomoDisplay();
  document.getElementById('pomoCompletedCount').textContent = state.pomoCompleted || 0;
  document.getElementById('pomoTotalMin').textContent = state.minutesStudied || 0;
  document.getElementById('noteSubjectTag').addEventListener('change', renderNotes);
}

init();
