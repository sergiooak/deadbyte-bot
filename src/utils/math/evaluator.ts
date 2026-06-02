import { formatNumber } from '../formatter'
import { makeNumberNode, renderExpression, replaceNodeById } from './ast'
import { factorial } from './factorial'
import type { BinaryOperator, ExpressionNode, ReducibleExpressionNode } from './types'

export function evaluateAstWithSteps(ast: ExpressionNode): { result: number; steps: string[] } | null {
  let current = ast
  const steps: string[] = []

  while (current.kind !== 'number') {
    const next = findNextReducibleNode(current)
    if (!next) return null

    const reduced = reduceNode(next)
    if (!reduced) return null

    const updatedTree = replaceNodeById(current, next.id, reduced)
    steps.push(
      updatedTree.kind === 'number'
        ? `${renderExpression(current)} = *${formatNumber(updatedTree.value)}*`
        : renderExpression(current, next.id)
    )

    current = updatedTree
  }

  return { result: current.value, steps }
}

export function evaluateBinaryOperator(op: BinaryOperator, left: number, right: number): number | null {
  switch (op) {
    case '+':
      return left + right
    case '-':
      return left - right
    case '*':
      return left * right
    case '/':
      return right === 0 ? null : left / right
    case '^':
      return Math.pow(left, right)
  }
}

function reduceNode(node: ReducibleExpressionNode): ExpressionNode | null {
  if (node.kind === 'unary') {
    if (node.operand.kind !== 'number') return null

    const operandValue = node.operand.value
    if (!Number.isInteger(operandValue) || operandValue < 0 || operandValue > 170) return null

    return makeNumberNode(factorial(operandValue))
  }

  if (node.left.kind !== 'number' || node.right.kind !== 'number') return null

  const value = evaluateBinaryOperator(node.op, node.left.value, node.right.value)
  if (value === null || !Number.isFinite(value)) return null

  return makeNumberNode(value)
}

function findNextReducibleNode(node: ExpressionNode): ReducibleExpressionNode | null {
  if (node.kind === 'number') return null

  if (node.kind === 'unary') {
    const operandCandidate = findNextReducibleNode(node.operand)
    if (operandCandidate) return operandCandidate

    return node.operand.kind === 'number' ? node : null
  }

  const leftCandidate = findNextReducibleNode(node.left)
  if (leftCandidate) return leftCandidate

  const rightCandidate = findNextReducibleNode(node.right)
  if (rightCandidate) return rightCandidate

  return node.left.kind === 'number' && node.right.kind === 'number' ? node : null
}
