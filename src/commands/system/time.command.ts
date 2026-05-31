import { defineCommand, normalizeCommandName } from '@deadbyte/runtime'
import { buildShortLocationName, clockEmoji, formatUtcOffset, getTimeForLocation, getUtcOffsetMinutes } from './time.helper.js'

const BRASILIA_TZ = 'America/Sao_Paulo'

const DEFAULT_LOCATION = 'Brasília, Brasil'

function aliasesFor(ctx: { config: { commands: Record<string, { aliases?: string[] }> } }, commandId: string, defaults: string[]) {
  return ctx.config.commands[commandId]?.aliases ?? defaults
}

export const timeCommand = defineCommand({
  id: 'system.time',
  group: 'system',
  name: 'Hora',
  description: 'Mostra a hora atual em uma cidade, estado ou país. Padrão: Brasília.',
  aliases: ['hora', 'time', 'horas', 'horario'],
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
    return Boolean(normalized && aliasesFor(ctx, 'system.time', timeCommand.aliases).map(normalizeCommandName).includes(normalized))
  },
  async run(ctx) {
    const query = ctx.parsedCommand?.argsText?.trim() || DEFAULT_LOCATION

    const result = await getTimeForLocation(query)

    if (!result) {
      await ctx.reply(`Não encontrei a localização *${query}*. Tente com outro nome, estado ou país.`)
      return
    }

    const shortName = buildShortLocationName(result.location.displayName)
    const pad = (n: number) => String(n).padStart(2, '0')
    const formattedTime = `${pad(result.hour)}:${pad(result.minute)}`
    const clock = clockEmoji(result.hour, result.minute)
    const gmtLabel = formatUtcOffset(result.utcOffsetMinutes)

    const brasiliaOffset = getUtcOffsetMinutes(BRASILIA_TZ)
    const diffMinutes = result.utcOffsetMinutes - brasiliaOffset
    const isSameTzAsBrasilia = diffMinutes === 0

    const lines: string[] = [
      `${clock} *${formattedTime}*`,
      '',
      `📍 ${shortName}`,
      `🌐 ${gmtLabel}`,
    ]

    if (!isSameTzAsBrasilia) {
      const absDiff = Math.abs(diffMinutes)
      const diffH = Math.floor(absDiff / 60)
      const diffM = absDiff % 60
      const diffLabel = diffM ? `${diffH}h${diffM}min` : `${diffH}h`
      const relation = diffMinutes > 0 ? 'à frente de' : 'atrás de'
      lines.push(`⏱️ ${diffLabel} ${relation} Brasília`)
    }

    await ctx.reply(lines.join('\n'))
  }
})
