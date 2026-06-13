import { defineCommand, type CommandContext } from '@deadbyte/runtime'
import sharp from 'sharp'
import { stickerMessages } from '../../messages/sticker.messages.js'
import type { FfmpegService } from '../../services/media/ffmpeg.service.js'
import type { BufferMedia } from '../../services/media/media.types.js'
import { overlaySubtitle } from '../../services/stickers/ttp.service.js'
import { StickerCommandConfigSchema, type StickerMetadata, type StickerRenderOptions } from '../../services/stickers/sticker.types.js'
import type { StickerService } from '../../services/stickers/sticker.service.js'
import { matchesExplicitAlias } from '../../utils/commands.js'
import type { GroupConfigService } from '../../groups/group-config.service.js'

type StickerCommandServices = {
  stickers?: StickerService
  ffmpeg?: FfmpegService
  groupConfigs?: GroupConfigService
  resolveTargetMedia?: () => Promise<BufferMedia | undefined>
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
      emojis: ['\u{1F916}']
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

/**
 * Aplica as configuracoes de autor/pacote do grupo sobre os metadados base do sticker.
 * Todos os comandos de sticker devem chamar isso para seguir o config do grupo.
 */
export function applyGroupMetadata(
  metadata: StickerMetadata,
  chat: { isGroup: boolean; id: string },
  groupConfigs?: GroupConfigService
): StickerMetadata {
  if (!chat.isGroup || !groupConfigs) return metadata
  const groupConfig = groupConfigs.get(chat.id)
  return {
    ...metadata,
    packName: groupConfig?.pacote ?? metadata.packName,
    packPublisher: groupConfig?.autor ?? metadata.packPublisher
  }
}

async function isSquareEnough(media: BufferMedia, squareThreshold: number, ffmpeg?: FfmpegService): Promise<boolean> {
  if (media.mimeType === 'image/webp') return true

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

function resolveCaptionText(ctx: CommandContext): string | undefined {
  // Modo explicito: argsText ja tem o texto sem o alias (!figurinha bom dia -> "bom dia")
  if (ctx.parsedCommand?.explicit) {
    return ctx.parsedCommand.argsText?.trim() || undefined
  }
  // Modo implicito: usa o body inteiro -- nao pode descartar a primeira palavra
  const body = ctx.message.body?.trim()
  if (body && !/^\S+\.\w{2,5}$/.test(body)) return body || undefined
  return undefined
}

const DOCUMENT_TYPES = ['document']
const MEDIA_TYPES = ['image', 'video', 'gif', ...DOCUMENT_TYPES]

export const createStickerCommand = defineCommand({
  id: 'sticker.create',
  group: 'sticker',
  name: 'Criar sticker',
  description: 'Converte imagem, video, sticker, gif ou documento em sticker webp.',
  aliases: ['figurinha', 'fig', 'f', 's', 'sticker'],
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  order: 1,
  supports: { private: true, groups: true, implicit: true },
  configFields: [
    { key: 'defaultPackName', label: 'Nome do pacote', type: 'string', defaultValue: 'DeadByte.com.br' },
    { key: 'defaultPackPublisher', label: 'Publicador', type: 'string', defaultValue: 'bot de figurinhas' },
    { key: 'defaultFit', label: 'Fit', type: 'select', defaultValue: 'contain', options: ['contain', 'cover'] }
  ],
  async match(ctx) {
    if (matchesExplicitAlias(ctx, 'sticker.create', createStickerCommand.aliases)) return true
    const isPrivate = !ctx.chat.isGroup
    const isMedia = ctx.message.hasMedia && MEDIA_TYPES.includes(ctx.message.type ?? '')
    if (isPrivate) return isMedia
    const services = ctx.services as StickerCommandServices
    return isMedia && services.groupConfigs?.get(ctx.chat.id).sticker === true
  },
  async run(ctx) {
    const services = ctx.services as StickerCommandServices
    let media: BufferMedia | undefined
    try {
      media = await services.resolveTargetMedia?.()
    } catch {
      await ctx.reply(stickerMessages.mediaDownloadFailed)
      return
    }
    if (!media) {
      await ctx.reply(stickerMessages.missingCreationMedia)
      return
    }

    try {
      const { metadata, options, squareThreshold } = resolveStickerOptions(ctx.config.commands['sticker.create']?.config)
      const groupMetadata = applyGroupMetadata(metadata, ctx.chat, services.groupConfigs)

      const caption = resolveCaptionText(ctx)
      const isDocument = DOCUMENT_TYPES.includes(ctx.targetMessage?.type ?? '')
      const isWebp = media.mimeType === 'image/webp'

      const fitSticker = await services.stickers?.createSticker(media, groupMetadata, { ...options, fit: 'contain' })
      if (!fitSticker) throw new Error('Sticker service is not available.')

      const fitBuffer = caption
        ? await overlaySubtitle(caption, fitSticker.buffer)
            .then(buf => services.stickers!.reapplyMetadata(buf, groupMetadata))
            .catch(() => fitSticker.buffer)
        : fitSticker.buffer
      await ctx.replyWithSticker(fitBuffer, fitSticker.mimeType)

      if (!isDocument && !isWebp) {
        const square = await isSquareEnough(media, squareThreshold, services.ffmpeg)
        if (!square) {
          const cropSticker = await services.stickers?.createSticker(media, groupMetadata, { ...options, fit: 'cover' })
          if (cropSticker) {
            const cropBuffer = caption
              ? await overlaySubtitle(caption, cropSticker.buffer)
                  .then(buf => services.stickers!.reapplyMetadata(buf, groupMetadata))
                  .catch(() => cropSticker.buffer)
              : cropSticker.buffer
            await ctx.replyWithSticker(cropBuffer, cropSticker.mimeType)
          }
        }
      }
    } catch {
      await ctx.reply(stickerMessages.creationFailed)
    }
  }
})
