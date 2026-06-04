import { defineCommand } from '@deadbyte/runtime'
import type { BufferMedia } from '../../services/media/media.types.js'
import type { StickerService } from '../../services/stickers/sticker.service.js'
import { matchesCommandAlias } from '../../utils/commands.js'
import { resolveStickerOptions } from './create-sticker.command.js'

// Comando que força o fit "cover": recorta/amplia para preencher o quadrado inteiro
type StickerCommandServices = {
  stickers?: StickerService
  resolveTargetMedia?: () => Promise<BufferMedia | undefined>
}

export const cropStickerCommand = defineCommand({
  id: 'sticker.crop',
  group: 'sticker',
  name: 'Sticker crop',
  description: 'Converte mídia em sticker com fit "cover" (corta para preencher o quadrado inteiro).',
  aliases: ['fc', 'crop', 'sc', 'cortado', 'cortada', 'quadrado', 'quadrada'],
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  supports: {
    private: true,
    groups: true,
    implicit: false
  },
  configFields: [],
  async match(ctx) {
    return matchesCommandAlias(ctx, 'sticker.crop', cropStickerCommand.aliases)
  },
  async run(ctx) {
    const services = ctx.services as StickerCommandServices
    let media: BufferMedia | undefined
    try {
      media = await services.resolveTargetMedia?.()
    } catch {
      await ctx.reply('{Erro|Falhei} ao baixar a mídia. {Tente novamente.|Manda de novo daqui a pouco.}')
      return
    }
    if (!media) {
      await ctx.reply('{Envie|Mande} ou {responda|marque} uma imagem/vídeo/sticker para {criar|fazer} a figurinha{.|!}')
      return
    }

    try {
      const { metadata, options } = resolveStickerOptions(ctx.config.commands['sticker.create']?.config)
      const sticker = await services.stickers?.createSticker(media, metadata, { ...options, fit: 'cover' })
      if (!sticker) throw new Error('Sticker service is not available.')
      await ctx.replyWithSticker(sticker.buffer, sticker.mimeType)
    } catch {
      await ctx.reply('{Erro|Falhei} ao criar a figurinha. {Tente novamente.|Pode tentar de novo.}')
    }
  }
})
