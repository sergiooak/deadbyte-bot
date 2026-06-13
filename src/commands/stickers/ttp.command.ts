import { defineCommand, type CommandContext } from '@deadbyte/runtime'
import { stickerMessages } from '../../messages/sticker.messages.js'
import { fetchTtp } from '../../services/stickers/ttp.service.js'
import { matchesCommandAlias } from '../../utils/commands.js'
import { applyGroupMetadata, resolveStickerOptions } from './create-sticker.command.js'
import type { StickerService } from '../../services/stickers/sticker.service.js'
import type { GroupConfigService } from '../../groups/group-config.service.js'

type TtpServices = {
  stickers?: StickerService
  groupConfigs?: GroupConfigService
}

/**
 * Resolve o texto para o TTP:
 *  1. argsText -- texto apos o alias (!ttp <texto>)
 *  2. corpo da mensagem quoted -- se o usuario respondeu a um texto
 *  3. null -- sem texto, nao pode gerar
 */
function resolveTtpText(ctx: CommandContext): string | null {
  const argsText = ctx.parsedCommand?.argsText?.trim()
  if (argsText) return argsText
  if (ctx.quotedMessage?.body?.trim()) return ctx.quotedMessage.body.trim()
  return null
}

/**
 * Comando TTP unificado.
 *
 * Modo explicito: !ttp <texto> / !ttp2 <texto> / !ttp3 <texto>
 *   - funciona em grupos e privado
 *   - texto vem do argsText ou da mensagem respondida
 *
 * Modo implicito (auto-TTP): qualquer mensagem de texto puro em chat privado
 *   - identico ao commandless.stickersFNtextSticker do v3
 *   - so ativa em private (como primado), nunca em grupos
 *
 * Em ambos os casos a imagem TTP passa pelo StickerService para conversao
 * correta para WebP 512x512 com EXIF -- igual ao sendMediaAsSticker do v3.
 */
export const ttpCommand = defineCommand({
  id: 'sticker.ttp',
  group: 'sticker',
  name: 'Texto para figurinha (TTP)',
  description: 'Cria figurinha a partir de texto. Explicito: !ttp <texto>. Implicito: qualquer texto no privado.',
  aliases: ['ttp', 'ttp1', 'ttp2', 'ttp3'],
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  supports: {
    private: true,
    groups: true,
    implicit: true
  },
  configFields: [],
  async match(ctx) {
    // Modo explicito: usuario usou um alias do comando
    if (matchesCommandAlias(ctx, 'sticker.ttp', ttpCommand.aliases)) return true

    // Modo implicito (auto-TTP): texto puro no privado, sem prefixo de comando
    if (ctx.parsedCommand?.explicit) return false
    if (ctx.chat.isGroup) return false
    if (ctx.message.type !== 'chat') return false
    if (!ctx.message.body?.trim()) return false
    return true
  },
  async run(ctx) {
    const isExplicit = ctx.parsedCommand?.explicit ?? false

    // Resolve o texto: explicito usa argsText/quoted, implicito usa o body direto
    const text = isExplicit
      ? resolveTtpText(ctx)
      : ctx.message.body.trim()

    if (!text) {
      await ctx.reply('🤖 - Manda um texto depois do comando ou responde a uma mensagem de texto.\nEx: *!ttp bom dia*')
      return
    }

    // Estilo: detecta pelo alias (ttp2, ttp3); auto-TTP sempre usa estilo 1
    const alias = ctx.parsedCommand?.normalizedName ?? 'ttp'
    const style: 1 | 2 | 3 = alias === 'ttp3' ? 3 : alias === 'ttp2' ? 2 : 1

    try {
      // Baixa a imagem da API com mime type real (PNG, WebP, etc.)
      const { buffer, mimeType } = await fetchTtp(text, style)

      // Passa pelo StickerService para conversao correta: resize 512x512, WebP + EXIF
      // Equivalente ao sendMediaAsSticker -> formatToWebpSticker do v3
      const services = ctx.services as TtpServices
      const { metadata, options } = resolveStickerOptions(ctx.config.commands['sticker.create']?.config)
      const groupMetadata = applyGroupMetadata(metadata, ctx.chat, services.groupConfigs)

      const sticker = await services.stickers?.createSticker(
        { buffer, mimeType },
        groupMetadata,
        { ...options, fit: 'contain' }
      )
      if (!sticker) throw new Error('StickerService nao disponivel')

      await ctx.replyWithSticker(sticker.buffer, sticker.mimeType)
    } catch {
      await ctx.reply(stickerMessages.creationFailed)
    }
  }
})
