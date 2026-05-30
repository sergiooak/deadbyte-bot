import { defineCommand, normalizeCommandName } from '@deadbyte/runtime'
import type { BufferMedia } from '../../services/media/media.types.js'
import { StickerCommandConfigSchema, type StickerMetadata, type StickerRenderOptions } from '../../services/stickers/sticker.types.js'
import type { StickerService } from '../../services/stickers/sticker.service.js'

type StickerCommandServices = {
  stickers?: StickerService
  resolveTargetMedia?: () => Promise<BufferMedia | undefined>
}

function aliasesFor(ctx: { config: { commands: Record<string, { aliases?: string[] }> } }, commandId: string, defaults: string[]) {
  return ctx.config.commands[commandId]?.aliases ?? defaults
}

export function resolveStickerOptions(rawConfig: unknown): {
  metadata: StickerMetadata
  options: StickerRenderOptions
} {
  const config = StickerCommandConfigSchema.parse(rawConfig ?? {})
  return {
    metadata: {
      packName: config.defaultPackName,
      packPublisher: config.defaultPackPublisher,
      emojis: ['🤖']
    },
    options: {
      fit: config.defaultFit,
      outputSize: config.outputSize,
      maxStickerBytes: config.maxStickerBytes,
      videoFps: config.videoFps,
      maxVideoSeconds: config.maxVideoSeconds,
      imageQuality: config.imageQuality,
      videoQuality: config.videoQuality,
      fallbackRenderSizes: config.compressionEnabled ? config.fallbackRenderSizes : []
    }
  }
}

export const createStickerCommand = defineCommand({
  id: 'sticker.create',
  group: 'sticker',
  name: 'Criar sticker',
  description: 'Converte imagem, vídeo, sticker ou documento em sticker webp.',
  aliases: ['s', 'sticker', 'f', 'fig', 'figurinha'],
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  supports: {
    private: true,
    groups: true,
    implicit: false
  },
  configFields: [
    { key: 'defaultPackName', label: 'Nome do pacote', type: 'string', defaultValue: 'DeadByte.com.br' },
    { key: 'defaultPackPublisher', label: 'Publicador', type: 'string', defaultValue: 'bot de figurinhas' },
    { key: 'outputSize', label: 'Tamanho', type: 'number', defaultValue: 512 },
    { key: 'defaultFit', label: 'Fit', type: 'select', defaultValue: 'contain', options: ['contain', 'cover'] }
  ],
  async match(ctx) {
    const normalized = ctx.parsedCommand?.normalizedName
    return Boolean(
      normalized && aliasesFor(ctx, 'sticker.create', createStickerCommand.aliases).map(normalizeCommandName).includes(normalized)
    )
  },
  async run(ctx) {
    const services = ctx.services as StickerCommandServices
    const media = await services.resolveTargetMedia?.()
    if (!media) {
      await ctx.reply('Envie ou responda uma imagem/vídeo/sticker para criar a figurinha.')
      return
    }

    const { metadata, options } = resolveStickerOptions(ctx.config.commands['sticker.create']?.config)
    const sticker = await services.stickers?.createSticker(media, metadata, options)
    if (!sticker) {
      throw new Error('Sticker service is not available.')
    }
    await ctx.replyWithSticker(sticker.buffer, sticker.mimeType)
  }
})
