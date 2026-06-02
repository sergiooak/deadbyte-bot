import { SUPERSCRIPT_DIGITS } from './constants'

export function toNumber(raw: string): number {
  return parseFloat(raw.replace(',', '.'))
}

export function fromSuperscript(value: string): number {
  return parseInt(value.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (digit) => SUPERSCRIPT_DIGITS[digit] ?? digit))
}

export function isSuperscriptDigit(value: string): boolean {
  return /[⁰¹²³⁴⁵⁶⁷⁸⁹]/.test(value)
}

export function readSuperscriptExponent(input: string, start: number): { value: number; nextIndex: number } | null {
  let index = start
  while (index < input.length && isSuperscriptDigit(input[index])) {
    index += 1
  }

  if (index === start) return null

  const value = fromSuperscript(input.slice(start, index))
  if (!Number.isFinite(value)) return null

  return { value, nextIndex: index }
}
