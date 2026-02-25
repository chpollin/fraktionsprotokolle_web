/**
 * ParlaBio – Detail View Rendering
 * Depends on: utils.js (escapeHtml, formatDate, genderLabel, factionTextColor, FACTION_COLORS)
 * Exposes: renderDetailView()
 */

function renderDetailView(person) {
  const p = person;
  const id = p['@id'] || '';
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
  else if (personType === 'Mitarbeiter-KGParl') subtitleParts.push('KGParl-Mitarbeiter');
  else if (personType === 'Other') subtitleParts.push('Sonstige Person');
  const lifeParts = [];
  if (birth && birth.date) lifeParts.push(formatDate(birth.date));
  if (death && death.date) lifeParts.push(formatDate(death.date));
  if (lifeParts.length) subtitleParts.push(lifeParts.join(' \u2013 '));

  // Alt names
  const altNames = p['fraktionsprotokolle:alt_names'] || [];

  // --- Profile card (Shneiderman: "Overview first") ---
  const factions = [...new Set(affiliations.map(a => a.faction))];
  const periods = [...new Set(affiliations.map(a => a.period))].sort((a, b) => a - b);

  let profileRows = '';
  const addProfileRow = (label, value) => {
    if (value) profileRows += `<tr><th>${escapeHtml(label)}</th><td>${value}</td></tr>`;
  };
  addProfileRow('Geburt', birth && birth.date
    ? escapeHtml([formatDate(birth.date), birth.place].filter(Boolean).join(', '))
    : '');
  addProfileRow('Tod', death && death.date
    ? escapeHtml([formatDate(death.date), death.place].filter(Boolean).join(', '))
    : '');
  addProfileRow('Beruf', escapeHtml(occupation));
  if (factions.length) {
    addProfileRow('Fraktionen', factions.map(f => {
      const bg = FACTION_COLORS[f] || '#666';
      const fg = factionTextColor(f);
      return `<span class="faction-badge" style="background:${bg};color:${fg}">${escapeHtml(f)}</span>`;
    }).join(' '));
  }
  if (periods.length) {
    addProfileRow('Wahlperioden', periods.map(wp => `WP\u00a0${wp}`).join(', '));
  }

  // --- Career timeline (Tufte: temporal data on a timeline) ---
  let timelineSection = '';
  if (affiliations.length > 0) {
    const allYears = affiliations.flatMap(a => [
      a.from ? parseInt(a.from.substring(0, 4), 10) : null,
      a.to ? parseInt(a.to.substring(0, 4), 10) : null,
    ]).filter(Boolean);
    const minYear = Math.min(...allYears);
    const maxYear = Math.max(...allYears);
    const totalSpan = maxYear - minYear || 1;

    let timelineRows = '';
    for (const aff of affiliations) {
      const fromYear = aff.from ? parseInt(aff.from.substring(0, 4), 10) : minYear;
      const toYear = aff.to ? parseInt(aff.to.substring(0, 4), 10) : maxYear;
      const left = ((fromYear - minYear) / totalSpan) * 100;
      const width = Math.max(((toYear - fromYear) / totalSpan) * 100, 2);
      const bg = FACTION_COLORS[aff.faction] || '#666';
      const fg = factionTextColor(aff.faction);

      timelineRows += `
        <div class="timeline-row">
          <span class="timeline-label">WP\u00a0${aff.period || '\u2014'}</span>
          <div class="timeline-track">
            <div class="timeline-bar" style="left:${left.toFixed(1)}%;width:${width.toFixed(1)}%;background:${bg};color:${fg}"
                 title="${escapeHtml(aff.faction)} (${aff.from || '?'} \u2013 ${aff.to || '?'})">
            </div>
          </div>
          <span class="timeline-dates">${aff.from ? aff.from.substring(0, 4) : '?'}\u2013${aff.to ? aff.to.substring(0, 4) : '?'}</span>
        </div>`;
    }

    const yearAxis = `<div class="timeline-axis">
      <span>${minYear}</span><span>${maxYear}</span>
    </div>`;

    timelineSection = `
      <section>
        <h3>Politische Karriere</h3>
        <div class="career-timeline">
          ${timelineRows}
          ${yearAxis}
        </div>
      </section>`;
  }

  // --- Stammdaten table (collapsed – details already in profile card) ---
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
  if (altNames.length) addRow('Weitere Namen', altNames.map(n => typeof n === 'string' ? n : (n.reg || [n.forename, n.surname].filter(Boolean).join(' '))).join('; '));

  // Structured occupation (KGParl)
  const occupationKgparl = p['fraktionsprotokolle:occupation_kgparl'];
  if (occupationKgparl) {
    const occList = Array.isArray(occupationKgparl) ? occupationKgparl : [occupationKgparl];
    const occTexts = occList.map(o => {
      const parts = [];
      if (o.role) parts.push(o.role);
      if (o.organisation) parts.push(o.organisation);
      if (o.from || o.to) parts.push(`(${o.from || '?'}\u2013${o.to || '?'})`);
      return parts.join(' ');
    }).join('; ');
    addRow('Berufliche Laufbahn', occTexts);
  }

  const stammdatenSection = stammdaten
    ? `<details class="stammdaten-details">
         <summary>Alle Stammdaten anzeigen</summary>
         <table class="stammdaten-table">${stammdaten}</table>
       </details>`
    : '';

  // --- Political vita (full table with exact dates) ---
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

  // --- Executive roles ---
  let exekutiveSection = '';
  const exekutive = p['fraktionsprotokolle:exekutive'];
  if (exekutive) {
    const content = Array.isArray(exekutive)
      ? `<ul>${exekutive.map(e => `<li>${escapeHtml(e)}</li>`).join('')}</ul>`
      : `<p>${escapeHtml(exekutive)}</p>`;
    exekutiveSection = `
      <section>
        <h3>Exekutive Funktionen</h3>
        ${content}
      </section>`;
  }

  // --- Sonstiges ---
  let sonstigesSection = '';
  const sonstiges = p['fraktionsprotokolle:sonstiges'];
  if (sonstiges) {
    const content = Array.isArray(sonstiges)
      ? `<ul>${sonstiges.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul>`
      : `<p>${escapeHtml(sonstiges)}</p>`;
    sonstigesSection = `
      <section>
        <h3>Sonstiges</h3>
        ${content}
      </section>`;
  }

  // --- External references ---
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
    refs.push(`<li>MdB-Stammdaten-ID: ${escapeHtml(ids.mdb_stammdaten)}</li>`);
  }
  if (ids.viaf) {
    const viafUrl = ids.viaf.startsWith('http') ? ids.viaf : `https://viaf.org/viaf/${ids.viaf}`;
    refs.push(`<li><a href="${escapeHtml(viafUrl)}" target="_blank" rel="noopener">VIAF</a></li>`);
  }
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

  // --- Citation (FAIR: Reusable) ---
  const today = new Date().toISOString().substring(0, 10);
  const citeName = p.name || id;
  const citeYear = birth && birth.date ? birth.date.substring(0, 4) : '';
  const citeLifespan = citeYear
    ? ` (${citeYear}\u2013${death && death.date ? death.date.substring(0, 4) : ''})`
    : '';

  const citePlain = `${citeName}${citeLifespan}, in: ParlaBio \u2013 Personendatenbank der Fraktionsprotokolle, hrsg. von der Kommission f\u00fcr Geschichte des Parlamentarismus und der politischen Parteien (KGParl), ${window.location.href}, abgerufen am ${today}.`;

  const citeBibtex = `@misc{parlabio_${(id || '').replace(/[^a-zA-Z0-9]/g, '_')},
  author = {KGParl},
  title = {${citeName}},
  year = {2026},
  url = {${window.location.href}},
  note = {ParlaBio -- Personendatenbank der Fraktionsprotokolle}
}`;

  const citationSection = `
    <section class="citation-section">
      <h3>Zitieren</h3>
      <div class="citation-box">
        <p class="citation-text">${escapeHtml(citePlain)}</p>
        <pre class="citation-bibtex" hidden>${escapeHtml(citeBibtex)}</pre>
        <div class="citation-actions">
          <button type="button" class="citation-copy" data-cite="plain">Kopieren</button>
          <button type="button" class="citation-copy" data-cite="bibtex">BibTeX kopieren</button>
        </div>
      </div>
    </section>`;

  // --- Assemble page ---
  return `
    <h1 class="sr-only">Personendetail</h1>
    <nav class="detail-nav">
      <a href="#" id="back-link">&larr; Zur\u00fcck</a>
    </nav>
    <article class="person-detail">
      <h2>${escapeHtml(p.name)}</h2>
      ${subtitleParts.length ? `<p class="person-subtitle">${escapeHtml(subtitleParts.join(' \u00b7 '))}</p>` : ''}
      <section class="profile-card">
        <table class="profile-table">${profileRows}</table>
      </section>
      ${timelineSection}
      ${stammdatenSection}
      ${vitaSection}
      ${exekutiveSection}
      ${sonstigesSection}
      ${refsSection}
      ${citationSection}
    </article>`;
}
