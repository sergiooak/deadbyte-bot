import { defineCommand, normalizeCommandName } from '@deadbyte/runtime'
import type { BufferMedia } from '../../services/media/media.types.js'
import type { StickerService } from '../../services/stickers/sticker.service.js'
import type { StickerMetadata } from '../../services/stickers/sticker.types.js'
import { resolveStickerOptions } from './create-sticker.command.js'

type StickerCommandServices = {
  stickers?: StickerService
  resolveTargetMedia?: () => Promise<BufferMedia | undefined>
}

function aliasesFor(ctx: { config: { commands: Record<string, { aliases?: string[] }> } }, commandId: string, defaults: string[]) {
  return ctx.config.commands[commandId]?.aliases ?? defaults
}

// Parseia os metadados do sticker roubado com base nos argumentos do comando.
// Cenários:
//   .roubar          → packName='', packPublisher='' (sem pacote e sem autor)
//   .roubar Pack     → packName='Pack', packPublisher=''
//   .roubar /Autor   → packName='', packPublisher='Autor'
//   .roubar Pack|Autor → packName='Pack', packPublisher='Autor'
function parseStolenMetadata(argsText: string): StickerMetadata {
  const delimiterIndex = argsText.search(/[|/\\]/)

  if (delimiterIndex !== -1) {
    const packName = argsText.slice(0, delimiterIndex).trim()
    const packPublisher = argsText.slice(delimiterIndex + 1).trim()
    return { packName, packPublisher, emojis: ['🤖'] }
  }

  return { packName: argsText.trim(), packPublisher: '', emojis: ['🤖'] }
}

export const stealStickerCommand = defineCommand({
  id: 'sticker.steal',
  group: 'sticker',
  name: 'Roubar sticker',
  description: 'Recria sticker usando metadata explícita quando informada.',
  aliases: ['steal', 'roubar', 'rename', 'renomear'],
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  supports: {
    private: true,
    groups: true,
    implicit: false
  },
  configFields: [],
  async match(ctx) {
    const normalized = ctx.parsedCommand?.normalizedName
    return Boolean(
      normalized && aliasesFor(ctx, 'sticker.steal', stealStickerCommand.aliases).map(normalizeCommandName).includes(normalized)
    )
  },
  async run(ctx) {
    const services = ctx.services as StickerCommandServices
    let media: BufferMedia | undefined
    try {
      media = await services.resolveTargetMedia?.()
    } catch {
      await ctx.reply('{Erro|Falhei} ao baixar a mídia. {Tente novamente.|Manda de novo daqui a pouco.}')
      return
    }
    if (!media) {
      await ctx.reply('{Responda|Marque} {um sticker|uma figurinha} ou {uma mídia|mídia} para {renomear|trocar os metadados|mudar pacote/autor}.')
      return
    }

    try {
      const defaults = resolveStickerOptions(ctx.config.commands['sticker.create']?.config)
      const metadata = parseStolenMetadata(ctx.parsedCommand?.argsText ?? '')
      const sticker = await services.stickers?.createSticker(media, metadata, defaults.options)
      if (!sticker) throw new Error('Sticker service is not available.')
      await ctx.replyWithSticker(sticker.buffer, sticker.mimeType)
    } catch {
      await ctx.reply('{Erro|Falhei} ao criar a figurinha. {Tente novamente.|Pode tentar de novo.}')
    }
  }
})
