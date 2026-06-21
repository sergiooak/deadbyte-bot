import sharp from 'sharp'
import { defineMediaEditCommand } from './media-edit.factory.js'

const PRIDE_STRIPES: [number, number, number][] = [
  [228, 3, 3],    // red
  [255, 140, 0],  // orange
  [255, 237, 0],  // yellow
  [0, 128, 38],   // green
  [0, 77, 255],   // blue
  [117, 7, 135],  // purple
]

async function buildFlagPng(width: number, height: number): Promise<Buffer> {
  const stripeH = Math.ceil(height / PRIDE_STRIPES.length)
  const rects = PRIDE_STRIPES.map(([r, g, b], i) =>
    `<rect x="0" y="${i * stripeH}" width="${width}" height="${stripeH}" fill="rgb(${r},${g},${b})"/>`
  ).join('')
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${rects}</svg>`
  return sharp(Buffer.from(svg)).png().toBuffer()
}

export const gayFlagCommand = defineMediaEditCommand({
  id: 'media.gayflag',
  name: 'Bandeira do orgulho',
  description: 'Sobrepõe a bandeira do orgulho LGBT sobre a mídia.',
  aliases: ['pride', 'arcoiris', 'gay', 'bandeiragay', 'lgbt'],
  order: 2,
  processFn: async (ffmpeg, input, inputExt, outputExt) => {
    const dims = await ffmpeg.probeAspectRatio(input)
    const flagPng = await buildFlagPng(dims.width, dims.height)
    return ffmpeg.overlayFull(input, inputExt, outputExt, flagPng, 0.4)
  },
})
