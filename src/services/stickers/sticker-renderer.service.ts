import sharp from 'sharp'
import type { BufferMedia } from '../media/media.types.js'
import { FfmpegService } from '../media/ffmpeg.service.js'
import type { StickerFit } from './sticker.types.js'

export type StickerRendererOptions = {
  fit: StickerFit
  size: number
  imageQuality: number
  videoQuality: number
  videoFps: number
  maxVideoSeconds: number
}

export class StickerRendererService {
  constructor(private readonly ffmpegService = new FfmpegService()) {}

  async render(media: BufferMedia, options: StickerRendererOptions): Promise<Buffer> {
    if (media.mimeType === 'image/webp') {
      return media.buffer
    }

    if (media.mimeType.startsWith('image/')) {
      return await this.renderImage(media.buffer, options)
    }

    if (media.mimeType.startsWith('video/')) {
      return await this.ffmpegService.renderVideoToWebp(media.buffer, {
        size: options.size,
        fit: options.fit,
        fps: options.videoFps,
        maxSeconds: options.maxVideoSeconds,
        quality: options.videoQuality
      })
    }

    throw new Error(`Unsupported media type for sticker: ${media.mimeType}`)
  }

  private async renderImage(input: Buffer, options: StickerRendererOptions): Promise<Buffer> {
    const fit = options.fit === 'cover' ? 'cover' : 'contain'
    return await sharp(input)
      .resize(options.size, options.size, {
        fit,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .webp({ quality: options.imageQuality })
      .toBuffer()
  }
}
