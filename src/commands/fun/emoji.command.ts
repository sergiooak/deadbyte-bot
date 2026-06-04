import { defineCommand } from '@deadbyte/runtime'
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
      await ctx.reply('Não foi possível obter um emoji {no momento|agora}. {Tente novamente.|Pode tentar de novo daqui a pouco.}')
      return
    }

    if (!data) {
      await ctx.reply('Não foi possível obter um emoji {no momento|agora}. {Tente novamente.|Pode tentar de novo daqui a pouco.}')
      return
    }

    const emoji = data.htmlCode.map(decodeHtmlEntity).join('')
    await ctx.reply(`${emoji}\n\n*{Nome|Chamam de}:* ${data.name}\n*Categoria:* ${data.category}\n*Grupo:* ${data.group}`)
  }
})
