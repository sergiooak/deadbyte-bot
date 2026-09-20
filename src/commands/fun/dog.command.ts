import { defineCommand } from '@deadbyte/runtime'
import { fetchTexasDog } from '../../services/texas/texas-api.service.js'
import { matchesExplicitAlias } from '../../utils/commands.js'

type DogServices = {
  replyWithMedia?: (media: { buffer: Buffer; mimeType: string; filename?: string }) => Promise<void>
}

export const dogCommand = defineCommand({
  id: 'fun.dog',
  group: 'fun',
  name: 'Foto de cachorrinho',
  description: 'Envia uma foto aleatória de cachorrinho.',
  aliases: ['cachorro', 'cachorrinho', 'dog', 'doguinho'],
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  supports: {
    private: true,
    groups: true,
    implicit: false
  },
  configFields: [],
  async match(ctx) {
    return matchesExplicitAlias(ctx, 'fun.dog', dogCommand.aliases)
  },
  async run(ctx) {
    try {
      const media = await fetchTexasDog()
      const services = ctx.services as DogServices
      const ext = media.mimeType.split('/')[1] ?? 'jpg'
      await services.replyWithMedia?.({ ...media, filename: `cachorrinho.${ext}` })
    } catch {
      await ctx.reply('Não foi possível buscar a foto do cachorrinho. Tente novamente.')
    }
  }
})
