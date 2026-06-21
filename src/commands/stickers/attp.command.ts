import { defineCommand, type CommandContext } from '@deadbyte/runtime'
import type { GroupConfigService } from '../../groups/group-config.service.js'
import { stickerMessages } from '../../messages/sticker.messages.js'
import { fetchTexasAttp } from '../../services/texas/texas-api.service.js'
import type { StickerService } from '../../services/stickers/sticker.service.js'
import { matchesExplicitAlias } from '../../utils/commands.js'
import { applyGroupMetadata, resolveStickerOptions } from './create-sticker.command.js'

type AttpServices = {
  stickers?: StickerService
  groupConfigs?: GroupConfigService
}

function resolveAttpText(ctx: CommandContext): string | null {
  const argsText = ctx.parsedCommand?.argsText?.trim()
  if (argsText) return argsText
  if (ctx.quotedMessage?.body?.trim()) return ctx.quotedMessage.body.trim()
  return null
}

export const attpCommand = defineCommand({
  id: 'sticker.attp',
  group: 'sticker',
  name: 'Texto animado para figurinha (ATTP)',
  description: 'Cria figurinha animada a partir de texto usando a Texas API.',
  aliases: ['attp'],
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  supports: {
    private: true,
    groups: true,
    implicit: false
  },
  configFields: [],
  async match(ctx) {
    return matchesExplicitAlias(ctx, 'sticker.attp', attpCommand.aliases)
  },
  async run(ctx) {
    const text = resolveAttpText(ctx)
    if (!text) {
      await ctx.reply('Manda um texto depois do comando ou responde a uma mensagem de texto.\nEx: *!attp bom dia*')
      return
    }

    try {
      const media = await fetchTexasAttp(text)
      const services = ctx.services as AttpServices
      const { metadata, options } = resolveStickerOptions(ctx.config.commands['sticker.create']?.config)
      const groupMetadata = applyGroupMetadata(metadata, ctx.chat, services.groupConfigs)
      const sticker = await services.stickers?.createSticker(media, groupMetadata, { ...options, fit: 'contain' })
      if (!sticker) throw new Error('Sticker service is not available.')

      await ctx.replyWithSticker(sticker.buffer, sticker.mimeType)
    } catch {
      await ctx.reply(stickerMessages.creationFailed)
    }
  }
})
