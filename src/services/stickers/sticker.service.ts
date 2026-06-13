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
  ) { }

  /** Re-aplica os metadados EXIF num WebP que ja foi processado (ex: apos overlay de legenda via ffmpeg). */
  async reapplyMetadata(webp: Buffer, metadata: StickerMetadata): Promise<Buffer> {
    return this.exif.applyMetadata(webp, metadata)
  }

  async createSticker(media: BufferMedia, metadata: StickerMetadata, options: StickerRenderOptions): Promise<RenderedSticker> {
    await this.events?.emit({
      id: crypto.randomUUID(),
      name: DeadByteEventNames.StickerRenderStarted,
      level: 'info',
      payload: { mimeType: media.mimeType, fit: options.fit, outputSize: 512 },
      timestamp: new Date().toISOString()
    })

    const sizes = [...new Set([512, ...options.fallbackRenderSizes])]
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

      if (sticker.byteLength <= 1024 * 1024) {
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

    await this.compressor.assertWithinLimit(lastSticker ?? Buffer.alloc(0), 1024 * 1024, {
      triedSizes: sizes
    })

    throw new Error('Sticker rendering failed without an output buffer.')
  }
}
