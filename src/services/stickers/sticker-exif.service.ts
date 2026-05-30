import { createHash } from 'node:crypto'
import webpmux from 'node-webpmux'
import type { StickerMetadata } from './sticker.types.js'

export class StickerExifService {
  async applyMetadata(webp: Buffer, metadata: StickerMetadata): Promise<Buffer> {
    const image = new webpmux.Image()
    await image.load(webp)
    image.exif = this.createExif(metadata)
    const saved = await image.save(null)
    return Buffer.isBuffer(saved) ? saved : webp
  }

  private createExif(metadata: StickerMetadata): Buffer {
    const payload = {
      'sticker-pack-id': createHash('sha1')
        .update(`${metadata.packName}:${metadata.packPublisher}`)
        .digest('hex'),
      'sticker-pack-name': metadata.packName,
      'sticker-pack-publisher': metadata.packPublisher,
      emojis: metadata.emojis ?? ['🤖']
    }

    const json = Buffer.from(JSON.stringify(payload), 'utf8')
    const header = Buffer.from([
      0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x16, 0x00, 0x00, 0x00
    ])
    header.writeUInt32LE(json.length, 14)
    return Buffer.concat([header, json])
  }
}
