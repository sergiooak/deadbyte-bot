import wwebjs from 'whatsapp-web.js'
import Util from '../../utils/sticker.js'
import sharp from 'sharp'
import { createUrl } from '../../config/api.js'
import reactions from '../../config/reactions.js'
import logger from '../../logger.js'

/**
 * Make sticker from media (image, video, gif)
 * @param {wwebjs.Message} msg
 * @param {boolean} crop
 */
export async function sticker (msg, crop = false) {
  await msg.react(reactions.wait)

  let media = await msg.downloadMedia()
  if (!media) return logger.error('Error downloading media')
  let stickerMedia = await Util.formatToWebpSticker(media, {}, crop)
  let mediaBuffer = Buffer.from(stickerMedia.data, 'base64')

  // if message has body, add it to the sticker as subtitle
  if (msg.body) {
    const url = await createUrl('image-creator', 'ttp', {
      message: msg.body,
      subtitle: true
    })
    const subtitleMedia = await wwebjs.MessageMedia.fromUrl(url, {
      unsafeMime: true
    })
    if (!subtitleMedia) return logger.error('Error downloading media')
    const subtitleBuffer = Buffer.from(subtitleMedia.data, 'base64')

    // using sharp, overlay the subtitleBuffer on top of the mediaBuffer, compress to be smaller than 1MB
    const finalBuffer = await sharp(mediaBuffer, { animated: true })
      .composite([{
        input: subtitleBuffer,
        gravity: 'south',
        animated: true,
        tile: true
      }])
      .webp()
      .toBuffer()

    // replace media data with the new data from sharp
    stickerMedia = new wwebjs.MessageMedia('image/webp', finalBuffer.toString('base64'), 'deadbyte.webp', true)
  }

  const chat = await msg.getChat()

  // if heavier than 1MB, compress it
  media = new wwebjs.MessageMedia('image/webp', stickerMedia.data, 'deadbyte.webp', true)
  mediaBuffer = Buffer.from(stickerMedia.data, 'base64')

  if (mediaBuffer.byteLength > 1_000_000) {
    logger.debug('compressing sticker...', mediaBuffer.byteLength)
    const compressedBuffer = await sharp(mediaBuffer, { animated: true })
      .webp({ quality: 33 })
      .toBuffer()
    media = new wwebjs.MessageMedia('image/webp', compressedBuffer.toString('base64'), 'deadbyte.webp', true)
    logger.debug('compressed sticker!', mediaBuffer.byteLength, '->', compressedBuffer.byteLength)
    mediaBuffer = Buffer.from(media.data, 'base64')
  }

  // if still heavier than 1MB, throw error
  if (mediaBuffer.byteLength > 1_000_000) {
    logger.warn('sticker is still too heavy!', mediaBuffer.byteLength)
    return await msg.react(reactions.heavy)
  }

  await sendMediaAsSticker(chat, media)

  if (!crop) {
    await sticker(msg, true) // make cropped version
    await msg.react(reactions.success)
  }
}

/**
 * Make sticker from text
 * @param {wwebjs.Message} msg
 */
export async function stickerText (msg) {
  await msg.react(reactions.wait)

  const url = await createUrl('image-creator', 'ttp', {
    message: msg.body
  })

  const media = await wwebjs.MessageMedia.fromUrl(url, {
    unsafeMime: true
  })
  if (!media) {
    logger.error('Error downloading media')
    return await msg.react(reactions.error)
  }

  const chat = await msg.getChat()

  // send media as sticker back
export async function removeBg (msg) {
  await msg.react(reactions.wait)

  if (!msg.hasMedia) {
    await msg.react(reactions.error)

    const header = '☠️🤖'
    const part1 = 'Para usar o {remove.bg|removedor de fundo|*!bg*} você {precisa|tem que}'
    const part2 = '{enviar|mandar} {esse|o} comando {junto com|na legenda de} uma {imagem|foto}'
    const end = '{!|!!|!!!}'

    const message = spintax(`${header} - ${part1} ${part2}${end}`)
    return await msg.reply(message)
  }

  const media = await msg.downloadMedia()
  if (!media) return logger.error('Error downloading media')
  if (!media.mimetype.includes('image')) {
    await msg.react(reactions.error)
    return await msg.reply('❌ Só consigo remover o fundo de imagens')
  }

  // upload image to get temporary url
  const formData = new FormData()
  const buffer = Buffer.from(media.data, 'base64')
  formData.append('file', buffer, 'image.png')

  const response = await fetch('https://v1.deadbyte.com.br/uploader/tempurl', {
    method: 'POST',
    body: formData
  })

  if (!response.ok) {
    logger.error('Error uploading image to remove.bg')
    return await msg.react(reactions.error)
  }

  const json = await response.json()
  const tempUrl = json.result

  // download image from temporary url
  const image = await fetch(tempUrl)
  if (!image.ok) {
    logger.error('Error downloading image from remove.bg')
    return await msg.react(reactions.error)
  }

  // send image as sticker back
  const chat = await msg.getChat()

  await Promise.all([sendStickerBg()])

  await msg.react(reactions.success)

  async function sendStickerBg (model) {
    const url = 'https://v1.deadbyte.com.br/image-processing/removebg?img=' + tempUrl + '&trim=true'
    const stickerMedia = await wwebjs.MessageMedia.fromUrl(url + tempUrl + '&trim=true', {
      unsafeMime: true
    })
    await sendMediaAsSticker(chat, stickerMedia)
  }
}
/**
 * Resend the sticker with the given pack and author
 * @param {wwebjs.Message} msg
 *
 */
export async function stealSticker (msg) {
  await msg.react(reactions.wait)

  const quotedMsg = await msg.getQuotedMessage()

  if (!msg.hasQuotedMsg || !quotedMsg.hasMedia) {
    await msg.react(reactions.error)

    const header = '☠️'
    const part1 = 'Para usar o *{!|/|#|.}{roubar|steal}* você {precisa|tem que}'
    const part2 = '{enviar|mandar} {esse|o} comando {respondendo|mencionando} {um sticker|uma figurinha}'
    const end = '{!|!!|!!!}'

    const message = spintax(`${header} - ${part1} ${part2}${end}`)
    return await msg.reply(message)
  }

  const media = await quotedMsg.downloadMedia()
  if (!media) return logger.error('Error downloading media')

  const body = msg.body.split('|')

  const stickerName = body[0]?.trim() || msg.aux.sender.pushname
  const stickerAuthor = body[1]?.trim() || 'DeadByte.com.br'

  await sendMediaAsSticker(msg.aux.chat, media, stickerName, stickerAuthor)
}
async function sendMediaAsSticker (chat, media, stickerName, stickerAuthor) {
  await chat.sendMessage(media, {
    sendMediaAsSticker: true,
    stickerName: stickerName || 'DeadByte.com.br',
    stickerAuthor: stickerAuthor || 'bot de figurinhas',
    stickerCategories: ['💀', '🤖']
  })
}
