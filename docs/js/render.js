/**
 * ParlaBio – Results View Rendering & Shared Render Helpers
 * Depends on: config.js (CONFIG), utils.js (escapeHtml, typeLabel, sexLabel,
 *             formatLifespan, factionTextColor, FACTION_COLORS)
 * Exposes: renderResultsView(), renderFacetGroup()
 */

function renderResultsView(results, query, filters, unfilteredFacets, page, pageSize, sort) {
  // Apply sort before slicing
  if (sort === 'birth') {
    results = [...results].sort((a, b) => (a.birth_year || 9999) - (b.birth_year || 9999));
  } else if (sort === 'name' || !query) {
    results = [...results].sort((a, b) => (a.surname || '').localeCompare(b.surname || '', 'de'));
  }
  // else: 'relevance' → keep MiniSearch score order (default)

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

  // Sort dropdown
  const sortOptions = query
    ? `<option value="relevance">Relevanz</option>
       <option value="name"${sort === 'name' ? ' selected' : ''}>Name A\u2013Z</option>
       <option value="birth"${sort === 'birth' ? ' selected' : ''}>Geburtsjahr</option>`
    : `<option value="name">Name A\u2013Z</option>
       <option value="birth"${sort === 'birth' ? ' selected' : ''}>Geburtsjahr</option>`;

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
        <div class="results-header">
          <span class="results-count">${totalResults.toLocaleString('de-DE')} Ergebnis${totalResults !== 1 ? 'se' : ''}</span>
          <select id="sort-select" class="sort-select">${sortOptions}</select>
        </div>
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

/**
 * Render a collapsible facet filter group for the sidebar.
 * @param {string} title - Display title (e.g. 'Fraktion')
 * @param {string} key - Filter key for URL params (e.g. 'faction')
 * @param {Object} facetValues - {value: count} map
 * @param {string} activeValue - Currently selected value (or falsy)
 * @param {Function} [formatFn] - Label formatter; defaults to identity
 * @param {boolean} [sortNumeric] - Sort by numeric key instead of count
 */
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

function renderPagination(currentPage, totalPages) {
  let pages = '';
  const range = CONFIG.PAGINATION_RANGE;

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
