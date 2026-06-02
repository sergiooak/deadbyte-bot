import { defineCommand, normalizeCommandName } from '@deadbyte/runtime'
import { ofetch } from 'ofetch'
import { sortCitiesByRelevance } from './ddd-data.helper.js'

// Mapa de siglas de estado → nome completo
const STATE_NAMES: Record<string, string> = {
  AC: 'Acre',
  AL: 'Alagoas',
  AP: 'Amapá',
  AM: 'Amazonas',
  BA: 'Bahia',
  CE: 'Ceará',
  DF: 'Distrito Federal',
  ES: 'Espírito Santo',
  GO: 'Goiás',
  MA: 'Maranhão',
  MT: 'Mato Grosso',
  MS: 'Mato Grosso do Sul',
  MG: 'Minas Gerais',
  PA: 'Pará',
  PB: 'Paraíba',
  PR: 'Paraná',
  PE: 'Pernambuco',
  PI: 'Piauí',
  RJ: 'Rio de Janeiro',
  RN: 'Rio Grande do Norte',
  RS: 'Rio Grande do Sul',
  RO: 'Rondônia',
  RR: 'Roraima',
  SC: 'Santa Catarina',
  SP: 'São Paulo',
  SE: 'Sergipe',
  TO: 'Tocantins',
}

interface BrasilApiDddResponse {
  state: string
  cities: string[]
}

function aliasesFor(
  ctx: { config: { commands: Record<string, { aliases?: string[] }> } },
  commandId: string,
  defaults: string[]
): string[] {
  return ctx.config.commands[commandId]?.aliases ?? defaults
}

/** Extrai o número de DDD tanto de "!ddd 34" quanto de "!ddd34" */
function extractDddArg(
  normalizedName: string,
  argsText: string,
  normalizedAliases: string[]
): string {
  // Caso: !ddd 34 → argsText = '34'
  if (argsText.trim()) return argsText.trim()

  // Caso: !ddd34 → normalizedName = 'ddd34'
  for (const alias of normalizedAliases) {
    if (normalizedName.startsWith(alias) && normalizedName.length > alias.length) {
      return normalizedName.slice(alias.length)
    }
  }

  return ''
}

export const dddCommand = defineCommand({
  id: 'utility.ddd',
  group: 'utility',
  name: 'DDD',
  description: 'Informa o estado e cidades relacionados a um DDD brasileiro.',
  aliases: ['ddd'],
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  supports: {
    private: true,
    groups: true,
    implicit: false
  },
  configFields: [],
  async match(ctx) {
    const normalized = ctx.parsedCommand?.normalizedName ?? ''
    const aliases = aliasesFor(ctx, 'utility.ddd', dddCommand.aliases)
    const normalizedAliases = aliases.map(normalizeCommandName)

    // Aceita: !ddd 34 (normalized = 'ddd') ou !ddd34 (normalized = 'ddd34')
    return (
      normalizedAliases.includes(normalized) ||
      normalizedAliases.some(
        (a) => normalized.startsWith(a) && /^\d+$/.test(normalized.slice(a.length))
      )
    )
  },
  async run(ctx) {
    const normalized = ctx.parsedCommand?.normalizedName ?? ''
    const argsText = ctx.parsedCommand?.argsText ?? ''
    const aliases = aliasesFor(ctx, 'utility.ddd', dddCommand.aliases)
    const normalizedAliases = aliases.map(normalizeCommandName)

    const dddStr = extractDddArg(normalized, argsText, normalizedAliases)

    if (!dddStr || !/^\d{2}$/.test(dddStr)) {
      await ctx.reply('{Informe|Mande} um DDD válido com 2 dígitos. Ex: *!ddd 34*')
      return
    }

    let data: BrasilApiDddResponse
    try {
      data = await ofetch<BrasilApiDddResponse>(
        `https://brasilapi.com.br/api/ddd/v1/${dddStr}`
      )
    } catch {
      await ctx.reply(`DDD *${dddStr}* {não foi encontrado|não apareceu por aqui}. Verifique se é um DDD válido.`)
      return
    }

    const stateName = STATE_NAMES[data.state] ?? data.state
    const MAX_CITIES = 20
    const cities = sortCitiesByRelevance(
      data.cities.map((c) => c.charAt(0) + c.slice(1).toLowerCase())
    )

    const cityList =
      cities.length > MAX_CITIES
        ? cities.slice(0, MAX_CITIES).join(', ') + ` e mais ${cities.length - MAX_CITIES} cidades...`
        : cities.join(', ')

    await ctx.reply(
      `{📍|☎️} *{DDD|Código} ${dddStr}* — ${stateName} (${data.state})\n\n🏙️ *{Cidades|Municípios} (${cities.length}):* ${cityList}`
    )
  }
})
