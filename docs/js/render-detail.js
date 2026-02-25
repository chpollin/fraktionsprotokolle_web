/**
 * ParlaBio – Detail View Rendering
 * Depends on: utils.js (escapeHtml, formatDate, genderLabel, factionTextColor, FACTION_COLORS)
 * Exposes: renderDetailView()
 */

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
