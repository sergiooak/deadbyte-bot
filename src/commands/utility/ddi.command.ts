import { defineCommand, normalizeCommandName } from '@deadbyte/runtime'
import { flagEmoji, lookupDdi } from './ddi-data.helper.js'

function aliasesFor(
  ctx: { config: { commands: Record<string, { aliases?: string[] }> } },
  commandId: string,
  defaults: string[]
): string[] {
  return ctx.config.commands[commandId]?.aliases ?? defaults
}

/** Extrai o número de DDI tanto de "!ddi 55" quanto de "!ddi55" */
function extractDdiArg(
  normalizedName: string,
  argsText: string,
  normalizedAliases: string[]
): string {
  // Caso: !ddi 55 → argsText = '55'
  if (argsText.trim()) return argsText.trim()

  // Caso: !ddi55 → normalizedName = 'ddi55'
  for (const alias of normalizedAliases) {
    if (normalizedName.startsWith(alias) && normalizedName.length > alias.length) {
      return normalizedName.slice(alias.length)
    }
  }

  return ''
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

    // Aceita: !ddi 55 (normalized = 'ddi') ou !ddi55 (normalized = 'ddi55')
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

    const ddiStr = extractDdiArg(normalized, argsText, normalizedAliases)

    if (!ddiStr || !/^\d{1,4}$/.test(ddiStr)) {
      await ctx.reply('{Informe|Mande} um DDI válido (1 a 4 dígitos). Ex: *!ddi 55*')
      return
    }

    const ddiNum = parseInt(ddiStr, 10)
    const countries = lookupDdi(ddiNum)

    if (!countries || countries.length === 0) {
      await ctx.reply(`DDI *+${ddiStr}* {não foi encontrado|não apareceu} na base de dados.`)
      return
    }

    if (countries.length === 1) {
      const c = countries[0]
      await ctx.reply(`{🌍|☎️} *{DDI|Código} +${ddiStr}* — ${flagEmoji(c.iso)} ${c.name}`)
      return
    }

    // Múltiplos países compartilham o mesmo DDI
    const list = countries.map((c) => `• ${flagEmoji(c.iso)} ${c.name}`).join('\n')
    await ctx.reply(`{🌍|☎️} *{DDI|Código} +${ddiStr}* é compartilhado por ${countries.length} {países/territórios|lugares}:\n\n${list}`)
  }
})
