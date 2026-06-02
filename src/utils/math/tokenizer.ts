import { normalizeArithmeticOperators } from './normalize'
import { isSuperscriptDigit, readSuperscriptExponent, toNumber } from './number'
import type { BinaryOperator, MathToken } from './types'

export function tokenizeArithmeticExpression(expr: string): MathToken[] | null {
  const tokens: MathToken[] = []
  const input = normalizeArithmeticOperators(expr)
  let index = 0
  let expectingValue = true

  while (index < input.length) {
    const char = input[index]

    if (/\s/.test(char)) {
      index += 1
      continue
    }

    if (char === '(') {
      tokens.push({ type: 'lparen' })
      expectingValue = true
      index += 1
      continue
    }

    if (char === ')') {
      if (expectingValue) return null
      tokens.push({ type: 'rparen' })
      expectingValue = false
      index += 1
      continue
    }

    if (char === '!') {
      if (expectingValue) return null
      tokens.push({ type: 'factorial' })
      expectingValue = false
      index += 1
      continue
    }

    if (!expectingValue && isSuperscriptDigit(char)) {
      const exponent = readSuperscriptExponent(input, index)
      if (!exponent) return null

      tokens.push({ type: 'operator', value: '^' })
      tokens.push({ type: 'number', value: exponent.value })
      index = exponent.nextIndex
      expectingValue = false
      continue
    }

    const isSignedNumber = expectingValue
      && (char === '+' || char === '-')
      && index + 1 < input.length
      && /[\d.,]/.test(input[index + 1])

    if (/[\d.,]/.test(char) || isSignedNumber) {
      const start = index
      if (isSignedNumber) index += 1

      let hasSeparator = false
      let hasDigit = false

      while (index < input.length) {
        const next = input[index]
        if (/\d/.test(next)) {
          hasDigit = true
          index += 1
          continue
        }

        if ((next === '.' || next === ',') && !hasSeparator) {
          hasSeparator = true
          index += 1
          continue
        }

        break
      }

      const raw = input.slice(start, index)
      if (!hasDigit || /^[-+]?[.,]$/.test(raw)) return null

      const value = toNumber(raw)
      if (!Number.isFinite(value)) return null

      tokens.push({ type: 'number', value })

      const exponent = readSuperscriptExponent(input, index)
      if (exponent) {
        tokens.push({ type: 'operator', value: '^' })
        tokens.push({ type: 'number', value: exponent.value })
        index = exponent.nextIndex
      }

      expectingValue = false
      continue
    }

    if (/^[+\-*/^]$/.test(char)) {
      if (expectingValue) return null
      tokens.push({ type: 'operator', value: char as BinaryOperator })
      expectingValue = true
      index += 1
      continue
    }

    return null
  }

  if (expectingValue) return null
  return tokens
}
