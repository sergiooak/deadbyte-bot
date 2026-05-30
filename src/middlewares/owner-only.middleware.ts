import type { CommandContext, DeadByteCommand } from '@deadbyte/runtime'

export async function ensureOwnerAllowed(command: DeadByteCommand, ctx: CommandContext): Promise<boolean> {
  const config = ctx.config.commands[command.id]
  const ownerOnly = config?.ownerOnly ?? command.ownerOnlyByDefault
  if (ownerOnly && !ctx.permissions.isOwner) {
    await ctx.reply('Este comando é restrito ao dono da instância.')
    return false
  }
  return true
}
