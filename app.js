const state = {
  notes: [],
  filtered: [],
  activeTags: new Set(),
  status: 'all',
  search: ''
};

const DOM = {
  cards: document.getElementById('cards'),
  template: document.getElementById('card-template'),
  search: document.getElementById('search'),
  status: document.getElementById('statusFilter'),
  tags: document.getElementById('tagFilters')
};

init();

async function init() {
  setupTelegramShell();

  try {
    const res = await fetch('notes.json');
    state.notes = await res.json();
    buildTagFilters();
    applyFilters();
  } catch (err) {
    DOM.cards.innerHTML = `<p class="error">Unable to load notes: ${err.message}</p>`;
  }

  DOM.search.addEventListener('input', (e) => {
    state.search = e.target.value.toLowerCase();
    applyFilters();
  });

  DOM.status.addEventListener('change', (e) => {
    state.status = e.target.value;
    applyFilters();
  });
}

function setupTelegramShell() {
  const tg = window.Telegram?.WebApp;
  if (!tg) return;

  tg.ready();
  tg.expand();
  applyTelegramTheme(tg.themeParams);
  tg.onEvent('themeChanged', () => applyTelegramTheme(tg.themeParams));
}

function applyTelegramTheme(params = {}) {
  const root = document.documentElement;
  const themeColor = document.getElementById('theme-color');

  const colors = {
    '--bg': params.bg_color,
    '--card-bg': params.secondary_bg_color,
    '--text': params.text_color,
    '--muted': params.hint_color,
    '--accent': params.link_color
  };

  Object.entries(colors).forEach(([key, value]) => {
    if (value) {
      root.style.setProperty(key, value);
    }
  });

  if (params.link_color) {
    root.style.setProperty('--accent-muted', hexToRgba(params.link_color, 0.15));
  }
  if (params.hint_color) {
    root.style.setProperty('--border', hexToRgba(params.hint_color, 0.25));
  }
  if (themeColor && params.bg_color) {
    themeColor.setAttribute('content', params.bg_color);
  }
}

function hexToRgba(hex, alpha = 1) {
  const clean = hex?.replace('#', '');
  if (!clean || clean.length < 6) return hex;
  const bigint = parseInt(clean.slice(0, 6), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function buildTagFilters() {
  const tags = new Set();
  state.notes.forEach((note) => note.tags?.forEach((tag) => tags.add(tag)));

  DOM.tags.innerHTML = '';
  [...tags].sort().forEach((tag) => {
    const chip = document.createElement('button');
    chip.className = 'chip';
    chip.textContent = tag;
    chip.type = 'button';
    chip.addEventListener('click', () => toggleTag(tag, chip));
    DOM.tags.appendChild(chip);
  });
}

function toggleTag(tag, chip) {
  if (state.activeTags.has(tag)) {
    state.activeTags.delete(tag);
    chip.classList.remove('active');
  } else {
    state.activeTags.add(tag);
    chip.classList.add('active');
  }
  applyFilters();
}

function applyFilters() {
  state.filtered = state.notes.filter((note) => {
    const matchesStatus = state.status === 'all' || note.status === state.status;
    const matchesTags = !state.activeTags.size || note.tags?.some((t) => state.activeTags.has(t));
    const matchesSearch = !state.search ||
      note.lesson.toLowerCase().includes(state.search) ||
      note.module.toLowerCase().includes(state.search) ||
      note.tags?.some((t) => t.toLowerCase().includes(state.search));
    return matchesStatus && matchesTags && matchesSearch;
  });

  renderCards();
}

function renderCards() {
  DOM.cards.innerHTML = '';
  if (!state.filtered.length) {
    DOM.cards.innerHTML = '<p class="muted">No lessons match those filters yet.</p>';
    return;
  }

  state.filtered.forEach((note) => {
    const card = DOM.template.content.cloneNode(true);
    card.querySelector('.eyebrow').textContent = note.module;
    card.querySelector('h2').textContent = note.lesson;
    card.querySelector('.status').textContent = formatStatus(note.status);
    card.querySelector('.summary').textContent = note.summary || 'Notes coming soon.';

    const meta = card.querySelector('.meta');
    (note.tags || []).forEach((tag) => {
      const span = document.createElement('span');
      span.textContent = tag;
      meta.appendChild(span);
    });

    const links = card.querySelector('.links');
    if (note.links?.video) {
      const a = document.createElement('a');
      a.href = note.links.video;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = 'Watch lesson';
      links.appendChild(a);
    }
    if (note.links?.notes) {
      const a = document.createElement('a');
      a.href = note.links.notes;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = 'Read notes';
      links.appendChild(a);
    }

    DOM.cards.appendChild(card);
  });
}

function formatStatus(status) {
  return status === 'complete' ? 'Complete' : 'In progress';
}
