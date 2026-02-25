/**
 * ParlaBio – Utility Functions
 * Depends on: (none)
 * Exposes: FACTION_COLORS, factionTextColor(), formatDate(), formatLifespan(),
 *          parseHash(), buildSearchHash(), normalizeUmlauts(), escapeHtml(),
 *          birthDecade(), sexLabel(), genderLabel(), typeLabel()
 */

// Faction color mapping (derived from parlabio/build/factions.py)
const FACTION_COLORS = {
  'CDU/CSU': '#000000',
  'SPD': '#e3000f',
  'FDP': '#ffed00',
  'B90/Grüne': '#1aa037',
  'LINKE': '#be3075',
  'Grüne': '#1aa037',
  'Grüne/B90': '#1aa037',
  'AfD': '#009ee0',
  'KPD': '#8b0000',
  'PDS': '#e60e0e',
  'DP': '#003366',
  'DPB': '#003366',
  'DP/DPB': '#003366',
  'DP/FVP': '#003366',
  'DRP': '#5a3d1a',
  'DRP/NR': '#5a3d1a',
  'Zentrum': '#8b6914',
  'DG/BHE': '#6b8e23',
  'DA': '#708090',
  'BP': '#0080c8',
  'FVP': '#d4aa00',
  'FU': '#556b2f',
  'GB/BHE': '#6b8e23',
  'WAV': '#808080',
  'Fraktionslos': '#999999',
  // Guest status
  'CDU/CSU (Gast)': '#000000',
  'FDP (Gast)': '#ffed00',
  'SPD (Gast)': '#e3000f',
  'DP/DPB (Gast)': '#003366',
  'DRP (Gast)': '#5a3d1a',
  'WAV (Gast)': '#808080',
  // Groups
  'Grp. B90/Grüne': '#1aa037',
  'Grp. PDS': '#e60e0e',
  'Grp. PDS/LL': '#e60e0e',
  'Grp. DP': '#003366',
  'Grp. Kraft/Oberl.': '#708090',
};

// Determine text color (white or black) for readability on colored background
function factionTextColor(faction) {
  const color = FACTION_COLORS[faction] || '#666666';
  // Simple luminance check
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

// Format ISO date to German format
function formatDate(isoDate) {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length === 3) {
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  }
  if (parts.length === 2) {
    return `${parts[1]}.${parts[0]}`;
  }
  return isoDate;
}

// Format life dates for display
function formatLifespan(birthYear, deathYear) {
  if (birthYear && deathYear) return `${birthYear}\u2013${deathYear}`;
  if (birthYear) return `* ${birthYear}`;
  if (deathYear) return `\u2020 ${deathYear}`;
  return '';
}

// Parse hash parameters from URL
function parseHash() {
  const hash = window.location.hash || '#/';
  if (hash === '#/' || hash === '#') {
    return { view: 'start' };
  }
  if (hash.startsWith('#/person/')) {
    return { view: 'detail', id: decodeURIComponent(hash.substring(9)) };
  }
  if (hash.startsWith('#/search')) {
    const params = new URLSearchParams(hash.substring(hash.indexOf('?') + 1));
    return {
      view: 'search',
      q: params.get('q') || '',
      type: params.get('type') || '',
      faction: params.get('faction') || '',
      period: params.get('period') || '',
      sex: params.get('sex') || '',
      decade: params.get('decade') || '',
      page: parseInt(params.get('page') || '1', 10),
    };
  }
  return { view: 'start' };
}

// Build hash URL from state
function buildSearchHash(state) {
  const params = new URLSearchParams();
  if (state.q) params.set('q', state.q);
  if (state.type) params.set('type', state.type);
  if (state.faction) params.set('faction', state.faction);
  if (state.period) params.set('period', state.period);
  if (state.sex) params.set('sex', state.sex);
  if (state.decade) params.set('decade', state.decade);
  if (state.page && state.page > 1) params.set('page', state.page);
  const qs = params.toString();
  return '#/search' + (qs ? '?' + qs : '');
}

// Normalize umlauts for search (ä→ae, ö→oe, ü→ue, ß→ss)
function normalizeUmlauts(str) {
  return str
    .replace(/ä/g, 'ae').replace(/Ä/g, 'Ae')
    .replace(/ö/g, 'oe').replace(/Ö/g, 'Oe')
    .replace(/ü/g, 'ue').replace(/Ü/g, 'Ue')
    .replace(/ß/g, 'ss');
}

// HTML-escape user content
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Get birth decade from year (e.g. 1876 → "1870er")
function birthDecade(year) {
  if (!year) return null;
  const decade = Math.floor(year / 10) * 10;
  return `${decade}er`;
}

// Sex label mapping
function sexLabel(code) {
  if (code === 'm') return 'männlich';
  if (code === 'f') return 'weiblich';
  return code || '';
}

// Gender display for Schema.org URL
function genderLabel(url) {
  if (!url) return '';
  if (url.includes('Male')) return 'männlich';
  if (url.includes('Female')) return 'weiblich';
  return '';
}

// Type labels for display
function typeLabel(type) {
  if (type === 'MdB') return 'MdB';
  if (type === 'KGParl') return 'KGParl-Mitarbeiter';
  return 'Sonstige';
}
