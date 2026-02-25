/**
 * ParlaBio – Application (Routing, State, Events)
 * Depends on: config.js (CONFIG), utils.js (parseHash, buildSearchHash, escapeHtml),
 *             search.js (initSearch, performSearch, computeOverviewStats, computeUnfilteredFacets),
 *             render.js (renderResultsView), render-overview.js (renderOverviewView),
 *             render-detail.js (renderDetailView)
 * Exposes: init() (auto-called on DOMContentLoaded)
 */

const APP = {
  totalCount: 0,
  overviewStats: null,
  // Back-Navigation: hash-basiertes Routing verliert den Suchzustand beim
  // Wechsel zur Detailseite. Gespeicherter State ermöglicht "Zurück zur Suche".
  lastSearchState: null,
};

// Initialize the application
async function init() {
  const appEl = document.getElementById('app');
  appEl.innerHTML = '<p aria-busy="true">Daten werden geladen\u2026</p>';

  try {
    APP.totalCount = await initSearch();
    APP.overviewStats = computeOverviewStats();
    route();
  } catch (err) {
    appEl.innerHTML = `<p>Fehler beim Laden der Daten: ${escapeHtml(err.message)}</p>`;
    console.error(err);
  }
}

// Route based on current hash
function route() {
  const state = parseHash();

  switch (state.view) {
    case 'start':
      showOverviewView();
      break;
    case 'search':
      showSearchView(state);
      break;
    case 'detail':
      showDetailView(state.id);
      break;
    default:
      showOverviewView();
  }

  bindHeaderSearch();
}

function showOverviewView() {
  const appEl = document.getElementById('app');
  appEl.innerHTML = renderOverviewView(APP.overviewStats);
  bindOverviewEvents();
  document.title = 'ParlaBio \u2013 Personendatenbank der Fraktionsprotokolle';

  // Sync header search: clear it on overview
  const headerInput = document.getElementById('header-search-input');
  if (headerInput) headerInput.value = '';
}

function showSearchView(state) {
  const appEl = document.getElementById('app');
  const filters = {
    type: state.type || '',
    faction: state.faction || '',
    period: state.period || '',
    sex: state.sex || '',
    decade: state.decade || '',
  };
  const page = state.page || 1;
  const pageSize = CONFIG.PAGE_SIZE;

  const results = performSearch(state.q, filters);
  const unfilteredFacets = computeUnfilteredFacets(state.q, filters);

  appEl.innerHTML = renderResultsView(results, state.q, filters, unfilteredFacets, page, pageSize);

  // Remember this search state for back navigation
  APP.lastSearchState = { ...state };

  bindSearchEvents(state);
  document.title = state.q
    ? `\u201e${state.q}\u201c \u2013 ParlaBio`
    : 'Alle Personen \u2013 ParlaBio';

  // Sync header search with current query
  const headerInput = document.getElementById('header-search-input');
  if (headerInput) headerInput.value = state.q || '';
}

async function showDetailView(id) {
  const appEl = document.getElementById('app');
  appEl.innerHTML = '<p aria-busy="true">Lade Personendaten\u2026</p>';

  try {
    const person = await loadPersonDetail(id);
    appEl.innerHTML = renderDetailView(person);
    bindDetailEvents();
    document.title = `${person.name} \u2013 ParlaBio`;
  } catch (err) {
    appEl.innerHTML = `<p>Person nicht gefunden: ${escapeHtml(id)}</p>
      <p><a href="#/">Zur Startseite</a></p>`;
  }

  // Clear header search on detail view
  const headerInput = document.getElementById('header-search-input');
  if (headerInput) headerInput.value = '';
}

// Bind header search form (present on every view)
function bindHeaderSearch() {
  const form = document.getElementById('header-search-form');
  if (!form || form.dataset.bound) return;
  form.dataset.bound = '1';

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = document.getElementById('header-search-input').value;
    window.location.hash = buildSearchHash({ q, page: 1 });
  });
}

// Event binding for overview view
function bindOverviewEvents() {
  // Toggle "weitere" factions
  const toggleBtn = document.getElementById('toggle-factions');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const more = document.getElementById('more-factions');
      if (more) {
        const isOpen = more.classList.toggle('open');
        toggleBtn.textContent = isOpen
          ? '\u25be Weniger anzeigen'
          : '\u25b8 ' + toggleBtn.textContent.match(/\d+/)[0] + ' weitere anzeigen';
      }
    });
  }
}

// Event binding for search/results view
function bindSearchEvents(state) {
  // Facet links
  document.querySelectorAll('.facet-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const key = link.dataset.facet;
      const value = link.dataset.value;
      const newState = { ...state, page: 1 };

      if (link.classList.contains('active')) {
        // Toggle off
        newState[key] = '';
      } else {
        newState[key] = value;
      }

      window.location.hash = buildSearchHash(newState);
    });
  });

  // Remove filter badges
  document.querySelectorAll('.filter-badge button').forEach(btn => {
    btn.addEventListener('click', () => {
      const badge = btn.closest('.filter-badge');
      const key = badge.dataset.filter;
      const newState = { ...state, page: 1 };
      newState[key] = '';
      window.location.hash = buildSearchHash(newState);
    });
  });

  // Pagination links
  document.querySelectorAll('.page-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = parseInt(link.dataset.page, 10);
      window.location.hash = buildSearchHash({ ...state, page });
      // Scroll to top of results
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

// Event binding for detail view
function bindDetailEvents() {
  const backLink = document.getElementById('back-link');
  if (backLink) {
    backLink.addEventListener('click', (e) => {
      e.preventDefault();
      if (APP.lastSearchState) {
        window.location.hash = buildSearchHash(APP.lastSearchState);
      } else {
        window.history.back();
      }
    });
  }
}

// Listen for hash changes
window.addEventListener('hashchange', route);

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', init);
