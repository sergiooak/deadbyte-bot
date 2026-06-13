import { defineCommand } from '@deadbyte/runtime'
import sharp from 'sharp'
import { stickerMessages } from '../../messages/sticker.messages.js'
import type { FfmpegService } from '../../services/media/ffmpeg.service.js'
import type { BufferMedia } from '../../services/media/media.types.js'
import type { GroupConfigService } from '../../groups/group-config.service.js'
import type { StickerService } from '../../services/stickers/sticker.service.js'
import { RembgNotAvailableError, RembgService } from '../../services/stickers/rembg.service.js'
import { matchesCommandAlias } from '../../utils/commands.js'
import { applyGroupMetadata, resolveStickerOptions } from './create-sticker.command.js'
import { resolveStickerMedia } from './sticker-fit-command.factory.js'

type BgCommandServices = {
  stickers?: StickerService
  ffmpeg?: FfmpegService
  groupConfigs?: GroupConfigService
  rembg?: RembgService
  resolveTargetMedia?: () => Promise<BufferMedia | undefined>
}

/**
 * Detecta se o buffer é um WebP animado (sticker animado ou GIF convertido).
 */
async function isAnimatedWebp(buffer: Buffer): Promise<boolean> {
  const meta = await sharp(buffer).metadata()
  return (meta.pages ?? 1) > 1
}

/**
 * Normaliza a mídia para um único frame PNG estático.
 * Retorna o buffer PNG + um aviso opcional a ser enviado ao usuário.
 */
async function normalizeToStaticFrame(
  media: BufferMedia,
  ffmpeg?: FfmpegService
): Promise<{ buffer: Buffer; warning?: string }> {
  const { mimeType, buffer } = media

  // Vídeo → extrai primeiro frame com ffmpeg
  if (mimeType.startsWith('video/')) {
    if (!ffmpeg) throw new Error('FfmpegService não disponível para extrair frame do vídeo.')
    const frame = await ffmpeg.extractFirstFrame(buffer)
    return { buffer: frame, warning: stickerMessages.bgVideoWarning }
  }

  // GIF → extrai primeiro frame com sharp
  if (mimeType === 'image/gif') {
    const frame = await sharp(buffer, { page: 0 }).png().toBuffer()
    return { buffer: frame, warning: stickerMessages.bgAnimatedWarning }
  }

  // WebP animado (sticker animado) → extrai primeiro frame com sharp
  if (mimeType === 'image/webp' && await isAnimatedWebp(buffer)) {
    const frame = await sharp(buffer, { page: 0 }).png().toBuffer()
    return { buffer: frame, warning: stickerMessages.bgAnimatedWarning }
  }

  // Imagem estática → converte para PNG se necessário
  const pngBuffer = await sharp(buffer).png().toBuffer()
  return { buffer: pngBuffer }
}

export const bgCommand = defineCommand({
  id: 'sticker.bg',
  group: 'sticker',
  name: 'Remover fundo',
  description: 'Remove o fundo de uma imagem usando rembg (modelo silueta) e retorna como figurinha.',
  aliases: ['semfundo', 'bg', 'rmbg', 'nobg', 'removebg'],
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  order: 9,
  supports: {
    private: true,
    groups: true,
    implicit: false
  },
  configFields: [],
  async match(ctx) {
    return matchesCommandAlias(ctx, 'sticker.bg', bgCommand.aliases)
  },
  async run(ctx) {
    const services = ctx.services as BgCommandServices
    const rembg = services.rembg ?? new RembgService()

    const resolution = await resolveStickerMedia(ctx, services)
    if (resolution.status === 'failed') return
    if (resolution.status === 'missing') {
      await ctx.reply(stickerMessages.bgMissingMedia)
      return
    }

    const media = resolution.media

    // Normaliza para frame estático PNG; envia aviso se necessário
    let imageBuffer: Buffer
    try {
      const { buffer, warning } = await normalizeToStaticFrame(media, services.ffmpeg)
      imageBuffer = buffer
      if (warning) {
        await ctx.reply(warning)
      }
    } catch {
      await ctx.reply(stickerMessages.creationFailed)
      return
    }

    // Remove o fundo via rembg
    let resultBuffer: Buffer
    try {
      resultBuffer = await rembg.removeBackground(imageBuffer)
    } catch (err) {
      if (err instanceof RembgNotAvailableError) {
        await ctx.reply(stickerMessages.bgNotAvailable)
      } else {
        await ctx.reply(stickerMessages.bgRemovalFailed)
      }
      return
    }

    // Aplica trim com sharp para remover bordas transparentes
    try {
      resultBuffer = await sharp(resultBuffer)
        .trim()
        .png()
        .toBuffer()
    } catch {
      // Trim falhou, usa o buffer sem trim mesmo
    }

    // Gera a figurinha a partir do PNG com fundo removido
    try {
      const { metadata, options } = resolveStickerOptions(ctx.config.commands['sticker.create']?.config)
      const groupMetadata = applyGroupMetadata(metadata, ctx.chat, services.groupConfigs)
      const stickerMedia: BufferMedia = { buffer: resultBuffer, mimeType: 'image/png', filename: 'nobg.png' }
      const sticker = await services.stickers?.createSticker(stickerMedia, groupMetadata, { ...options, fit: 'contain' })
      if (!sticker) throw new Error('Sticker service is not available.')
      await ctx.replyWithSticker(sticker.buffer, sticker.mimeType)
    } catch {
      await ctx.reply(stickerMessages.creationFailed)
    }
  }
})
