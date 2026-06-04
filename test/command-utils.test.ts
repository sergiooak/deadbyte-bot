import type { CommandContext } from '@deadbyte/runtime'
import { describe, expect, it } from 'vitest'
import {
  getAliasSuffix,
  getCommandAliases,
  matchesCommandAlias,
  matchesCommandAliasWithSuffix,
  matchesExplicitAlias,
} from '../src/utils/commands.js'

function createContext(normalizedName: string, explicit = true): Pick<CommandContext, 'config' | 'parsedCommand'> {
  return {
    config: ({
      commands: {
        'system.ping': { aliases: ['pingar'] },
        'utility.ddd': { aliases: ['ddd'] },
      },
    } as unknown) as CommandContext['config'],
    parsedCommand: {
      explicit,
      rawName: normalizedName,
      normalizedName,
      argsText: '',
      source: explicit ? 'message' : 'implicit',
    },
  }
}

describe('command alias utilities', () => {
  it('reads configured aliases before command defaults', () => {
    expect(getCommandAliases(createContext('pingar').config, 'system.ping', ['ping'])).toEqual(['pingar'])
    expect(getCommandAliases(createContext('pingar').config, 'system.status', ['status'])).toEqual(['status'])
  })

  it('matches aliases through normalized command names', () => {
    expect(matchesCommandAlias(createContext('pingar'), 'system.ping', ['ping'])).toBe(true)
    expect(matchesCommandAlias(createContext('ping'), 'system.ping', ['ping'])).toBe(false)
  })

  it('can require explicit aliases for implicit-capable commands', () => {
    expect(matchesExplicitAlias(createContext('pingar'), 'system.ping', ['ping'])).toBe(true)
    expect(matchesExplicitAlias(createContext('pingar', false), 'system.ping', ['ping'])).toBe(false)
  })

  it('matches aliases with validated suffixes', () => {
    const ctx = createContext('ddd34')
    expect(getAliasSuffix('ddd34', ['ddd'], /^\d+$/)).toBe('34')
    expect(matchesCommandAliasWithSuffix(ctx, 'utility.ddd', ['ddd'], /^\d+$/)).toBe(true)
    expect(matchesCommandAliasWithSuffix(createContext('dddmg'), 'utility.ddd', ['ddd'], /^\d+$/)).toBe(false)
  })
})
