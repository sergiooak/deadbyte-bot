import { defineMediaEditCommand } from './media-edit.factory.js'

export const grayscaleCommand = defineMediaEditCommand({
  id: 'media.grayscale',
  name: 'Preto e branco',
  description: 'Converte imagem, vídeo ou figurinha para preto e branco.',
  aliases: ['pb', 'cinza', 'grayscale', 'bw', 'pretoebranco'],
  order: 1,
  processFn: (ffmpeg, input, inputExt, outputExt) =>
    ffmpeg.grayscale(input, inputExt, outputExt),
})
