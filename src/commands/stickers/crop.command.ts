import { defineStickerFitCommand } from './sticker-fit-command.factory.js'

export const cropStickerCommand = defineStickerFitCommand({
  id: 'sticker.crop',
  name: 'Sticker crop',
  description: 'Converte mídia em sticker com fit "cover" (corta para preencher o quadrado inteiro).',
  aliases: ['fc', 'crop', 'sc', 'cortado', 'cortada', 'quadrado', 'quadrada'],
  fit: 'cover'
})
