import { describe, expect, it } from 'vitest'
import { sortCitiesByRelevance } from '../src/commands/utility/ddd-data.helper.js'
import { flagEmoji, lookupDdi } from '../src/commands/utility/ddi-data.helper.js'

describe('phone code data helpers', () => {
  it('sorts DDD cities by population rank within the provided state', () => {
    expect(sortCitiesByRelevance(['Araguari', 'Uberlandia'], 'MG')).toEqual(['Uberlandia', 'Araguari'])
    expect(sortCitiesByRelevance(['Rio de Janeiro', 'Sao Paulo'])).toEqual(['Sao Paulo', 'Rio de Janeiro'])
  })

  it('keeps unknown DDD cities sorted by city name after ranked cities', () => {
    expect(sortCitiesByRelevance(['Zeta', 'Uberlandia', 'Alpha'], 'MG')).toEqual(['Uberlandia', 'Alpha', 'Zeta'])
  })

  it('looks up shared and single-country DDI codes', () => {
    expect(lookupDdi(1)?.map((country) => country.iso)).toEqual(expect.arrayContaining(['US', 'CA']))
    expect(lookupDdi(7)?.map((country) => country.iso)).toEqual(expect.arrayContaining(['RU', 'KZ']))
    expect(lookupDdi(351)).toEqual([{ name: 'Portugal', iso: 'PT' }])
  })

  it('generates flag emoji from ISO country codes', () => {
    expect(flagEmoji('br')).toBe('🇧🇷')
  })
})
