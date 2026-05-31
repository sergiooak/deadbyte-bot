import { defineCommand, normalizeCommandName } from '@deadbyte/runtime'
import { aliasesFor, decodeHtmlEntity, fetchRandomEmoji } from './emoji-hub.helper.js'

export const reactCommand = defineCommand({
  id: 'fun.react',
  group: 'fun',
  name: 'React',
  description: 'Reage à mensagem com um emoji aleatório.',
  aliases: ['react', 'reacao', 'reagir'],
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  supports: {
    private: true,
    groups: true,
    implicit: true
  },
  configFields: [],
  async match(ctx) {
    if (ctx.message.body === '.') return true
    const normalized = ctx.parsedCommand?.normalizedName
    return Boolean(normalized && aliasesFor(ctx, 'fun.react', reactCommand.aliases).map(normalizeCommandName).includes(normalized))
  },
  async run(ctx) {
    const data = await fetchRandomEmoji()

    if (!data) {
      await ctx.reply('Não foi possível obter um emoji no momento. Tente novamente.')
      return
    }

    // Use only the base codepoint (first htmlCode) to maximise reaction compatibility
    const emoji = decodeHtmlEntity(data.htmlCode[0])

    await ctx.react(emoji)
  }
})
