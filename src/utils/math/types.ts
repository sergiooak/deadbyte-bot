export interface MathResult {
  expression: string
  result: number
  explanation: string
}

export type BinaryOperator = '+' | '-' | '*' | '/' | '^'

export type MathToken =
  | { type: 'number'; value: number }
  | { type: 'operator'; value: BinaryOperator }
  | { type: 'factorial' }
  | { type: 'lparen' }
  | { type: 'rparen' }

export type ExpressionNode =
  | { kind: 'number'; id: number; value: number }
  | { kind: 'unary'; id: number; op: '!'; operand: ExpressionNode }
  | { kind: 'binary'; id: number; op: BinaryOperator; left: ExpressionNode; right: ExpressionNode }

export type ReducibleExpressionNode = Extract<ExpressionNode, { kind: 'unary' | 'binary' }>
