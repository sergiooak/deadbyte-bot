import { defineCommand } from '@deadbyte/runtime'
import { ofetch } from 'ofetch'
import { utilityMessages } from '../../messages/utility.messages.js'
import { getNormalizedCommandAliases, matchesCommandAliasWithSuffix } from '../../utils/commands.js'
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
  return utilityMessages.dddResult(dddStr, stateName, data.state, cities.length, cities.join(', '))
}

export const dddCommand = defineCommand({
  id: 'utility.ddd',
  group: 'utility',
  name: 'DDD',
  description: 'Informa o estado e cidades relacionados a um DDD brasileiro.',
  aliases: ['ddd'],
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  order: 1,
  supports: {
    private: true,
    groups: true,
    implicit: false
  },
  configFields: [],
  async match(ctx) {
    return matchesCommandAliasWithSuffix(ctx, 'utility.ddd', dddCommand.aliases, /^\d+$/)
  },
  async run(ctx) {
    const normalized = ctx.parsedCommand?.normalizedName ?? ''
    const argsText = ctx.parsedCommand?.argsText ?? ''
    const normalizedAliases = getNormalizedCommandAliases(ctx.config, 'utility.ddd', dddCommand.aliases)
    const argValue = extractDddArg(normalized, argsText, normalizedAliases)
    const targets = await collectPhoneTargets(ctx, argValue)

    if (targets.length === 0) {
      await ctx.reply(utilityMessages.dddMissingInput)
      return
    }

    const replies: string[] = []

    for (const target of targets) {
      const parsed = parsePhoneNumber(target)
      const ddd = parsed.kind === 'brazil' || parsed.kind === 'local' ? parsed.ddd : undefined

      if (parsed.kind === 'international') {
        replies.push(utilityMessages.dddInternational(target.label, parsed.ddi))
        continue
      }

      if (!ddd || !/^\d{2}$/.test(ddd)) {
        replies.push(utilityMessages.dddInvalid(target.label))
        continue
      }

      const result = await lookupDdd(ddd)
      replies.push(result ?? utilityMessages.dddNotFound(target.label, ddd))
    }

    await ctx.reply(replies.join('\n\n'))
  }
})

