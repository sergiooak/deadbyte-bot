export function substitutePi(expr: string): string {
  return expr.replace(/(?<![a-z\d])pi(?![a-z\d])/gi, String(Math.PI))
}

export function normalizeArithmeticOperators(expr: string): string {
  return expr
    .replace(/[×xX]/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
}
