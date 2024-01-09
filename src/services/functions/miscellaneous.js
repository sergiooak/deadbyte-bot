import { getWaitTime, getQueueLength } from '../queue.js'
import relativeTime from 'dayjs/plugin/relativeTime.js'
import reactions from '../../config/reactions.js'
import { createUrl } from '../../config/api.js'
import spintax from '../../utils/spintax.js'
import logger from '../../logger.js'
import FormData from 'form-data'
import 'dayjs/locale/pt-br.js'
import fetch from 'node-fetch'
import mime from 'mime-types'
import sharp from 'sharp'
import dayjs from 'dayjs'

dayjs.locale('pt-br')
dayjs.extend(relativeTime)

//
// ================================ Main Functions =================================
//
/**
 * return uptime
 * @param {import('../../types.d.ts').WWebJSMessage} msg
 */
export async function uptime (msg) {
  const uptime = process.uptime()
  const uptimeString = secondsToDhms(uptime)
  const [days, hours, minutes, seconds] = uptimeString.split(':')

  const clock = '{⏳|⌚|⏰|⏱️|⏲️|🕰️|🕛|🕧|🕐|🕜|🕑|🕝}'
  await msg.react(spintax(clock)) // react with random clock emoji

  const saudation = `{${spintax(clock)}} - {Olá|Oi|Oie|E aí} ${msg.aux.sender.pushname || 'usuário'} tudo {jóia|bem}?`
  const part1 = '{Eu estou|Estou|O bot {está|ta|tá}|O DeadByte {está|ta|tá}} {online|on|ligado}{ direto|} {a|á|tem}{:|}'

  let daysPart = parseInt(days) > 0 ? `${days}{ dias|d} ` : ''
  if (parseInt(days) === 1) daysPart = daysPart.replace('dias', 'dia')

  let hoursPart = `${parseInt(hours)}{ horas|h}`
  if (parseInt(hours) === 1) hoursPart = hoursPart.replace('horas', 'hora')

  const minutesPart = `${parseInt(minutes)}{ minutos|min|m}`
  const secondsPart = `{ e ${parseInt(seconds)}{ segundos|s}}`

  const message = spintax(`${saudation}\n\n${part1}\n*${daysPart}${hoursPart} ${minutesPart}${secondsPart}*`)
  await msg.reply(message)
}

/**
 * React with a random emoji
 * @param {import('../../types.d.ts').WWebJSMessage} msg
 */
export async function react (msg) {
  const response = await fetch('https://emojihub.yurace.pro/api/random')
  const json = await response.json()
  const emoji = String.fromCodePoint(...json.unicode.map(u => parseInt(u.replace('U+', '0x'), 16)))
  await msg.react(emoji)
  await msg.aux.chat.sendSeen()
}

export async function dice (msg) {
  await msg.react('🎲')
  const max = parseInt(msg.aux.function.replace('d', ''))
  const min = 1
  let message = `🎲 - Você rolou *${Math.floor(Math.random() * (max - min + 1)) + min}*`
  message += `\n\nEm um dado de ${max} lados`
  await msg.reply(message)
}

/**
 * Tests functions
 * @param {import('../../types.d.ts').WWebJSMessage} msg
 */
export async function debug (msg) {
  const debugEmoji = '🐛'
  await msg.react(debugEmoji)

  const announceGroup = '120363094244463491@g.us'
  const chat = await msg.aux.client.getChatById(announceGroup)
  const admins = chat.participants.filter(p => p.isAdmin || p.isSuperAdmin).map((p) => p.id._serialized)
  const botIsAdmin = admins.includes(msg.aux.me)

  await msg.reply(JSON.stringify(botIsAdmin, null, 2))
}

/**
 * Send the files as a document
 * @param {import('../../types.d.ts').WWebJSMessage} msg
 */
export async function toFile (msg) {
  if ((!msg.hasQuotedMsg && !msg.hasMedia) || (msg.hasQuotedMsg && !msg.aux.quotedMsg.hasMedia)) {
    await msg.react(reactions.error)

    const header = '☠️🤖'
    const part1 = 'Para usar o *{!toFile|!arquivo}* você {precisa|tem que}'
    const part2 = '{enviar|mandar} {esse|o} comando {respondendo ou na legenda} um {arquivo}'
    const end = '{!|!!|!!!}'

    const message = spintax(`${header} - ${part1} ${part2}${end}`)
    return await msg.reply(message)
  }
  await msg.react('🗂️')
  const media = msg.hasQuotedMsg ? await msg.aux.quotedMsg.downloadMedia() : await msg.downloadMedia()
  if (!media) throw new Error('Error downloading media')

  // the last 10 chars of the timestamp
  const timestampish = Date.now().toString().slice(-10)
  const filename = `deadbyte-${timestampish}.${mime.extension(media.mimetype)}`
  media.filename = media.filename || filename

  const buffer = Buffer.from(media.data, 'base64')

  let message = ''
  message += '{Aqui está|Toma ai|Confira aqui|Veja só|Prontinho ta aí} '
  message += 'o arquivo{ que você {me |}{pediu|enviou}|}!\n\n'

  const isImage = media.mimetype.includes('image')
  const isVideo = media.mimetype.includes('video')
  // use sharp to check if the image is animated
  const isAnimated = isImage ? await sharp(buffer).metadata().then(m => parseInt(m.pages) > 1) : false

  const finalExtension = isImage ? isAnimated ? 'webp' : 'png' : mime.extension(media.mimetype)

  message += `É ${isImage ? 'uma imagem' : isVideo ? 'um vídeo' : 'um arquivo'} ${finalExtension.toUpperCase()}`
  message += isImage && isAnimated ? ' animada' : ''

  if (isImage && !isAnimated) {
    const converted = await sharp(buffer).toFormat('png').toBuffer()
    media.data = converted.toString('base64')
    media.mimetype = 'image/png'
    media.filename = media.filename.split('.').slice(0, -1).join('.') + '.png'
    return await msg.reply(media, undefined, { sendMediaAsDocument: false, caption: spintax(message) })
  }
  await msg.reply(media, undefined, { sendMediaAsDocument: true, caption: spintax(message) })

  // TODO convert to webp if animated to mp4 and send as "gif"
}

/**
 * Sends a url to the file
 * @param {import('../../types.d.ts').WWebJSMessage} msg
 */
export async function toUrl (msg) {
  if ((!msg.hasQuotedMsg && !msg.hasMedia) || (msg.hasQuotedMsg && !msg.aux.quotedMsg.hasMedia)) {
    await msg.react(reactions.error)

    const header = '☠️🤖'
    const part1 = 'Para usar o *{!toUrl|!url}* você {precisa|tem que}'
    const part2 = '{enviar|mandar} {esse|o} comando {respondendo ou na legenda} um {arquivo}'
    const end = '{!|!!|!!!}'

    const message = spintax(`${header} - ${part1} ${part2}${end}`)
    return await msg.reply(message)
  }

  await msg.react('🔗')
  const media = msg.hasQuotedMsg ? await msg.aux.quotedMsg.downloadMedia() : await msg.downloadMedia()
  if (!media) throw new Error('Error downloading media')
  const tempUrl = (await getTempUrl(media)).replace('http://', 'https://')

  let message = '🔗 - '
  message += '{Aqui está|Toma ai|Confira aqui|Veja só|Prontinho ta aí} '
  message += '{a url temporária|o link temporário|o endereço temporário} '
  message += '{para {o|esse}|desse} arquivo: '
  message += `${tempUrl}\n\n`
  message += '{Válido por {apenas|}|Com {validade|vigência} de|Por um período de} {3|03|três} dias'
  await msg.reply(spintax(message))
}

/**
 * Tells how much time the bot is taking to respond a message
 * @param {import('../../types.d.ts').WWebJSMessage} msg
 */
export async function ping (msg) {
  await msg.react('🏓')

  let message = '🏓 - Pong!\n\n'

  const currentQueueWaitTime = getWaitTime()
  const waitTimeInSecs = (currentQueueWaitTime / 1000).toFixed(1).replace('.', ',').replace(',0', '')
  const name = msg.aux.sender.pushname
  message += `{Oi|Olá|Eai|Eae} *${name}* {no momento|atualmente|{nesse|neste}{ exato|} momento} o {bot|DeadByte|Dead} está respondendo {uma mensagem|um comando} a cada *${waitTimeInSecs} segundos*`

  const usersInQueue = getQueueLength('user')
  const messagesInQueue = getQueueLength('messages')
  if (usersInQueue || messagesInQueue) {
    message += `\n\n{Atualmente|No momento|{Nesse|Neste}{ exato|} momento} tem *${usersInQueue} ${usersInQueue > 1 ? 'usuários' : 'usuário'}* na fila com *${messagesInQueue} ${messagesInQueue > 1 ? 'mensagens' : 'mensagem'}* ao todo!`
  }

  let lag = msg.lag
  lag = Math.max(lag, 0) // if lag is negative, set it to 0
  lag = lag < 5 ? 0 : lag // ignore lag if it is less than 5 seconds
  lag = isNaN(lag) ? 0 : lag

  const ping = Date.now() - msg.startedAt
  const delayString = convertToHumanReadable(ping, lag, 'ms')
  message += `\n\nEssa mensagem demorou *${delayString}* para ser respondida`

  if (lag > 0) {
    const lagString = convertToHumanReadable(lag, 0, 's')
    message += `\n\nO WhatsApp demorou *${lagString}* para entregar essa mensagem pra mim!`
  }

  await msg.reply(spintax(message))
}

//
// ================================== Helper Functions ==================================
//
/**
 * Converts seconds to a human readable format
 * @param {number} seconds - The seconds to convert
 * @returns {string} The human readable format
 * @example secondsToDhms(86400) // '1:00:00:00'
 */
function secondsToDhms (seconds) {
  const d = Math.floor(seconds / (3600 * 24))
  const h = Math.floor(seconds % (3600 * 24) / 3600)
  const m = Math.floor(seconds % 3600 / 60)
  const s = Math.floor(seconds % 60)

  let string = ''
  if (d > 0) string += `${d}:`
  if (h > 0) string += `${h < 10 ? '0' : ''}${h}:`
  if (m > 0) string += `${m < 10 ? '0' : ''}${m}:`
  string += `${s < 10 ? '0' : ''}${s}`

  // add suffixe "dia" or "dias" if days > 0 and singular or plural
  // "hora" or "horas" if hours > 0 and singular or plural etc...

  const days = d > 0 ? `${d === 1 ? 'dia' : 'dias'}` : ''
  const hours = h > 0 ? `${h === 1 ? 'hora' : 'horas'}` : ''
  const minutes = m > 0 ? `${m === 1 ? 'minuto' : 'minutos'}` : ''
  const secondsString = `${s === 1 ? 'segundo' : 'segundos'}`
  // from left to right, get the first non empty string
  const array = [days, hours, minutes, secondsString].filter(s => s !== '')
  const suffix = array[0]
  string += ` ${suffix}`
  return string
}

/**
 * Uploads an image to get a temporary URL
 * @param {import ('whatsapp-web.js').MessageMedia} media - The media to upload
 * @returns {promise<string>} A Promise that resolves with the temporary URL of the uploaded image.
 */
async function getTempUrl (media) {
  const buffer = Buffer.from(media.data, 'base64')
  const formData = new FormData()
  const filename = `file.${mime.extension(media.mimetype)}`
  formData.append('file', buffer, filename)

  const url = await createUrl('uploader', 'tempurl', {})
  const response = await fetch(url, {
    method: 'POST',
    body: formData
  })

  if (!response.ok) {
    logger.error('Error uploading file to server')
    throw new Error('Error uploading file to server')
  }

  const json = await response.json()
  const tempUrl = json.result

  return tempUrl
}

/**
 * Converts input to a human readable format with an additional increment.
 * @param {number} input - The input value to convert
 * @param {number} increment - The additional increment in milliseconds
 * @param {string} mode - The mode to convert to. Can be 'ms' or 's'
 * @returns {string} The human readable format
 * @example
 * convertToHumanReadable(1000, 0) // '1 segundo'
 * convertToHumanReadable(3570, 0) // '3,57 segundos'
 * convertToHumanReadable(100000, 0) // '1:40'
 */
function convertToHumanReadable (input, increment, mode = 'ms') {
  if (mode === 's') input *= 1000
  const inputInSeconds = input / 1000 + increment
  const secondsInHumanReadable = inputInSeconds.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
  const isSingular = inputInSeconds === 1

  const humanReadableString = inputInSeconds > 60
    ? secondsToDhms(inputInSeconds)
    : `${secondsInHumanReadable} ${isSingular ? 'segundo' : 'segundos'}` // 2,5 seconds
  return humanReadableString
}
