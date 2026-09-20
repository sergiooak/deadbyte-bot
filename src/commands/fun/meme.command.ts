import { defineCommand } from '@deadbyte/runtime'
import { fetchTexasMeme } from '../../services/texas/texas-api.service.js'
import { matchesExplicitAlias } from '../../utils/commands.js'

type MemeServices = {
  replyWithMedia?: (media: { buffer: Buffer; mimeType: string; filename?: string }) => Promise<void>
}

export const memeCommand = defineCommand({
  id: 'fun.meme',
  group: 'fun',
  name: 'Meme aleatório',
  description: 'Envia um meme aleatório (foto ou vídeo).',
  aliases: ['meme'],
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  supports: {
    private: true,
    groups: true,
    implicit: false
  },
  configFields: [],
  async match(ctx) {
    return matchesExplicitAlias(ctx, 'fun.meme', memeCommand.aliases)
  },
  async run(ctx) {
    try {
      const media = await fetchTexasMeme()
      const services = ctx.services as MemeServices
      const isVideo = media.mimeType.startsWith('video/')
      const ext = media.mimeType.split('/')[1] ?? 'jpg'
      await services.replyWithMedia?.({ ...media, filename: `meme.${isVideo ? 'mp4' : ext}` })
    } catch {
      await ctx.reply('Não foi possível buscar o meme. Tente novamente.')
    }
  }
})
