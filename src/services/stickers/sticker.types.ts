import { z } from 'zod'
import type { BufferMedia } from '../media/media.types.js'

export type StickerFit = 'contain' | 'cover'

export type StickerMetadata = {
  packName: string
  packPublisher: string
  emojis?: string[]
}

export type StickerRenderOptions = {
  fit: StickerFit
  videoFps: number
  maxVideoSeconds: number
  imageQuality: number
  videoQuality: number
  fallbackRenderSizes: number[]
}

export type RenderedSticker = BufferMedia & {
  mimeType: 'image/webp'
}

export const StickerCommandConfigSchema = z.object({
  defaultPackName: z.string().default('DeadByte.com.br'),
  defaultPackPublisher: z.string().default('bot de figurinhas'),
  videoFps: z.coerce.number().int().positive().default(10),
  maxVideoSeconds: z.coerce.number().int().positive().default(7),
  defaultFit: z.enum(['contain', 'cover']).default('contain'),
  fallbackRenderSizes: z.array(z.number().int().positive()).default([512, 384, 256, 170]),
  imageQuality: z.coerce.number().int().min(1).max(100).default(80),
  videoQuality: z.coerce.number().int().min(1).max(100).default(70),
  compressionEnabled: z.boolean().default(true)
})

export type StickerCommandConfig = z.infer<typeof StickerCommandConfigSchema>
