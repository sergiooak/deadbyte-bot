import { formatNumber, formatRootSymbol } from '../formatter'
import {
  BINARY_RE,
  FACTORIAL_RE,
  PERCENT_RE,
  POWER_CARET_RE,
  POWER_NATURAL_RE,
  POWER_SUPER_RE,
  ROOT_DEGREE_NAMES,
  ROOT_NATURAL_RE,
  ROOT_SYMBOL_DEGREES,
  ROOT_SYMBOL_RE,
} from './constants'
import { evaluateAstWithSteps, evaluateBinaryOperator } from './evaluator'
import { factorial } from './factorial'
import { normalizeArithmeticOperators } from './normalize'
import { fromSuperscript, toNumber } from './number'
import { makeNumberNode, parseArithmeticToAst, renderExpression, resetExpressionNodeIds } from './ast'
import type { BinaryOperator, MathResult } from './types'

export function parseFreeArithmeticExpression(expr: string): MathResult | null {
  resetExpressionNodeIds()
  const ast = parseArithmeticToAst(expr)
  if (!ast || ast.kind === 'number') return null

  const evaluation = evaluateAstWithSteps(ast)
  if (!evaluation) return null

  return {
    expression: expr,
    result: evaluation.result,
    explanation: evaluation.steps.length > 0
      ? evaluation.steps.join('\n')
      : `${renderExpression(ast)} = *${formatNumber(evaluation.result)}*`,
  }
}

export function parseValidationExpression(expr: string): MathResult | null {
  const equalMatches = expr.match(/=/g)
  if (!equalMatches || equalMatches.length !== 1) return null

  const [leftRaw, rightRaw] = expr.split('=')
  const leftExpr = leftRaw?.trim() ?? ''
  const rightExpr = rightRaw?.trim() ?? ''
  if (!leftExpr || !rightExpr) return null

  const left = parseFreeArithmeticExpression(leftExpr)
  if (!left) return null

  resetExpressionNodeIds()
  const rightAst = parseArithmeticToAst(rightExpr)
  if (!rightAst) return null

  const rightEvaluation = evaluateAstWithSteps(rightAst)
  if (!rightEvaluation) return null

  const normalizedLeft = renderExpression(parseArithmeticToAst(leftExpr) ?? makeNumberNode(left.result))
  const expected = `${normalizedLeft} = ${formatNumber(left.result)}`
  const isCorrect = Math.abs(left.result - rightEvaluation.result) <= 1e-9

  return {
    expression: expr,
    result: isCorrect ? 1 : 0,
    explanation: isCorrect
      ? `✅ {Correto|Certo|Certa resposta (com a voz do Silvio Santos)}\n${left.explanation}\n${normalizedLeft} = ${formatNumber(rightEvaluation.result)}`
      : `❌ {Errado|Incorreto|Resposta errada|Ta errado|Acertou miserável 🤣}\n${left.explanation}\n${expected}`,
  }
}

export function parseRootExpression(expr: string): MathResult | null {
  const symbolMatch = ROOT_SYMBOL_RE.exec(expr)
  if (symbolMatch) {
    const degree = ROOT_SYMBOL_DEGREES[symbolMatch[1]] ?? 2
    const value = toNumber(symbolMatch[2])
    return calculateRoot(expr, degree, value)
  }

  const naturalMatch = ROOT_NATURAL_RE.exec(expr)
  if (!naturalMatch) return null

  const degree = parseRootDegree(naturalMatch[1])
  const value = toNumber(naturalMatch[2])
  return calculateRoot(expr, degree, value)
}

export function parsePowerExpression(expr: string): MathResult | null {
  const superMatch = POWER_SUPER_RE.exec(expr)
  if (superMatch) {
    const base = toNumber(superMatch[1])
    const exponent = fromSuperscript(superMatch[2])
    return formatPowerResult(expr, base, exponent)
  }

  const caretMatch = POWER_CARET_RE.exec(expr)
  if (caretMatch) {
    const base = toNumber(caretMatch[1])
    const exponent = toNumber(caretMatch[2])
    return formatPowerResult(expr, base, exponent)
  }

  const naturalMatch = POWER_NATURAL_RE.exec(expr)
  if (!naturalMatch) return null

  const base = toNumber(naturalMatch[1])
  const exponent = toNumber(naturalMatch[2])
  return formatPowerResult(expr, base, exponent)
}

export function parseFactorialExpression(expr: string): MathResult | null {
  const match = FACTORIAL_RE.exec(expr)
  if (!match) return null

  const value = toNumber(match[1])
  if (!Number.isInteger(value) || value < 0) return null

  if (value > 170) {
    return {
      expression: expr,
      result: Infinity,
      explanation: `${formatNumber(value)}! é grande demais para precisão numérica.`,
    }
  }

  const result = factorial(value)
  return {
    expression: expr,
    result,
    explanation: `${formatNumber(value)}! = *${formatNumber(result)}*`,
  }
}

export function parsePercentExpression(expr: string): MathResult | null {
  const match = PERCENT_RE.exec(expr)
  if (!match) return null

  const percent = toNumber(match[1])
  const base = toNumber(match[2])
  const result = (percent / 100) * base

  return {
    expression: expr,
    result,
    explanation: `${formatNumber(percent)}% de ${formatNumber(base)} = *${formatNumber(result)}*`,
  }
}

export function parseBinaryExpression(expr: string): MathResult | null {
  const match = BINARY_RE.exec(expr)
  if (!match) return null

  const left = toNumber(match[1])
  const operator = normalizeArithmeticOperators(match[2])
  const right = toNumber(match[3])

  if (right === 0 && operator === '/') {
    return { expression: expr, result: NaN, explanation: 'Divisão por zero não é permitida.' }
  }

  const result = evaluateBinaryOperator(operator as BinaryOperator, left, right)
  if (result === null) return null

  return {
    expression: expr,
    result,
    explanation: `${formatNumber(left)} ${operatorLabel(operator as BinaryOperator)} ${formatNumber(right)} = *${formatNumber(result)}*`,
  }
}

function parseRootDegree(rawDegree: string | undefined): number {
  if (!rawDegree) return 2

  const normalizedDegree = rawDegree.trim().toLowerCase()
  return ROOT_DEGREE_NAMES[normalizedDegree] ?? (parseInt(normalizedDegree, 10) || 2)
}

function calculateRoot(expression: string, degree: number, value: number): MathResult | null {
  if (degree < 1) return null
  if (value < 0 && degree % 2 === 0) return null

  const result = Math.pow(value, 1 / degree)
  return {
    expression,
    result,
    explanation: `${formatRootSymbol(degree)}${formatNumber(value)} = *${formatNumber(result)}*`,
  }
}

function formatPowerResult(expression: string, base: number, exponent: number): MathResult {
  const result = Math.pow(base, exponent)
  return {
    expression,
    result,
    explanation: `${formatNumber(base)}^${formatNumber(exponent)} = *${formatNumber(result)}*`,
  }
}

function operatorLabel(operator: BinaryOperator): string {
  if (operator === '*') return '×'
  if (operator === '/') return '÷'
  if (operator === '-') return '−'
  return operator
}
