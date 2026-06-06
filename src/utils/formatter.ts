export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return 'indefinido'

  return new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 8,
    minimumFractionDigits: 0,
  }).format(value)
}

export function formatRootSymbol(degree: number): string {
  if (degree === 2) return '√'
  if (degree === 3) return '∛'
  if (degree === 4) return '∜'
  return `${degree}√`
}
