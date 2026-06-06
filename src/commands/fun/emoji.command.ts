import { defineCommand } from '@deadbyte/runtime'
import { funMessages } from '../../messages/fun.messages.js'
import { matchesCommandAlias } from '../../utils/commands.js'
import { decodeHtmlEntity, fetchRandomEmoji } from './emoji-hub.helper.js'

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
    return matchesCommandAlias(ctx, 'fun.emoji', emojiCommand.aliases)
  },
  async run(ctx) {
    let data
    try {
      data = await fetchRandomEmoji()
    } catch {
      await ctx.reply(funMessages.emojiUnavailable)
      return
    }

    if (!data) {
      await ctx.reply(funMessages.emojiUnavailable)
      return
    }

    const emoji = data.htmlCode.map(decodeHtmlEntity).join('')
    await ctx.reply(funMessages.emojiResult(emoji, data))
  }
})
