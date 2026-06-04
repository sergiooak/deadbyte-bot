import { defineCommand } from '@deadbyte/runtime'

import { formatMathCommandOutput } from '../../utils/formatter'
import { matchesCommandAlias } from '../../utils/commands.js'
import { parseMathExpression } from '../../utils/math'

const NAMED_ALIASES = ['calc', 'calcular', 'math', 'conta']

function getExpressionText(ctx: { parsedCommand?: { explicit?: boolean; argsText: string }; message: { body: string } }): string {
  return ctx.parsedCommand?.explicit
    ? ctx.parsedCommand.argsText.trim()
    : ctx.message.body.trim()
}

export const mathCommand = defineCommand({
  id: 'fun.math',
  group: 'fun',
  name: 'Calculadora',
  description:
    'Calcula expressões matemáticas longas com precedência e parênteses. Também valida contas com "=" e responde Correto/Errado.',
  aliases: NAMED_ALIASES,
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  supports: {
    private: true,
    groups: true,
    implicit: true,
  },
  configFields: [],
  async match(ctx) {
    if (ctx.parsedCommand?.explicit) {
      if (!matchesCommandAlias(ctx, 'fun.math', mathCommand.aliases)) return false

      return parseMathExpression(ctx.parsedCommand.argsText.trim()) !== null
    }

    return parseMathExpression(ctx.message.body.trim()) !== null
  },
  async run(ctx) {
    const result = parseMathExpression(getExpressionText(ctx))

    if (!result) {
      await ctx.reply(
        '{🧮|📐} Não consegui calcular essa expressão.\n\nExemplos válidos:\n• `1 + 2 * 3`\n• `(4 + 6) / 2`\n• `2 ^ 3 ^ 2`\n• `1 + 1 = 2` (validação)\n• `1 + 1 = 3` (retorna Errado)\n• `40% de 250` · `raiz cúbica de 27` · `6³`'
      )
      return
    }

    await ctx.reply(formatMathCommandOutput(result.explanation))
  },
})
