import type { CommandContext, DeadByteCommand } from '@deadbyte/runtime'
import { middlewareMessages } from '../messages/middleware.messages.js'

export async function ensureCommandEnabled(command: DeadByteCommand, ctx: CommandContext): Promise<boolean> {
  const config = ctx.config.commands[command.id]
  if (config?.enabled === false) {
    await ctx.reply(config.disabledMessage ?? middlewareMessages.commandDisabled)
    return false
  }
  return true
}
