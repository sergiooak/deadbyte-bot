import { DeadByteEventNames, type DeadByteEventLogger } from '@deadbyte/runtime'
import type { BufferMedia } from '../media/media.types.js'
import { StickerCompressorService } from './sticker-compressor.service.js'
import { StickerExifService } from './sticker-exif.service.js'
import { StickerRendererService } from './sticker-renderer.service.js'
import type { RenderedSticker, StickerMetadata, StickerRenderOptions } from './sticker.types.js'

export class StickerService {
  constructor(
    private readonly renderer = new StickerRendererService(),
    private readonly exif = new StickerExifService(),
    private readonly compressor = new StickerCompressorService(),
    private readonly events?: DeadByteEventLogger
  ) {}

  async createSticker(media: BufferMedia, metadata: StickerMetadata, options: StickerRenderOptions): Promise<RenderedSticker> {
    await this.events?.emit({
      id: crypto.randomUUID(),
      name: DeadByteEventNames.StickerRenderStarted,
      level: 'info',
      payload: { mimeType: media.mimeType, fit: options.fit, outputSize: options.outputSize },
      timestamp: new Date().toISOString()
    })

    const sizes = [...new Set([options.outputSize, ...options.fallbackRenderSizes])]
    let lastSticker: Buffer | undefined

    for (const size of sizes) {
      const rendered = await this.renderer.render(media, {
        fit: options.fit,
        size,
        imageQuality: options.imageQuality,
        videoQuality: options.videoQuality,
        videoFps: options.videoFps,
        maxVideoSeconds: options.maxVideoSeconds
      })
      const sticker = await this.exif.applyMetadata(rendered, metadata)
      lastSticker = sticker

      if (sticker.byteLength <= options.maxStickerBytes) {
        await this.events?.emit({
          id: crypto.randomUUID(),
          name: DeadByteEventNames.StickerRenderCompleted,
          level: 'info',
          payload: { bytes: sticker.byteLength, size },
          timestamp: new Date().toISOString()
        })
        return { buffer: sticker, mimeType: 'image/webp', filename: 'sticker.webp' }
      }

      await this.events?.emit({
        id: crypto.randomUUID(),
        name: DeadByteEventNames.StickerCompressed,
        level: 'warn',
        payload: { bytes: sticker.byteLength, size, nextFallback: true },
        timestamp: new Date().toISOString()
      })
    }

    await this.compressor.assertWithinLimit(lastSticker ?? Buffer.alloc(0), options.maxStickerBytes, {
      triedSizes: sizes
    })

    throw new Error('Sticker rendering failed without an output buffer.')
  }
}
