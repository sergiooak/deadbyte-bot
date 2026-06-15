import type { CommandContext } from '@deadbyte/runtime'
import { stickerMessages } from '../../messages/sticker.messages.js'
import type { GroupConfigService } from '../../groups/group-config.service.js'
import type { StickerLyService } from '../../services/stickers/sticker-ly.service.js'

export const DEFAULT_PACK_PUBLISHER = 'DeadByte.com.br'

export type ReplyWithStickerPack = (
  items: Array<{ buffer: Buffer; mimeType: string; filename?: string }>,
  pack: { name: string; publisher: string; id?: string }
) => Promise<void>

export type StickerLyCommandServices = {
  stickerLy?: StickerLyService
  groupConfigs?: GroupConfigService
  replyWithStickerPack?: ReplyWithStickerPack
}

/**
 * Resolve o publicador do pacote: usa o autor configurado no grupo,
 * caindo para o padrao do DeadByte -- mesma ideia do `applyGroupMetadata`.
 */
export function resolvePackPublisher(ctx: CommandContext, services: StickerLyCommandServices): string {
  if (ctx.chat.isGroup && services.groupConfigs) {
    const groupConfig = services.groupConfigs.get(ctx.chat.id)
    if (groupConfig?.autor) return groupConfig.autor
  }
  return DEFAULT_PACK_PUBLISHER
}

const RANDOM_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

/** Gera um sufixo aleatorio de 6 caracteres para nomear pacotes sem nome proprio. */
export function randomPackTag(): string {
  let tag = ''
  for (let i = 0; i < 6; i++) {
    tag += RANDOM_CHARS.charAt(Math.floor(Math.random() * RANDOM_CHARS.length))
  }
  return tag
}

/**
 * Baixa as URLs e envia tudo como um unico pacote de figurinhas.
 * Retorna `true` em caso de sucesso e `false` (ja respondendo o erro) caso contrario.
 */
export async function sendStickerLyPack(
  ctx: CommandContext,
  services: StickerLyCommandServices,
  urls: string[],
  pack: { name: string; id?: string }
): Promise<boolean> {
  if (!services.stickerLy || !services.replyWithStickerPack) {
    await ctx.reply(stickerMessages.lyPackSendFailed)
    return false
  }

  try {
    const medias = await services.stickerLy.downloadStickers(urls)
    if (medias.length === 0) {
      await ctx.reply(stickerMessages.lyPackSendFailed)
      return false
    }

    await services.replyWithStickerPack(medias, {
      name: pack.name,
      publisher: resolvePackPublisher(ctx, services),
      id: pack.id
    })
    return true
  } catch {
    await ctx.reply(stickerMessages.lyPackSendFailed)
    return false
  }
}
