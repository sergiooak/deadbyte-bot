import { defineCommand } from '@deadbyte/runtime'
import sharp from 'sharp'
import type { FfmpegService } from '../../services/media/ffmpeg.service.js'
import type { BufferMedia } from '../../services/media/media.types.js'
import { matchesCommandAlias } from '../../utils/commands.js'

type StickerToMediaServices = {
  ffmpeg?: FfmpegService
  resolveTargetMedia?: () => Promise<BufferMedia | undefined>
  replyWithMedia?: (media: BufferMedia) => Promise<void>
}

export const stickerToMediaCommand = defineCommand({
  id: 'sticker.to-media',
  group: 'sticker',
  name: 'Figurinha para mídia',
  description: 'Converte figurinha estática em imagem (PNG) ou animada em vídeo (MP4).',
  aliases: ['arquivo', 'desfig', 'unsticker', 'toimg'],
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  supports: {
    private: true,
    groups: true,
    implicit: false
  },
  configFields: [],
  async match(ctx) {
    return matchesCommandAlias(ctx, 'sticker.to-media', stickerToMediaCommand.aliases)
  },
  async run(ctx) {
    const services = ctx.services as StickerToMediaServices

    let media: BufferMedia | undefined
    try {
      media = await services.resolveTargetMedia?.()
    } catch {
      await ctx.reply('{Erro|Falhei} ao baixar a mídia. {Tente novamente.|Manda de novo daqui a pouco.}')
      return
    }

    if (!media) {
      await ctx.reply('{Responda|Marque} uma figurinha para {converter|transformar} em imagem ou vídeo.')
      return
    }

    if (media.mimeType !== 'image/webp') {
      await ctx.reply(`Essa mídia {não é|não parece ser} uma figurinha. Tipo recebido: ${media.mimeType}`)
      return
    }

    try {
      // Detecta se o WebP é animado verificando o número de frames (páginas)
      const metadata = await sharp(media.buffer).metadata()
      const isAnimated = (metadata.pages ?? 1) > 1

      if (isAnimated) {
        // Figurinha animada → MP4
        const ffmpeg = services.ffmpeg
        if (!ffmpeg) throw new Error('FfmpegService não disponível.')
        const mp4Buffer = await ffmpeg.webpToMp4(media.buffer)
        await services.replyWithMedia?.({ buffer: mp4Buffer, mimeType: 'video/mp4', filename: 'sticker.mp4' })
      } else {
        // Figurinha estática → PNG
        const pngBuffer = await sharp(media.buffer).png().toBuffer()
        await services.replyWithMedia?.({ buffer: pngBuffer, mimeType: 'image/png', filename: 'sticker.png' })
      }
    } catch {
      await ctx.reply('{Ocorreu um erro|Falhei} ao converter a figurinha. {Tente novamente.|Pode tentar de novo.}')
    }
  }
})
