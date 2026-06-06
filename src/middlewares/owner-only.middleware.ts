import type { CommandContext, DeadByteCommand } from '@deadbyte/runtime'
import { middlewareMessages } from '../messages/middleware.messages.js'

export async function ensureOwnerAllowed(command: DeadByteCommand, ctx: CommandContext): Promise<boolean> {
  const config = ctx.config.commands[command.id]
  const ownerOnly = config?.ownerOnly ?? command.ownerOnlyByDefault
  if (ownerOnly && !ctx.permissions.isOwner) {
    await ctx.reply(middlewareMessages.ownerOnly)
    return false
  }
  return true
}
