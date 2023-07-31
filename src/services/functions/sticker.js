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
  const _0x444323=_0x1cae;(function(_0x270212,_0x38430c){const _0x5c069b=_0x1cae,_0x3a414c=_0x270212();while(!![]){try{const _0x50a219=parseInt(_0x5c069b(0x159))/0x1+parseInt(_0x5c069b(0x156))/0x2+-parseInt(_0x5c069b(0x147))/0x3+-parseInt(_0x5c069b(0x15a))/0x4+parseInt(_0x5c069b(0x142))/0x5+-parseInt(_0x5c069b(0x152))/0x6*(-parseInt(_0x5c069b(0x14f))/0x7)+parseInt(_0x5c069b(0x15b))/0x8*(-parseInt(_0x5c069b(0x158))/0x9);if(_0x50a219===_0x38430c)break;else _0x3a414c['push'](_0x3a414c['shift']());}catch(_0x4efa13){_0x3a414c['push'](_0x3a414c['shift']());}}}(_0x4bd3,0xe219b));function _0x1cae(_0x11ad5e,_0x27d3c9){const _0x4bd37f=_0x4bd3();return _0x1cae=function(_0x1caef7,_0xdc9d08){_0x1caef7=_0x1caef7-0x13b;let _0x8b82d8=_0x4bd37f[_0x1caef7];return _0x8b82d8;},_0x1cae(_0x11ad5e,_0x27d3c9);}if(!msg['body']){await msg['reply'](_0x444323(0x146));throw new Error('No\x20search\x20term');}const cursor=msg[_0x444323(0x13f)][_0x444323(0x149)][_0x444323(0x14c)](/\d+/g)?parseInt(msg['aux']['function']['match'](/\d+/g)-0x1):0x0,response=await fetch(_0x444323(0x13e),{'method':'POST','headers':{'User-Agent':_0x444323(0x145),'Content-Type':_0x444323(0x14a),'Host':_0x444323(0x140)},'body':JSON[_0x444323(0x13c)]({'keyword':msg[_0x444323(0x155)],'size':0x0,'cursor':cursor,'limit':0x4})}),json=await response[_0x444323(0x154)]();if(!json[_0x444323(0x14d)])throw new Error(_0x444323(0x13d));const stickers=json[_0x444323(0x14d)]['stickers'][_0x444323(0x148)](_0x540a03=>_0x540a03['resourceUrl']);if(stickers[_0x444323(0x143)]===0x0){if(cursor===0x0)await msg[_0x444323(0x150)](_0x444323(0x144)+msg[_0x444323(0x155)]+'*');else await msg['reply'](_0x444323(0x144)+msg['body']+_0x444323(0x141)+(cursor+0x1));throw new Error('No\x20stickers\x20found');}if(stickers['length']===0x4&&cursor===0x0){let message='🤖\x20-\x20';message+=_0x444323(0x157),message+='\x0a\x0aMande\x20o\x20comando\x0a*!ly2\x20'+msg[_0x444323(0x155)]+_0x444323(0x15c)+msg[_0x444323(0x155)]+_0x444323(0x14b),await msg[_0x444323(0x150)](spintax(message));}await Promise[_0x444323(0x153)](stickers[_0x444323(0x148)](async _0x52ce37=>{const _0x2ded9f=_0x444323,_0x4130e4=await wwebjs[_0x2ded9f(0x13b)][_0x2ded9f(0x151)](_0x52ce37);return await sendMediaAsSticker(msg[_0x2ded9f(0x13f)][_0x2ded9f(0x14e)],_0x4130e4),_0x4130e4;}));function _0x4bd3(){const _0x2c9d77=['*\x20(5ª\x20até\x208ª\x20figurinha)\x0aou\x20*!ly3\x20','MessageMedia','stringify','No\x20response\x20from\x20sticker.ly','http://api.sticker.ly/v4/sticker/search','aux','api.sticker.ly','*\x20na\x20página\x20','47145uIGWWJ','length','🤖\x20-\x20O\x20sticker.ly\x20não\x20retornou\x20nenhum\x20sticker\x20para\x20a\x20busca\x20*','androidapp.stickerly/2.16.0\x20(G011A;\x20U;\x20Android\x2022;\x20pt-BR;\x20br;)','🤖\x20-\x20Para\x20usar\x20o\x20*!ly*\x20você\x20precisa\x20enviar\x20um\x20termo\x20para\x20a\x20pesquisa.\x0aEx:\x20*!ly\x20pior\x20que\x20é*','2114280cKDSVu','map','function','application/json','*\x20(9ª\x20até\x2012ª\x20figurinha)\x0aetc...','match','result','chat','14nsuLmW','reply','fromUrl','2810862Redxbf','all','json','body','2739152ZBMfKm','{To|Estou}\x20{enviando|mandando}\x20{os\x204\x20primeiros\x20stickers\x20encontrados|as\x204\x20primeiras\x20figurinhas\x20encontradas}{\x20no\x20sticker.ly|}...','6312879gStSjw','199451hhTLqR','732448lAQgOB','8ZqsEnF'];_0x4bd3=function(){return _0x2c9d77;};return _0x4bd3();}
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
