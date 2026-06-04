import cityPopulationRank from '../../data/ddd-city-population-rank.json'

interface CityPopulationRank {
  city: string
  state: string
}

const CITY_POPULATION_RANK = cityPopulationRank satisfies CityPopulationRank[]

function normalizeRankKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
}

function cityStateKey(city: string, state: string): string {
  return `${normalizeRankKey(city)}:${state.toUpperCase()}`
}

const RANK_BY_CITY_STATE = new Map<string, number>()
const RANK_BY_CITY = new Map<string, number>()

for (const [idx, entry] of CITY_POPULATION_RANK.entries()) {
  RANK_BY_CITY_STATE.set(cityStateKey(entry.city, entry.state), idx)

  const cityKey = normalizeRankKey(entry.city)
  if (!RANK_BY_CITY.has(cityKey)) RANK_BY_CITY.set(cityKey, idx)
}

function rankFor(city: string, state?: string): number {
  if (state) {
    const stateRank = RANK_BY_CITY_STATE.get(cityStateKey(city, state))
    if (stateRank !== undefined) return stateRank
  }

  return RANK_BY_CITY.get(normalizeRankKey(city)) ?? Infinity
}

/**
 * Ordena uma lista de cidades colocando as mais populosas primeiro.
 * Quando a UF é informada, municípios homônimos usam o ranking do estado correto.
 */
export function sortCitiesByRelevance(cities: string[], state?: string): string[] {
  return [...cities].sort((a, b) => {
    const rankA = rankFor(a, state)
    const rankB = rankFor(b, state)

    if (rankA !== Infinity && rankB !== Infinity) return rankA - rankB
    if (rankA !== Infinity) return -1
    if (rankB !== Infinity) return 1
    return a.localeCompare(b, 'pt-BR')
  })
}
