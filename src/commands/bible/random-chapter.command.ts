import { defineCommand } from '@deadbyte/runtime'
import { bibleMessages } from '../../messages/bible.messages.js'
import { fetchBibleRandomChapter } from '../../services/texas/texas-api.service.js'
import { matchesCommandAlias } from '../../utils/commands.js'

export const randomChapterCommand = defineCommand({
  id: 'bible.random-chapter',
  group: 'bible',
  name: 'Capítulo aleatório',
  description: 'Envia um capítulo aleatório da Bíblia.',
  aliases: ['capitulo'],
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  order: 2,
  supports: {
    private: true,
    groups: true,
    implicit: false,
  },
  configFields: [],
  async match(ctx) {
    const argsText = ctx.parsedCommand?.argsText?.trim()
    if (!matchesCommandAlias(ctx, 'bible.random-chapter', randomChapterCommand.aliases)) return false
    // If args are provided, this command will be handled by get-chapter instead
    return !argsText
  },
  async run(ctx) {
    try {
      const result = await fetchBibleRandomChapter()
      const escrita = Array.isArray(result.escrita)
        ? result.escrita.map((v, i) => `*${i + 1}:* ${v}`).join('\n')
        : result.escrita
      await ctx.reply(bibleMessages.randomChapter(result.nome, result.capitulo, escrita))
    } catch {
      await ctx.reply(bibleMessages.fetchError)
    }
  },
})
