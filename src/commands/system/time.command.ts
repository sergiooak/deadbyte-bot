import { defineCommand } from '@deadbyte/runtime'
import { systemMessages } from '../../messages/system.messages.js'
import { matchesCommandAlias } from '../../utils/commands.js'
import { buildShortLocationName, clockEmoji, formatUtcOffset, getTimeForLocation, getUtcOffsetMinutes } from './time.helper.js'

const BRASILIA_TZ = 'America/Sao_Paulo'
const DEFAULT_LOCATION = 'Brasília, Brasil'

export const timeCommand = defineCommand({
  id: 'system.time',
  group: 'system',
  name: 'Hora',
  description: 'Mostra a hora atual em uma cidade, estado ou país. Padrão: Brasília.',
  aliases: ['hora', 'horario', 'horas', 'time'],
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  order: 4,
  supports: {
    private: true,
    groups: true,
    implicit: false
  },
  configFields: [],
  async match(ctx) {
    return matchesCommandAlias(ctx, 'system.time', timeCommand.aliases)
  },
  async run(ctx) {
    const query = ctx.parsedCommand?.argsText?.trim() || DEFAULT_LOCATION

    let result
    try {
      result = await getTimeForLocation(query)
    } catch {
      await ctx.reply(systemMessages.timeLookupFailed)
      return
    }

    if (!result) {
      await ctx.reply(systemMessages.timeNotFound(query))
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
    let timeDifference = ''

    if (!isSameTzAsBrasilia) {
      const absDiff = Math.abs(diffMinutes)
      const diffH = Math.floor(absDiff / 60)
      const diffM = absDiff % 60
      const diffLabel = diffM ? `${diffH}h${diffM}min` : `${diffH}h`
      const relation = diffMinutes > 0 ? 'à frente de' : 'atrás de'
      timeDifference = `${diffLabel} ${relation} Brasília`
    }

    await ctx.reply(
      timeDifference
        ? systemMessages.timeResultWithDifference(clock, formattedTime, shortName, gmtLabel, timeDifference)
        : systemMessages.timeResult(clock, formattedTime, shortName, gmtLabel)
    )
  }
})
