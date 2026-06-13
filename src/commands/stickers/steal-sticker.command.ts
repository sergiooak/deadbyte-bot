import { defineCommand } from '@deadbyte/runtime'
import { stickerMessages } from '../../messages/sticker.messages.js'
import type { BufferMedia } from '../../services/media/media.types.js'
import type { GroupConfigService } from '../../groups/group-config.service.js'
import type { StickerService } from '../../services/stickers/sticker.service.js'
import type { StickerMetadata } from '../../services/stickers/sticker.types.js'
import { matchesCommandAlias } from '../../utils/commands.js'
import { applyGroupMetadata, resolveStickerOptions } from './create-sticker.command.js'

type StickerCommandServices = {
  stickers?: StickerService
  groupConfigs?: GroupConfigService
  resolveTargetMedia?: () => Promise<BufferMedia | undefined>
}

// Parseia os metadados do sticker roubado com base nos argumentos do comando.
// Cenarios:
//   .roubar          -> packName='', packPublisher='' (sem pacote e sem autor)
//   .roubar Pack     -> packName='Pack', packPublisher=''
//   .roubar /Autor   -> packName='', packPublisher='Autor'
//   .roubar Pack|Autor -> packName='Pack', packPublisher='Autor'
function parseStolenMetadata(argsText: string): StickerMetadata {
  const delimiterIndex = argsText.search(/[|/\\]/)

  if (delimiterIndex !== -1) {
    const packName = argsText.slice(0, delimiterIndex).trim()
    const packPublisher = argsText.slice(delimiterIndex + 1).trim()
    return { packName, packPublisher, emojis: ['\u{1F916}'] }
  }

  return { packName: argsText.trim(), packPublisher: '', emojis: ['\u{1F916}'] }
}

export const stealStickerCommand = defineCommand({
  id: 'sticker.steal',
  group: 'sticker',
  name: 'Roubar sticker',
  description: 'Recria sticker usando metadata explicita quando informada.',
  aliases: ['roubar', 'renomear', 'steal', 'rename'],
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  order: 5,
  supports: {
    private: true,
    groups: true,
    implicit: false
  },
  configFields: [],
  async match(ctx) {
    return matchesCommandAlias(ctx, 'sticker.steal', stealStickerCommand.aliases)
  },
  async run(ctx) {
    const services = ctx.services as StickerCommandServices
    let media: BufferMedia | undefined
    try {
      media = await services.resolveTargetMedia?.()
    } catch {
      await ctx.reply(stickerMessages.mediaDownloadFailed)
      return
    }
    if (!media) {
      await ctx.reply(stickerMessages.stealMissingMedia)
      return
    }

    try {
      const defaults = resolveStickerOptions(ctx.config.commands['sticker.create']?.config)
      // Parseia o que o usuario passou; campos vazios recebem fallback do grupo
      const parsed = parseStolenMetadata(ctx.parsedCommand?.argsText ?? '')
      const groupFallback = applyGroupMetadata(defaults.metadata, ctx.chat, services.groupConfigs)
      const metadata: StickerMetadata = {
        packName: parsed.packName || groupFallback.packName,
        packPublisher: parsed.packPublisher || groupFallback.packPublisher,
        emojis: parsed.emojis
      }
      const sticker = await services.stickers?.createSticker(media, metadata, defaults.options)
      if (!sticker) throw new Error('Sticker service is not available.')
      await ctx.replyWithSticker(sticker.buffer, sticker.mimeType)
    } catch {
      await ctx.reply(stickerMessages.creationFailed)
    }
  }
})
