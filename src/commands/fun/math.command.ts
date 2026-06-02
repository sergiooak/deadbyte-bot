import { defineCommand, normalizeCommandName } from '@deadbyte/runtime'

// ─── Constantes de suporte ────────────────────────────────────────────────────

// Padrão de número: aceita inteiro ou decimal com vírgula ou ponto
const NUM = /\d+(?:[.,]\d+)?/
const NUM_SRC = NUM.source

// Dígitos superescritos → arábicos
const SUPERSCRIPT_MAP: Record<string, string> = {
  '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4',
  '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
}

// Nomes de grau de raiz reconhecidos nominalmente → grau numérico
const ROOT_DEGREE_NAMES: Record<string, number> = {
  quadrada: 2, cubica: 3, cúbica: 3, quarta: 4, quinta: 5,
  sexta: 6, setima: 7, sétima: 7, oitava: 8, nona: 9,
}
const ROOT_DEGREE_NAMES_PATTERN = Object.keys(ROOT_DEGREE_NAMES).join('|')

// Símbolos Unicode de raiz → grau
const ROOT_SYMBOL_MAP: Record<string, number> = { '√': 2, '∛': 3, '∜': 4 }

// ─── Regexes ──────────────────────────────────────────────────────────────────

// Operação binária: A op B
const BINARY_RE = new RegExp(
  `^(${NUM_SRC})\\s*([+\\-*/x×÷])\\s*(${NUM_SRC})$`,
  'i'
)

// Porcentagem: "N% de N" ou "N% N" ou "N%N"
const PERCENT_RE = new RegExp(
  `^(${NUM_SRC})\\s*%\\s*(?:de\\s+)?(${NUM_SRC})$`,
  'i'
)

// Potência simbólica: N^M (qualquer expoente)
const POWER_CARET_RE = new RegExp(
  `^(${NUM_SRC})\\s*\\^\\s*(${NUM_SRC})$`
)

// Potência com dígitos superescritos: N² N³ N⁴ N¹⁰ etc.
const POWER_SUPER_RE = new RegExp(
  `^(${NUM_SRC})([²³⁴⁵⁶⁷⁸⁹⁰¹]+)$`
)

// Potência natural: "N elevado a[o] M"
const POWER_NATURAL_RE = new RegExp(
  `^(${NUM_SRC})\\s+elevado\\s+ao?\\s+(${NUM_SRC})$`,
  'i'
)

// Fatorial: N!
const FACTORIAL_RE = new RegExp(
  `^(${NUM_SRC})\\s*!$`
)

// Raiz com símbolo Unicode: √N ∛N ∜N
const ROOT_SYMBOL_RE = /^([√∛∜])\s*(\d+(?:[.,]\d+)?)$/

// Raiz natural: "raiz [grau] [de] N"
//   grau pode ser: um nome (cúbica…), um número (3), ordinal (3ª, 4°)
//   se omitido → quadrada (grau 2)
const ROOT_NATURAL_RE = new RegExp(
  `^raiz\\s+(?:(${ROOT_DEGREE_NAMES_PATTERN}|\\d+[ªº°]?|\\d+)\\s+)?(?:de\\s+)?(${NUM_SRC})$`,
  'i'
)

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Substitui ocorrências de "pi" (isolado) pelo valor de Math.PI */
function substitutePi(expr: string): string {
  // Substitui "pi" que não esteja cercado por letras/dígitos
  return expr.replace(/(?<![a-z\d])pi(?![a-z\d])/gi, String(Math.PI))
}

/** Normaliza separador decimal (vírgula → ponto) */
function toNum(raw: string): number {
  return parseFloat(raw.replace(',', '.'))
}

/** Converte string de dígitos superescritos em número */
function fromSuperscript(s: string): number {
  return parseInt(s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (c) => SUPERSCRIPT_MAP[c] ?? c))
}

/** Formata número em pt-BR com separadores de milhar e até 8 casas decimais */
function formatNum(n: number): string {
  if (!isFinite(n)) return 'indefinido'
  return new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 8,
    minimumFractionDigits: 0,
  }).format(n)
}

/** Símbolo de raiz para exibição */
function rootSymbol(degree: number): string {
  if (degree === 2) return '√'
  if (degree === 3) return '∛'
  if (degree === 4) return '∜'
  return `${degree}√`
}

/** Calcula fatorial de inteiro não negativo */
function factorial(n: number): number {
  if (n <= 1) return 1
  let acc = 1
  for (let i = 2; i <= n; i++) {
    acc *= i
  }
  return acc
}

// ─── Parser principal ─────────────────────────────────────────────────────────

type MathResult = { expression: string; result: number; explanation: string }

/** Tenta interpretar e calcular uma expressão matemática */
function parseMathExpression(expr: string): MathResult | null {
  const trimmed = substitutePi(expr.trim())

  // Raiz com símbolo: √N ∛N ∜N
  const rootSymbolMatch = ROOT_SYMBOL_RE.exec(trimmed)
  if (rootSymbolMatch) {
    const degree = ROOT_SYMBOL_MAP[rootSymbolMatch[1]] ?? 2
    const n = toNum(rootSymbolMatch[2])
    if (n < 0 && degree % 2 === 0) return null
    const result = Math.pow(n, 1 / degree)
    return {
      expression: trimmed,
      result,
      explanation: `${rootSymbol(degree)}${formatNum(n)} = *${formatNum(result)}*`
    }
  }

  // Raiz natural: "raiz [grau] [de] N"
  const rootNaturalMatch = ROOT_NATURAL_RE.exec(trimmed)
  if (rootNaturalMatch) {
    const degreeRaw = rootNaturalMatch[1]?.trim().toLowerCase()
    const n = toNum(rootNaturalMatch[2])

    let degree = 2
    if (degreeRaw) {
      if (ROOT_DEGREE_NAMES[degreeRaw] !== undefined) {
        degree = ROOT_DEGREE_NAMES[degreeRaw]
      } else {
        // número ou ordinal: "3", "3ª", "4°"
        degree = parseInt(degreeRaw) || 2
      }
    }

    if (degree < 1) return null
    if (n < 0 && degree % 2 === 0) return null
    const result = Math.pow(n, 1 / degree)
    return {
      expression: trimmed,
      result,
      explanation: `${rootSymbol(degree)}${formatNum(n)} = *${formatNum(result)}*`
    }
  }

  // Potência com dígito superescrito: 6³ 2¹⁰
  const superMatch = POWER_SUPER_RE.exec(trimmed)
  if (superMatch) {
    const base = toNum(superMatch[1])
    const exp = fromSuperscript(superMatch[2])
    const result = Math.pow(base, exp)
    return {
      expression: trimmed,
      result,
      explanation: `${formatNum(base)}^${exp} = *${formatNum(result)}*`
    }
  }

  // Potência com ^: 2^10
  const caretMatch = POWER_CARET_RE.exec(trimmed)
  if (caretMatch) {
    const base = toNum(caretMatch[1])
    const exp = toNum(caretMatch[2])
    const result = Math.pow(base, exp)
    return {
      expression: trimmed,
      result,
      explanation: `${formatNum(base)}^${formatNum(exp)} = *${formatNum(result)}*`
    }
  }

  // Potência natural: "N elevado a M"
  const powerNaturalMatch = POWER_NATURAL_RE.exec(trimmed)
  if (powerNaturalMatch) {
    const base = toNum(powerNaturalMatch[1])
    const exp = toNum(powerNaturalMatch[2])
    const result = Math.pow(base, exp)
    return {
      expression: trimmed,
      result,
      explanation: `${formatNum(base)}^${formatNum(exp)} = *${formatNum(result)}*`
    }
  }

  // Fatorial: "N!"
  const factorialMatch = FACTORIAL_RE.exec(trimmed)
  if (factorialMatch) {
    const n = toNum(factorialMatch[1])
    if (!Number.isInteger(n) || n < 0) return null
    if (n > 170) {
      return {
        expression: trimmed,
        result: Infinity,
        explanation: `${formatNum(n)}! é grande demais para precisão numérica.`
      }
    }
    const result = factorial(n)
    return {
      expression: trimmed,
      result,
      explanation: `${formatNum(n)}! = *${formatNum(result)}*`
    }
  }

  // Porcentagem: "40% de 250", "20% 4", "20%4"
  const pctMatch = PERCENT_RE.exec(trimmed)
  if (pctMatch) {
    const pct = toNum(pctMatch[1])
    const base = toNum(pctMatch[2])
    const result = (pct / 100) * base
    return {
      expression: trimmed,
      result,
      explanation: `${formatNum(pct)}% de ${formatNum(base)} = *${formatNum(result)}*`
    }
  }

  // Operação binária: A op B
  const binMatch = BINARY_RE.exec(trimmed)
  if (binMatch) {
    const a = toNum(binMatch[1])
    const opRaw = binMatch[2]
    const b = toNum(binMatch[3])

    if (b === 0 && (opRaw === '/' || opRaw === '÷')) {
      return { expression: trimmed, result: NaN, explanation: 'Divisão por zero não é permitida.' }
    }

    let result: number
    let opLabel: string
    switch (opRaw) {
      case '+': result = a + b; opLabel = '+'; break
      case '-': result = a - b; opLabel = '−'; break
      case '*':
      case 'x':
      case 'X':
      case '×': result = a * b; opLabel = '×'; break
      case '/':
      case '÷': result = a / b; opLabel = '÷'; break
      default: return null
    }

    return {
      expression: trimmed,
      result,
      explanation: `${formatNum(a)} ${opLabel} ${formatNum(b)} = *${formatNum(result)}*`
    }
  }

  return null
}

function aliasesFor(
  ctx: { config: { commands: Record<string, { aliases?: string[] }> } },
  commandId: string,
  defaults: string[]
): string[] {
  return ctx.config.commands[commandId]?.aliases ?? defaults
}

const NAMED_ALIASES = ['calc', 'calcular', 'math', 'conta']

export const mathCommand = defineCommand({
  id: 'fun.math',
  group: 'fun',
  name: 'Calculadora',
  description:
    'Calcula expressões matemáticas. Suporta +, −, ×, ÷, %, raiz (qualquer grau), potência e fatorial. Funciona implicitamente (ex: 2+2, raiz cúbica de 27) ou com !calc.',
  aliases: NAMED_ALIASES,
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  supports: {
    private: true,
    groups: true,
    implicit: true
  },
  configFields: [],
  async match(ctx) {
    // Modo explícito: !calc 2+2 ou !calc 20%4
    if (ctx.parsedCommand?.explicit) {
      const normalized = ctx.parsedCommand.normalizedName ?? ''
      const aliases = aliasesFor(ctx, 'fun.math', mathCommand.aliases)
      if (!aliases.map(normalizeCommandName).includes(normalized)) return false
      const expr = ctx.parsedCommand.argsText.trim()
      return parseMathExpression(expr) !== null
    }

    // Modo implícito: mensagem inteira é uma expressão
    const body = ctx.message.body.trim()
    return parseMathExpression(body) !== null
  },
  async run(ctx) {
    const exprStr = ctx.parsedCommand?.explicit
      ? ctx.parsedCommand.argsText.trim()
      : ctx.message.body.trim()

    const result = parseMathExpression(exprStr)

    if (!result) {
      await ctx.reply(
        '🧮 Não consegui calcular essa expressão.\n\nExemplos válidos:\n• `2 + 3` · `2,5 * 8`\n• `40% de 250` · `20%4`\n• `raiz de 36` · `raiz cúbica de 27` · `raiz 5 de 32`\n• `√25` · `∛27` · `∜16`\n• `2^10` · `2 elevado a 10` · `6³`\n• `2!` · `5!`'
      )
      return
    }

    await ctx.reply(`🧮 ${result.explanation}`)
  }
})

