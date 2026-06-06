import { defineCommand } from '@deadbyte/runtime'
import { phoneCodeMessages } from '../../messages/phone-code.messages.js'
import { getNormalizedCommandAliases, matchesCommandAliasWithSuffix } from '../../utils/commands.js'
import { flagEmoji, lookupDdi } from './ddi-data.helper.js'
import { collectPhoneTargets, parsePhoneNumber } from './phone-code.helper.js'

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

  return phoneCodeMessages.ddiResult(
    ddiStr,
    countries.map((country) => ({ name: country.name, flag: flagEmoji(country.iso) }))
  )
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
    return matchesCommandAliasWithSuffix(ctx, 'utility.ddi', ddiCommand.aliases, /^\d+$/)
  },
  async run(ctx) {
    const normalized = ctx.parsedCommand?.normalizedName ?? ''
    const argsText = ctx.parsedCommand?.argsText ?? ''
    const normalizedAliases = getNormalizedCommandAliases(ctx.config, 'utility.ddi', ddiCommand.aliases)
    const argValue = extractDdiArg(normalized, argsText, normalizedAliases)
    const targets = await collectPhoneTargets(ctx, argValue)

    if (targets.length === 0) {
      await ctx.reply(phoneCodeMessages.ddiMissingInput)
      return
    }

    const replies: string[] = []

    for (const target of targets) {
      const parsed = parsePhoneNumber(target)
      const isShortDdiArg = target.source === 'argument' && target.digits.length <= 4 && !target.hasExplicitPlus

      if (isShortDdiArg) {
        const result = formatDdiResult(target.digits)
        replies.push(result ?? phoneCodeMessages.ddiNotFound(target.digits))
        continue
      }

      if (parsed.kind === 'brazil') {
        replies.push(phoneCodeMessages.ddiBrazilian(target.label, parsed.ddd))
        continue
      }

      if (parsed.kind === 'local' && !target.hasExplicitPlus) {
        replies.push(phoneCodeMessages.ddiLocalWithoutCountry(target.label))
        continue
      }

      const ddi = parsed.kind === 'international' ? parsed.ddi : target.digits
      if (!/^\d{1,4}$/.test(ddi)) {
        replies.push(phoneCodeMessages.ddiInvalid(target.label))
        continue
      }

      const result = formatDdiResult(ddi)
      replies.push(result ?? phoneCodeMessages.ddiNotFound(ddi))
    }

    await ctx.reply(replies.join('\n\n'))
  }
})
