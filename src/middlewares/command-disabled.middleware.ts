import type { CommandContext, DeadByteCommand } from '@deadbyte/runtime'

export async function ensureCommandEnabled(command: DeadByteCommand, ctx: CommandContext): Promise<boolean> {
  const config = ctx.config.commands[command.id]
  if (config?.enabled === false) {
    await ctx.reply(config.disabledMessage ?? '{Esse comando|Esta função} {está|ficou} desativado{ nesta instância| por aqui}{.| no momento.}')
    return false
  }
  return true
}
