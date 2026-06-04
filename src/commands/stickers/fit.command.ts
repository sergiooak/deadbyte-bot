import { defineStickerFitCommand } from './sticker-fit-command.factory.js'

export const fitStickerCommand = defineStickerFitCommand({
  id: 'sticker.fit',
  name: 'Sticker fit',
  description: 'Converte mídia em sticker com fit "contain" (preserva proporção, fundo transparente).',
  aliases: ['ff', 'fit', 'sf', 'inteira', 'inteiro', 'fi'],
  fit: 'contain'
})
