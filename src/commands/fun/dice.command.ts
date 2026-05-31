import { defineCommand, normalizeCommandName } from '@deadbyte/runtime'

/** Regex que valida expressões de dado: [N]dF[op][M] ex: 2d6+3, d20, 4d6*2 */
const DICE_REGEX = /^(?<dice>\d*)d(?<faces>\d+)((?<op>[+\-*/])(?<mod>\d+))?$/i

/** Aliases textuais para o comando (sem ser a expressão em si) */
const NAMED_ALIASES = ['dado', 'dice', 'rolar', 'rola', 'd']

function aliasesFor(
  ctx: { config: { commands: Record<string, { aliases?: string[] }> } },
  commandId: string,
  defaults: string[]
): string[] {
  return ctx.config.commands[commandId]?.aliases ?? defaults
}

/** Clamps e parseia a quantidade de dados (1–100) */
function parseDiceCount(raw: string): number {
  return Math.min(Math.max(parseInt(raw || '1') || 1, 1), 100)
}

/** Clamps e parseia a quantidade de faces (2–1000) */
function parseFaces(raw: string): number {
  return Math.min(Math.max(parseInt(raw) || 6, 2), 1000)
}

/** Rola um dado de N faces, retorna valor e eventual nota crítica */
function roll(faces: number): { result: number; note: string } {
  const result = Math.floor(Math.random() * faces) + 1
  const note = result === faces ? '✨ crítico!' : result === 1 ? '💀 falha crítica!' : ''
  return { result, note }
}

/** Aplica o modificador sobre o total */
function applyModifier(total: number, op: string, mod: number): number {
  switch (op) {
    case '+': return total + mod
    case '-': return total - mod
    case '*': return total * mod
    case '/': return Math.floor(total / mod)
    default: return total
  }
}

/** Extrai a expressão de dado do rawName ou do argsText */
function resolveExpression(rawName: string, argsText: string, namedAliases: string[]): string | null {
  // Modo 1: !2d6+3 → rawName é a própria expressão
  if (DICE_REGEX.test(rawName)) return rawName

  // Modo 2: !dado 2d6+3 → argsText é a expressão
  const normalizedRaw = normalizeCommandName(rawName)
  if (namedAliases.map(normalizeCommandName).includes(normalizedRaw)) {
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
    const aliases = aliasesFor(ctx, 'fun.dice', diceCommand.aliases)

    return resolveExpression(rawName, argsText, aliases) !== null
  },
  async run(ctx) {
    const rawName = ctx.parsedCommand?.rawName ?? ''
    const argsText = ctx.parsedCommand?.argsText ?? ''
    const aliases = aliasesFor(ctx, 'fun.dice', diceCommand.aliases)

    const expression = resolveExpression(rawName, argsText, aliases)

    if (!expression) {
      await ctx.reply(
        '🎲 Informe uma expressão válida!\n\nExemplos:\n• `!2d6+3` — 2 dados de 6 lados, +3\n• `!d20` — 1 dado de 20 lados\n• `!dado 4d6` — 4 dados de 6 lados'
      )
      return
    }

    const match = DICE_REGEX.exec(expression)!
    const { dice: diceRaw, faces: facesRaw, op, mod: modRaw } = match.groups as Record<string, string>

    const diceCount = parseDiceCount(diceRaw)
    const faces = parseFaces(facesRaw)
    const modifier = modRaw ? parseInt(modRaw) : 0
    const hasModifier = Boolean(op && modRaw)

    // Rola todos os dados
    const rolls = Array.from({ length: diceCount }, () => roll(faces))
    const rawTotal = rolls.reduce((acc, r) => acc + r.result, 0)
    const finalTotal = hasModifier ? applyModifier(rawTotal, op, modifier) : rawTotal

    // Monta a mensagem
    let message = `🎲 *${finalTotal}*`

    if (hasModifier) {
      message += ` _(${rawTotal} ${op} ${modifier})_`
    }

    // Detalha cada dado se mais de um
    if (diceCount > 1) {
      message += `\n\n_${diceCount} dados de ${faces} lados:_\n`
      rolls.forEach((r, i) => {
        message += `• ${i + 1}º dado: \`${r.result}\`${r.note ? ` ${r.note}` : ''}\n`
      })
    } else {
      const note = rolls[0].note
      if (note) message += `\n_${note}_`
    }

    await ctx.reply(message)
  }
})
