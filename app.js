const state = {
  notes: [],
  filtered: [],
  activeTags: new Set(),
  status: 'all',
  module: 'all',
  search: ''
};

const DOM = {
  cards: document.getElementById('cards'),
  template: document.getElementById('card-template'),
  search: document.getElementById('search'),
  status: document.getElementById('statusFilter'),
  tags: document.getElementById('tagFilters'),
  modules: document.getElementById('moduleFilters'),
  viewerRoot: document.getElementById('noteViewer'),
  viewerOverlay: document.getElementById('noteViewerOverlay'),
  viewerPanel: document.getElementById('noteViewerPanel'),
  viewerTitle: document.getElementById('noteViewerTitle'),
  viewerLoading: document.getElementById('noteViewerLoading'),
  viewerError: document.getElementById('noteViewerError'),
  viewerContent: document.getElementById('noteViewerContent'),
  viewerBody: document.getElementById('noteViewerBody'),
  viewerClose: document.getElementById('noteViewerClose')
};

const viewerState = {
  isOpen: false,
  controller: null,
  lastFocused: null
};

const focusableSelector = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

DOM.viewerClose?.addEventListener('click', closeNoteViewer);
DOM.viewerOverlay?.addEventListener('click', closeNoteViewer);
document.addEventListener('keydown', handleViewerKeydown);

init();

async function init() {
  setupTelegramShell();

  if (window.marked?.setOptions) {
    window.marked.setOptions({
      gfm: true,
      breaks: true,
      headerIds: false,
      mangle: false
    });
  }

  try {
    const res = await fetch('notes.json');
    state.notes = await res.json();
    state.notes.sort((a, b) => (a.lesson || '').localeCompare(b.lesson || ''));
    buildModuleFilters();
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

function buildModuleFilters() {
  const modules = [...new Set(state.notes.map((note) => note.module))].sort();
  DOM.modules.innerHTML = '';
  DOM.modules.appendChild(createModuleButton('All modules', 'all'));
  modules.forEach((module) => DOM.modules.appendChild(createModuleButton(module, module)));
  setActiveModuleButton();
}

function createModuleButton(label, value) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'module-button';
  button.textContent = label;
  button.dataset.value = value;
  button.addEventListener('click', () => {
    state.module = value;
    setActiveModuleButton();
    applyFilters();
  });
  return button;
}

function setActiveModuleButton() {
  DOM.modules.querySelectorAll('.module-button').forEach((button) => {
    if (button.dataset.value === state.module) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  });
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
    const matchesModule = state.module === 'all' || note.module === state.module;
    const matchesTags = !state.activeTags.size || note.tags?.some((t) => state.activeTags.has(t));
    const matchesSearch = !state.search ||
      note.lesson.toLowerCase().includes(state.search) ||
      note.module.toLowerCase().includes(state.search) ||
      note.tags?.some((t) => t.toLowerCase().includes(state.search));
    return matchesStatus && matchesModule && matchesTags && matchesSearch;
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

    const notesButton = document.createElement('button');
    notesButton.type = 'button';
    notesButton.textContent = note.links?.notes ? 'View notes' : 'Notes coming soon';
    notesButton.className = 'link-button';

    if (note.links?.notes) {
      notesButton.addEventListener('click', () => openNoteViewer(note));
    } else {
      notesButton.disabled = true;
      notesButton.setAttribute('aria-disabled', 'true');
    }

    links.appendChild(notesButton);

    DOM.cards.appendChild(card);
  });
}

function formatStatus(status) {
  return status === 'complete' ? 'Complete' : 'In progress';
}

async function openNoteViewer(note = {}) {
  if (!DOM.viewerRoot || !DOM.viewerPanel) return;

  viewerState.lastFocused = document.activeElement;
  DOM.viewerTitle.textContent = note.lesson || 'Lesson notes';
  DOM.viewerContent.innerHTML = '';
  DOM.viewerBody?.scrollTo({ top: 0 });
  hideViewerError();
  setViewerLoading(true);

  DOM.viewerRoot.classList.add('is-open');
  DOM.viewerRoot.setAttribute('aria-hidden', 'false');
  document.body.classList.add('has-note-viewer');
  viewerState.isOpen = true;
  requestAnimationFrame(() => DOM.viewerClose?.focus());

  viewerState.controller?.abort?.();

  if (!note.links?.notes) {
    setViewerLoading(false);
    DOM.viewerContent.innerHTML = '<p class="muted">These notes aren’t ready yet. Check back soon.</p>';
    return;
  }

  try {
    const controller = new AbortController();
    viewerState.controller = controller;
    const res = await fetch(note.links.notes, { signal: controller.signal });
    if (!res.ok) throw new Error(`Unable to fetch notes (${res.status})`);
    const markdown = await res.text();
    const html = renderMarkdown(markdown);
    DOM.viewerContent.innerHTML = html;
    enhanceRenderedMarkdown(DOM.viewerContent);
    setViewerLoading(false);
  } catch (err) {
    if (err.name === 'AbortError') return;
    showViewerError(err.message || 'Unable to load notes.');
  }
}

function closeNoteViewer() {
  if (!viewerState.isOpen) return;
  viewerState.controller?.abort?.();
  viewerState.controller = null;
  viewerState.isOpen = false;
  DOM.viewerRoot?.classList.remove('is-open');
  DOM.viewerRoot?.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('has-note-viewer');
  setViewerLoading(false);
  hideViewerError();
  DOM.viewerContent.innerHTML = '';
  DOM.viewerBody?.scrollTo({ top: 0 });
  viewerState.lastFocused?.focus?.();
}

function setViewerLoading(isLoading) {
  if (!DOM.viewerLoading) return;
  DOM.viewerLoading.hidden = !isLoading;
}

function showViewerError(message) {
  setViewerLoading(false);
  if (DOM.viewerError) {
    DOM.viewerError.hidden = false;
    DOM.viewerError.textContent = message;
  }
}

function hideViewerError() {
  if (DOM.viewerError) {
    DOM.viewerError.hidden = true;
    DOM.viewerError.textContent = '';
  }
}

function renderMarkdown(markdown = '') {
  if (window.marked?.parse) {
    return window.marked.parse(markdown);
  }
  const escaped = markdown
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return escaped.replace(/\n/g, '<br />');
}

function enhanceRenderedMarkdown(container) {
  if (!container) return;
  container.querySelectorAll('a').forEach((link) => {
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
  });
}

function handleViewerKeydown(event) {
  if (!viewerState.isOpen) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    closeNoteViewer();
    return;
  }
  if (event.key === 'Tab') {
    trapFocus(event);
  }
}

function trapFocus(event) {
  const focusable = DOM.viewerPanel?.querySelectorAll(focusableSelector);
  if (!focusable?.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey) {
    if (document.activeElement === first) {
      event.preventDefault();
      last.focus();
    }
    return;
  }

  if (document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
