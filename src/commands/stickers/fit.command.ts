import { defineCommand, normalizeCommandName } from '@deadbyte/runtime'
import type { BufferMedia } from '../../services/media/media.types.js'
import type { StickerService } from '../../services/stickers/sticker.service.js'
import { resolveStickerOptions } from './create-sticker.command.js'

// Comando que força o fit "contain": preserva proporção com fundo transparente
type StickerCommandServices = {
  stickers?: StickerService
  resolveTargetMedia?: () => Promise<BufferMedia | undefined>
}

export const fitStickerCommand = defineCommand({
  id: 'sticker.fit',
  group: 'sticker',
  name: 'Sticker fit',
  description: 'Converte mídia em sticker com fit "contain" (preserva proporção, fundo transparente).',
  aliases: ['ff', 'fit', 'sf', 'inteira', 'inteiro', 'fi'],
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
    const aliases = ctx.config.commands['sticker.fit']?.aliases ?? fitStickerCommand.aliases
    return Boolean(normalized && aliases.map(normalizeCommandName).includes(normalized))
  },
  async run(ctx) {
    const services = ctx.services as StickerCommandServices
    const media = await services.resolveTargetMedia?.()
    if (!media) {
      await ctx.reply('Envie ou responda uma imagem/vídeo/sticker para criar a figurinha.')
      return
    }

    const { metadata, options } = resolveStickerOptions(ctx.config.commands['sticker.create']?.config)
    const sticker = await services.stickers?.createSticker(media, metadata, { ...options, fit: 'contain' })
    if (!sticker) {
      throw new Error('Sticker service is not available.')
    }
    await ctx.replyWithSticker(sticker.buffer, sticker.mimeType)
  }
})
