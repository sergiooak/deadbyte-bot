import { DeadByteEventNames } from '@deadbyte/runtime'
import type { DeadByteEventLogger } from '@deadbyte/runtime'

export class StickerCompressorService {
  constructor(private readonly eventLogger?: DeadByteEventLogger) {}

  async assertWithinLimit(buffer: Buffer, maxBytes: number, payload: Record<string, unknown>): Promise<void> {
    if (buffer.byteLength <= maxBytes) {
      return
    }

    await this.eventLogger?.emit({
      id: crypto.randomUUID(),
      name: DeadByteEventNames.StickerCompressed,
      level: 'warn',
      message: 'Sticker still exceeds maximum size after fallback rendering.',
      payload: { ...payload, bytes: buffer.byteLength, maxBytes },
      timestamp: new Date().toISOString()
    })

    throw new Error(`Sticker is too large after compression attempts (${buffer.byteLength}/${maxBytes} bytes).`)
  }
}
