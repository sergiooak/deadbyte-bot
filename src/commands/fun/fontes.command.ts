import { defineCommand } from '@deadbyte/runtime'
import { fetchTexasFontes } from '../../services/texas/texas-api.service.js'
import { matchesExplicitAlias } from '../../utils/commands.js'

function resolveText(ctx: Parameters<typeof fontesCommand.run>[0]): string | null {
  const argsText = ctx.parsedCommand?.argsText?.trim()
  if (argsText) return argsText
  if (ctx.quotedMessage?.body?.trim()) return ctx.quotedMessage.body.trim()
  return null
}

export const fontesCommand = defineCommand({
  id: 'fun.fontes',
  group: 'fun',
  name: 'Fontes / estilos de texto',
  description: 'Converte texto para diversos estilos e fontes Unicode.',
  aliases: ['fontes', 'fonts', 'morefonts', 'fancy', 'estilos', 'letras', 'unicode'],
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  supports: {
    private: true,
    groups: true,
    implicit: false
  },
  configFields: [],
  async match(ctx) {
    return matchesExplicitAlias(ctx, 'fun.fontes', fontesCommand.aliases)
  },
  async run(ctx) {
    const text = resolveText(ctx)
    if (!text) {
      await ctx.reply('Manda um texto depois do comando ou responde a uma mensagem.\nEx: *!fontes bom dia*')
      return
    }

    try {
      const result = await fetchTexasFontes(text)
      await ctx.reply(result)
    } catch {
      await ctx.reply('Não foi possível converter o texto. Tente novamente.')
    }
  }
})
