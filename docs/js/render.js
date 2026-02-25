/**
 * ParlaBio – HTML Rendering (3 Views)
 * Pure functions: data in → HTML string out
 */

function renderOverviewView(stats) {
  const total = stats.total;
  const typeMdB = stats.types['MdB'] || 0;
  const typeSonstige = stats.types['Sonstige'] || 0;
  const typeKGParl = stats.types['KGParl'] || 0;

  const pct = (n) => total > 0 ? (n / total * 100).toFixed(1).replace('.', ',') : '0';

  // Factions: sorted by count descending
  const factionEntries = Object.entries(stats.factions).sort((a, b) => b[1] - a[1]);
  const factionMax = factionEntries.length > 0 ? factionEntries[0][1] : 1;
  const topFactions = factionEntries.slice(0, 8);
  const moreFactions = factionEntries.slice(8);

  function renderBarRows(entries, max, filterKey) {
    return entries.map(([label, count]) => {
      const widthPct = Math.round((count / max) * 100);
      const href = `#/search?${filterKey}=${encodeURIComponent(label)}`;
      return `<a class="bar-row" href="${href}">
        <span class="bar-label">${escapeHtml(label)}</span>
        <div class="bar-track"><div class="bar-fill" style="width:${widthPct}%"></div></div>
        <span class="bar-value">${count.toLocaleString('de-DE')}</span>
      </a>`;
    }).join('');
  }

  // Periods: sorted numerically
  const periodEntries = Object.entries(stats.periods)
    .map(([k, v]) => [parseInt(k, 10), v])
    .sort((a, b) => a[0] - b[0]);
  const periodMax = Math.max(...periodEntries.map(e => e[1]), 1);

  function renderMinibars(entries, max, filterKey, labelFn) {
    return entries.map(([key, count]) => {
      const heightPct = Math.max(Math.round((count / max) * 100), 3);
      const label = labelFn ? labelFn(key) : String(key);
      const href = `#/search?${filterKey}=${encodeURIComponent(key)}`;
      return `<a class="minibar" href="${href}" style="height:${heightPct}%" title="${label}: ${count.toLocaleString('de-DE')}">
        <span class="minibar-label">${escapeHtml(label)}</span>
      </a>`;
    }).join('');
  }

  // Decades: sorted numerically, filtered to main range
  const decadeEntries = Object.entries(stats.decades)
    .map(([k, v]) => [k, v])
    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
  const decadeMax = Math.max(...decadeEntries.map(e => e[1]), 1);

  // Sex
  const sexEntries = Object.entries(stats.sex).sort((a, b) => b[1] - a[1]);
  const sexMax = sexEntries.length > 0 ? sexEntries[0][1] : 1;

  function renderSexBars(entries, max) {
    return entries.map(([code, count]) => {
      const widthPct = Math.round((count / max) * 100);
      const label = sexLabel(code);
      const href = `#/search?sex=${encodeURIComponent(code)}`;
      return `<a class="bar-row" href="${href}">
        <span class="bar-label">${escapeHtml(label)}</span>
        <div class="bar-track"><div class="bar-fill" style="width:${widthPct}%"></div></div>
        <span class="bar-value">${count.toLocaleString('de-DE')}</span>
      </a>`;
    }).join('');
  }

  const moreFactionRows = moreFactions.length > 0
    ? `<div class="bar-chart-more" id="more-factions">${renderBarRows(moreFactions, factionMax, 'faction')}</div>
       <button class="bar-toggle" id="toggle-factions" type="button">\u25b8 ${moreFactions.length} weitere anzeigen</button>`
    : '';

  return `
    <section class="overview-hero">
      <h1>ParlaBio</h1>
      <p class="subtitle">Personendatenbank der Fraktionsprotokolle</p>
      <p class="stats">${total.toLocaleString('de-DE')} Personen &middot; 1949\u20132005</p>
    </section>

    <section class="overview-section">
      <h2>Personentypen</h2>
      <div class="stat-cards">
        <a class="stat-card" href="#/search?type=MdB">
          <div class="stat-number">${typeMdB.toLocaleString('de-DE')}</div>
          <div class="stat-label">MdB</div>
          <div class="stat-percent">${pct(typeMdB)} %</div>
        </a>
        <a class="stat-card" href="#/search?type=Sonstige">
          <div class="stat-number">${typeSonstige.toLocaleString('de-DE')}</div>
          <div class="stat-label">Sonstige</div>
          <div class="stat-percent">${pct(typeSonstige)} %</div>
        </a>
        <a class="stat-card" href="#/search?type=KGParl">
          <div class="stat-number">${typeKGParl.toLocaleString('de-DE')}</div>
          <div class="stat-label">KGParl-MA</div>
          <div class="stat-percent">${pct(typeKGParl)} %</div>
        </a>
      </div>
    </section>

    <section class="overview-section">
      <h2>Fraktionen (nur MdB)</h2>
      <div class="bar-chart">
        ${renderBarRows(topFactions, factionMax, 'faction')}
        ${moreFactionRows}
      </div>
    </section>

    <div class="minibar-row">
      <div class="overview-section">
        <h2>Wahlperioden</h2>
        <div class="minibar-group-container">
          <div class="minibar-group">
            ${renderMinibars(periodEntries, periodMax, 'period', (k) => String(k))}
          </div>
        </div>
      </div>
      <div class="overview-section">
        <h2>Geburtsjahrzehnte</h2>
        <div class="minibar-group-container">
          <div class="minibar-group">
            ${renderMinibars(decadeEntries, decadeMax, 'decade', (k) => k)}
          </div>
        </div>
      </div>
    </div>

    <section class="overview-section">
      <h2>Geschlecht</h2>
      <div class="bar-chart">
        ${renderSexBars(sexEntries, sexMax)}
      </div>
    </section>

    <details class="overview-about">
      <summary>\u25b8 \u00dcber ParlaBio</summary>
      <p>ParlaBio erschlie\u00dft das Personenregister der Edition
      <a href="https://fraktionsprotokolle.de" target="_blank" rel="noopener">fraktionsprotokolle.de</a>.
      Die Datenbank umfasst alle Personen, die in den Fraktionsprotokollen des Deutschen Bundestages
      (1949\u20132005) erw\u00e4hnt werden: Abgeordnete, Minister, Journalisten, ausl\u00e4ndische Staatsg\u00e4ste
      und viele mehr.</p>
      <p>Herausgegeben von der
      <a href="https://kgparl.de" target="_blank" rel="noopener">Kommission f\u00fcr Geschichte des
      Parlamentarismus und der politischen Parteien</a> (KGParl).</p>
    </details>`;
}

function renderResultsView(results, query, filters, facets, page, pageSize) {
  const totalResults = results.length;
  const totalPages = Math.ceil(totalResults / pageSize);
  const start = (page - 1) * pageSize;
  const pageResults = results.slice(start, start + pageSize);

  // Active filter badges
  let badges = '';
  if (filters.type) badges += renderBadge('type', typeLabel(filters.type));
  if (filters.faction) badges += renderBadge('faction', filters.faction);
  if (filters.period) badges += renderBadge('period', `WP ${filters.period}`);
  if (filters.sex) badges += renderBadge('sex', sexLabel(filters.sex));
  if (filters.decade) badges += renderBadge('decade', filters.decade);

  // Compute facets without the currently active filter for each category
  // (so counts reflect what you'd get after removing just that filter)
  const unfilteredFacets = computeUnfilteredFacets(query, filters);

  return `
    ${badges ? `<div class="active-filters">Aktive Filter: ${badges}</div>` : ''}
    <div class="results-layout">
      <aside class="filter-sidebar">
        <h3>Filter</h3>
        ${renderFacetGroup('Typ', 'type', unfilteredFacets.type, filters.type, formatTypeFacet)}
        ${renderFacetGroup('Fraktion', 'faction', unfilteredFacets.faction, filters.faction)}
        ${renderFacetGroup('Wahlperiode', 'period', unfilteredFacets.period, filters.period, formatPeriodFacet, true)}
        ${renderFacetGroup('Geschlecht', 'sex', unfilteredFacets.sex, filters.sex, formatSexFacet)}
        ${renderFacetGroup('Geburtsjahrzehnt', 'decade', unfilteredFacets.decade, filters.decade, null, true)}
      </aside>
      <div class="results-main">
        <p class="results-count">${totalResults.toLocaleString('de-DE')} Ergebnis${totalResults !== 1 ? 'se' : ''}</p>
        ${pageResults.length ? renderResultsTable(pageResults) : '<p>Keine Ergebnisse gefunden.</p>'}
        ${totalPages > 1 ? renderPagination(page, totalPages) : ''}
      </div>
    </div>`;
}

function renderBadge(filterKey, label) {
  return `<span class="filter-badge" data-filter="${filterKey}">${escapeHtml(label)} <button type="button" aria-label="${escapeHtml(label)} entfernen">&times;</button></span>`;
}

function renderResultsTable(results) {
  let rows = '';
  for (const p of results) {
    const factionBadges = (p.factions || []).map(f => {
      const bg = FACTION_COLORS[f] || '#666';
      const fg = factionTextColor(f);
      return `<span class="faction-badge" style="background:${bg};color:${fg}">${escapeHtml(f)}</span>`;
    }).join(' ');

    rows += `<tr>
      <td><a href="#/person/${encodeURIComponent(p.id)}">${escapeHtml(p.name)}</a></td>
      <td>${formatLifespan(p.birth_year, p.death_year)}</td>
      <td>${factionBadges || '\u2014'}</td>
    </tr>`;
  }

  return `<table class="results-table" role="grid">
    <thead><tr><th>Name</th><th>Leben</th><th>Fraktion</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function renderFacetGroup(title, key, facetValues, activeValue, formatFn, sortNumeric) {
  if (!facetValues || Object.keys(facetValues).length === 0) return '';

  let entries = Object.entries(facetValues);

  if (sortNumeric) {
    entries.sort((a, b) => {
      const na = parseInt(a[0], 10);
      const nb = parseInt(b[0], 10);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return a[0].localeCompare(b[0], 'de');
    });
  } else {
    entries.sort((a, b) => b[1] - a[1]); // Sort by count descending
  }

  const items = entries.map(([value, count]) => {
    const label = formatFn ? formatFn(value) : value;
    const isActive = activeValue === String(value);
    return `<li>
      <a href="#" class="facet-link${isActive ? ' active' : ''}" data-facet="${key}" data-value="${escapeHtml(String(value))}">
        ${escapeHtml(label)} <small>(${count.toLocaleString('de-DE')})</small>
      </a>
    </li>`;
  }).join('');

  const open = activeValue ? ' open' : '';
  return `<details${open}>
    <summary>${escapeHtml(title)}</summary>
    <ul class="facet-list">${items}</ul>
  </details>`;
}

function formatTypeFacet(value) {
  return typeLabel(value);
}

function formatPeriodFacet(value) {
  return `WP ${value}`;
}

function formatSexFacet(value) {
  return sexLabel(value);
}

// Compute facets from unfiltered-per-category results
// For each filter category, we compute facets without that specific filter applied
function computeUnfilteredFacets(query, filters) {
  // For efficiency: compute once with all filters removed per category
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

function renderPagination(currentPage, totalPages) {
  let pages = '';
  const range = 2;

  // Always show first page
  if (currentPage > range + 1) {
    pages += `<a href="#" class="page-link" data-page="1">1</a>`;
    if (currentPage > range + 2) pages += `<span class="page-ellipsis">\u2026</span>`;
  }

  for (let i = Math.max(1, currentPage - range); i <= Math.min(totalPages, currentPage + range); i++) {
    if (i === currentPage) {
      pages += `<strong class="page-current">${i}</strong>`;
    } else {
      pages += `<a href="#" class="page-link" data-page="${i}">${i}</a>`;
    }
  }

  // Always show last page
  if (currentPage < totalPages - range) {
    if (currentPage < totalPages - range - 1) pages += `<span class="page-ellipsis">\u2026</span>`;
    pages += `<a href="#" class="page-link" data-page="${totalPages}">${totalPages}</a>`;
  }

  return `<nav class="pagination" aria-label="Seitennavigation">
    ${currentPage > 1 ? `<a href="#" class="page-link" data-page="${currentPage - 1}">&laquo;</a>` : ''}
    ${pages}
    ${currentPage < totalPages ? `<a href="#" class="page-link" data-page="${currentPage + 1}">&raquo;</a>` : ''}
  </nav>`;
}

function renderDetailView(person) {
  const p = person;
  const personType = p['fraktionsprotokolle:personType'];
  const nameData = p['fraktionsprotokolle:name'];
  const birth = p['fraktionsprotokolle:birth'];
  const death = p['fraktionsprotokolle:death'];
  const affiliations = p['fraktionsprotokolle:affiliations'] || [];
  const ids = p['fraktionsprotokolle:ids'] || {};
  const occupation = p.hasOccupation ? p.hasOccupation.name : '';

  // Subtitle
  const subtitleParts = [];
  if (personType === 'MdB') subtitleParts.push('MdB');
  if (personType === 'KGParl') subtitleParts.push('KGParl-Mitarbeiter');
  const lifeParts = [];
  if (birth && birth.date) lifeParts.push(formatDate(birth.date));
  if (death && death.date) lifeParts.push(formatDate(death.date));
  if (lifeParts.length) subtitleParts.push(lifeParts.join(' \u2013 '));

  // Alt names
  const altNames = p['fraktionsprotokolle:alt_names'] || [];

  // Stammdaten table
  let stammdaten = '';
  const addRow = (label, value) => {
    if (value) stammdaten += `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`;
  };
  addRow('Geburtsdatum', birth ? formatDate(birth.date) : '');
  addRow('Geburtsort', birth ? [birth.place, birth.country].filter(Boolean).join(', ') : '');
  addRow('Sterbedatum', death ? formatDate(death.date) : '');
  addRow('Sterbeort', death ? [death.place, death.country].filter(Boolean).join(', ') : '');
  addRow('Geschlecht', genderLabel(p.gender));
  addRow('Beruf', occupation);
  if (nameData && nameData.prefix) addRow('Namenspräfix', nameData.prefix);
  if (nameData && nameData.role_name) addRow('Funktionsbezeichnung', nameData.role_name);
  if (altNames.length) addRow('Weitere Namen', altNames.join('; '));

  // Structured occupation (KGParl)
  const occupationKgparl = p['fraktionsprotokolle:occupation_kgparl'];
  if (occupationKgparl && occupationKgparl.length) {
    const occTexts = occupationKgparl.map(o => {
      const parts = [];
      if (o.occupation) parts.push(o.occupation);
      if (o.from || o.to) parts.push(`(${o.from || '?'}\u2013${o.to || '?'})`);
      return parts.join(' ');
    }).join('; ');
    addRow('Berufliche Laufbahn', occTexts);
  }

  // Political vita (affiliations table)
  let vitaSection = '';
  if (affiliations.length > 0) {
    let vitaRows = '';
    for (const aff of affiliations) {
      const bg = FACTION_COLORS[aff.faction] || '#666';
      const fg = factionTextColor(aff.faction);
      vitaRows += `<tr>
        <td>${aff.period || '\u2014'}</td>
        <td><span class="faction-badge" style="background:${bg};color:${fg}">${escapeHtml(aff.faction)}</span></td>
        <td>${formatDate(aff.from) || '\u2014'} \u2013 ${formatDate(aff.to) || '\u2014'}</td>
      </tr>`;
    }
    vitaSection = `
      <section>
        <h3>Politische Vita</h3>
        <table>
          <thead><tr><th>WP</th><th>Fraktion</th><th>Zeitraum</th></tr></thead>
          <tbody>${vitaRows}</tbody>
        </table>
      </section>`;
  }

  // Executive roles
  let exekutiveSection = '';
  const exekutive = p['fraktionsprotokolle:exekutive'];
  if (exekutive && exekutive.length) {
    const items = exekutive.map(e => `<li>${escapeHtml(e)}</li>`).join('');
    exekutiveSection = `
      <section>
        <h3>Exekutive Funktionen</h3>
        <ul>${items}</ul>
      </section>`;
  }

  // External references
  let refsSection = '';
  const refs = [];
  if (ids.gnd) {
    const gndUrl = ids.gnd.startsWith('http') ? ids.gnd : `https://d-nb.info/gnd/${ids.gnd}`;
    refs.push(`<li><a href="${escapeHtml(gndUrl)}" target="_blank" rel="noopener">GND (Deutsche Nationalbibliothek)</a></li>`);
  }
  if (ids.wikipedia) {
    refs.push(`<li><a href="${escapeHtml(ids.wikipedia)}" target="_blank" rel="noopener">Wikipedia</a></li>`);
  }
  if (ids.mdb_stammdaten) {
    refs.push(`<li><a href="https://www.bundestag.de/abgeordnete/biografien/${escapeHtml(ids.mdb_stammdaten)}" target="_blank" rel="noopener">MdB-Stammdaten (Bundestag)</a></li>`);
  }
  if (ids.viaf) {
    const viafUrl = ids.viaf.startsWith('http') ? ids.viaf : `https://viaf.org/viaf/${ids.viaf}`;
    refs.push(`<li><a href="${escapeHtml(viafUrl)}" target="_blank" rel="noopener">VIAF</a></li>`);
  }
  // sameAs URLs not already covered
  if (p.sameAs) {
    for (const url of p.sameAs) {
      const covered = [ids.gnd, ids.wikipedia, ids.viaf].some(v => v && url.includes(v));
      if (!covered) {
        refs.push(`<li><a href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(url)}</a></li>`);
      }
    }
  }

  if (refs.length) {
    refsSection = `
      <section>
        <h3>Externe Referenzen</h3>
        <ul>${refs.join('')}</ul>
      </section>`;
  }

  // Sonstiges
  let sonstigesSection = '';
  const sonstiges = p['fraktionsprotokolle:sonstiges'];
  if (sonstiges && sonstiges.length) {
    const items = sonstiges.map(s => `<li>${escapeHtml(s)}</li>`).join('');
    sonstigesSection = `
      <section>
        <h3>Sonstiges</h3>
        <ul>${items}</ul>
      </section>`;
  }

  return `
    <nav class="detail-nav">
      <a href="#" id="back-link">&larr; Zurück</a>
    </nav>
    <article class="person-detail">
      <h2>${escapeHtml(p.name)}</h2>
      ${subtitleParts.length ? `<p class="person-subtitle">${escapeHtml(subtitleParts.join(' \u00b7 '))}</p>` : ''}
      <section>
        <h3>Stammdaten</h3>
        <table class="stammdaten-table">${stammdaten}</table>
      </section>
      ${vitaSection}
      ${exekutiveSection}
      ${sonstigesSection}
      ${refsSection}
    </article>`;
}
