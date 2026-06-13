import { defineStickerFitCommand } from './sticker-fit-command.factory.js'

export const fitStickerCommand = defineStickerFitCommand({
  id: 'sticker.fit',
  name: 'Sticker inteiro',
  description: 'Converte mídia em sticker preservando proporção (fundo transparente).',
  aliases: ['inteira', 'inteiro', 'ff', 'fit', 'sf', 'fi'],
  fit: 'contain',
  order: 2,
})
