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
    card.querySelector('.summary').textContent = note.summary;

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
