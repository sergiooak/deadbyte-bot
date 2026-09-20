import { defineCommand } from '@deadbyte/runtime'
import { fetchTexasCat } from '../../services/texas/texas-api.service.js'
import { matchesExplicitAlias } from '../../utils/commands.js'

type CatServices = {
  replyWithMedia?: (media: { buffer: Buffer; mimeType: string; filename?: string }) => Promise<void>
}

export const catCommand = defineCommand({
  id: 'fun.cat',
  group: 'fun',
  name: 'Foto de gatinho',
  description: 'Envia uma foto aleatória de gatinho.',
  aliases: ['gato', 'gatinho', 'cat'],
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  supports: {
    private: true,
    groups: true,
    implicit: false
  },
  configFields: [],
  async match(ctx) {
    return matchesExplicitAlias(ctx, 'fun.cat', catCommand.aliases)
  },
  async run(ctx) {
    try {
      const media = await fetchTexasCat()
      const services = ctx.services as CatServices
      const ext = media.mimeType.split('/')[1] ?? 'jpg'
      await services.replyWithMedia?.({ ...media, filename: `gatinho.${ext}` })
    } catch {
      await ctx.reply('Não foi possível buscar a foto do gatinho. Tente novamente.')
    }
  }
})
