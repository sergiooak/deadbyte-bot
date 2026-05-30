import { describe, expect, it } from 'vitest'
import { parseCommand } from '../src/context/parse-command.js'

describe('parseCommand', () => {
  it('parses explicit commands and normalizes accents', () => {
    expect(parseCommand('!Figurínha agora', ['!'], ['#']).normalizedName).toBe('figurinha')
  })
})
