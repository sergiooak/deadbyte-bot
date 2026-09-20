import { defineCommand, type CommandContext } from '@deadbyte/runtime'
import { fetchLyrics } from '../../services/texas/texas-api.service.js'
import { matchesExplicitAlias } from '../../utils/commands.js'

function resolveTerm(ctx: CommandContext): string | null {
  const argsText = ctx.parsedCommand?.argsText?.trim()
  if (argsText) return argsText
  if (ctx.quotedMessage?.body?.trim()) return ctx.quotedMessage.body.trim()
  return null
}

export const lyricsCommand = defineCommand({
  id: 'music.lyrics',
  group: 'music',
  name: 'Letra de música',
  description: 'Busca a letra de uma música.',
  aliases: ['letra', 'lyrics', 'letras'],
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  order: 2,
  supports: {
    private: true,
    groups: true,
    implicit: false
  },
  configFields: [],
  async match(ctx) {
    return matchesExplicitAlias(ctx, 'music.lyrics', lyricsCommand.aliases)
  },
  async run(ctx) {
    const term = resolveTerm(ctx)
    if (!term) {
      await ctx.reply('Manda o nome da música depois do comando.\nEx: *!letra 1x1 hollywood undead*')
      return
    }

    try {
      const lyrics = await fetchLyrics(term)
      await ctx.reply(lyrics)
    } catch {
      await ctx.reply('Não consegui encontrar a letra dessa música. Verifica o nome e tenta de novo.')
    }
  }
})
