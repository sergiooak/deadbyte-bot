import relativeTime from 'dayjs/plugin/relativeTime.js'
import { getLags } from '../../utils/lagMemory.js'
import reactions from '../../config/reactions.js'
import { createUrl } from '../../config/api.js'
import spintax from '../../utils/spintax.js'
import { getQueueLength } from '../queue.js'
import wwebjs from 'whatsapp-web.js'
import logger from '../../logger.js'
import FormData from 'form-data'
import 'dayjs/locale/pt-br.js'
import fetch from 'node-fetch'
import mime from 'mime-types'
import OpenAI from 'openai'
import sharp from 'sharp'
import dayjs from 'dayjs'
import path from 'path'
import fs from 'fs'

dayjs.locale('pt-br')
dayjs.extend(relativeTime)
const openai = new OpenAI(process.env.OPENAI_API_KEY)

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

  const clock = '{⏳|⌚|⏰|⏱️|⏲️|🕰️|🕛|🕧|🕐|🕜|🕑|🕝}'
  await msg.react(spintax(clock)) // react with random clock emoji

  const saudation = `{${spintax(clock)}} - {Olá|Oi|Oie|E aí} ${msg.aux.sender.pushname || 'usuário'} tudo {jóia|bem}?`
  const part1 = '{Eu estou|Estou|O bot {está|ta|tá}|O DeadByte {está|ta|tá}} {online|on|ligado}{ direto|} {a|á|tem}{:|} '

  const message = spintax(`${saudation}\n\n${part1}*${uptimeString}*`)
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

/**
 * Roll a dice, or multiple dice with optional modifier
 * @param {import('../../types.d.ts').WWebJSMessage} msg
 */
export async function dice (msg) {
  await msg.react('🎲')

  const fullCommand = msg.aux.function

  const regex = /(?<dice>\d*)d(?<faces>\d+)(?<modifier>[\+\-\*\/]\d+)?/i
  const match = fullCommand.match(regex)

  const amountOfDice = validateDice(match.groups.dice)
  const amountOfFaces = validateFaces(match.groups.faces)
  const modifier = match.groups.modifier || 0

  const diceRolls = Array.from({ length: amountOfDice }, () => rollDice(amountOfFaces))

  const total = diceRolls.reduce((acc, curr) => acc + curr.roll, 0)
  const initialTotal = total

  let message = `🎲 - *Você rolou ${applyModifierIfNeeded(total, modifier, initialTotal)}`
  message += `\n\n_Em ${amountOfDice} dado${amountOfDice > 1 ? 's' : ''} de ${amountOfFaces} lados_`

  // explain each roll if more than 1 dice
  if (amountOfDice > 1) {
    message += '\n\n'
    diceRolls.forEach((d, i) => {
      message += `• ${i + 1}º dado: \`\`\`${d.roll}${d.explanation ? ` ${d.explanation}` : ''}\`\`\`\n`
    })
  }
  await msg.reply(message)
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

  const usersInQueue = getQueueLength('user')
  const messagesInQueue = getQueueLength('messages')
  if (usersInQueue || messagesInQueue) {
    message += `{Atualmente|No momento|{Nesse|Neste}{ exato|} momento} tem *${usersInQueue} ${usersInQueue > 1 ? 'usuários' : 'usuário'}* na fila com *${messagesInQueue} ${messagesInQueue > 1 ? 'mensagens' : 'mensagem'}* ao todo!\n\n`
  }

  const lagsLastHour = getLags(60)
  console.log(lagsLastHour)
  let lag = msg.lag
  lag = Math.max(lag, 0) // if lag is negative, set it to 0
  lag = isNaN(lag) ? 0 : lag

  const ping = Date.now() - msg.startedAt
  const delayString = convertToHumanReadable(ping, lag, 'ms')
  message += `Essa mensagem demorou *${delayString}* para ser respondida`

  if (lag > 0) {
    const lagString = convertToHumanReadable(lag, 0, 's')
    message += `\n\nO WhatsApp demorou *${lagString}* para entregar essa mensagem pra mim!`
  }

  // TODO create an image with the chart of the lags

  await msg.reply(spintax(message))
}

/**
 * Speaks the message
 * @param {import('../../types.d.ts').WWebJSMessage} msg
 */
export async function speak (msg) {
  let msgToReply = msg
  let input = msg.body
  if (msg.hasQuotedMsg && !msg.body) {
    const quotedMsg = await msg.getQuotedMessage()
    input = quotedMsg.body
    msgToReply = quotedMsg
  }

  if (!input) {
    await msg.reply(
      spintax('Para usar o *{!speak|!fale|!falar|!voz|!diga|!dizer}* você {precisa|tem que} {enviar|mandar} {esse|o} comando junto com um texto!\n\nExemplo: `!diga Olá, eu sou o DeadByte!`')
    )
    await msg.react(reactions.error)
    return
  }

  const inputLimit = 1000
  const originalInputSize = input.length

  if (originalInputSize > inputLimit) {
    await msg.reply(`O texto não pode ter mais de ${inputLimit} caracteres!\n\nO seu texto tem ${originalInputSize} caracteres!\nVou cortar o texto para você!`)
    input = input.slice(0, inputLimit)
  }

  await msg.react('🗣️')
  await msg.aux.chat.sendStateRecording()

  const voices = ['onyx', 'echo', 'fable', 'nova', 'shimmer']

  // function can be called with !speak1, !speak2, !speak3, !speak4, !speak5
  let voiceId = parseInt(msg.aux.function.slice(-1)) - 1 || 0
  // say if the voice is invalid
  if (voiceId > voices.length - 1) {
    await msg.reply(`Essa voz não existe!\n\nAs vozes disponíveis são:\n${voices.map((v, i) => `${i + 1} - ${v}`).join('\n')}\n\nIrei usar a voz padrão!`)
    voiceId = 0
  }

  const voice = voices[voiceId]

  const opus = await openai.audio.speech.create({
    input,
    voice,
    model: 'tts-1',
    response_format: 'opus'
  })

  const buffer = Buffer.from(await opus.arrayBuffer())

  // hand make the media object
  const media = new wwebjs.MessageMedia('audio/ogg; codecs=opus', buffer.toString('base64'), 'DeadByte.opus')
  await msgToReply.reply(media, undefined, { sendAudioAsVoice: true })
}

/**
 * Transcribes the audio message
 * @param {import('../../types.d.ts').WWebJSMessage} msg
 */
export async function transcribe (msg) {
  let msgToReply = msg
  let media = msg.hasMedia ? await msg.downloadMedia() : null
  if (msg.hasQuotedMsg && !msg.hasMedia) {
    const quotedMsg = await msg.getQuotedMessage()
    media = await quotedMsg.downloadMedia()
    msgToReply = quotedMsg
  }

  if (!media) {
    await msg.reply(
      spintax('Para usar o *{!transcribe|!transcricao|!transcrever}* você {precisa|tem que} {enviar|mandar} {esse|o} comando junto com um áudio!\n\nExemplo: `!transcrever` respondendo um áudio')
    )
    await msg.react(reactions.error)
    return
  }

  await msg.react('🎙️')
  await msg.aux.chat.sendStateTyping()

  // save file to temp folder
  const timestampish = Date.now().toString().slice(-10)
  console.log(timestampish)
  const filePath = `./src/temp/${timestampish}.mp3`
  const nomalizedFilePath = path.resolve(filePath)
  fs.writeFileSync(nomalizedFilePath, media.data, { encoding: 'base64' })

  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(nomalizedFilePath),
    model: 'whisper-1',
    response_format: 'text'
  })
  fs.unlinkSync(nomalizedFilePath)
  await msgToReply.reply(`🎙️ - ${transcription.trim()}`)
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

/**
 * Validates the dice amount
 * @param {string} dice - The dice amount to validate
 * @param {number} min - The minimum amount of dice (default 1)
 * @param {number} max - The maximum amount of dice (default 100)
 * @returns {number} The validated dice amount
 */
function validateDice (dice, min = 1, max = 100) {
  return Math.min(Math.max(parseInt(dice) || 1, min), max)
}

/**
 * Validates the faces amount
 * @param {string} faces - The faces amount to validate
 * @param {number} min - The minimum amount of faces (default 2)
 * @param {number} max - The maximum amount of faces (default 1000)
 * @returns {number} The validated faces amount
 */
function validateFaces (faces, min = 2, max = 1000) {
  return Math.min(Math.max(parseInt(faces) || 2, min), max)
}

/**
 * Rolls a dice
 * @param {number} faces - The amount of faces of the dice
 * @returns {number} The dice roll
 */
function rollDice (faces) {
  const min = 1
  const roll = Math.floor(Math.random() * (faces - min + 1)) + min
  return { roll }
}

/**
 * Applies a modifier to the total
 * @param {number} total - The total to apply the modifier
 * @param {string} modifier - The modifier to apply
 * @param {number} initialTotal - The initial total before applying the modifier
 * @returns {string} The total with the modifier
 */
function applyModifierIfNeeded (total, modifier, initialTotal) {
  if (!modifier) return `${total}*`

  const operator = modifier[0] // + - * /
  const value = parseInt(modifier.slice(1))
  const operations = {
    '+': (total, value) => total + value,
    '-': (total, value) => Math.max(total - value, 0),
    '*': (total, value) => total * value,
    '/': (total, value) => Math.floor(total / value)
  }

  total = operations[operator](total, value)
  return `${total}* _(${initialTotal} ${operator} ${value})_`
}
