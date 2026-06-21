import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineCommand } from '@deadbyte/runtime'
import { mediaMessages } from '../../messages/media.messages.js'
import { matchesCommandAlias } from '../../utils/commands.js'
import { resolveAndProcessMedia, type MediaEditServices } from './media-edit.factory.js'

const ASSET_PATH = join(fileURLToPath(import.meta.url), '..', '..', '..', 'assets', 'craque-do-jogo.png')

export const craqueCommand = defineCommand({
  id: 'media.craque',
  group: 'media',
  name: 'Craque do jogo',
  description: 'Adiciona o selo "Craque do jogo" no canto superior direito da mídia.',
  aliases: ['craque', 'craquedojogo', 'mvp', 'craquedomatch'],
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  order: 3,
  supports: { private: true, groups: true, implicit: false },
  configFields: [],
  async match(ctx) {
    return matchesCommandAlias(ctx, 'media.craque', craqueCommand.aliases)
  },
  async run(ctx) {
    const services = ctx.services as MediaEditServices

    let assetBuffer: Buffer
    try {
      assetBuffer = await readFile(ASSET_PATH)
    } catch {
      await ctx.reply(mediaMessages.craqueAssetMissing)
      return
    }

    await resolveAndProcessMedia(ctx, services, (ffmpeg, input, inputExt, outputExt) =>
      ffmpeg.overlayTopRight(input, inputExt, outputExt, assetBuffer)
    )
  },
})
