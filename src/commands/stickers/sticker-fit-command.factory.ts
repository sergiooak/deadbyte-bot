import { defineCommand, type CommandContext } from '@deadbyte/runtime'
import { stickerMessages } from '../../messages/sticker.messages.js'
import type { BufferMedia } from '../../services/media/media.types.js'
import type { GroupConfigService } from '../../groups/group-config.service.js'
import type { StickerService } from '../../services/stickers/sticker.service.js'
import type { StickerFit } from '../../services/stickers/sticker.types.js'
import { overlaySubtitle } from '../../services/stickers/ttp.service.js'
import { matchesCommandAlias } from '../../utils/commands.js'
import { applyGroupMetadata, resolveStickerOptions } from './create-sticker.command.js'

type StickerCommandServices = {
  stickers?: StickerService
  groupConfigs?: GroupConfigService
  resolveTargetMedia?: () => Promise<BufferMedia | undefined>
}

type StickerFitCommandOptions = {
  id: `sticker.${string}`
  name: string
  description: string
  aliases: string[]
  fit: StickerFit
  order?: number
  hiddenFromMenu?: boolean
}

type MediaResolution =
  | { status: 'found'; media: BufferMedia }
  | { status: 'missing' }
  | { status: 'failed' }

export async function resolveStickerMedia(
  ctx: CommandContext,
  services: { resolveTargetMedia?: () => Promise<BufferMedia | undefined> }
): Promise<MediaResolution> {
  try {
    const media = await services.resolveTargetMedia?.()
    return media ? { status: 'found', media } : { status: 'missing' }
  } catch {
    await ctx.reply(stickerMessages.mediaDownloadFailed)
    return { status: 'failed' }
  }
}

export async function createAndReplyWithSticker(
  ctx: CommandContext,
  services: StickerCommandServices,
  media: BufferMedia,
  fit: StickerFit
): Promise<void> {
  const { metadata, options } = resolveStickerOptions(ctx.config.commands['sticker.create']?.config)
  const groupMetadata = applyGroupMetadata(metadata, ctx.chat, services.groupConfigs)
  const sticker = await services.stickers?.createSticker(media, groupMetadata, { ...options, fit })

  if (!sticker) {
    throw new Error('Sticker service is not available.')
  }

  // Se o usuario mandou texto junto com o comando, sobrepoe como legenda.
  // Apos o overlay via ffmpeg o EXIF e perdido, entao re-aplicamos os metadados.
  const caption = ctx.parsedCommand?.argsText?.trim()
  const finalBuffer = caption
    ? await overlaySubtitle(caption, sticker.buffer)
        .then(buf => services.stickers!.reapplyMetadata(buf, groupMetadata))
        .catch(() => sticker.buffer)
    : sticker.buffer

  await ctx.replyWithSticker(finalBuffer, sticker.mimeType)
}

export function defineStickerFitCommand(options: StickerFitCommandOptions) {
  return defineCommand({
    id: options.id,
    group: 'sticker',
    name: options.name,
    description: options.description,
    aliases: options.aliases,
    enabledByDefault: true,
    ownerOnlyByDefault: false,
    order: options.order,
    hiddenFromMenu: options.hiddenFromMenu,
    supports: {
      private: true,
      groups: true,
      implicit: false
    },
    configFields: [],
    async match(ctx) {
      return matchesCommandAlias(ctx, options.id, options.aliases)
    },
    async run(ctx) {
      const services = ctx.services as StickerCommandServices
      const resolution = await resolveStickerMedia(ctx, services)

      if (resolution.status === 'failed') {
        return
      }

      if (resolution.status === 'missing') {
        await ctx.reply(stickerMessages.missingCreationMedia)
        return
      }

      try {
        await createAndReplyWithSticker(ctx, services, resolution.media, options.fit)
      } catch {
        await ctx.reply(stickerMessages.creationFailed)
      }
    }
  })
}
