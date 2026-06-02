import { defineCommand, normalizeCommandName } from '@deadbyte/runtime'

function aliasesFor(ctx: { config: { commands: Record<string, { aliases?: string[] }> } }, commandId: string, defaults: string[]) {
  return ctx.config.commands[commandId]?.aliases ?? defaults
}

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
    const normalized = ctx.parsedCommand?.normalizedName
    return Boolean(normalized && aliasesFor(ctx, 'system.ping', pingCommand.aliases).map(normalizeCommandName).includes(normalized))
  },
  async run(ctx) {
    await ctx.reply('{pong|pong!|online por aqui|tô vivo}')
  }
})
