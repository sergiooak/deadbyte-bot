import { defineCommand, type CommandContext } from '@deadbyte/runtime'
import sharp from 'sharp'
import { mediaMessages } from '../../messages/media.messages.js'
import type { FfmpegService } from '../../services/media/ffmpeg.service.js'
import type { BufferMedia } from '../../services/media/media.types.js'
import { matchesCommandAlias } from '../../utils/commands.js'

export type MediaEditServices = {
  ffmpeg?: FfmpegService
  resolveTargetMedia?: () => Promise<BufferMedia | undefined>
  replyWithMedia?: (media: BufferMedia) => Promise<void>
}

type MediaKind = 'image' | 'video' | 'sticker-static' | 'sticker-animated'

async function classifyMedia(media: BufferMedia): Promise<MediaKind> {
  if (media.mimeType.startsWith('video/')) return 'video'
  if (media.mimeType === 'image/webp') {
    const meta = await sharp(media.buffer).metadata()
    return (meta.pages ?? 1) > 1 ? 'sticker-animated' : 'sticker-static'
  }
  return 'image'
}

function mimeToExt(mimeType: string): string {
  const map: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
    'video/3gpp': '3gp',
  }
  return map[mimeType] ?? mimeType.split('/')[1] ?? 'bin'
}

type ProcessFn = (ffmpeg: FfmpegService, input: Buffer, inputExt: string, outputExt: string) => Promise<Buffer>

export async function resolveAndProcessMedia(
  ctx: CommandContext,
  services: MediaEditServices,
  processFn: ProcessFn,
): Promise<void> {
  const ffmpeg = services.ffmpeg
  if (!ffmpeg) {
    await ctx.reply(mediaMessages.processingFailed)
    return
  }

  let media: BufferMedia | undefined
  try {
    media = await services.resolveTargetMedia?.()
  } catch {
    await ctx.reply(mediaMessages.downloadFailed)
    return
  }

  if (!media) {
    await ctx.reply(mediaMessages.missingMedia)
    return
  }

  const kind = await classifyMedia(media)

  try {
    switch (kind) {
      case 'image': {
        const ext = mimeToExt(media.mimeType)
        const result = await processFn(ffmpeg, media.buffer, ext, 'png')
        await services.replyWithMedia?.({ buffer: result, mimeType: 'image/png', filename: 'output.png' })
        break
      }

      case 'video': {
        const ext = mimeToExt(media.mimeType)
        const result = await processFn(ffmpeg, media.buffer, ext, 'mp4')
        await services.replyWithMedia?.({ buffer: result, mimeType: 'video/mp4', filename: 'output.mp4' })
        break
      }

      case 'sticker-static': {
        const pngBuf = await sharp(media.buffer).png().toBuffer()
        const resultPng = await processFn(ffmpeg, pngBuf, 'png', 'png')
        const webpBuf = await sharp(resultPng).webp({ quality: 90 }).toBuffer()
        await ctx.replyWithSticker(webpBuf, 'image/webp')
        break
      }

      case 'sticker-animated': {
        const gifBuf = await sharp(media.buffer, { animated: true }).gif().toBuffer()
        const resultWebp = await processFn(ffmpeg, gifBuf, 'gif', 'webp')
        await ctx.replyWithSticker(resultWebp, 'image/webp')
        break
      }
    }
  } catch {
    await ctx.reply(mediaMessages.processingFailed)
  }
}

export type MediaEditCommandOptions = {
  id: `media.${string}`
  name: string
  description: string
  aliases: string[]
  order?: number
  processFn: ProcessFn
}

export function defineMediaEditCommand(options: MediaEditCommandOptions) {
  return defineCommand({
    id: options.id,
    group: 'media',
    name: options.name,
    description: options.description,
    aliases: options.aliases,
    enabledByDefault: true,
    ownerOnlyByDefault: false,
    order: options.order,
    supports: { private: true, groups: true, implicit: false },
    configFields: [],
    async match(ctx) {
      return matchesCommandAlias(ctx, options.id, options.aliases)
    },
    async run(ctx) {
      const services = ctx.services as MediaEditServices
      await resolveAndProcessMedia(ctx, services, options.processFn)
    },
  })
}
