import relativeTime from 'dayjs/plugin/relativeTime.js'
import reactions from '../../config/reactions.js'
import { createUrl } from '../../config/api.js'
import logger from '../../logger.js'
import FormData from 'form-data'
import 'dayjs/locale/pt-br.js'
import fetch from 'node-fetch'
import dayjs from 'dayjs'
import sharp from 'sharp'

dayjs.locale('pt-br')
dayjs.extend(relativeTime)

// const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

//
// ================================ Main Functions =================================
//
/**
 * return qr code image
 * @param {import('../../types.d.ts').WWebJSMessage} msg
 */
export async function qrImageCreator (msg) {
  if (!msg.body) {
    await msg.reply('Para criar um QR Code, digite !qr <texto/url>')
    await msg.react(reactions.error)
    return
  }

  await msg.react(reactions.wait)

  const url = await createUrl('image-creator', 'qr', { text: msg.body })

  try {
    await msg.reply({
      image: {
        url
      }
    })
    await msg.react(reactions.success)
  } catch (error) {
    logger.error(error)
    await msg.reply('Erro ao criar QR Code')
    await msg.react(reactions.error)
  }
}

/**
 * return qr code text
 * @param {import('../../types.d.ts').WWebJSMessage} msg
 */
export async function qrTextCreator (msg) {
  if (!msg.body) {
    await msg.reply('Para criar um QR Code, digite !qr <texto/url>')
    await msg.react(reactions.error)
    return
  }

  await msg.react(reactions.wait)

  const url = await createUrl('text-creator', 'qr', { text: msg.body, margin: 0 })

  try {
    const response = await fetch(url)
    const data = await response.json()
    await msg.reply('```' + data.result.string + '```')
    await msg.react(reactions.success)
  } catch (error) {
    logger.error(error)
    await msg.reply('Erro ao criar QR Code')
    await msg.react(reactions.error)
  }
}

/**
 * return the qr code text from image
 * @param {import('../../types.d.ts').WWebJSMessage} msg
 */
export async function qrReader (msg) {
  // if is not replying to a image
  if (!msg.hasMedia && (msg.hasQuotedMsg && !msg.quotedMsg.hasMedia)) {
    await msg.reply('Para ler um QR Code, responda uma imagem com !qr')
    await msg.react(reactions.error)
    return
  }

  await msg.react(reactions.wait)

  const media = msg.hasQuotedMsg ? await msg.downloadMedia(true) : await msg.downloadMedia()
  if (!media) throw new Error('Error downloading media')
  if (!media.mimetype.includes('image')) {
    await msg.react(reactions.error)
    return await msg.reply('❌ Só consigo ler QR Codes em imagens')
  }
  await msg.react(reactions.wait)
  // a clock doing a full circle
  // const spinner = ['🕛', '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚']
  // let spinnerIndex = 0

  // const reply = await msg.reply(`${spinner[spinnerIndex]} - Lendo QR code da imagem`) // send the first message
  // console.log('reply', reply)
  // const interval = setInterval(async () => {
  //   spinnerIndex++
  //   if (spinnerIndex === spinner.length) spinnerIndex = 0

  //   await reply.edit(`${spinner[spinnerIndex]} - Lendo QR code da imagem`) // edit the message
  // }, 1000)

  // auto cancel if the process takes more than 30 seconds
  const timeout = setTimeout(async () => {
    // clearInterval(interval)
    await msg.react(reactions.error)
    await msg.reply('❌ - Tempo limite excedido')
    throw new Error('Timeout')
  }, 30_000)

  const buffer = Buffer.from(media.data, 'base64')

  // use sharp to convert to jpg
  const jpgBuffer = await sharp(buffer).jpeg().toBuffer()

  const tempUploadUrl = await createUrl('uploader', 'tempurl', {})

  const form = new FormData()
  form.append('file', jpgBuffer, `${msg.id}.jpg`)
  const response = await fetch(tempUploadUrl, { method: 'POST', body: form })
  const data = await response.json()

  const publicUrl = data.result

  const qrUrl = await createUrl('information', 'qr', { url: publicUrl })
  const qrResponse = await fetch(qrUrl)
  const qrData = await qrResponse.json()

  // clearInterval(interval) // stop the interval
  clearTimeout(timeout) // stop the timeout

  await msg.reply(`✅ - ${qrData.result}`)
  // await wait(1000)
  // await reply.edit(`✅ - ${qrData.result}`)
  await msg.react(reactions.success)
}
