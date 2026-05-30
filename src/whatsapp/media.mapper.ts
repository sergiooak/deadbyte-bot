import whatsappWebJs from 'whatsapp-web.js'
import type { BufferMedia } from '../services/media/media.types.js'
import type { WhatsappMediaLike, WhatsappMessageLike } from './whatsapp-adapter.js'

const { MessageMedia } = whatsappWebJs as unknown as {
  MessageMedia: new (mimeType: string, data: string, filename?: string) => unknown
}

export function whatsappMediaToBufferMedia(media: WhatsappMediaLike): BufferMedia {
  return {
    buffer: Buffer.from(media.data, 'base64'),
    mimeType: media.mimetype,
    filename: media.filename
  }
}

export function bufferMediaToWhatsappMedia(media: BufferMedia): unknown {
  return new MessageMedia(media.mimeType, media.buffer.toString('base64'), media.filename)
}

export async function downloadMessageMedia(message?: WhatsappMessageLike): Promise<BufferMedia | undefined> {
  if (!message?.hasMedia || !message.downloadMedia) {
    return undefined
  }

  const media = await message.downloadMedia()
  return media ? whatsappMediaToBufferMedia(media) : undefined
}
