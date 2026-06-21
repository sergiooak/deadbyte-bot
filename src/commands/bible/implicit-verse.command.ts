import { defineCommand } from '@deadbyte/runtime'
import { bibleMessages } from '../../messages/bible.messages.js'
import { fetchBibleVerse, fetchBibleChapter } from '../../services/texas/texas-api.service.js'
import { parseImplicitVerseRef } from './bible-books.js'

export const implicitVerseCommand = defineCommand({
  id: 'bible.implicit-verse',
  group: 'bible',
  name: 'Referência bíblica implícita',
  description: 'Detecta referências bíblicas automáticas no chat. Ex: Salmos 23:1 ou João 1',
  aliases: [],
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  order: 7,
  supports: {
    private: true,
    groups: true,
    implicit: true,
  },
  configFields: [],
  async match(ctx) {
    const body = ctx.message?.body?.trim() ?? ''
    return parseImplicitVerseRef(body) !== null
  },
  async run(ctx) {
    const body = ctx.message?.body?.trim() ?? ''
    const parsed = parseImplicitVerseRef(body)
    if (!parsed) return

    try {
      if (parsed.kind === 'verse') {
        const result = await fetchBibleVerse(parsed.livro, parsed.versiculo)
        await ctx.reply(bibleMessages.verse(result.nome, result.capitulo, result.versiculo!, result.escrita as string))
      } else {
        const result = await fetchBibleChapter(parsed.livro, parsed.capitulo)
        const escrita = Array.isArray(result.escrita)
          ? result.escrita.map((v, i) => `*${i + 1}:* ${v}`).join('\n')
          : result.escrita as string
        await ctx.reply(bibleMessages.chapter(result.nome, result.capitulo, escrita))
      }
    } catch {
      await ctx.reply(bibleMessages.fetchError)
    }
  },
})
