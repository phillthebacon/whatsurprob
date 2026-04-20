// Subdivision term by country ISO2 code.
// "What does this country call their top-level subdivision?"
// Fallback: "Region"
const SUBDIVISION_LABELS = {
  US: 'State', CA: 'Province', AU: 'State', MX: 'State', BR: 'State',
  IN: 'State', DE: 'State', MY: 'State', NG: 'State', VE: 'State',
  AT: 'State', SS: 'State',
  CN: 'Province', ZA: 'Province', AR: 'Province', IT: 'Region',
  FR: 'Region', PH: 'Region', CL: 'Region', NZ: 'Region', PE: 'Region',
  JP: 'Prefecture',
  GB: 'Country/Region', IE: 'County', KE: 'County',
  RU: 'Oblast', UA: 'Oblast', BY: 'Region',
  AE: 'Emirate',
  CH: 'Canton',
  ES: 'Autonomous Community',
  NL: 'Province', BE: 'Province', PL: 'Voivodeship',
  TH: 'Province', VN: 'Province', ID: 'Province',
  KR: 'Province', TR: 'Province',
  EG: 'Governorate', SA: 'Region',
  SE: 'County', NO: 'County', FI: 'Region', DK: 'Region',
  GR: 'Region', PT: 'District', RO: 'County',
  CZ: 'Region', HU: 'County', BG: 'Province',
}

export function getSubdivisionLabel(iso2) {
  if (!iso2) return 'Region'
  return SUBDIVISION_LABELS[iso2.toUpperCase()] || 'Region'
}

// ============================================================
// Wrapper around @countrystatecity/countries-browser
// Lazy-loads on demand so initial bundle stays small
// ============================================================
let _csc = null
async function csc() {
  if (_csc) return _csc
  _csc = await import('@countrystatecity/countries-browser')
  return _csc
}

export async function getCountries() {
  const m = await csc()
  return m.getCountries()
}

export async function getStates(iso2) {
  const m = await csc()
  return m.getStatesOfCountry(iso2)
}

export async function getCities(iso2, stateCode) {
  const m = await csc()
  return m.getCitiesOfState(iso2, stateCode)
}

// ============================================================
// Snap coords to a privacy-preserving precision
// country: centroid of country (from csc data)
// subdivision: centroid of state/province
// city: round to 1 decimal (~11km) — user chose to share city name
// ============================================================
export function snapCoords(lat, lng, granularity) {
  if (granularity === 'city') {
    return {
      lat: Math.round(lat * 10) / 10,
      lng: Math.round(lng * 10) / 10
    }
  }
  // country/subdivision: caller passes the centroid already
  return { lat, lng }
}
