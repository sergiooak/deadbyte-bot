import { describe, expect, it } from 'vitest'
import {
  mergeGroupConfig,
  parseGroupConfigBlock,
  parseGroupConfigFromDescription,
  serializeGroupConfig,
  upsertGroupConfigBlock
} from '../src/groups/group-config.parser.js'

describe('group config parser', () => {
  it('parses booleans, disabled booleans and string values', () => {
    expect(parseGroupConfigBlock('#db welcome goodbye autoSticker autor=Sergio pacote=DeadByte')).toEqual({
      welcome: true,
      goodbye: true,
      sticker: true,
      autor: 'Sergio',
      pacote: 'DeadByte'
    })
  })

  it('accepts empty string values with key equals', () => {
    expect(parseGroupConfigBlock('#db autoSticker -welcome autor= pacote=')).toEqual({
      welcome: false,
      goodbye: false,
      sticker: true,
      autor: '',
      pacote: ''
    })
  })

  it('uses safe defaults when there is no db block', () => {
    expect(parseGroupConfigFromDescription('Grupo sem configuracao')).toEqual({
      welcome: false,
      goodbye: false,
      sticker: false,
      autor: undefined,
      pacote: undefined
    })
  })

  it('merges partial config over defaults', () => {
    expect(mergeGroupConfig({ welcome: true, autor: '' })).toEqual({
      welcome: true,
      goodbye: false,
      sticker: false,
      autor: '',
      pacote: undefined
    })
  })

  it('replaces the db block and keeps it as the last line', () => {
    const next = upsertGroupConfigBlock('Descricao\n#db welcome autor=Antigo\nRegras', mergeGroupConfig({ sticker: true, pacote: 'DeadByte' }))

    expect(next).toBe('Descricao\nRegras\n#db -welcome -goodbye sticker pacote=DeadByte')
  })

  it('serializes disabled booleans explicitly', () => {
    expect(serializeGroupConfig(mergeGroupConfig({ welcome: true, autor: '' }))).toBe('#db welcome -goodbye -sticker autor=')
  })
})
