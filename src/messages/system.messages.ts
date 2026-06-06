import type { DeadByteCommand } from '@deadbyte/runtime'
import { getCommandAliases } from '../utils/commands.js'

type CommandConfig = Record<string, { aliases?: string[]; enabled?: boolean } | undefined>

type StatusInfo = {
  instanceId: string
  mode: string
  uptime: string
  clientId: string
}

type TimeInfo = {
  clock: string
  formattedTime: string
  shortName: string
  gmtLabel: string
  diffLabel?: string
  relation?: string
}

const GROUP_LABELS: Record<string, string> = {
  system: '{🔧 Sistema|🔧 Sistema, o painel que ninguém lê até quebrar}',
  sticker: '{🎨 Figurinhas|🎨 Figurinhas, a fábrica de caos visual}',
  fun: '{😄 Diversão|😄 Diversão, porque alguém precisa trabalhar pouco}',
  group: '{👥 Grupo|👥 Grupo, administração com leve julgamento}'
}

export const systemMessages = {
  ping: '🏓 - Pong{|!|!!|!!!}{| kk} {|\n{Tô|To} {vivo|funcionando|respondendo}{|.|!|!!|!!!}{| (por enquanto{| kk})}}',
  status(info: StatusInfo): string {
    return [
      '{🤖|⚙️|📡} *{Status da instância|Status do bot|Diagnóstico básico, já que pediram}*',
      '',
      `instance: ${info.instanceId}`,
      `mode: ${info.mode}`,
      `uptime: ${info.uptime}`,
      `client: ${info.clientId}`
    ].join('\n')
  },
  timeLookupFailed:
    '{Erro|Falhei|Não consegui} ao buscar a hora. {Tenta novamente|Pode tentar de novo daqui a pouco|A geografia temporal tropeçou aqui}.',
  timeNotFound(query: string): string {
    return `{Não encontrei|Procurei e nada de achar} a localização *${query}*. Tenta com {outro nome|uma cidade, estado ou país diferente|um nome menos misterioso, por gentileza}.`
  },
  timeResult(info: TimeInfo): string {
    const lines = [
      `${info.clock} *${info.formattedTime}*`,
      '',
      `{📍|🗺️} ${info.shortName}`,
      `{🌐|🕒} ${info.gmtLabel}`
    ]

    if (info.diffLabel && info.relation) {
      lines.push(`{⏱️|⌚} ${info.diffLabel} ${info.relation} Brasília`)
    }

    lines.push('', '{Tá na mão|Pronto, consulta temporal feita|Aparentemente o relógio ainda funciona}.')
    return lines.join('\n')
  },
  menu(commands: DeadByteCommand[], prefix: string, commandConfig: CommandConfig): string {
    const lines: string[] = [`{🤖|📋|🧭} *DeadByte — {Menu de Comandos|Comandos disponíveis|Ajuda, porque adivinhar comando é chato}*`, '']
    const grouped = new Map<string, DeadByteCommand[]>()

    for (const command of commands) {
      if (command.id === 'system.menu') continue
      if (commandConfig[command.id]?.enabled === false) continue

      if (!grouped.has(command.group)) {
        grouped.set(command.group, [])
      }
      grouped.get(command.group)!.push(command)
    }

    for (const [group, cmds] of grouped) {
      const label = GROUP_LABELS[group] ?? `{📦 ${group}|📦 ${group}, seja lá quem batizou isso}`
      lines.push(`*${label}*`)

      for (const cmd of cmds) {
        const aliases = getCommandAliases({ commands: commandConfig }, cmd.id, cmd.aliases)
        const primary = `${prefix}${aliases[0]}`
        const rest = aliases.slice(1, 3).map((alias) => `${prefix}${alias}`)
        const altStr = rest.length > 0 ? ` _({ou|também|se quiser variar} ${rest.join(', ')})_` : ''
        lines.push(`• *${primary}*${altStr} — ${cmd.description}`)
      }

      lines.push('')
    }

    lines.push('{Use com moderação|Pronto, agora não tem desculpa|Se der errado, pelo menos o menu estava aqui}.')
    return lines.join('\n').trimEnd()
  }
}
