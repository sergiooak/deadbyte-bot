import { defineCommand } from '@deadbyte/runtime'
import { stickerMessages } from '../../messages/sticker.messages.js'
import { matchesCommandAlias } from '../../utils/commands.js'
import { sendStickerLyPack, type StickerLyCommandServices } from './sticker-ly.shared.js'

const PACK_ID_REGEX = /^[a-zA-Z0-9]{6}$/

// Detecta um link de pacote do sticker.ly em qualquer lugar da mensagem (modo implicito).
const PACK_LINK_REGEX = /https?:\/\/sticker\.ly\/s\/([a-zA-Z0-9]{6})/i

/** Limpa a entrada do usuario: aceita tanto o codigo quanto o link completo do sticker.ly. */
function parsePackId(argsText: string): string {
  return argsText
    .replace(/https?:\/\/sticker\.ly\/s\//i, '')
    .trim()
    .toUpperCase()
}

export const packStickerLyCommand = defineCommand({
  id: 'sticker.ly-pack',
  group: 'sticker',
  name: 'Pacote do sticker.ly',
  description: 'Baixa um pacote do sticker.ly pelo codigo (ex: !pack 2RY2AQ) e envia como figurinhas. Tambem dispara sozinho ao detectar um link sticker.ly/s/... na mensagem.',
  aliases: ['pack', 'packly', 'lypack', 'ply'],
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  order: 21,
  supports: {
    private: true,
    groups: true,
    implicit: true
  },
  configFields: [],
  async match(ctx) {
    // Modo explicito: usuario usou um alias (!pack <codigo|link>)
    if (matchesCommandAlias(ctx, 'sticker.ly-pack', packStickerLyCommand.aliases)) return true
    // Modo implicito: qualquer mensagem que contenha um link de pacote do sticker.ly
    if (ctx.parsedCommand?.explicit) return false
    return PACK_LINK_REGEX.test(ctx.message.body ?? '')
  },
  async run(ctx) {
    const services = ctx.services as StickerLyCommandServices
    const isExplicit = ctx.parsedCommand?.explicit ?? false

    let packId: string
    if (isExplicit) {
      const argsText = ctx.parsedCommand?.argsText?.trim() ?? ''
      if (!argsText) {
        await ctx.reply(stickerMessages.packMissingId)
        return
      }
      packId = parsePackId(argsText)
      if (!PACK_ID_REGEX.test(packId)) {
        await ctx.reply(stickerMessages.packInvalidId)
        return
      }
    } else {
      // Implicito: extrai o codigo do link presente na mensagem (ja validado pelo match)
      const match = (ctx.message.body ?? '').match(PACK_LINK_REGEX)
      if (!match) return
      packId = match[1].toUpperCase()
    }

    if (!services.stickerLy) {
      await ctx.reply(stickerMessages.lyPackSendFailed)
      return
    }
    let pack
    try {
      pack = await services.stickerLy.getPack(packId)
    } catch (error) {
      await ctx.reply(stickerMessages.packNotFound(packId))
      return
    }

    if (!pack) {
      await ctx.reply(stickerMessages.packNotFound(packId))
      return
    }

    // Avisa que achou antes de baixar/enviar, pois o pacote demora um pouco
    await ctx.reply(stickerMessages.packFound(pack.name, pack.stickerUrls.length))

    const packName = `${pack.name} - ${pack.id}`
    await sendStickerLyPack(ctx, services, pack.stickerUrls, { name: packName, id: pack.id })
  }
})
