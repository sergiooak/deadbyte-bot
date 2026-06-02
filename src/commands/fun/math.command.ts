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

type BinaryOperator = '+' | '-' | '*' | '/' | '^'

type MathToken =
  | { type: 'number'; value: number }
  | { type: 'operator'; value: BinaryOperator }
  | { type: 'lparen' }
  | { type: 'rparen' }

type ExprNode =
  | { kind: 'number'; id: number; value: number }
  | { kind: 'binary'; id: number; op: BinaryOperator; left: ExprNode; right: ExprNode }

const OP_PRECEDENCE: Record<BinaryOperator, number> = {
  '+': 1,
  '-': 1,
  '*': 2,
  '/': 2,
  '^': 3,
}

const OP_ASSOCIATIVITY: Record<BinaryOperator, 'left' | 'right'> = {
  '+': 'left',
  '-': 'left',
  '*': 'left',
  '/': 'left',
  '^': 'right',
}

let expressionNodeId = 0

function nextNodeId(): number {
  expressionNodeId += 1
  return expressionNodeId
}

function makeNumberNode(value: number): ExprNode {
  return { kind: 'number', id: nextNodeId(), value }
}

function makeBinaryNode(op: BinaryOperator, left: ExprNode, right: ExprNode): ExprNode {
  return { kind: 'binary', id: nextNodeId(), op, left, right }
}

/** Normaliza símbolos alternativos para operadores aritméticos ASCII */
function normalizeArithmeticOperators(expr: string): string {
  return expr
    .replace(/[×xX]/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
}

/** Tokeniza expressão aritmética com suporte a números longos e parênteses */
function tokenizeArithmeticExpression(expr: string): MathToken[] | null {
  const tokens: MathToken[] = []
  const input = normalizeArithmeticOperators(expr)

  let i = 0
  let expectingValue = true

  while (i < input.length) {
    const ch = input[i]

    if (/\s/.test(ch)) {
      i += 1
      continue
    }

    if (ch === '(') {
      tokens.push({ type: 'lparen' })
      expectingValue = true
      i += 1
      continue
    }

    if (ch === ')') {
      if (expectingValue) return null
      tokens.push({ type: 'rparen' })
      expectingValue = false
      i += 1
      continue
    }

    const isSignedNumber =
      expectingValue
      && (ch === '+' || ch === '-')
      && i + 1 < input.length
      && /[\d.,]/.test(input[i + 1])

    if (/[\d.,]/.test(ch) || isSignedNumber) {
      let start = i
      if (isSignedNumber) i += 1

      let seenSeparator = false
      let seenDigit = false

      while (i < input.length) {
        const c = input[i]
        if (/\d/.test(c)) {
          seenDigit = true
          i += 1
          continue
        }
        if ((c === '.' || c === ',') && !seenSeparator) {
          seenSeparator = true
          i += 1
          continue
        }
        break
      }

      const raw = input.slice(start, i)
      if (!seenDigit || /^[-+]?[.,]$/.test(raw)) return null
      const value = parseFloat(raw.replace(',', '.'))
      if (!isFinite(value)) return null

      tokens.push({ type: 'number', value })
      expectingValue = false
      continue
    }

    if (/^[+\-*/^]$/.test(ch)) {
      if (expectingValue) return null
      tokens.push({ type: 'operator', value: ch as BinaryOperator })
      expectingValue = true
      i += 1
      continue
    }

    return null
  }

  if (expectingValue) return null
  return tokens
}

/** Constrói AST via shunting-yard para respeitar precedência e associatividade */
function parseArithmeticToAst(expr: string): ExprNode | null {
  const tokens = tokenizeArithmeticExpression(expr)
  if (!tokens || tokens.length === 0) return null

  const output: ExprNode[] = []
  const operators: Array<BinaryOperator | '('> = []

  const applyTopOperator = (): boolean => {
    const op = operators.pop()
    if (!op || op === '(') return false

    const right = output.pop()
    const left = output.pop()
    if (!left || !right) return false

    output.push(makeBinaryNode(op, left, right))
    return true
  }

  for (const token of tokens) {
    if (token.type === 'number') {
      output.push(makeNumberNode(token.value))
      continue
    }

    if (token.type === 'lparen') {
      operators.push('(')
      continue
    }

    if (token.type === 'rparen') {
      while (operators.length > 0 && operators[operators.length - 1] !== '(') {
        if (!applyTopOperator()) return null
      }
      if (operators.length === 0) return null
      operators.pop()
      continue
    }

    if (token.type === 'operator') {
      while (operators.length > 0) {
        const top = operators[operators.length - 1]
        if (top === '(') break

        const currentPrec = OP_PRECEDENCE[token.value]
        const topPrec = OP_PRECEDENCE[top]
        const assoc = OP_ASSOCIATIVITY[token.value]

        const shouldPop = assoc === 'left'
          ? currentPrec <= topPrec
          : currentPrec < topPrec

        if (!shouldPop) break
        if (!applyTopOperator()) return null
      }
      operators.push(token.value)
    }
  }

  while (operators.length > 0) {
    if (operators[operators.length - 1] === '(') return null
    if (!applyTopOperator()) return null
  }

  if (output.length !== 1) return null
  return output[0]
}

function evaluateBinaryOperator(op: BinaryOperator, left: number, right: number): number | null {
  switch (op) {
    case '+': return left + right
    case '-': return left - right
    case '*': return left * right
    case '/': return right === 0 ? null : left / right
    case '^': return Math.pow(left, right)
  }
}

/** Decide quando parênteses são necessários para preservar semântica */
function shouldWrapByParent(
  child: Extract<ExprNode, { kind: 'binary' }>,
  parentOp: BinaryOperator,
  side: 'left' | 'right'
): boolean {
  const childPrec = OP_PRECEDENCE[child.op]
  const parentPrec = OP_PRECEDENCE[parentOp]

  if (childPrec < parentPrec) return true
  if (childPrec > parentPrec) return false

  if (side === 'right' && (parentOp === '-' || parentOp === '/')) return true
  if (side === 'left' && parentOp === '^') return true
  return false
}

function renderExpression(
  node: ExprNode,
  highlightedNodeId?: number,
  parentOp?: BinaryOperator,
  side?: 'left' | 'right'
): string {
  if (node.kind === 'number') {
    return formatNum(node.value)
  }

  const left = renderExpression(node.left, highlightedNodeId, node.op, 'left')
  const right = renderExpression(node.right, highlightedNodeId, node.op, 'right')
  let rendered = `${left} ${node.op} ${right}`

  const wrappedByParent = parentOp !== undefined
    && shouldWrapByParent(node, parentOp, side ?? 'left')

  if (wrappedByParent) {
    rendered = `(${rendered})`
  }

  if (highlightedNodeId === node.id && !wrappedByParent) {
    rendered = `(${rendered})`
  }

  return rendered
}

/** Busca o próximo nó pronto para reduzir em ordem de avaliação real */
function findNextReducibleNode(node: ExprNode): Extract<ExprNode, { kind: 'binary' }> | null {
  if (node.kind === 'number') return null

  const leftCandidate = findNextReducibleNode(node.left)
  if (leftCandidate) return leftCandidate

  const rightCandidate = findNextReducibleNode(node.right)
  if (rightCandidate) return rightCandidate

  if (node.left.kind === 'number' && node.right.kind === 'number') {
    return node
  }

  return null
}

function replaceNodeById(root: ExprNode, nodeId: number, replacement: ExprNode): ExprNode {
  if (root.id === nodeId) return replacement
  if (root.kind === 'number') return root

  return {
    ...root,
    left: replaceNodeById(root.left, nodeId, replacement),
    right: replaceNodeById(root.right, nodeId, replacement),
  }
}

/** Avalia AST e gera decomposição passo a passo da expressão */
function evaluateAstWithSteps(ast: ExprNode): { result: number; steps: string[] } | null {
  let current = ast
  const steps: string[] = []

  while (current.kind !== 'number') {
    const next = findNextReducibleNode(current)
    if (!next) return null
    if (next.left.kind !== 'number' || next.right.kind !== 'number') return null

    const value = evaluateBinaryOperator(next.op, next.left.value, next.right.value)
    if (value === null || !isFinite(value)) return null

    const reduced = makeNumberNode(value)
    const updatedTree = replaceNodeById(current, next.id, reduced)

    if (updatedTree.kind === 'number') {
      steps.push(`${renderExpression(current)} = *${formatNum(updatedTree.value)}*`)
    } else {
      steps.push(renderExpression(current, next.id))
    }

    current = updatedTree
  }

  return { result: current.value, steps }
}

/** Calcula expressão aritmética livre com suporte a parênteses */
function parseFreeArithmeticExpression(expr: string): MathResult | null {
  expressionNodeId = 0
  const ast = parseArithmeticToAst(expr)
  if (!ast) return null

  const evaluation = evaluateAstWithSteps(ast)
  if (!evaluation) return null

  const explanation = evaluation.steps.length > 0
    ? evaluation.steps.join('\n')
    : `${renderExpression(ast)} = *${formatNum(evaluation.result)}*`

  return {
    expression: expr,
    result: evaluation.result,
    explanation,
  }
}

/** Modo validação: "expressão = resultado" */
function parseValidationExpression(expr: string): MathResult | null {
  const equalMatches = expr.match(/=/g)
  if (!equalMatches) return null
  if (equalMatches.length !== 1) return null

  const [leftRaw, rightRaw] = expr.split('=')
  const leftExpr = leftRaw?.trim() ?? ''
  const rightExpr = rightRaw?.trim() ?? ''

  if (!leftExpr || !rightExpr) return null

  const left = parseFreeArithmeticExpression(leftExpr)
  const right = parseFreeArithmeticExpression(rightExpr)
  if (!left || !right) return null

  const epsilon = 1e-9
  const isCorrect = Math.abs(left.result - right.result) <= epsilon

  const normalizedLeft = renderExpression(parseArithmeticToAst(leftExpr) ?? makeNumberNode(left.result))
  const expected = `${normalizedLeft} = ${formatNum(left.result)}`

  return {
    expression: expr,
    result: isCorrect ? 1 : 0,
    explanation: isCorrect
      ? `✅ Correto\n${normalizedLeft} = ${formatNum(right.result)}`
      : `❌ Errado\n${expected}`,
  }
}

/** Tenta interpretar e calcular uma expressão matemática */
function parseMathExpression(expr: string): MathResult | null {
  const trimmed = substitutePi(expr.trim())

  // Modo de validação explícita: A = B
  const validation = parseValidationExpression(trimmed)
  if (validation) {
    return validation
  }

  // Calculadora geral com precedência e parênteses
  const freeArithmetic = parseFreeArithmeticExpression(trimmed)
  if (freeArithmetic) {
    return freeArithmetic
  }

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
    'Calcula expressões matemáticas longas com precedência e parênteses. Também valida contas com "=" e responde Correto/Errado.',
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
        '🧮 Não consegui calcular essa expressão.\n\nExemplos válidos:\n• `1 + 2 * 3`\n• `(4 + 6) / 2`\n• `2 ^ 3 ^ 2`\n• `1 + 1 = 2` (validação)\n• `1 + 1 = 3` (retorna Errado)\n• `40% de 250` · `raiz cúbica de 27` · `6³`'
      )
      return
    }

    await ctx.reply(`🧮 ${result.explanation}`)
  }
})

