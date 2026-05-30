import { defineCommand, normalizeCommandName } from '@deadbyte/runtime'
import type { BufferMedia } from '../../services/media/media.types.js'
import type { StickerService } from '../../services/stickers/sticker.service.js'
import type { StickerMetadata } from '../../services/stickers/sticker.types.js'
import { resolveStickerOptions } from './create-sticker.command.js'

type StickerCommandServices = {
  stickers?: StickerService
  resolveTargetMedia?: () => Promise<BufferMedia | undefined>
}

function aliasesFor(ctx: { config: { commands: Record<string, { aliases?: string[] }> } }, commandId: string, defaults: string[]) {
  return ctx.config.commands[commandId]?.aliases ?? defaults
}

function parseExplicitMetadata(argsText: string): StickerMetadata | undefined {
  const parts = argsText
    .split(/\s(?:\||\/|\\)\s/)
    .map((part) => part.trim())
    .filter(Boolean)

  if (parts.length < 2) {
    return undefined
  }

  return {
    packName: parts[0] ?? '',
    packPublisher: parts[1] ?? '',
    emojis: ['🤖']
  }
}

export const stealStickerCommand = defineCommand({
  id: 'sticker.steal',
  group: 'sticker',
  name: 'Roubar sticker',
  description: 'Recria sticker usando metadata explícita quando informada.',
  aliases: ['steal', 'roubar', 'rename', 'renomear'],
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
    return Boolean(
      normalized && aliasesFor(ctx, 'sticker.steal', stealStickerCommand.aliases).map(normalizeCommandName).includes(normalized)
    )
  },
  async run(ctx) {
    const services = ctx.services as StickerCommandServices
    const media = await services.resolveTargetMedia?.()
    if (!media) {
      await ctx.reply('Responda um sticker ou mídia para renomear.')
      return
    }

    const defaults = resolveStickerOptions(ctx.config.commands['sticker.create']?.config)
    const explicit = parseExplicitMetadata(ctx.parsedCommand?.argsText ?? '')
    const sticker = await services.stickers?.createSticker(media, explicit ?? defaults.metadata, defaults.options)
    if (!sticker) {
      throw new Error('Sticker service is not available.')
    }
    await ctx.replyWithSticker(sticker.buffer, sticker.mimeType)
  }
})
