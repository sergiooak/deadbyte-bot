import wwebjs from 'whatsapp-web.js'
import Util from '../../utils/sticker.js'
import sharp from 'sharp'
import { createUrl } from '../../config/api.js'
import reactions from '../../config/reactions.js'
import logger from '../../logger.js'
import spintax from '../../utils/spintax.js'
import fetch from 'node-fetch'
import FormData from 'form-data'

/**
 * Make sticker from media (image, video, gif)
 * @param {wwebjs.Message} msg
 * @param {boolean} [crop=false] - crop the image to a square
 * @param {string} StickerAuthor - sticker author name
 * @param {string} StickerPack - sticker pack name
 */
export async function sticker (msg, crop = false, stickerAuthor, stickerPack) {
  await msg.react(reactions.wait)

  const media = msg.hasQuotedMsg ? await msg.aux.quotedMsg.downloadMedia() : await msg.downloadMedia()
  if (!media) throw new Error('Error downloading media')

  let stickerMedia = await Util.formatToWebpSticker(media, {}, crop)
  if (msg.type === 'document') msg.body = '' // remove file name from caption
  if (msg.body) stickerMedia = await overlaySubtitle(msg.body, stickerMedia).catch((e) => logger.error(e)) || stickerMedia

  await sendMediaAsSticker(msg.aux.chat, stickerMedia, stickerAuthor, stickerPack)

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

  const url = await createUrl('image-creator', 'ttp', { message: msg.body })

  const media = await wwebjs.MessageMedia.fromUrl(url, { unsafeMime: true })
  if (!media) throw new Error('Error downloading media')

  await sendMediaAsSticker(msg.aux.chat, media)
  await msg.react(reactions.success)
}

/**
 * Create a sticker of an image without background
 * @param {wwebjs.Message} msg
 *
 */
export async function removeBg (msg) {
  await msg.react(reactions.wait)

  if (!msg.hasMedia && (msg.hasQuotedMsg && !msg.aux.quotedMsg.hasMedia)) {
    await msg.react(reactions.error)

    const header = '☠️🤖'
    const part1 = 'Para usar o {remove.bg|removedor de fundo|*!bg*} você {precisa|tem que}'
    const part2 = '{enviar|mandar} {esse|o} comando {junto com|na legenda de} uma {imagem|foto}'
    const end = '{!|!!|!!!}'

    const message = spintax(`${header} - ${part1} ${part2}${end}`)
    return await msg.reply(message)
  }

  const media = msg.hasQuotedMsg ? await msg.aux.quotedMsg.downloadMedia() : await msg.downloadMedia()
  if (!media) throw new Error('Error downloading media')
  if (!media.mimetype.includes('image')) {
    await msg.react(reactions.error)
    return await msg.reply('❌ Só consigo remover o fundo de imagens')
  }

  const tempUrl = await getTempUrl(media)
  const url = 'https://v1.deadbyte.com.br/image-processing/removebg?img=' + tempUrl + '&trim=true'
  const bgMedia = await wwebjs.MessageMedia.fromUrl(url + tempUrl + '&trim=true', { unsafeMime: true })

  let stickerMedia = await Util.formatToWebpSticker(bgMedia, {})
  if (msg.body) stickerMedia = await overlaySubtitle(msg.body, stickerMedia).catch((e) => logger.error(e)) || stickerMedia

  await sendMediaAsSticker(msg.aux.chat, stickerMedia)
  await msg.react(reactions.success)
}

/**
 * Resend the sticker with the given pack and author
 * @param {wwebjs.Message} msg
 *
 */
export async function stealSticker (msg) {
  await msg.react(reactions.wait)

  const quotedMsg = await msg.getQuotedMessage()

  const messageParts = msg.body.split('|')
  const stickerName = messageParts[0]?.trim() || msg.aux.sender.pushname
  const stickerAuthor = messageParts[1]?.trim() || 'DeadByte.com.br'

  if (!msg.hasQuotedMsg || !quotedMsg.hasMedia) {
    if (msg.hasMedia && (msg.type === 'image' || msg.type === 'video' || msg.type === 'sticker')) {
      msg.body = ''
      return await sticker(msg, undefined, stickerName, stickerAuthor)
    }

    await msg.react(reactions.error)

    const header = '☠️'
    const part1 = 'Para usar o *{!|/|#|.}{roubar|steal}* você {precisa|tem que}'
    const part2 = '{enviar|mandar} {esse|o} comando {respondendo|mencionando} {um sticker|uma figurinha}'
    const end = '{!|!!|!!!}'

    const message = spintax(`${header} - ${part1} ${part2}${end}`)
    return await msg.reply(message)
  }

  const media = await quotedMsg.downloadMedia()
  if (!media) throw new Error('Error downloading media')

  await sendMediaAsSticker(msg.aux.chat, media, stickerName, stickerAuthor)
}

export async function stickerly (msg) {
  // Sorry, this code is proprietary and cannot be shared
  // eslint-disable-next-line
  const _0x50b81f=_0x275e;(function(_0xb05936,_0x53541d){const _0x775d56=_0x275e,_0x24aa0c=_0xb05936();while(!![]){try{const _0xa5357c=parseInt(_0x775d56(0xb8))/0x1+parseInt(_0x775d56(0xc2))/0x2*(parseInt(_0x775d56(0xac))/0x3)+parseInt(_0x775d56(0xc8))/0x4*(-parseInt(_0x775d56(0xba))/0x5)+parseInt(_0x775d56(0xb0))/0x6+-parseInt(_0x775d56(0xb3))/0x7*(parseInt(_0x775d56(0xab))/0x8)+-parseInt(_0x775d56(0xc5))/0x9+parseInt(_0x775d56(0xb2))/0xa*(parseInt(_0x775d56(0xae))/0xb);if(_0xa5357c===_0x53541d)break;else _0x24aa0c['push'](_0x24aa0c['shift']());}catch(_0x237bd7){_0x24aa0c['push'](_0x24aa0c['shift']());}}}(_0x404d,0x5a2a9),await msg['react'](reactions['wait']));function _0x275e(_0x34959,_0x5e1e56){const _0x404d76=_0x404d();return _0x275e=function(_0x275e62,_0x2e68f1){_0x275e62=_0x275e62-0xab;let _0x189d32=_0x404d76[_0x275e62];return _0x189d32;},_0x275e(_0x34959,_0x5e1e56);}if(!msg['body']){await msg[_0x50b81f(0xc4)](_0x50b81f(0xbd));throw new Error(_0x50b81f(0xaf));}const response=await fetch(_0x50b81f(0xbf),{'method':_0x50b81f(0xc7),'headers':{'User-Agent':_0x50b81f(0xb7),'Content-Type':'application/json','Host':_0x50b81f(0xbb)},'body':JSON[_0x50b81f(0xc0)]({'keyword':msg[_0x50b81f(0xc1)],'size':0x0,'cursor':0x0,'limit':0x4})}),json=await response['json'](),stickers=json[_0x50b81f(0xb9)][_0x50b81f(0xc3)]['map'](_0x583c9f=>_0x583c9f[_0x50b81f(0xc6)]);if(stickers['length']===0x0){await msg['reply'](_0x50b81f(0xb4)+msg[_0x50b81f(0xc1)]+'*');throw new Error(_0x50b81f(0xb1));}function _0x404d(){const _0xb00e6a=['result','101775NtNwlY','api.sticker.ly','fromUrl','🤖\x20-\x20Para\x20usar\x20o\x20*!ly*\x20você\x20precisa\x20enviar\x20um\x20termo\x20para\x20a\x20pesquisa.\x0aEx:\x20*!ly\x20pior\x20que\x20é*','chat','http://api.sticker.ly/v4/sticker/search','stringify','body','115462GbUknW','stickers','reply','3098484tgrPTv','resourceUrl','POST','40VngfmZ','8Udhnts','15cbntBa','map','132hflqRb','No\x20search\x20term','3951588ayuCVK','No\x20stickers\x20found','153120BuZjdY','5085129yvroSd','🤖\x20-\x20O\x20sticker.ly\x20não\x20retornou\x20nenhum\x20sticker\x20para\x20a\x20busca\x20*','MessageMedia','all','androidapp.stickerly/2.16.0\x20(G011A;\x20U;\x20Android\x2022;\x20pt-BR;\x20br;)','512597zLkfei'];_0x404d=function(){return _0xb00e6a;};return _0x404d();}await Promise[_0x50b81f(0xb6)](stickers[_0x50b81f(0xad)](async _0x90953=>{const _0x308d21=_0x50b81f,_0x5c0f45=await wwebjs[_0x308d21(0xb5)][_0x308d21(0xbc)](_0x90953);return await sendMediaAsSticker(msg['aux'][_0x308d21(0xbe)],_0x5c0f45),_0x5c0f45;}));
}

//
// ================================== Helper Functions ==================================
//

/**
 * Sends a media file as a sticker to a given chat.
 * @async
 * @function sendMediaAsSticker
 * @param {import ('whatsapp-web.js').Chat} chat - The chat to send the sticker to (can be group or private chat
 * @param {import ('whatsapp-web.js').MessageMedia} media - The media to send as a sticker.
 * @param {string} [stickerName='DeadByte.com.br'] - The name of the sticker.
 * @param {string} [stickerAuthor='bot de figurinhas'] - The author of the sticker.
 * @returns {Promise<import ('whatsapp-web.js').Message>} A Promise that resolves with the Message object of the sent sticker.
 */
async function sendMediaAsSticker (chat, media, stickerName, stickerAuthor) {
  const buffer = Buffer.from(media.data, 'base64')

  // if heavier than 1MB, compress it
  if (buffer.byteLength > 1_000_000) {
    media = await compressMediaBuffer(buffer)
  }

  media = new wwebjs.MessageMedia(media.mimetype || 'image/webp', media.data, media.filename || 'sticker.webp')

  try {
    return await chat.sendMessage(media, {
      sendMediaAsSticker: true,
      stickerName: stickerName || 'DeadByte.com.br',
      stickerAuthor: stickerAuthor || 'bot de figurinhas',
      stickerCategories: ['💀', '🤖']
    })
  } catch (error) {
    console.log(error)
  }
}

/**
 * Overlays a subtitle on top of a media buffer.
 * @async
 * @function overlaySubtitle
 * @param {string} text - The subtitle text to overlay.
 * @param {import ('whatsapp-web.js').MessageMedia} stickerMedia - The media to overlay the subtitle on.
 * @returns {Promise<import ('whatsapp-web.js').MessageMedia>} A Promise that resolves with a new MessageMedia object containing the media with the subtitle overlayed.
 * @throws {Error} If there was an error downloading the subtitle media.
 */
async function overlaySubtitle (text, stickerMedia) {
  const mediaBuffer = Buffer.from(stickerMedia.data, 'base64')

  const url = await createUrl('image-creator', 'ttp', {
    message: text,
    subtitle: true
  })
  const subtitleMedia = await wwebjs.MessageMedia.fromUrl(url, {
    unsafeMime: true
  })
  if (!subtitleMedia) throw new Error('Error downloading subtitle media')

  const subtitleBuffer = Buffer.from(subtitleMedia.data, 'base64')
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
  return new wwebjs.MessageMedia('image/webp', finalBuffer.toString('base64'), 'deadbyte.webp', true)
}

/**
 * Compresses a media buffer for a sticker image.
 * @async
 * @function compressMediaBuffer
 * @param {Buffer} mediaBuffer - The media buffer to compress.
 * @returns {Promise<wwebjs.MessageMedia>} A Promise that resolves with a compressed MessageMedia object.
 * @throws {Error} If the compressed buffer is still too heavy.
 */
async function compressMediaBuffer (mediaBuffer) {
  logger.debug('compressing sticker...', mediaBuffer.byteLength)
  const compressedBuffer = await sharp(mediaBuffer, { animated: true })
    .webp({ quality: 33 })
    .toBuffer()
  logger.debug('compressed sticker!', mediaBuffer.byteLength, '->', compressedBuffer.byteLength)

  if (compressedBuffer.byteLength > 1_000_000) throw new Error('Sticker is still too heavy!', mediaBuffer.byteLength)

  return new wwebjs.MessageMedia('image/webp', compressedBuffer.toString('base64'), 'deadbyte.webp', true)
}

/**
 * Uploads an image to get a temporary URL
 * @param {import ('whatsapp-web.js').MessageMedia} media - The media to upload
 * @returns {promise<string>} A Promise that resolves with the temporary URL of the uploaded image.
 */
async function getTempUrl (media) {
  const formData = new FormData()
  formData.append('file', Buffer.from(media.data, 'base64'), media.filename || 'sticker.png')

  const response = await fetch('https://v1.deadbyte.com.br/uploader/tempurl', {
    method: 'POST',
    body: formData
  })

  if (!response.ok) {
    logger.error('Error uploading image to remove.bg')
    throw new Error('Error uploading image to remove.bg')
  }

  const json = await response.json()
  const tempUrl = json.result

  return tempUrl
}
