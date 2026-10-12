import { describe, expect, it } from 'vitest'
import { formatPairingCode, maskPhone, normalizePairingPhone } from '../src/whatsapp/pairing.js'

describe('pairing helpers', () => {
  it('normalizes phone numbers to digits with country code', () => {
    expect(normalizePairingPhone('+55 (34) 90000-0001')).toBe('5534900000001')
    expect(normalizePairingPhone('123')).toBeUndefined()
    expect(normalizePairingPhone('1'.repeat(16))).toBeUndefined()
  })

  it('masks the middle of the number keeping its length', () => {
    expect(maskPhone('5534900000001')).toBe('5534*******01')
    expect(maskPhone('5534900000001')).toHaveLength(13)
  })

  it('formats the 8 character pairing code', () => {
    expect(formatPairingCode('abcd1234')).toBe('ABCD-1234')
    expect(formatPairingCode('ABCD-1234')).toBe('ABCD-1234')
  })
})
