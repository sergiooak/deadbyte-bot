import { defineCommand } from '@deadbyte/runtime'
import { ofetch } from 'ofetch'
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

  return `{📍|☎️|📞} *{DDD|Código|Discagem Direta a Distância} ${dddStr}* — ${stateName} (${data.state})\n\n{🏙️|🌆|🌃} *{Cidades|Municípios|Localidades|Regiões} ({${cities.length}|total de ${cities.length}|${cities.length} no total}):* ${cityList}`
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
    return matchesCommandAliasWithSuffix(ctx, 'utility.ddd', dddCommand.aliases, /^\d+$/)
  },
  async run(ctx) {
    const normalized = ctx.parsedCommand?.normalizedName ?? ''
    const argsText = ctx.parsedCommand?.argsText ?? ''
    const normalizedAliases = getNormalizedCommandAliases(ctx.config, 'utility.ddd', dddCommand.aliases)
    const argValue = extractDddArg(normalized, argsText, normalizedAliases)
    const targets = await collectPhoneTargets(ctx, argValue)

    if (targets.length === 0) {
      await ctx.reply(`{Informe|Mande|Joga aí|Solta|Forneça} um DDD, responda {a mensagem de }alguém ou marque a pessoa. {Ex:|Exemplo, já que aparentemente precisa:|Tipo assim:|Desse jeito|Nesse modelo:} *!ddd 34*`)
      return
    }

    const replies: string[] = []

    for (const target of targets) {
      const parsed = parsePhoneNumber(target)
      const ddd = parsed.kind === 'brazil' || parsed.kind === 'local' ? parsed.ddd : undefined

      if (parsed.kind === 'international') {
        replies.push(`*${target.label}*: {` +
          `{🤓|☝️🤓|☝️} {isso aí tem cara de número gringo, meu {consagrado|caro}}|esse número veio de fora com mala despachada|isso aí está com cheiro de roaming internacional|esse número claramente passou pela imigração|isso aí tem sotaque de aeroporto|esse número chegou no Brasil só a turismo|isso não é tupiniquim não ein?|esse número aí fala “hello” antes de falar “alô”|isso aí está mais internacional que tomada de hotel|esse número está pedindo carimbo no passaporte|isso aí veio de fora e nem tentou disfarçar|esse número aí paga mais caro em copacabana|esse número claramente não sabe o hino do Brasil|esse ai tem sotaque de gringo|Hello mai friend|Brasil desse aí é com Z}` +
          `}. ` +
          `{DDD é coisa {de BR|do Brasil}|DDD é só para número brasileiro pô|DDD serve para número brasileiro, conceito avançado, aparentemente|Tem DDD nesse {trem|número} aí não}.` +
          `{Usa|Use} *!ddi +${parsed.ddi}* e {` +
          `para de botar passaporte na fila do SUS|não tenta nacionalizar o coitado no grito|para de fazer intercâmbio no comando errado|pare de passar vergonha|não tenta abrasileirar o número na marra|aceita que o mundo é maior que o +55|não coloca camisa da seleção em número estrangeiro|presta mais atenção}` +
          `}.`)
        continue
      }

      if (!ddd || !/^\d{2}$/.test(ddd)) {
        replies.push(
          `*${target.label}*: {me dá um DDD válido com 2 dígitos, criatura iluminada|DDD tem 2 dígitos, tecnologia de ponta, eu sei|manda um DDD com 2 dígitos e para de inventar coisa|isso aí precisa ser um DDD de 2 dígitos, não a idade da sua vó|eu preciso de um DDD real com 2 dígitos, não uma fanfic numérica|digita um DDD com 2 dígitos ai chefe|não fode pôm DDD é 2 numeros|Uai que tanto de numero é esse ai?? DDD tem 2 digitos só|Uai, ultima vez que eu vi DDD tinha 2 digitos}. Ex: *!ddd 34*`
        )
        continue
      }

      const result = await lookupDdd(ddd)
      replies.push(
        result ??
        `*${target.label}*: {` +
        `{DDD *${ddd}* não foi encontrado|O DDD *${ddd}* não consta no mapa civilizado da telefonia|Procurei o DDD *${ddd}* e ele simplesmente não existe no nosso plano terrestre|O DDD *${ddd}* deve ser do Acre, não existe!|DDD *${ddd}* não bate com nenhum lugar conhecido pela humanidade|Esse DDD *${ddd}* está mais desaparecido que documentação de projeto legado|DDD *${ddd}* não existe aqui, pelo menos não nesta linha do tempo|Não achei o DDD *${ddd}*, e olha que eu tentei viu?|Uai, esxiste DDD *${ddd}* não ein?}` +
        `. ` +
        `{Ou ele é inválido|Ou isso aí é inválido|Ou esse número saiu direto da sua imaginação|Ou você tropeçou no teclado|Ou alguém ensinou telefonia errada para você|Ou esse DDD veio de um Brasil alternativo|Ou a Anatel acordou criativa e esqueceu de me avisar|Ou você descobriu uma unidade federativa secreta|Ou você está usando geografia freestyle}` +
        `, {` +
        `ou você inventou telefonia freestyle|ou você desbloqueou o modo ficção científica da discagem|ou você tentou cadastrar Nárnia no DDD|ou você criou um CEP com complexo de telefone|ou você está fazendo fanfic de operadora|ou você abriu uma filial telefônica em Wakanda|ou você está testando os limites da cartografia nacional|ou você decidiu que o Brasil precisava de DLC de DDD|ou você confundiu DDD com número da sorte|ou você meteu o louco}` +
        `}.`
      )
    }

    await ctx.reply(replies.join('\n\n'))
  }
})
