import { defineCommand, normalizeCommandName } from '@deadbyte/runtime'
import sharp from 'sharp'
import type { FfmpegService } from '../../services/media/ffmpeg.service.js'
import type { BufferMedia } from '../../services/media/media.types.js'
import { StickerCommandConfigSchema, type StickerMetadata, type StickerRenderOptions } from '../../services/stickers/sticker.types.js'
import type { StickerService } from '../../services/stickers/sticker.service.js'

type StickerCommandServices = {
  stickers?: StickerService
  ffmpeg?: FfmpegService
  resolveTargetMedia?: () => Promise<BufferMedia | undefined>
}

function aliasesFor(ctx: { config: { commands: Record<string, { aliases?: string[] }> } }, commandId: string, defaults: string[]) {
  return ctx.config.commands[commandId]?.aliases ?? defaults
}

export function resolveStickerOptions(rawConfig: unknown): {
  metadata: StickerMetadata
  options: StickerRenderOptions
  squareThreshold: number
} {
  const config = StickerCommandConfigSchema.parse(rawConfig ?? {})
  return {
    metadata: {
      packName: config.defaultPackName,
      packPublisher: config.defaultPackPublisher,
      emojis: ['🤖']
    },
    options: {
      fit: config.defaultFit,
      videoFps: config.videoFps,
      maxVideoSeconds: config.maxVideoSeconds,
      imageQuality: config.imageQuality,
      videoQuality: config.videoQuality,
      fallbackRenderSizes: config.compressionEnabled ? config.fallbackRenderSizes : []
    },
    squareThreshold: config.squareThreshold
  }
}

// Verifica se a mídia é quadrada o suficiente para não precisar de uma segunda figurinha crop.
// WebP já é sticker quadrado — sempre quadrado.
// Imagens: usa sharp para ler dimensões.
// Vídeos/GIFs: usa ffprobe para ler dimensões.
async function isSquareEnough(media: BufferMedia, squareThreshold: number, ffmpeg?: FfmpegService): Promise<boolean> {
  if (media.mimeType === 'image/webp') {
    return true
  }

  let width = 1
  let height = 1

  if (media.mimeType.startsWith('image/')) {
    const meta = await sharp(media.buffer).metadata()
    width = meta.width ?? 1
    height = meta.height ?? 1
  } else if (ffmpeg) {
    const dims = await ffmpeg.probeAspectRatio(media.buffer)
    width = dims.width
    height = dims.height
  }

  const ratio = Math.min(width, height) / Math.max(width, height)
  return ratio >= squareThreshold
}

export const createStickerCommand = defineCommand({
  id: 'sticker.create',
  group: 'sticker',
  name: 'Criar sticker',
  description: 'Converte imagem, vídeo, sticker ou documento em sticker webp.',
  aliases: ['s', 'sticker', 'f', 'fig', 'figurinha'],
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  supports: {
    private: true,
    groups: true,
    implicit: true
  },
  configFields: [
    { key: 'defaultPackName', label: 'Nome do pacote', type: 'string', defaultValue: 'DeadByte.com.br' },
    { key: 'defaultPackPublisher', label: 'Publicador', type: 'string', defaultValue: 'bot de figurinhas' },
    { key: 'defaultFit', label: 'Fit', type: 'select', defaultValue: 'contain', options: ['contain', 'cover'] }
  ],
  async match(ctx) {
    const normalized = ctx.parsedCommand?.normalizedName
    if (
      ctx.parsedCommand?.explicit &&
      normalized &&
      aliasesFor(ctx, 'sticker.create', createStickerCommand.aliases).map(normalizeCommandName).includes(normalized)
    ) {
      return true
    }
    const isPrivate = !ctx.chat.isGroup
    const isMedia = ctx.message.hasMedia && ['image', 'video', 'gif'].includes(ctx.message.type ?? '')
    return isPrivate && isMedia
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
      const { metadata, options, squareThreshold } = resolveStickerOptions(ctx.config.commands['sticker.create']?.config)

      // Sempre envia a figurinha com contain (fit)
      const fitSticker = await services.stickers?.createSticker(media, metadata, { ...options, fit: 'contain' })
      if (!fitSticker) throw new Error('Sticker service is not available.')
      await ctx.replyWithSticker(fitSticker.buffer, fitSticker.mimeType)

      // Se não for quadrada o suficiente, também envia a versão crop (cover)
      const square = await isSquareEnough(media, squareThreshold, services.ffmpeg)
      if (!square) {
        const cropSticker = await services.stickers?.createSticker(media, metadata, { ...options, fit: 'cover' })
        if (cropSticker) {
          await ctx.replyWithSticker(cropSticker.buffer, cropSticker.mimeType)
        }
      }
    } catch {
      await ctx.reply('{Erro|Falhei} ao criar a figurinha. {Tente novamente.|Pode tentar de novo.}')
    }
  }
})
