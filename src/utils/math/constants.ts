import type { BinaryOperator } from './types'

export const NUMBER_PATTERN = /\d+(?:[.,]\d+)?/
export const NUMBER_SOURCE = NUMBER_PATTERN.source

export const SUPERSCRIPT_DIGITS: Record<string, string> = {
  '⁰': '0',
  '¹': '1',
  '²': '2',
  '³': '3',
  '⁴': '4',
  '⁵': '5',
  '⁶': '6',
  '⁷': '7',
  '⁸': '8',
  '⁹': '9',
}

export const ROOT_DEGREE_NAMES: Record<string, number> = {
  quadrada: 2,
  cubica: 3,
  cúbica: 3,
  quarta: 4,
  quinta: 5,
  sexta: 6,
  setima: 7,
  sétima: 7,
  oitava: 8,
  nona: 9,
}

export const ROOT_SYMBOL_DEGREES: Record<string, number> = {
  '√': 2,
  '∛': 3,
  '∜': 4,
}

export const OPERATOR_PRECEDENCE: Record<BinaryOperator, number> = {
  '+': 1,
  '-': 1,
  '*': 2,
  '/': 2,
  '^': 3,
}

export const OPERATOR_ASSOCIATIVITY: Record<BinaryOperator, 'left' | 'right'> = {
  '+': 'left',
  '-': 'left',
  '*': 'left',
  '/': 'left',
  '^': 'right',
}

const ROOT_DEGREE_NAME_PATTERN = Object.keys(ROOT_DEGREE_NAMES).join('|')

export const BINARY_RE = new RegExp(`^(${NUMBER_SOURCE})\\s*([+\\-*/xX×÷])\\s*(${NUMBER_SOURCE})$`, 'i')
export const PERCENT_RE = new RegExp(`^(${NUMBER_SOURCE})\\s*%\\s*(?:de\\s+)?(${NUMBER_SOURCE})$`, 'i')
export const POWER_CARET_RE = new RegExp(`^(${NUMBER_SOURCE})\\s*\\^\\s*(${NUMBER_SOURCE})$`)
export const POWER_SUPER_RE = new RegExp(`^(${NUMBER_SOURCE})([²³⁴⁵⁶⁷⁸⁹⁰¹]+)$`)
export const POWER_NATURAL_RE = new RegExp(`^(${NUMBER_SOURCE})\\s+elevado\\s+ao?\\s+(${NUMBER_SOURCE})$`, 'i')
export const FACTORIAL_RE = new RegExp(`^(${NUMBER_SOURCE})\\s*!$`)
export const ROOT_SYMBOL_RE = new RegExp(`^([√∛∜])\\s*(${NUMBER_SOURCE})$`)
export const ROOT_NATURAL_RE = new RegExp(
  `^raiz\\s+(?:(${ROOT_DEGREE_NAME_PATTERN}|\\d+[ªº°]?|\\d+)\\s+)?(?:de\\s+)?(${NUMBER_SOURCE})$`,
  'i'
)
