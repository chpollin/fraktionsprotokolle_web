/**
 * ParlaBio – Search & Faceting (MiniSearch + Array.filter)
 */

let allPersons = [];
let miniSearch = null;

// Load search index and initialize MiniSearch
async function initSearch() {
  const resp = await fetch('data/search-index.json');
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
    processTerm: (term) => {
      // Normalize umlauts so "Mueller" finds "Müller"
      term = term.toLowerCase();
      term = normalizeUmlauts(term);
      return term || null;
    },
  });

  miniSearch.addAll(allPersons);
  return allPersons.length;
}

// Perform search with text query and facet filters
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
  const stats = {
    total: allPersons.length,
    types: {},
    factions: {},
    periods: {},
    decades: {},
    sex: {},
  };

  for (const p of allPersons) {
    // Types
    const t = p.type || 'Sonstige';
    stats.types[t] = (stats.types[t] || 0) + 1;

    // Factions (only for MdB)
    if (p.type === 'MdB' && p.factions) {
      for (const f of p.factions) {
        stats.factions[f] = (stats.factions[f] || 0) + 1;
      }
    }

    // Periods
    if (p.periods) {
      for (const wp of p.periods) {
        stats.periods[wp] = (stats.periods[wp] || 0) + 1;
      }
    }

    // Decades
    const dec = birthDecade(p.birth_year);
    if (dec) {
      stats.decades[dec] = (stats.decades[dec] || 0) + 1;
    }

    // Sex
    if (p.sex) {
      stats.sex[p.sex] = (stats.sex[p.sex] || 0) + 1;
    }
  }

  return stats;
}

// Load a single person's detail JSON
async function loadPersonDetail(id) {
  const resp = await fetch(`data/person/${encodeURIComponent(id)}.json`);
  if (!resp.ok) throw new Error(`Person not found: ${id}`);
  return resp.json();
}
