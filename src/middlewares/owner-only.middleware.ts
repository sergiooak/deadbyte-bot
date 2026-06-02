import type { CommandContext, DeadByteCommand } from '@deadbyte/runtime'

export async function ensureOwnerAllowed(command: DeadByteCommand, ctx: CommandContext): Promise<boolean> {
  const config = ctx.config.commands[command.id]
  const ownerOnly = config?.ownerOnly ?? command.ownerOnlyByDefault
  if (ownerOnly && !ctx.permissions.isOwner) {
    await ctx.reply('{Esse comando|Esta função} é {restrito|reservado} ao dono da instância{.|, foi mal.}')
    return false
  }
  return true
}
