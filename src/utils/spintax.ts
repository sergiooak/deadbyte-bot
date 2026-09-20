/**
 * Utilitarios para MONTAR texto spintax de forma segura. O render fica a cargo
 * do {@link SpintaxService}; aqui so escapamos e combinamos variacoes.
 */

/** Escapa os caracteres especiais do spintax (`{ } | \`) para virarem texto literal. */
export function escapeSpintax(text: string): string {
  return text.replace(/[\\{}|]/g, (char) => `\\${char}`)
}

/**
 * Combina variacoes em um bloco spintax `{a|b|c}` (uma e escolhida ao renderizar).
 * Cada variacao e escapada, entao chaves/pipes no texto nao quebram a sintaxe.
 * Com uma unica variacao, retorna o texto escapado sem chaves.
 */
export function spintaxFromVariants(variants: string[]): string {
  const cleaned = variants.map((variant) => variant.trim()).filter(Boolean)
  if (cleaned.length === 0) return ''
  if (cleaned.length === 1) return escapeSpintax(cleaned[0])
  return `{${cleaned.map(escapeSpintax).join('|')}}`
}
