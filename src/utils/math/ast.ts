import { formatNumber } from '../formatter'
import { OPERATOR_ASSOCIATIVITY, OPERATOR_PRECEDENCE } from './constants'
import { tokenizeArithmeticExpression } from './tokenizer'
import type { BinaryOperator, ExpressionNode } from './types'

let expressionNodeId = 0

export function resetExpressionNodeIds(): void {
  expressionNodeId = 0
}

function nextNodeId(): number {
  expressionNodeId += 1
  return expressionNodeId
}

export function makeNumberNode(value: number): ExpressionNode {
  return { kind: 'number', id: nextNodeId(), value }
}

function makeBinaryNode(op: BinaryOperator, left: ExpressionNode, right: ExpressionNode): ExpressionNode {
  return { kind: 'binary', id: nextNodeId(), op, left, right }
}

function makeUnaryNode(op: '!', operand: ExpressionNode): ExpressionNode {
  return { kind: 'unary', id: nextNodeId(), op, operand }
}

export function parseArithmeticToAst(expr: string): ExpressionNode | null {
  const tokens = tokenizeArithmeticExpression(expr)
  if (!tokens || tokens.length === 0) return null

  const output: ExpressionNode[] = []
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

    if (token.type === 'factorial') {
      const operand = output.pop()
      if (!operand) return null
      output.push(makeUnaryNode('!', operand))
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

    while (operators.length > 0) {
      const top = operators[operators.length - 1]
      if (top === '(') break

      const currentPrecedence = OPERATOR_PRECEDENCE[token.value]
      const topPrecedence = OPERATOR_PRECEDENCE[top]
      const associativity = OPERATOR_ASSOCIATIVITY[token.value]
      const shouldPop = associativity === 'left'
        ? currentPrecedence <= topPrecedence
        : currentPrecedence < topPrecedence

      if (!shouldPop) break
      if (!applyTopOperator()) return null
    }

    operators.push(token.value)
  }

  while (operators.length > 0) {
    if (operators[operators.length - 1] === '(') return null
    if (!applyTopOperator()) return null
  }

  if (output.length !== 1) return null
  return output[0]
}

export function renderExpression(
  node: ExpressionNode,
  highlightedNodeId?: number,
  parentOp?: BinaryOperator,
  side?: 'left' | 'right'
): string {
  if (node.kind === 'number') return formatNumber(node.value)

  if (node.kind === 'unary') {
    const operand = renderExpression(node.operand, highlightedNodeId)
    const needsWrap = node.operand.kind !== 'number'
    const rendered = `${needsWrap ? `(${operand})` : operand}${node.op}`

    return highlightedNodeId === node.id ? `(${rendered})` : rendered
  }

  const left = renderExpression(node.left, highlightedNodeId, node.op, 'left')
  const right = renderExpression(node.right, highlightedNodeId, node.op, 'right')
  const expression = `${left} ${node.op} ${right}`
  const wrappedByParent = parentOp !== undefined && shouldWrapByParent(node, parentOp, side ?? 'left')

  if (wrappedByParent) return `(${expression})`
  if (highlightedNodeId === node.id) return `(${expression})`

  return expression
}

export function replaceNodeById(root: ExpressionNode, nodeId: number, replacement: ExpressionNode): ExpressionNode {
  if (root.id === nodeId) return replacement
  if (root.kind === 'number') return root

  if (root.kind === 'unary') {
    return {
      ...root,
      operand: replaceNodeById(root.operand, nodeId, replacement),
    }
  }

  return {
    ...root,
    left: replaceNodeById(root.left, nodeId, replacement),
    right: replaceNodeById(root.right, nodeId, replacement),
  }
}

function shouldWrapByParent(
  child: Extract<ExpressionNode, { kind: 'binary' }>,
  parentOp: BinaryOperator,
  side: 'left' | 'right'
): boolean {
  const childPrecedence = OPERATOR_PRECEDENCE[child.op]
  const parentPrecedence = OPERATOR_PRECEDENCE[parentOp]

  if (childPrecedence < parentPrecedence) return true
  if (childPrecedence > parentPrecedence) return false
  if (side === 'right' && (parentOp === '-' || parentOp === '/')) return true
  if (side === 'left' && parentOp === '^') return true

  return false
}
