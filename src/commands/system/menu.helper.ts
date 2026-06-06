import type { DeadByteCommand } from '@deadbyte/runtime'
import { systemMenuGroupLabels, systemMessages } from '../../messages/system.messages.js'
import { getCommandAliases } from '../../utils/commands.js'

type CommandConfig = Record<string, { aliases?: string[]; enabled?: boolean } | undefined>

function getVisibleMenuCommands(commands: DeadByteCommand[], commandConfig: CommandConfig): DeadByteCommand[] {
  return commands.filter((command) => command.id !== 'system.menu' && commandConfig[command.id]?.enabled !== false)
}

function groupCommandsByGroup(commands: DeadByteCommand[]): Map<string, DeadByteCommand[]> {
  const grouped = new Map<string, DeadByteCommand[]>()

  for (const command of commands) {
    const commandsInGroup = grouped.get(command.group) ?? []
    commandsInGroup.push(command)
    grouped.set(command.group, commandsInGroup)
  }

  return grouped
}

function formatCommandAliases(command: DeadByteCommand, prefix: string, commandConfig: CommandConfig) {
  const aliases = getCommandAliases({ commands: commandConfig }, command.id, command.aliases)
  const primary = `${prefix}${(aliases[0] ?? command.name).toLowerCase()}`
  const alternatives = aliases.slice(1, 3).map((alias) => `${prefix}${alias}`)
  const aliasHint = alternatives.length > 0 ? systemMessages.menuAliasHint(alternatives.join(', ')) : ''

  return { primary, aliasHint }
}

function menuGroupLabel(group: string): string {
  return group in systemMenuGroupLabels
    ? systemMenuGroupLabels[group as keyof typeof systemMenuGroupLabels]
    : systemMessages.menuUnknownGroup(group)
}

export function createSystemMenu(commands: DeadByteCommand[], prefix: string, commandConfig: CommandConfig): string {
  const lines: string[] = [systemMessages.menuHeader, '']
  const visibleCommands = getVisibleMenuCommands(commands, commandConfig)
  const groupedCommands = groupCommandsByGroup(visibleCommands)

  for (const [group, commandsInGroup] of groupedCommands) {
    const label = menuGroupLabel(group)
    lines.push(`*${label}*`)

    for (const command of commandsInGroup) {
      const { primary, aliasHint } = formatCommandAliases(command, prefix, commandConfig)
      lines.push(systemMessages.menuCommandLine(primary, aliasHint, command.description ?? command.name))
    }

    lines.push('')
  }

  lines.push(systemMessages.menuFooter)
  return lines.join('\n').trimEnd()
}
