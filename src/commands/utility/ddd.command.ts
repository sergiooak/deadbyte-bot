import { defineCommand, normalizeCommandName } from '@deadbyte/runtime'
import { ofetch } from 'ofetch'
import { sortCitiesByRelevance } from './ddd-data.helper.js'
import { collectPhoneTargets, parsePhoneNumber } from './phone-code.helper.js'

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
  TO: 'Tocantins'
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

/** Extrai o DDD tanto de "!ddd 34" quanto de "!ddd34". */
function extractDddArg(
  normalizedName: string,
  argsText: string,
  normalizedAliases: string[]
): string {
  if (argsText.trim()) return argsText.trim()

  for (const alias of normalizedAliases) {
    if (normalizedName.startsWith(alias) && normalizedName.length > alias.length) {
      return normalizedName.slice(alias.length)
    }
  }

  return ''
}

function normalizeCityName(city: string): string {
  const titled = city
    .toLocaleLowerCase('pt-BR')
    .replace(/(^|\s|-|')\p{L}/gu, (match) => match.toLocaleUpperCase('pt-BR'))

  return titled.replace(/\b(De|Da|Do|Das|Dos|E)\b/g, (match) => match.toLocaleLowerCase('pt-BR'))
}

async function lookupDdd(dddStr: string): Promise<string | undefined> {
  let data: BrasilApiDddResponse

  try {
    data = await ofetch<BrasilApiDddResponse>(
      `https://brasilapi.com.br/api/ddd/v1/${dddStr}`
    )
  } catch {
    return undefined
  }

  const stateName = STATE_NAMES[data.state] ?? data.state
  const cities = sortCitiesByRelevance(data.cities.map(normalizeCityName), data.state)
  const cityList = cities.join(', ')

  return `{📍|☎️} *{DDD|Código} ${dddStr}* — ${stateName} (${data.state})\n\n🏙️ *{Cidades|Municípios} (${cities.length}):* ${cityList}`
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
    const argValue = extractDddArg(normalized, argsText, normalizedAliases)
    const targets = await collectPhoneTargets(ctx, argValue)

    if (targets.length === 0) {
      await ctx.reply('{Informe|Mande} um DDD, responda alguém ou marque a pessoa. Ex: *!ddd 34*')
      return
    }

    const replies: string[] = []

    for (const target of targets) {
      const parsed = parsePhoneNumber(target)
      const ddd = parsed.kind === 'brazil' || parsed.kind === 'local' ? parsed.ddd : undefined

      if (parsed.kind === 'international') {
        replies.push(`*${target.label}*: isso aí tem cara de número gringo, meu consagrado. DDD é coisa de BR; usa *!ddi +${parsed.ddi}* e para de botar passaporte na fila do SUS.`)
        continue
      }

      if (!ddd || !/^\d{2}$/.test(ddd)) {
        replies.push(`*${target.label}*: me dá um DDD válido com 2 dígitos, criatura iluminada. Ex: *!ddd 34*`)
        continue
      }

      const result = await lookupDdd(ddd)
      replies.push(result ?? `*${target.label}*: DDD *${ddd}* não foi encontrado. Ou ele é inválido, ou você inventou telefonia freestyle.`)
    }

    await ctx.reply(replies.join('\n\n'))
  }
})
