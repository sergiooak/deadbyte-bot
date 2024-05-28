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
 * @param {import('../../types.d.ts').WWebJSMessage} msg
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
 * @param {import('../../types.d.ts').WWebJSMessage} msg
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
 * Make sticker from text
 * @param {import('../../types.d.ts').WWebJSMessage} msg
 */
export async function textSticker2 (msg) {
  await msg.react(reactions.wait)

  const url = await createUrl('image-creator', 'ttp2', { message: msg.body })

  const media = await wwebjs.MessageMedia.fromUrl(url, { unsafeMime: true })
  if (!media) throw new Error('Error downloading media')

  await sendMediaAsSticker(msg.aux.chat, media)
  await msg.react(reactions.success)
}

/**
 * Make sticker from text
 * @param {import('../../types.d.ts').WWebJSMessage} msg
 */
export async function textSticker3 (msg) {
  await msg.react(reactions.wait)

  const url = await createUrl('image-creator', 'ttp3', { message: msg.body })

  const media = await wwebjs.MessageMedia.fromUrl(url, { unsafeMime: true })
  if (!media) throw new Error('Error downloading media')

  await sendMediaAsSticker(msg.aux.chat, media)
  await msg.react(reactions.success)
}

/**
 * Create a sticker of an image without background
 * @param {import('../../types.d.ts').WWebJSMessage} msg
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

  // use shapr to convert to a max 512 (bigger side) jpg image, crank up the contrast
  const buffer = Buffer.from(media.data, 'base64')
  const resizedBuffer = await sharp(buffer)
    .resize(1024, 1024, { fit: 'inside' })
    .jpeg()
    .toBuffer()

  const tempUrl = await getTempUrl(resizedBuffer)
  const url = await createUrl('image-processing', 'removebg', { img: tempUrl, trim: true })
  const bgMedia = await wwebjs.MessageMedia.fromUrl(url, { unsafeMime: true })

  let stickerMedia = await Util.formatToWebpSticker(bgMedia, {})
  if (msg.body) stickerMedia = await overlaySubtitle(msg.body, stickerMedia).catch((e) => logger.error(e)) || stickerMedia

  await sendMediaAsSticker(msg.aux.chat, stickerMedia)
  await msg.react(reactions.success)
}

/**
 * Resend the sticker with the given pack and author
 * @param {import('../../types.d.ts').WWebJSMessage} msg
 *
 */
export async function stealSticker (msg) {
  await msg.react(reactions.wait)

  const quotedMsg = await msg.getQuotedMessage()

  const delimiters = ['|', '/', '\\']
  let messageParts = [msg.body] // default to the whole message
  for (const delimiter of delimiters) {
    if (messageParts.length > 1) break
    messageParts = msg.body.split(delimiter)
  }
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
  await msg.react(reactions.success)
}

/**
 * Search for a sticker on sticker.ly
 * @param {import('../../types.d.ts').WWebJSMessage} msg
 */
export async function stickerLySearch (msg) {
  const isStickerGroup = checkStickerGroup(msg.aux.chat.id)
  const limit = getStickerLimit(isStickerGroup)

  if (!msg.body) {
    await msg.reply('🤖 - Para usar o *!ly* você precisa enviar um termo para a pesquisa.\nEx: *!ly pior que é*')
    throw new Error('No search term')
  }

  await msg.react(reactions.wait)

  const stickers = await searchTermOnStickerLy(msg.body)

  const cursor = getCursor(msg.aux.function)
  const total = stickers.length // total number of stickers
  const stickersPaginated = paginateStickers(stickers, cursor, limit) // paginate

  if (stickersPaginated.length === 0) {
    let message = `🤖 - O sticker.ly não retornou {nenhum sticker|nenhum figurinha} para {a busca|o termo} *"${msg.body}"*`
    if (cursor !== 0) {
      message += ` na página ${cursor + 1}, {pois|porque|já que|pq} só existem ${Math.ceil(total / limit) + 1} páginas`
    }
    await msg.reply(spintax(message))
    throw new Error('No stickers found')
  }

  const prefix = msg.aux.prefix || '!'

  if (cursor === 0) {
    let message = '🤖 - '
    message += `Encontrei ${total} figurinha${stickersPaginated.length > 1 ? 's' : ''} para {a busca|o termo} *"${msg.body}"* no sticker.ly\n\n`

    // If there will exist more than one page, show the pagination examples
    if (total > limit) {
      message += `{To|Estou|Tô}{ te | }{enviando|mandando} {os ${limit} primeiros stickers encontrados|as ${limit} primeiras figurinhas encontradas}...\n\n`
      message += spintax('Se quiser {mais{ figurinhas| stickers|}|outros} com {esse{ mesmo|}|o mesmo} termo, {envie|mande}:\n')
      message = addPaginationToTheMessage(message, prefix, 'ly', msg.body, limit, total)
    } else {
      message += `{To|Estou|Tô}{ te | }{enviando|mandando} {os ${stickersPaginated.length} stickers encontrados|as ${stickersPaginated.length} figurinhas encontradas}...`
    }
    await msg.reply(spintax(message))
  }

  await sendStickers(stickersPaginated, msg.aux.chat)
  await msg.react(reactions.success)
}

/**
 * Get a sticker pack from sticker.ly
 * @param {import('../../types.d.ts').WWebJSMessage} msg
 */
export async function stickerLyPack (msg) {
  // remove https://sticker.ly/s/ from the beginning of the message if it exists
  msg.body = msg.body.replace('https://sticker.ly/s/', '')

  const isStickerGroup = checkStickerGroup(msg.aux.chat.id)
  const limit = getStickerLimit(isStickerGroup)

  if (!msg.body) {
    await msg.reply('🤖 - Para usar o *!pack* você precisa enviar um código de pacote do sticker.ly.\nEx: *!pack 2RY2AQ*')
    throw new Error('No search term')
  }

  await msg.react(reactions.wait)

  // if the term is a pack id, send the pack
  const packRegex = /^[a-zA-Z0-9]{6}$/
  if (!packRegex.test(msg.body)) {
    await msg.reply('🤖 - Para usar o *!pack* você precisa enviar um código de pacote do sticker.ly.\nEx: *!pack 2RY2AQ*')
  }
  const packId = msg.body.toUpperCase()

  const stickers = await getPackFromStickerLy(packId)

  const cursor = getCursor(msg.aux.function)
  const total = stickers.length // total number of stickers
  const stickersPaginated = paginateStickers(stickers, cursor, limit) // paginate

  if (stickersPaginated.length === 0) {
    let message = `🤖 - O sticker.ly não retornou {nenhum sticker|nenhum figurinha} para o {pacotre|pack} *"${packId}"*`
    if (cursor !== 0) {
      message += ` na página ${cursor + 1}, {pois|porque|já que|pq} só existem ${Math.ceil(total / limit) + 1} páginas`
    }
    await msg.reply(spintax(message))
    throw new Error('No stickers found')
  }

  const prefix = msg.aux.prefix || '!'

  if (cursor === 0) {
    let message = '🤖 - '
    message += `Encontrei ${total} figurinha${stickersPaginated.length > 1 ? 's' : ''} no {pacote|pack} *"${packId}"* no sticker.ly\n\n`
    // o pacote se chama ${stickers[0].pack} e foi criado por ${stickers[0].author}
    message += `O pacote se chama *"${stickers[0].pack}"* e foi criado por *"${stickers[0].author}"*\n\n`
    message += `{To|Estou|Tô}{ te | }{enviando|mandando} {os ${limit} primeiros stickers encontrados|as ${limit} primeiras figurinhas encontradas}...\n\n`
    message += spintax('Se quiser {mais{ figurinhas| stickers|}} {desse|do mesmo} {pacote|pack}, {envie|mande}:\n')
    message = addPaginationToTheMessage(message, prefix, 'pack', packId, limit, total)
    await msg.reply(spintax(message))
  }

  await sendStickers(stickersPaginated, msg.aux.chat)
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
    logger.error(error)
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
async function getTempUrl (buffer) {
  const formData = new FormData()
  formData.append('file', buffer, 'sticker.png')

  const url = await createUrl('uploader', 'tempurl', {})
  const response = await fetch(url, {
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

/**
 * Get a sticker pack from sticker.ly
 * @param {string} packId
 */
async function getPackFromStickerLy (packId) {
  const packResponse = await fetch(`http://api.sticker.ly/v1/stickerPack/${packId}`, {
    method: 'GET',
    headers: {
      'User-Agent': 'androidapp.stickerly/2.16.0 (G011A; U; Android 22; pt-BR; br;)',
      'Content-Type': 'application/json',
      Host: 'api.sticker.ly'
    }
  })

  const packJson = await packResponse.json()
  if (!packJson.result) return []

  return packJson.result.resourceFiles.map((s, i) => ({
    id: null,
    pack: packJson.result.name,
    packId,
    author: packJson.result.authorName,
    url: packJson.result.resourceUrlPrefix + s,
    isAnimated: packJson.result.isAnimated,
    views: null,
    nsfw: 0
  }))
}

/**
 * Search for a sticker on sticker.ly
 * @param {string} term
 */
async function searchTermOnStickerLy (term) {
  const response = await fetch('http://api.sticker.ly/v4/sticker/search', {
    method: 'POST',
    headers: {
      'User-Agent': 'androidapp.stickerly/2.16.0 (G011A; U; Android 22; pt-BR; br;)',
      'Content-Type': 'application/json',
      Host: 'api.sticker.ly'
    },
    body: JSON.stringify({
      keyword: term,
      size: 0,
      cursor: 0,
      limit: 999
    })
  })

  const json = await response.json()
  if (!json.result) return []

  const stickers = json.result.stickers.map((s) => ({
    id: s.sid,
    pack: s.packName,
    packId: s.packId,
    author: s.authorName,
    url: s.resourceUrl,
    isAnimated: s.isAnimated,
    views: s.viewCount,
    nsfw: s.stickerPack.nsfwScore
  }))
    .filter((s) => s.nsfw <= 69) // filter out nsfw stickers
  return stickers
}

/**
 * Add pagination examples to the message
 * @param {string} message - The message to add the pagination examples to
 * @param {string} prefix - The prefix. Ex: '!'
 * @param {string} command - The command. Ex: 'ly' for !ly
 * @param {string} term - The term used to search. Ex: 'pior que é'
 * @param {number} limit - The limit of items per page
 * @param {number} total - The total number of items
 * @returns {string} The message with the pagination examples
 */
/**
 * Adds pagination examples to the message.
 * @param {string} message - The message to add the pagination examples to.
 * @param {string} prefix - The prefix. Ex: '!'.
 * @param {string} command - The command. Ex: 'ly' for !ly.
 * @param {string} term - The term used to search.
 * @param {number} limit - The limit of items per page.
 * @param {number} total - The total number of items.
 * @returns {string} The message with the pagination examples.
 */
function addPaginationToTheMessage (message, prefix, command, term, limit, total) {
  if (total <= limit) return message

  const lastPage = Math.ceil(total / limit)

  const getPageRange = (page) => ({
    firstItem: (page - 1) * limit + 1,
    lastItem: Math.min(page * limit, total)
  })

  const addPageExample = (page) => {
    const { firstItem, lastItem } = getPageRange(page)
    message += `*${prefix}${command}${page} ${term}* (${firstItem}ª`
    message += lastItem === firstItem ? ' figurinha)' : ` até ${lastItem}ª figurinha)\n`
  }

  if (total > limit) addPageExample(2) // if there is more than one page, add the second page example
  if (total > limit * 2) addPageExample(3) // if there is more than two pages, add the third page example

  if (lastPage !== 2 && lastPage !== 3) {
    // if the last page is not the second or third page, add the last page example
    message += 'até\n'
    addPageExample(lastPage)
  }

  return message
}

/**
 * Check if the chat is a sticker group
 * @param {string} chatId
 * @returns {boolean}
 */
function checkStickerGroup (chatId) {
  const stickerGroup = '120363282791987363@g.us'
  return chatId._serialized === stickerGroup
}

/**
 * Get the limit of stickers based on the chat type
 * @param {boolean} isStickerGroup
 * @returns {number}
 */
function getStickerLimit (isStickerGroup) {
  const maxStickersOnGroup = 8
  const maxStickersOnPrivate = 4
  return isStickerGroup ? maxStickersOnGroup : maxStickersOnPrivate
}

/**
 * Get the cursor for pagination
 * @param {string} functionAux
 * @returns {number}
 */
function getCursor (functionAux) {
  if (!functionAux) return 0
  return functionAux.match(/\d+/g) ? parseInt(functionAux.match(/\d+/g) - 1) : 0
}

/**
 * Paginate the stickers
 * @param {Array} stickers
 * @param {number} cursor
 * @param {number} limit
 * @returns {Array}
 */
function paginateStickers (stickers, cursor, limit) {
  return stickers.slice(cursor * limit, (cursor + 1) * limit)
}

/**
 * Send stickers waiting a random time between each one
 * @param {Array} stickersPaginated
 * @param {Object} chat
 * @returns {Promise}
 */
async function sendStickers (stickersPaginated, chat) {
  for (const s of stickersPaginated) {
    const media = await wwebjs.MessageMedia.fromUrl(s.url)
    await sendMediaAsSticker(chat, media)
    await waitRandomTime()
  }
}

/**
 * Wait random time
 * @param {number} min @default 50
 * @param {number} max @default 500
 * @returns {Promise}
 */
function waitRandomTime (min = 50, max = 500) {
  return new Promise((resolve) => {
    setTimeout(resolve, Math.random() * (max - min) + min)
  })
}
