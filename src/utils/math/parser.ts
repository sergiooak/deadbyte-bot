import { substitutePi } from './normalize'
import {
  parseBinaryExpression,
  parseFactorialExpression,
  parseFreeArithmeticExpression,
  parsePercentExpression,
  parsePowerExpression,
  parseRootExpression,
  parseValidationExpression,
} from './operations'
import type { MathResult } from './types'

export function parseMathExpression(expr: string): MathResult | null {
  const trimmed = substitutePi(expr.trim())

  return parseValidationExpression(trimmed)
    ?? parseFreeArithmeticExpression(trimmed)
    ?? parseRootExpression(trimmed)
    ?? parsePowerExpression(trimmed)
    ?? parseFactorialExpression(trimmed)
    ?? parsePercentExpression(trimmed)
    ?? parseBinaryExpression(trimmed)
}
