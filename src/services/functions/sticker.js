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
export async function stickerCreator (msg, crop = false, stickerAuthor, stickerPack) {
  await msg.react(reactions.wait)

  const media = msg.hasQuotedMsg ? await msg.aux.quotedMsg.downloadMedia() : await msg.downloadMedia()
  if (!media) throw new Error('Error downloading media')

  let stickerMedia = await Util.formatToWebpSticker(media, {}, crop)
  if (msg.type === 'document') msg.body = '' // remove file name from caption
  if (msg.body) stickerMedia = await overlaySubtitle(msg.body, stickerMedia).catch((e) => logger.error(e)) || stickerMedia

  await sendMediaAsSticker(msg.aux.chat, stickerMedia, stickerAuthor, stickerPack)

  if (!crop) {
    await stickerCreator(msg, true) // make cropped version
    await msg.react(reactions.success)
  }
}

/**
 * Make sticker from text
 * @param {wwebjs.Message} msg
 */
export async function textSticker (msg) {
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
      return await stickerCreator(msg, undefined, stickerName, stickerAuthor)
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

export async function stickerLySearch (msg) {
  if (!msg.body) {
    await msg.reply('🤖 - Para usar o *!ly* você precisa enviar um termo para a pesquisa.\nEx: *!ly pior que é*')
    throw new Error('No search term')
  }

  await msg.react(reactions.wait)

  // Sorry, this code is proprietary and cannot be shared
  // eslint-disable-next-line
  const _0x193dac=_0x4579;(function(_0x1b78e5,_0x2244e8){const _0x422188=_0x4579,_0x34b3e0=_0x1b78e5();while(!![]){try{const _0x724c2a=parseInt(_0x422188(0x1e2))/0x1+parseInt(_0x422188(0x1e6))/0x2+parseInt(_0x422188(0x1fd))/0x3*(parseInt(_0x422188(0x1ef))/0x4)+parseInt(_0x422188(0x1f3))/0x5*(-parseInt(_0x422188(0x200))/0x6)+parseInt(_0x422188(0x1e5))/0x7*(parseInt(_0x422188(0x1e8))/0x8)+-parseInt(_0x422188(0x1ec))/0x9*(parseInt(_0x422188(0x1eb))/0xa)+parseInt(_0x422188(0x1f0))/0xb*(-parseInt(_0x422188(0x1f8))/0xc);if(_0x724c2a===_0x2244e8)break;else _0x34b3e0['push'](_0x34b3e0['shift']());}catch(_0x30a56c){_0x34b3e0['push'](_0x34b3e0['shift']());}}}(_0x5ec0,0x7f5b5));function _0x5ec0(){const _0x59c804=['499452SYBRoc','map','🤖\x20-\x20O\x20sticker.ly\x20não\x20retornou\x20nenhum\x20sticker\x20para\x20a\x20busca\x20*','result','POST','15eBQTXU','{To|Estou}\x20{enviando|mandando}\x20{os\x204\x20primeiros\x20stickers\x20encontrados|as\x204\x20primeiras\x20figurinhas\x20encontradas}{\x20no\x20sticker.ly|}...','json','66hPBCMg','stickers','application/json','stringify','function','785735oVhNiG','fromUrl','🤖\x20-\x20','7RukKOI','1612340bTMLRY','body','1810712LWlYFF','aux','\x0a\x0aMande\x20o\x20comando\x0a*!ly2\x20','110kETVuT','287415CByOad','length','reply','209992LZllwX','297UCUXsc','No\x20stickers\x20found','http://api.sticker.ly/v4/sticker/search','38195FAKYQk','*\x20na\x20página\x20','resourceUrl','*\x20(5ª\x20até\x208ª\x20figurinha)\x0aou\x20*!ly3\x20','match'];_0x5ec0=function(){return _0x59c804;};return _0x5ec0();}const cursor=msg['aux'][_0x193dac(0x1e1)][_0x193dac(0x1f7)](/\d+/g)?parseInt(msg[_0x193dac(0x1e9)][_0x193dac(0x1e1)]['match'](/\d+/g)-0x1):0x0,response=await fetch(_0x193dac(0x1f2),{'method':_0x193dac(0x1fc),'headers':{'User-Agent':'androidapp.stickerly/2.16.0\x20(G011A;\x20U;\x20Android\x2022;\x20pt-BR;\x20br;)','Content-Type':_0x193dac(0x202),'Host':'api.sticker.ly'},'body':JSON[_0x193dac(0x203)]({'keyword':msg['body'],'size':0x0,'cursor':cursor,'limit':0x4})}),json=await response[_0x193dac(0x1ff)]();if(!json[_0x193dac(0x1fb)])throw new Error('No\x20response\x20from\x20sticker.ly');const stickers=json[_0x193dac(0x1fb)][_0x193dac(0x201)][_0x193dac(0x1f9)](_0x14b8a7=>_0x14b8a7[_0x193dac(0x1f5)]);if(stickers[_0x193dac(0x1ed)]===0x0){if(cursor===0x0)await msg['reply'](_0x193dac(0x1fa)+msg[_0x193dac(0x1e7)]+'*');else await msg[_0x193dac(0x1ee)]('🤖\x20-\x20O\x20sticker.ly\x20não\x20retornou\x20nenhum\x20sticker\x20para\x20a\x20busca\x20*'+msg['body']+_0x193dac(0x1f4)+(cursor+0x1));throw new Error(_0x193dac(0x1f1));}if(stickers[_0x193dac(0x1ed)]===0x4&&cursor===0x0){let message=_0x193dac(0x1e4);message+=_0x193dac(0x1fe),message+=_0x193dac(0x1ea)+msg[_0x193dac(0x1e7)]+_0x193dac(0x1f6)+msg[_0x193dac(0x1e7)]+'*\x20(9ª\x20até\x2012ª\x20figurinha)\x0aetc...',await msg[_0x193dac(0x1ee)](spintax(message));}function _0x4579(_0x34857e,_0x5158ba){const _0x5ec091=_0x5ec0();return _0x4579=function(_0x4579bb,_0x2d16dd){_0x4579bb=_0x4579bb-0x1e1;let _0x553d51=_0x5ec091[_0x4579bb];return _0x553d51;},_0x4579(_0x34857e,_0x5158ba);}await Promise['all'](stickers[_0x193dac(0x1f9)](async _0x1f515d=>{const _0x240a50=_0x193dac,_0x574d81=await wwebjs['MessageMedia'][_0x240a50(0x1e3)](_0x1f515d);return await sendMediaAsSticker(msg[_0x240a50(0x1e9)]['chat'],_0x574d81),_0x574d81;}));

  await msg.react(reactions.success)
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
