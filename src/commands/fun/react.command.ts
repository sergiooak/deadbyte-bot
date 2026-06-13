import { defineCommand } from '@deadbyte/runtime'
import { funMessages } from '../../messages/fun.messages.js'
import { matchesExplicitAlias } from '../../utils/commands.js'
import { decodeHtmlEntity, fetchRandomEmoji } from './emoji-hub.helper.js'

export const reactCommand = defineCommand({
  id: 'fun.react',
  group: 'fun',
  name: 'React',
  description: 'Reage à mensagem com um emoji aleatório.',
  aliases: ['reacao', 'reagir', 'react'],
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  order: 4,
  supports: {
    private: true,
    groups: true,
    implicit: true
  },
  configFields: [],
  async match(ctx) {
    if (ctx.message.body === '.') return true
    return matchesExplicitAlias(ctx, 'fun.react', reactCommand.aliases)
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

    const emoji = decodeHtmlEntity(data.htmlCode[0])
    await ctx.react(emoji)
  }
})
