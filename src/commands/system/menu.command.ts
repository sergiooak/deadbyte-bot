import { defineCommand, normalizeCommandName, type DeadByteCommand } from '@deadbyte/runtime'

type MenuServices = {
  commands?: DeadByteCommand[]
}

// Ícones e rótulos dos grupos exibidos no menu, em pt-BR
const GROUP_LABELS: Record<string, string> = {
  system: '🔧 Sistema',
  sticker: '🎨 Figurinhas',
  fun: '😄 Diversão',
}

type CommandConfig = Record<string, { aliases?: string[]; enabled?: boolean } | undefined>

function aliasesFor(config: CommandConfig, commandId: string, defaults: string[]): string[] {
  return config[commandId]?.aliases ?? defaults
}

// Monta o texto do menu agrupando os comandos habilitados por grupo
function buildMenuText(
  commands: DeadByteCommand[],
  prefix: string,
  commandConfig: CommandConfig
): string {
  const lines: string[] = [`🤖 *DeadByte — Menu de Comandos*`, '']

  const grouped = new Map<string, DeadByteCommand[]>()

  for (const command of commands) {
    // Oculta o próprio comando de menu da listagem
    if (command.id === 'system.menu') continue

    // Omite comandos desabilitados explicitamente na configuração
    if (commandConfig[command.id]?.enabled === false) continue

    if (!grouped.has(command.group)) {
      grouped.set(command.group, [])
    }
    grouped.get(command.group)!.push(command)
  }

  for (const [group, cmds] of grouped) {
    const label = GROUP_LABELS[group] ?? `📦 ${group}`
    lines.push(`*${label}*`)

    for (const cmd of cmds) {
      const aliases = aliasesFor(commandConfig, cmd.id, cmd.aliases)
      const primary = `${prefix}${aliases[0]}`
      const rest = aliases.slice(1, 3).map((a) => `${prefix}${a}`)
      const altStr = rest.length > 0 ? ` _(ou ${rest.join(', ')})_` : ''
      lines.push(`• *${primary}*${altStr} — ${cmd.description}`)
    }

    lines.push('')
  }

  return lines.join('\n').trimEnd()
}

export const menuCommand = defineCommand({
  id: 'system.menu',
  group: 'system',
  name: 'Menu',
  description: 'Lista todos os comandos disponíveis do bot.',
  aliases: ['menu', 'ajuda', 'help', 'comandos'],
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  supports: {
    private: true,
    groups: true,
    implicit: false
  },
  configFields: [],
  async match(ctx) {
    const normalized = ctx.parsedCommand?.normalizedName
    const aliases = aliasesFor(
      ctx.config.commands as CommandConfig,
      'system.menu',
      menuCommand.aliases
    )
    return Boolean(normalized && aliases.map(normalizeCommandName).includes(normalized))
  },
  async run(ctx) {
    const services = ctx.services as MenuServices
    const allCommands = services.commands ?? []
    const prefix = ctx.config.prefixes[0] ?? '.'
    const text = buildMenuText(allCommands, prefix, ctx.config.commands as CommandConfig)
    await ctx.reply(text)
  }
})
