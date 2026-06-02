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
    return `{🌍|☎️} *{DDI|Código} +${ddiStr}* — ${flagEmoji(c.iso)} ${c.name}`
  }

  const list = countries.map((c) => `• ${flagEmoji(c.iso)} ${c.name}`).join('\n')
  return `{🌍|☎️} *{DDI|Código} +${ddiStr}* é compartilhado por ${countries.length} {países/territórios|lugares}:\n\n${list}`
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
      await ctx.reply('{Informe|Mande} um DDI, responda alguém ou marque a pessoa. Ex: *!ddi 55*')
      return
    }

    const replies: string[] = []

    for (const target of targets) {
      const parsed = parsePhoneNumber(target)
      const isShortDdiArg = target.source === 'argument' && target.digits.length <= 4 && !target.hasExplicitPlus

      if (isShortDdiArg) {
        const result = formatDdiResult(target.digits)
        replies.push(result ?? `DDI *+${target.digits}* não foi encontrado na base. A geografia olhou torto e saiu andando.`)
        continue
      }

      if (parsed.kind === 'brazil') {
        replies.push(`*${target.label}*: isso é número BR, meu nobre. DDI dele é +55 e o que você quer de verdade é *!ddd ${parsed.ddd ?? 'XX'}*. Usa o comando certo, sem violência contra a telefonia.`)
        continue
      }

      if (parsed.kind === 'local' && !target.hasExplicitPlus) {
        replies.push(`*${target.label}*: número sem DDI não dá para adivinhar país, campeão. Manda com + na frente, tipo *!ddi +351...*, porque bola de cristal está em manutenção.`)
        continue
      }

      const ddi = parsed.kind === 'international' ? parsed.ddi : target.digits
      if (!/^\d{1,4}$/.test(ddi)) {
        replies.push(`*${target.label}*: me entrega um DDI válido de 1 a 4 dígitos. Do jeito que veio, até a antena pediu demissão.`)
        continue
      }

      const result = formatDdiResult(ddi)
      replies.push(result ?? `DDI *+${ddi}* não foi encontrado na base. A geografia olhou torto e saiu andando.`)
    }

    await ctx.reply(replies.join('\n\n'))
  }
})
