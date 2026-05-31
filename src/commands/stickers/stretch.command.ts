import { defineCommand, normalizeCommandName } from '@deadbyte/runtime'
import type { BufferMedia } from '../../services/media/media.types.js'
import type { StickerService } from '../../services/stickers/sticker.service.js'
import { resolveStickerOptions } from './create-sticker.command.js'

// Comando que força o fit "stretch": estica a mídia para preencher o quadrado sem recortar
type StickerCommandServices = {
  stickers?: StickerService
  resolveTargetMedia?: () => Promise<BufferMedia | undefined>
}

export const stretchStickerCommand = defineCommand({
  id: 'sticker.stretch',
  group: 'sticker',
  name: 'Sticker stretch',
  description: 'Converte mídia em sticker com fit "stretch" (estica para preencher o quadrado, sem recortar).',
  aliases: ['fe', 'estica', 'stretch', 'ss', 'achatada', 'achatado'],
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
    const aliases = ctx.config.commands['sticker.stretch']?.aliases ?? stretchStickerCommand.aliases
    return Boolean(normalized && aliases.map(normalizeCommandName).includes(normalized))
  },
  async run(ctx) {
    const services = ctx.services as StickerCommandServices
    let media: BufferMedia | undefined
    try {
      media = await services.resolveTargetMedia?.()
    } catch {
      await ctx.reply('Erro ao baixar a mídia. Tente novamente.')
      return
    }
    if (!media) {
      await ctx.reply('Envie ou responda uma imagem/vídeo/sticker para criar a figurinha.')
      return
    }

    try {
      const { metadata, options } = resolveStickerOptions(ctx.config.commands['sticker.create']?.config)
      const sticker = await services.stickers?.createSticker(media, metadata, { ...options, fit: 'stretch' })
      if (!sticker) throw new Error('Sticker service is not available.')
      await ctx.replyWithSticker(sticker.buffer, sticker.mimeType)
    } catch {
      await ctx.reply('Erro ao criar a figurinha. Tente novamente.')
    }
  }
})
