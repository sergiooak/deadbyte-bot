import { normalizeCommandName, type CommandContext } from '@deadbyte/runtime'

type CommandConfig = {
  commands: Record<string, { aliases?: string[] } | undefined>
}

export function getCommandAliases(config: CommandConfig, commandId: string, defaults: string[]): string[] {
  return config.commands[commandId]?.aliases ?? defaults
}

export function getNormalizedCommandAliases(config: CommandConfig, commandId: string, defaults: string[]): string[] {
  return getCommandAliases(config, commandId, defaults).map(normalizeCommandName)
}

export function matchesCommandAlias(ctx: Pick<CommandContext, 'config' | 'parsedCommand'>, commandId: string, defaults: string[]): boolean {
  const normalized = ctx.parsedCommand?.normalizedName
  return Boolean(normalized && getNormalizedCommandAliases(ctx.config, commandId, defaults).includes(normalized))
}

export function matchesExplicitAlias(ctx: Pick<CommandContext, 'config' | 'parsedCommand'>, commandId: string, defaults: string[]): boolean {
  return Boolean(ctx.parsedCommand?.explicit && matchesCommandAlias(ctx, commandId, defaults))
}

export function getAliasSuffix(
  normalizedName: string,
  normalizedAliases: string[],
  suffixPattern: RegExp
): string | undefined {
  for (const alias of normalizedAliases) {
    if (!normalizedName.startsWith(alias) || normalizedName.length <= alias.length) continue

    const suffix = normalizedName.slice(alias.length)
    if (suffixPattern.test(suffix)) return suffix
  }

  return undefined
}

export function matchesCommandAliasWithSuffix(
  ctx: Pick<CommandContext, 'config' | 'parsedCommand'>,
  commandId: string,
  defaults: string[],
  suffixPattern: RegExp
): boolean {
  const normalized = ctx.parsedCommand?.normalizedName ?? ''
  const normalizedAliases = getNormalizedCommandAliases(ctx.config, commandId, defaults)
  return normalizedAliases.includes(normalized) || getAliasSuffix(normalized, normalizedAliases, suffixPattern) !== undefined
}
