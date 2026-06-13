import type { DeadByteCommand, DeadByteCommandGroupDefinition } from '@deadbyte/runtime'
import { systemMessages } from '../../messages/system.messages.js'
import { getCommandAliases } from '../../utils/commands.js'

type CommandConfig = Record<string, { aliases?: string[]; enabled?: boolean } | undefined>

function getVisibleMenuCommands(commands: DeadByteCommand[], commandConfig: CommandConfig): DeadByteCommand[] {
  return commands.filter(
    (command) =>
      command.id !== 'system.menu' &&
      !command.hiddenFromMenu &&
      commandConfig[command.id]?.enabled !== false,
  )
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

function sortedCommands(commands: DeadByteCommand[]): DeadByteCommand[] {
  return [...commands].sort((a, b) => {
    const ao = a.order ?? Infinity
    const bo = b.order ?? Infinity
    return ao - bo
  })
}

function formatCommandAliases(command: DeadByteCommand, prefix: string, commandConfig: CommandConfig) {
  const aliases = getCommandAliases({ commands: commandConfig }, command.id, command.aliases)
  const primary = `${prefix}${(aliases[0] ?? command.name).toLowerCase()}`
  const alternatives = aliases.slice(1, 3).map((alias) => `${prefix}${alias}`)
  const aliasHint = alternatives.length > 0 ? systemMessages.menuAliasHint(alternatives.join(', ')) : ''

  return { primary, aliasHint }
}

export function createSystemMenu(
  commands: DeadByteCommand[],
  prefix: string,
  commandConfig: CommandConfig,
  groups: DeadByteCommandGroupDefinition[],
): string {
  const lines: string[] = [systemMessages.menuHeader, '']
  const visibleCommands = getVisibleMenuCommands(commands, commandConfig)
  const groupedCommands = groupCommandsByGroup(visibleCommands)

  const visibleGroups = groups
    .filter((g) => !g.hidden && groupedCommands.has(g.id))
    .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity))

  // grupos sem definição formal (fallback)
  const definedIds = new Set(groups.map((g) => g.id))
  for (const id of groupedCommands.keys()) {
    if (!definedIds.has(id)) {
      visibleGroups.push({ id, title: id })
    }
  }

  for (const group of visibleGroups) {
    const commandsInGroup = sortedCommands(groupedCommands.get(group.id) ?? [])
    const label = group.emoji ? `${group.emoji} ${group.title}` : group.title
    lines.push(`*${label}*`)

    for (const command of commandsInGroup) {
      const { primary, aliasHint } = formatCommandAliases(command, prefix, commandConfig)
      lines.push(systemMessages.menuCommandLine(primary, aliasHint, command.description ?? command.name))
    }

    lines.push('')
  }

  return lines.join('\n').trimEnd()
}
