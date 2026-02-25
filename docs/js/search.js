/**
 * ParlaBio – Search & Faceting
 * Depends on: config.js (CONFIG), utils.js (normalizeUmlauts, birthDecade)
 * Exposes: initSearch(), performSearch(), computeFacets(), computeOverviewStats(),
 *          computeUnfilteredFacets(), loadPersonDetail()
 */

let allPersons = [];
let miniSearch = null;

// Load search index and initialize MiniSearch
async function initSearch() {
  const resp = await fetch(CONFIG.SEARCH_INDEX_URL);
  if (!resp.ok) throw new Error(`HTTP ${resp.status} beim Laden des Suchindex`);
  allPersons = await resp.json();

  miniSearch = new MiniSearch({
    fields: ['surname', 'forename', 'name'],
    storeFields: ['id', 'name', 'surname', 'forename', 'sex', 'birth_year',
                   'death_year', 'birth_place', 'type', 'factions', 'periods',
                   'gnd', 'has_wikipedia'],
    searchOptions: {
      boost: { surname: 3, forename: 1, name: 1 },
      fuzzy: 0.2,
      prefix: true,
    },
    // Umlaut-Normalisierung in Index und Query: historische Quellen und
    // internationale Nutzer schreiben oft "Mueller" statt "Müller"
    processTerm: (term) => {
      term = term.toLowerCase();
      term = normalizeUmlauts(term);
      return term || null;
    },
  });

  miniSearch.addAll(allPersons);
  return allPersons.length;
}

/**
 * Full-text search with facet filtering.
 * @param {string} query - Free-text search query (empty = all persons)
 * @param {Object} filters - Active facet filters
 * @param {string} [filters.type] - Person type: 'MdB', 'Sonstige', 'KGParl'
 * @param {string} [filters.faction] - Faction name, e.g. 'CDU/CSU'
 * @param {string} [filters.period] - Wahlperiode number as string, e.g. '7'
 * @param {string} [filters.sex] - 'm' or 'f'
 * @param {string} [filters.decade] - Birth decade, e.g. '1920er'
 * @returns {Array} Matching person objects with _score field
 */
function performSearch(query, filters) {
  let results;

  if (query && query.trim()) {
    // Text search via MiniSearch
    results = miniSearch.search(query, {
      boost: { surname: 3, forename: 1, name: 1 },
      fuzzy: 0.2,
      prefix: true,
    });
    // MiniSearch returns objects with id + storeFields; map to uniform shape
    results = results.map(r => ({
      id: r.id,
      name: r.name,
      surname: r.surname,
      forename: r.forename,
      sex: r.sex,
      birth_year: r.birth_year,
      death_year: r.death_year,
      birth_place: r.birth_place,
      type: r.type,
      factions: r.factions,
      periods: r.periods,
      gnd: r.gnd,
      has_wikipedia: r.has_wikipedia,
      _score: r.score,
    }));
  } else {
    // No query: return all persons sorted alphabetically by surname
    results = allPersons.map(p => ({ ...p, _score: 0 }));
    results.sort((a, b) => (a.surname || '').localeCompare(b.surname || '', 'de'));
  }

  // Apply facet filters via Array.filter
  if (filters.type) {
    results = results.filter(p => p.type === filters.type);
  }
  if (filters.faction) {
    results = results.filter(p => p.factions && p.factions.includes(filters.faction));
  }
  if (filters.period) {
    const wp = parseInt(filters.period, 10);
    results = results.filter(p => p.periods && p.periods.includes(wp));
  }
  if (filters.sex) {
    results = results.filter(p => p.sex === filters.sex);
  }
  if (filters.decade) {
    results = results.filter(p => birthDecade(p.birth_year) === filters.decade);
  }

  return results;
}

// Compute facet counts from a result set
function computeFacets(results) {
  const facets = {
    type: {},
    faction: {},
    period: {},
    sex: {},
    decade: {},
  };

  for (const p of results) {
    // Type
    facets.type[p.type] = (facets.type[p.type] || 0) + 1;

    // Factions
    if (p.factions) {
      for (const f of p.factions) {
        facets.faction[f] = (facets.faction[f] || 0) + 1;
      }
    }

    // Periods
    if (p.periods) {
      for (const wp of p.periods) {
        facets.period[wp] = (facets.period[wp] || 0) + 1;
      }
    }

    // Sex
    if (p.sex) {
      facets.sex[p.sex] = (facets.sex[p.sex] || 0) + 1;
    }

    // Decade
    const dec = birthDecade(p.birth_year);
    if (dec) {
      facets.decade[dec] = (facets.decade[dec] || 0) + 1;
    }
  }

  return facets;
}

// Compute overview statistics for the dashboard
function computeOverviewStats() {
  const allFacets = computeFacets(allPersons);
  const mdbFacets = computeFacets(allPersons.filter(p => p.type === 'MdB'));
  return {
    total: allPersons.length,
    types: allFacets.type,
    factions: mdbFacets.faction,
    periods: allFacets.period,
    decades: allFacets.decade,
    sex: allFacets.sex,
  };
}

/**
 * Compute facets from unfiltered-per-category results.
 * For each filter category, computes facets without that specific filter applied,
 * so sidebar counts reflect what you'd get after removing just that filter.
 * @param {string} query - Current search query
 * @param {Object} filters - Active filters {type, faction, period, sex, decade}
 * @returns {Object} Facets per category, each with counts from unfiltered-for-that-category results
 */
function computeUnfilteredFacets(query, filters) {
  const categories = ['type', 'faction', 'period', 'sex', 'decade'];
  const result = {};

  for (const cat of categories) {
    const filtersWithout = { ...filters };
    filtersWithout[cat] = '';
    const catResults = performSearch(query, filtersWithout);
    const allFacets = computeFacets(catResults);
    result[cat] = allFacets[cat];
  }

  return result;
}

// Load a single person's detail JSON
async function loadPersonDetail(id) {
  const resp = await fetch(`${CONFIG.PERSON_DETAIL_URL}${encodeURIComponent(id)}.json`);
  if (!resp.ok) throw new Error(`Person not found: ${id}`);
  return resp.json();
}
