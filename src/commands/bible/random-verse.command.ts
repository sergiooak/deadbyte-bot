import { defineCommand } from '@deadbyte/runtime'
import { bibleMessages } from '../../messages/bible.messages.js'
import { fetchBibleRandomVerse } from '../../services/texas/texas-api.service.js'
import { matchesCommandAlias } from '../../utils/commands.js'

export const randomVerseCommand = defineCommand({
  id: 'bible.random-verse',
  group: 'bible',
  name: 'Versículo aleatório',
  description: 'Envia um versículo aleatório da Bíblia.',
  aliases: ['biblia', 'versiculo'],
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  order: 1,
  supports: {
    private: true,
    groups: true,
    implicit: false,
  },
  configFields: [],
  async match(ctx) {
    return matchesCommandAlias(ctx, 'bible.random-verse', randomVerseCommand.aliases)
  },
  async run(ctx) {
    try {
      const result = await fetchBibleRandomVerse()
      await ctx.reply(bibleMessages.randomVerse(result.nome, result.capitulo, result.versiculo!, result.escrita as string))
    } catch {
      await ctx.reply(bibleMessages.fetchError)
    }
  },
})
