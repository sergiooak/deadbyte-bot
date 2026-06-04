import { defineCommand } from '@deadbyte/runtime'
import { matchesCommandAlias } from '../../utils/commands.js'

export const pingCommand = defineCommand({
  id: 'system.ping',
  group: 'system',
  name: 'Ping',
  description: 'Responde pong para validar se o bot está vivo.',
  aliases: ['ping', 'p'],
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  supports: {
    private: true,
    groups: true,
    implicit: false
  },
  configFields: [],
  async match(ctx) {
    return matchesCommandAlias(ctx, 'system.ping', pingCommand.aliases)
  },
  async run(ctx) {
    await ctx.reply('{pong|pong!|online por aqui|tô vivo}')
  }
})
