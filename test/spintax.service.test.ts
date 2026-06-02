import { describe, expect, it } from 'vitest'
import { SpintaxService } from '../src/services/text/spintax.service.js'

describe('SpintaxService', () => {
  it('renders nested choices from the parsed tree', () => {
    const choices = [0, 0, 0]
    const spintax = new SpintaxService({ random: () => choices.shift() ?? 0 })

    expect(spintax.render('{{Oi|Ola} {mundo|pessoal}|Tchau}')).toBe('Oi mundo')
  })

  it('supports empty alternatives and escaped delimiters', () => {
    const spintax = new SpintaxService({ random: () => 0.99 })

    expect(spintax.render('Oi{!|} \\{fixo\\|literal\\}')).toBe('Oi {fixo|literal}')
  })

  it('keeps malformed blocks readable', () => {
    const spintax = new SpintaxService()

    expect(spintax.render('texto {sem fechar')).toBe('texto {sem fechar')
  })
})
