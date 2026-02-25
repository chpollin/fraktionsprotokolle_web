/**
 * ParlaBio – Overview Dashboard Rendering
 * Depends on: config.js (CONFIG), utils.js (escapeHtml, sexLabel)
 * Exposes: renderOverviewView()
 */

/**
 * Render horizontal bar rows for bar charts.
 * Unified function for faction bars, sex bars, etc.
 * @param {Array} entries - Array of [key, count] pairs
 * @param {number} max - Maximum count (for width calculation)
 * @param {string} filterKey - URL filter parameter name (e.g. 'faction', 'sex')
 * @param {Function} [labelFn] - Optional label formatter; defaults to identity
 */
function renderBarRows(entries, max, filterKey, labelFn) {
  return entries.map(([key, count]) => {
    const widthPct = Math.round((count / max) * 100);
    const label = labelFn ? labelFn(key) : key;
    const href = `#/search?${filterKey}=${encodeURIComponent(key)}`;
    return `<a class="bar-row" href="${href}">
      <span class="bar-label">${escapeHtml(label)}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${widthPct}%"></div></div>
      <span class="bar-value">${count.toLocaleString('de-DE')}</span>
    </a>`;
  }).join('');
}

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

function renderOverviewView(stats) {
  const total = stats.total;
  const typeMdB = stats.types['MdB'] || 0;
  const typeSonstige = stats.types['Sonstige'] || 0;
  const typeKGParl = stats.types['KGParl'] || 0;

  const pct = (n) => total > 0 ? (n / total * 100).toFixed(1).replace('.', ',') : '0';

  // Factions: sorted by count descending
  // Only MdB factions shown – 63% of persons have no faction affiliation
  const factionEntries = Object.entries(stats.factions).sort((a, b) => b[1] - a[1]);
  const factionMax = factionEntries.length > 0 ? factionEntries[0][1] : 1;
  const topFactions = factionEntries.slice(0, CONFIG.TOP_FACTIONS_COUNT);
  const moreFactions = factionEntries.slice(CONFIG.TOP_FACTIONS_COUNT);

  // Periods: sorted numerically
  const periodEntries = Object.entries(stats.periods)
    .map(([k, v]) => [parseInt(k, 10), v])
    .sort((a, b) => a[0] - b[0]);
  const periodMax = Math.max(...periodEntries.map(e => e[1]), 1);

  // Decades: sorted numerically
  const decadeEntries = Object.entries(stats.decades)
    .map(([k, v]) => [k, v])
    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
  const decadeMax = Math.max(...decadeEntries.map(e => e[1]), 1);

  // Sex
  const sexEntries = Object.entries(stats.sex).sort((a, b) => b[1] - a[1]);
  const sexMax = sexEntries.length > 0 ? sexEntries[0][1] : 1;

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
        ${renderBarRows(sexEntries, sexMax, 'sex', sexLabel)}
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
