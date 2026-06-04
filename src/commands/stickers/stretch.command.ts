import { defineStickerFitCommand } from './sticker-fit-command.factory.js'

export const stretchStickerCommand = defineStickerFitCommand({
  id: 'sticker.stretch',
  name: 'Sticker stretch',
  description: 'Converte mídia em sticker com fit "stretch" (estica para preencher o quadrado, sem recortar).',
  aliases: ['fe', 'estica', 'stretch', 'ss', 'achatada', 'achatado'],
  fit: 'stretch'
})
