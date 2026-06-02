import { defineCommand, normalizeCommandName } from '@deadbyte/runtime'
import { formatUptime } from '../../app/create-bot-app.js'

function aliasesFor(ctx: { config: { commands: Record<string, { aliases?: string[] }> } }, commandId: string, defaults: string[]) {
  return ctx.config.commands[commandId]?.aliases ?? defaults
}

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
    const normalized = ctx.parsedCommand?.normalizedName
    return Boolean(normalized && aliasesFor(ctx, 'system.status', statusCommand.aliases).map(normalizeCommandName).includes(normalized))
  },
  async run(ctx) {
    const runtime = ctx.services.runtime as { startedAt?: number } | undefined
    const uptime = runtime?.startedAt ? formatUptime(Date.now() - runtime.startedAt) : 'unknown'
    await ctx.reply(
      [
        '{🤖|⚙️|📡} *Status da instância*',
        '',
        `instance: ${ctx.config.instanceId}`,
        `mode: ${ctx.config.mode}`,
        `uptime: ${uptime}`,
        `client: ${ctx.config.clientId}`
      ].join('\n')
    )
  }
})
