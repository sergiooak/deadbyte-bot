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

function normalizeGroupQuery(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, ' ')
    .trim()
}

function getGroupLabel(group: DeadByteCommandGroupDefinition): string {
  return group.emoji ? `${group.emoji} ${group.title}` : group.title
}

function groupMatchesQuery(group: DeadByteCommandGroupDefinition, query: string): boolean {
  const normalizedQuery = normalizeGroupQuery(query)
  const normalizedId = normalizeGroupQuery(group.id)
  const normalizedTitle = normalizeGroupQuery(group.title)

  return normalizedQuery === normalizedId || normalizedId.startsWith(normalizedQuery) || normalizedTitle.startsWith(normalizedQuery)
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
  groupQuery = '',
): string {
  const lines: string[] = [systemMessages.menuHeader, '']
  const visibleCommands = getVisibleMenuCommands(commands, commandConfig)
  const groupedCommands = groupCommandsByGroup(visibleCommands)

  let visibleGroups = groups
    .filter((g) => !g.hidden && groupedCommands.has(g.id))
    .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity))

  // grupos sem definição formal (fallback)
  const definedIds = new Set(groups.map((g) => g.id))
  for (const id of groupedCommands.keys()) {
    if (!definedIds.has(id)) {
      visibleGroups.push({ id, title: id })
    }
  }

  const trimmedGroupQuery = groupQuery.trim()
  if (trimmedGroupQuery) {
    const matchedGroup = visibleGroups.find((group) => groupMatchesQuery(group, trimmedGroupQuery))

    if (!matchedGroup) {
      const availableGroups = visibleGroups.map((group) => group.title).join(', ')
      return systemMessages.menuGroupNotFound(trimmedGroupQuery, availableGroups)
    }

    visibleGroups = [matchedGroup]
  }

  for (const group of visibleGroups) {
    const commandsInGroup = sortedCommands(groupedCommands.get(group.id) ?? [])
    const label = getGroupLabel(group)
    lines.push(`*${label}*`)

    for (const command of commandsInGroup) {
      const { primary, aliasHint } = formatCommandAliases(command, prefix, commandConfig)
      lines.push(systemMessages.menuCommandLine(primary, aliasHint, command.description ?? command.name))
    }

    lines.push('')
  }

  return lines.join('\n').trimEnd()
}
