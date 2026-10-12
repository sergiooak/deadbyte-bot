/** Normaliza o número para o formato do WhatsApp: só dígitos, com DDI (ex.: 5534999999999). */
export function normalizePairingPhone(value: string): string | undefined {
  const digits = value.replace(/\D/g, '')
  return digits.length >= 10 && digits.length <= 15 ? digits : undefined
}

/** O WhatsApp devolve o código em 8 caracteres; exibimos como ABCD-EFGH. */
export function formatPairingCode(code: string): string {
  const clean = code.replace(/[^0-9A-Z]/gi, '').toUpperCase()
  return clean.length === 8 ? `${clean.slice(0, 4)}-${clean.slice(4)}` : clean
}
