import { defineCommand } from '@deadbyte/runtime'
import { funMessages } from '../../messages/fun.messages.js'
import { matchesCommandAlias } from '../../utils/commands.js'
import { parseMathExpression } from '../../utils/math'

const NAMED_ALIASES = ['calc', 'calcular', 'math', 'conta']

function getExpressionText(ctx: { parsedCommand?: { explicit?: boolean; argsText: string }; message: { body: string } }): string {
  return ctx.parsedCommand?.explicit
    ? ctx.parsedCommand.argsText.trim()
    : ctx.message.body.trim()
}

function formatMathResult(explanation: string): string {
  return /^[✅❌]/.test(explanation)
    ? funMessages.mathCheckedResult(explanation)
    : funMessages.mathResult(explanation)
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
      await ctx.reply(funMessages.mathInvalid)
      return
    }

    await ctx.reply(formatMathResult(result.explanation))
  },
})
