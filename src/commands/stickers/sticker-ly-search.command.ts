import { defineCommand, type CommandContext } from '@deadbyte/runtime'
import { stickerMessages } from '../../messages/sticker.messages.js'
import { getNormalizedCommandAliases, matchesCommandAliasWithSuffix } from '../../utils/commands.js'
import { sendStickerLyPack, type StickerLyCommandServices } from './sticker-ly.shared.js'

const PAGE_SUFFIX = /^\d+$/

function resolvePageSize(ctx: CommandContext): number {
  const raw = (ctx.config.commands['sticker.ly-search']?.config as { pageSize?: unknown } | undefined)?.pageSize
  const value = Number(raw)
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 16
}

/** Extrai o numero da pagina a partir do alias usado (ly -> 1, ly2 -> 2, ly3 -> 3...). */
function resolvePage(ctx: CommandContext): number {
  const normalized = ctx.parsedCommand?.normalizedName ?? ''
  const aliases = getNormalizedCommandAliases(ctx.config, 'sticker.ly-search', searchStickerLyCommand.aliases)
  for (const alias of aliases) {
    if (normalized.startsWith(alias) && normalized.length > alias.length) {
      const suffix = normalized.slice(alias.length)
      if (PAGE_SUFFIX.test(suffix)) return Math.max(1, parseInt(suffix, 10))
    }
  }
  return 1
}

export const searchStickerLyCommand = defineCommand({
  id: 'sticker.ly-search',
  group: 'sticker',
  name: 'Buscar figurinhas (sticker.ly)',
  description: 'Busca figurinhas no sticker.ly por um termo e envia como pacote. Pagine com !ly2, !ly3...',
  aliases: ['ly', 'stickerly', 'lu'],
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  order: 20,
  supports: {
    private: true,
    groups: true,
    implicit: false
  },
  configFields: [
    { key: 'pageSize', label: 'Figurinhas por pagina', type: 'number', defaultValue: 8 }
  ],
  async match(ctx) {
    if (!ctx.parsedCommand?.explicit) return false
    return matchesCommandAliasWithSuffix(ctx, 'sticker.ly-search', searchStickerLyCommand.aliases, PAGE_SUFFIX)
  },
  async run(ctx) {
    const services = ctx.services as StickerLyCommandServices
    const term = ctx.parsedCommand?.argsText?.trim() ?? ''
    if (!term) {
      await ctx.reply(stickerMessages.lyMissingTerm)
      return
    }
    if (!services.stickerLy) {
      await ctx.reply(stickerMessages.lyPackSendFailed)
      return
    }

    let stickers
    try {
      stickers = await services.stickerLy.search(term)
    } catch {
      await ctx.reply(stickerMessages.lyPackSendFailed)
      return
    }

    const total = stickers.length
    if (total === 0) {
      await ctx.reply(stickerMessages.lyNoResults(term))
      return
    }

    const pageSize = resolvePageSize(ctx)
    const page = resolvePage(ctx)
    const totalPages = Math.ceil(total / pageSize)
    const slice = stickers.slice((page - 1) * pageSize, page * pageSize)

    if (slice.length === 0) {
      await ctx.reply(stickerMessages.lyNoResultsOnPage(term, totalPages))
      return
    }

    // So apresenta a contagem total na primeira pagina, igual ao v3.
    if (page === 1) {
      const prefix = ctx.parsedCommand?.prefix ?? '!'
      const morePages = total > pageSize ? stickerMessages.lyMorePages(prefix, term) : ''
      await ctx.reply(stickerMessages.lyFound(term, total) + morePages)
    }

    const packName = totalPages > 1 ? `${term} #${page}` : term
    await sendStickerLyPack(ctx, services, slice.map((s) => s.url), { name: packName })
  }
})
