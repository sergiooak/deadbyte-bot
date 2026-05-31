import { defineCommand, normalizeCommandName } from '@deadbyte/runtime'
import { aliasesFor, decodeHtmlEntity, fetchRandomEmoji } from './emoji-hub.helper.js'

export const emojiCommand = defineCommand({
  id: 'fun.emoji',
  group: 'fun',
  name: 'Emoji',
  description: 'Retorna um emoji aleatório com seu nome e categoria.',
  aliases: ['emoji', 'em'],
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  supports: {
    private: true,
    groups: true,
    implicit: false
  },
  configFields: [],
  async match(ctx) {
    const normalized = ctx.parsedCommand?.normalizedName
    return Boolean(normalized && aliasesFor(ctx, 'fun.emoji', emojiCommand.aliases).map(normalizeCommandName).includes(normalized))
  },
  async run(ctx) {
    const data = await fetchRandomEmoji()

    if (!data) {
      await ctx.reply('Não foi possível obter um emoji no momento. Tente novamente.')
      return
    }

    const emoji = data.htmlCode.map(decodeHtmlEntity).join('')

    await ctx.reply(`${emoji}\n\nNome: ${data.name}\nCategoria: ${data.category}\nGrupo: ${data.group}`)
  }
})
