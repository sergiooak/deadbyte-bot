import { defineCommand } from '@deadbyte/runtime'
import { funMessages } from '../../messages/fun.messages.js'
import { matchesCommandAlias } from '../../utils/commands.js'

const DICE_REGEX = /^(?<dice>\d*)d(?<faces>\d+)((?<op>[+\-*/])(?<mod>\d+))?$/i
const NAMED_ALIASES = ['dado', 'dice', 'rolar', 'rola', 'd']

function parseDiceCount(raw: string): number {
  return Math.min(Math.max(parseInt(raw || '1') || 1, 1), 100)
}

function parseFaces(raw: string): number {
  return Math.min(Math.max(parseInt(raw) || 6, 2), 1000)
}

function roll(faces: number): { result: number; note: string } {
  const result = Math.floor(Math.random() * faces) + 1
  const note = result === faces ? funMessages.diceCriticalNote : result === 1 ? funMessages.diceFumbleNote : ''
  return { result, note }
}

function applyModifier(total: number, op: string, mod: number): number {
  switch (op) {
    case '+': return total + mod
    case '-': return total - mod
    case '*': return total * mod
    case '/': return Math.floor(total / mod)
    default: return total
  }
}

function formatDiceTotal(finalTotal: number, rawTotal: number, op: string | undefined, modifier: number): string {
  return op ? `${finalTotal} _(${rawTotal} ${op} ${modifier})_` : String(finalTotal)
}

function formatDiceDetails(diceCount: number, faces: number, rolls: Array<{ result: number; note: string }>): string {
  if (diceCount > 1) {
    const rollLines = rolls
      .map((roll, index) => `• ${index + 1}º {dado|rolagem}: \`${roll.result}\`${roll.note ? ` ${roll.note}` : ''}`)
      .join('\n')

    return `\n_${diceCount} {dados|rolagens} de ${faces} lados, porque uma rolagem só seria simples demais:_\n${rollLines}`
  }

  const note = rolls[0]?.note
  return note ? `\n_${note}_` : ''
}

function resolveExpression(isNamedAlias: boolean, rawName: string, argsText: string): string | null {
  if (DICE_REGEX.test(rawName)) return rawName

  if (isNamedAlias) {
    const arg = argsText.trim()
    if (DICE_REGEX.test(arg)) return arg
  }

  return null
}

export const diceCommand = defineCommand({
  id: 'fun.dice',
  group: 'fun',
  name: 'Dado',
  description: 'Rola dados com expressão NdF[±N]. Ex: !2d6+3, !d20, !dado 4d6',
  aliases: NAMED_ALIASES,
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  supports: {
    private: true,
    groups: true,
    implicit: false
  },
  configFields: [],
  async match(ctx) {
    const rawName = ctx.parsedCommand?.rawName ?? ''
    const argsText = ctx.parsedCommand?.argsText ?? ''

    return resolveExpression(matchesCommandAlias(ctx, 'fun.dice', diceCommand.aliases), rawName, argsText) !== null
  },
  async run(ctx) {
    const rawName = ctx.parsedCommand?.rawName ?? ''
    const argsText = ctx.parsedCommand?.argsText ?? ''

    const expression = resolveExpression(matchesCommandAlias(ctx, 'fun.dice', diceCommand.aliases), rawName, argsText)

    if (!expression) {
      await ctx.reply(funMessages.diceInvalid)
      return
    }

    const match = DICE_REGEX.exec(expression)!
    const { dice: diceRaw, faces: facesRaw, op, mod: modRaw } = match.groups as Record<string, string>

    const diceCount = parseDiceCount(diceRaw)
    const faces = parseFaces(facesRaw)
    const modifier = modRaw ? parseInt(modRaw) : 0
    const hasModifier = Boolean(op && modRaw)
    const rolls = Array.from({ length: diceCount }, () => roll(faces))
    const rawTotal = rolls.reduce((acc, item) => acc + item.result, 0)
    const finalTotal = hasModifier ? applyModifier(rawTotal, op, modifier) : rawTotal

    const total = formatDiceTotal(finalTotal, rawTotal, op, modifier)
    const details = formatDiceDetails(diceCount, faces, rolls)
    await ctx.reply(funMessages.diceRoll(total, details))
  }
})
