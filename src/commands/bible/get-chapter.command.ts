import { defineCommand } from '@deadbyte/runtime'
import { bibleMessages } from '../../messages/bible.messages.js'
import { fetchBibleChapter } from '../../services/texas/texas-api.service.js'
import { matchesCommandAlias } from '../../utils/commands.js'

function parseChapterArgs(argsText: string): { livro: string; capitulo: string } | null {
  const trimmed = argsText.trim()
  // Match: "Salmos 23" or "1 João 3" etc. — last token is chapter number
  const match = /^(.+?)\s+(\d+)$/.exec(trimmed)
  if (!match) return null
  return { livro: match[1].trim(), capitulo: match[2] }
}

export const getChapterCommand = defineCommand({
  id: 'bible.get-chapter',
  group: 'bible',
  name: 'Pesquisar capítulo',
  description: 'Busca um capítulo específico da Bíblia. Ex: !capitulo Salmos 23',
  aliases: ['capitulo'],
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  order: 3,
  supports: {
    private: true,
    groups: true,
    implicit: false,
  },
  configFields: [],
  async match(ctx) {
    if (!matchesCommandAlias(ctx, 'bible.get-chapter', getChapterCommand.aliases)) return false
    const argsText = ctx.parsedCommand?.argsText?.trim() ?? ''
    return parseChapterArgs(argsText) !== null
  },
  async run(ctx) {
    const argsText = ctx.parsedCommand?.argsText?.trim() ?? ''
    const parsed = parseChapterArgs(argsText)
    if (!parsed) {
      await ctx.reply(bibleMessages.usageChapter)
      return
    }

    try {
      const result = await fetchBibleChapter(parsed.livro, parsed.capitulo)
      const escrita = Array.isArray(result.escrita)
        ? result.escrita.map((v, i) => `*${i + 1}:* ${v}`).join('\n')
        : result.escrita as string
      await ctx.reply(bibleMessages.chapter(result.nome, result.capitulo, escrita))
    } catch {
      await ctx.reply(bibleMessages.fetchError)
    }
  },
})
