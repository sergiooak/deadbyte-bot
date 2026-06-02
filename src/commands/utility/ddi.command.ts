import { defineCommand, normalizeCommandName } from '@deadbyte/runtime'
import { flagEmoji, lookupDdi } from './ddi-data.helper.js'
import { collectPhoneTargets, parsePhoneNumber } from './phone-code.helper.js'

function aliasesFor(
  ctx: { config: { commands: Record<string, { aliases?: string[] }> } },
  commandId: string,
  defaults: string[]
): string[] {
  return ctx.config.commands[commandId]?.aliases ?? defaults
}

/** Extrai o DDI tanto de "!ddi 55" quanto de "!ddi55". */
function extractDdiArg(
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

function formatDdiResult(ddiStr: string): string | undefined {
  const ddiNum = parseInt(ddiStr, 10)
  const countries = lookupDdi(ddiNum)

  if (!countries || countries.length === 0) {
    return undefined
  }

  if (countries.length === 1) {
    const c = countries[0]
    return `{🌍|☎️|🌐} *{DDI|Código|Discagem} +${ddiStr}* {—|➜|-} ${flagEmoji(c.iso)} ${c.name}`
  }

  const list = countries.map((c) => `• ${flagEmoji(c.iso)} ${c.name}`).join('\n')
  return `{🌍|☎️|🌐} *{DDI|Código|Discagem} +${ddiStr}* {é compartilhado por|pertence a|está associado a} ${countries.length} {países/territórios|lugares|regiões}:\n\n${list}`
}

export const ddiCommand = defineCommand({
  id: 'utility.ddi',
  group: 'utility',
  name: 'DDI',
  description: 'Informa o(s) país(es) associados a um DDI (código de discagem internacional).',
  aliases: ['ddi'],
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
    const aliases = aliasesFor(ctx, 'utility.ddi', ddiCommand.aliases)
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
    const aliases = aliasesFor(ctx, 'utility.ddi', ddiCommand.aliases)
    const normalizedAliases = aliases.map(normalizeCommandName)
    const argValue = extractDdiArg(normalized, argsText, normalizedAliases)
    const targets = await collectPhoneTargets(ctx, argValue)

    if (targets.length === 0) {
      await ctx.reply(`{Me manda|Informe|Mande|Joga aí|Solta|Forneça} um DDI, responda {a mensagem de alguém|alguém} ou marque {a pessoa|o gringo}. {Ex:|Exemplo, já que aparentemente precisa:|Tipo assim:|Desse jeito|Nesse modelo:} *!ddi 52*`)
      return
    }

    const replies: string[] = []

    for (const target of targets) {
      const parsed = parsePhoneNumber(target)
      const isShortDdiArg = target.source === 'argument' && target.digits.length <= 4 && !target.hasExplicitPlus

      if (isShortDdiArg) {
        const result = formatDdiResult(target.digits)
        replies.push(
          result ??
          `{` +
          `DDI *+${target.digits}* não foi encontrado na base|O DDI *+${target.digits}* não consta no atlas minimamente funcional da telefonia|Procurei o DDI *+${target.digits}* e não achei|DDI *+${target.digits}* não apareceu aqui|Esse DDI *+${target.digits}* não bate com nenhum país conhecido neste planeta|DDI *+${target.digits}* não foi localizado nem com boa vontade|Esse DDI *+${target.digits}* está mais perdido que turista sem roaming|DDI *+${target.digits}* deu negativo no teste de existência internacional|Não achei o DDI *+${target.digits}*, e olha que eu olhei num monte de mapa aqui|Não achei nem no wikipédia o DDI *+${target.digits}*` +
          `}{.|!|!!}`
        )
        continue
      }

      if (parsed.kind === 'brazil') {
        replies.push(
          `*${target.label}*: {` +
          `{☝️🤓|🤓|☝️} {isso é número BR, meu {nobre|chapa|consagrado}}|isso aí é brasileiro, campeão da geografia básica|esse número ai tem até CPF|isso aí é BR com firma reconhecida|esse número é mais +55 do que pão de queijo em rodoviária|isso aí está no território nacional|isso aí veio com RG, não com passaporte}` +
          `. ` +
          `{DDI dele é +55|O DDI dele é +55|No plano internacional, ele mora no +55|O passaporte telefônico dele é +55|A certidão internacional dele aponta +55}` +
          ` e {` +
          `o que você quer de verdade é *!ddd ${parsed.ddd ?? 'XX'}*|o comando que você está procurando, é *!ddd ${parsed.ddd ?? 'XX'}*}` +
          `. ` +
          `{{Use|Usa|Manda} o comando certo|Vai no comando certo|Aplica o comando correto}` +
          `}` +
          `{.|!|!!}`
        )
        continue
      }

      if (parsed.kind === 'local' && !target.hasExplicitPlus) {
        replies.push(`*${target.label}*: {número sem DDI não dá para adivinhar país, campeão|número sem DDI é bruxaria demais, amigo|sem DDI na frente eu não tenho bola de cristal, chefe}. {Manda com + na frente, tipo *!ddi +351...*|Bota um + na frente, tipo *!ddi +351...*|Coloca um + na frente, tipo *!ddi +351...*}, {porque bola de cristal está em manutenção|porque a minha bola de cristal deu problemas|porque não sou vidente|porque meus dons psíquicos estão com defeito}.`)
        continue
      }

      const ddi = parsed.kind === 'international' ? parsed.ddi : target.digits
      if (!/^\d{1,4}$/.test(ddi)) {
        replies.push(`*${target.label}*: {me entrega um DDI válido de 1 a 4 dígitos|manda um DDI que tenha entre 1 e 4 dígitos|preciso de um DDI com 1 a 4 dígitos mesmo}. {Do jeito que veio, até a antena pediu demissão|Desse jeito aí, até o servidor chorou|Com isso aí, a rede ficou deprimida|Assim não rola, o wifi ficou triste}.`)
        continue
      }

      const result = formatDdiResult(ddi)
      replies.push(result ?? `{DDI *+${ddi}* não foi encontrado na base|O DDI *+${ddi}* não consta aqui|Procurei o DDI *+${ddi}* e travou|Esse DDI *+${ddi}* não apareceu no radar|DDI *+${ddi}* não bateu com nada}. {A geografia olhou torto e saiu andando|O mapa ficou com raiva e sumiu|A GPS começou a rir da situação|O atlas pediu mais tempo pra processar|A cartografia teve uma crise existencial}.`)
    }

    await ctx.reply(replies.join('\n\n'))
  }
})
