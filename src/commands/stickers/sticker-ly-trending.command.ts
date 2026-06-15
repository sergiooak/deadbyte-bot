import { defineCommand, type CommandContext } from '@deadbyte/runtime'
import { stickerMessages } from '../../messages/sticker.messages.js'
import { matchesCommandAlias } from '../../utils/commands.js'
import { randomPackTag, sendStickerLyPack, type StickerLyCommandServices } from './sticker-ly.shared.js'

function resolveLimit(ctx: CommandContext): number {
  const raw = (ctx.config.commands['sticker.ly-trending']?.config as { limit?: unknown } | undefined)?.limit
  const value = Number(raw)
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 16
}

export const trendingStickerLyCommand = defineCommand({
  id: 'sticker.ly-trending',
  group: 'sticker',
  name: 'Figurinhas em alta (sticker.ly)',
  description: 'Envia um pacote com figurinhas aleatorias em alta no sticker.ly.',
  aliases: ['trend', 'trending', 'lytrend', 'emalta'],
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  order: 22,
  supports: {
    private: true,
    groups: true,
    implicit: false
  },
  configFields: [
    { key: 'limit', label: 'Quantidade de figurinhas', type: 'number', defaultValue: 16 }
  ],
  async match(ctx) {
    return matchesCommandAlias(ctx, 'sticker.ly-trending', trendingStickerLyCommand.aliases)
  },
  async run(ctx) {
    const services = ctx.services as StickerLyCommandServices
    if (!services.stickerLy) {
      await ctx.reply(stickerMessages.lyPackSendFailed)
      return
    }
    let stickers
    try {
      stickers = await services.stickerLy.getRecommended()
    } catch (error) {
      await ctx.reply(stickerMessages.trendingNone)
      return
    }

    if (stickers.length === 0) {
      await ctx.reply(stickerMessages.trendingNone)
      return
    }

    const limit = resolveLimit(ctx)
    const picked = [...stickers].sort(() => 0.5 - Math.random()).slice(0, limit)

    await ctx.reply(stickerMessages.trendingFound(picked.length))
    await sendStickerLyPack(ctx, services, picked.map((s) => s.url), {
      name: `Figurinhas em alta do DeadByte #${randomPackTag()}`
    })
  }
})
