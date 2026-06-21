import { defineCommand } from '@deadbyte/runtime'
import { bibleMessages } from '../../messages/bible.messages.js'
import { fetchBibleVerse } from '../../services/texas/texas-api.service.js'
import { matchesCommandAlias } from '../../utils/commands.js'

function parseVerseArgs(argsText: string): { livro: string; versiculo: string } | null {
  const trimmed = argsText.trim()
  // Match: "Salmos 23:1" or "1 João 3:16" — last token is cap:ver
  const match = /^(.+?)\s+(\d+:\d+)$/.exec(trimmed)
  if (!match) return null
  return { livro: match[1].trim(), versiculo: match[2] }
}

export const getVerseCommand = defineCommand({
  id: 'bible.get-verse',
  group: 'bible',
  name: 'Pesquisar versículo',
  description: 'Busca um versículo específico da Bíblia. Ex: !versiculo Salmos 23:1',
  aliases: ['versiculo'],
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  order: 4,
  supports: {
    private: true,
    groups: true,
    implicit: false,
  },
  configFields: [],
  async match(ctx) {
    if (!matchesCommandAlias(ctx, 'bible.get-verse', getVerseCommand.aliases)) return false
    const argsText = ctx.parsedCommand?.argsText?.trim() ?? ''
    return parseVerseArgs(argsText) !== null
  },
  async run(ctx) {
    const argsText = ctx.parsedCommand?.argsText?.trim() ?? ''
    const parsed = parseVerseArgs(argsText)
    if (!parsed) {
      await ctx.reply(bibleMessages.usageVerse)
      return
    }

    try {
      const result = await fetchBibleVerse(parsed.livro, parsed.versiculo)
      await ctx.reply(bibleMessages.verse(result.nome, result.capitulo, result.versiculo!, result.escrita as string))
    } catch {
      await ctx.reply(bibleMessages.fetchError)
    }
  },
})
