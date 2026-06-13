import { defineStickerFitCommand } from './sticker-fit-command.factory.js'

export const stretchStickerCommand = defineStickerFitCommand({
  id: 'sticker.stretch',
  name: 'Sticker esticado',
  description: 'Converte mídia em sticker esticando para preencher o quadrado, sem recortar.',
  aliases: ['esticada', 'esticado', 'achatada', 'achatado', 'fe', 'estica', 'stretch', 'ss'],
  fit: 'stretch',
  order: 4,
})
