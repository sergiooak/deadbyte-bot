import { defineCommand } from '@deadbyte/runtime'
import { formatUptime } from '../../app/create-bot-app.js'
import { systemMessages } from '../../messages/system.messages.js'
import { matchesCommandAlias } from '../../utils/commands.js'

export const statusCommand = defineCommand({
  id: 'system.status',
  group: 'system',
  name: 'Status',
  description: 'Mostra informações de runtime da instância.',
  aliases: ['status', 'stat'],
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  supports: {
    private: true,
    groups: true,
    implicit: false
  },
  configFields: [],
  async match(ctx) {
    return matchesCommandAlias(ctx, 'system.status', statusCommand.aliases)
  },
  async run(ctx) {
    const runtime = ctx.services.runtime as { startedAt?: number } | undefined
    const uptime = runtime?.startedAt ? formatUptime(Date.now() - runtime.startedAt) : 'desconhecido'
    await ctx.reply(systemMessages.status(ctx.config.instanceId, ctx.config.mode, uptime, ctx.config.clientId))
  }
})
