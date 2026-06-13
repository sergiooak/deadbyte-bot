import { defineStickerFitCommand } from './sticker-fit-command.factory.js'

export const cropStickerCommand = defineStickerFitCommand({
  id: 'sticker.crop',
  name: 'Sticker quadrado',
  description: 'Converte mídia em sticker cortando para preencher o quadrado inteiro.',
  aliases: ['quadrado', 'quadrada', 'cortado', 'cortada', 'fc', 'crop', 'sc'],
  fit: 'cover',
  order: 3,
})
