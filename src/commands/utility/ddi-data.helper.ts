import ddiCountryCodes from '../../data/ddi-country-codes.json'

export interface DdiCountry {
  /** Nome do país em português */
  name: string
  /** Código ISO 3166-1 alpha-2 para gerar emoji de bandeira */
  iso: string
}

const DDI_MAP = ddiCountryCodes as Record<string, DdiCountry[]>

/** Gera emoji de bandeira a partir de um código ISO 3166-1 alpha-2 */
export function flagEmoji(iso: string): string {
  return [...iso.toUpperCase()]
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join('')
}

/** Retorna os países associados a um DDI, ou undefined se não encontrado */
export function lookupDdi(ddi: number): DdiCountry[] | undefined {
  return DDI_MAP[String(ddi)]
}
