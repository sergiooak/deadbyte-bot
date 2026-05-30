import { DeadByteEventNames, type CommandContext, type DeadByteCommand, type DeadByteEventLogger } from '@deadbyte/runtime'

export async function runCommandWithBoundary(
  command: DeadByteCommand,
  ctx: CommandContext,
  events: DeadByteEventLogger
): Promise<void> {
  const startedAt = performance.now()
  try {
    await command.run(ctx)
    await events.emit({
      id: crypto.randomUUID(),
      name: DeadByteEventNames.CommandExecuted,
      level: 'info',
      instanceId: ctx.config.instanceId,
      payload: { commandId: command.id, durationMs: Math.round(performance.now() - startedAt) },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    const normalized = error instanceof Error ? error : new Error(String(error))
    await events.emit({
      id: crypto.randomUUID(),
      name: DeadByteEventNames.CommandFailed,
      level: 'error',
      instanceId: ctx.config.instanceId,
      payload: { commandId: command.id },
      error: {
        name: normalized.name,
        message: normalized.message,
        stack: normalized.stack
      },
      timestamp: new Date().toISOString()
    })
    await ctx.reply('Erro ao executar comando.')
  }
}
