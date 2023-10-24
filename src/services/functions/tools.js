import wwebjs from 'whatsapp-web.js'
import fetch from 'node-fetch'
import reactions from '../../config/reactions.js'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br.js'
import relativeTime from 'dayjs/plugin/relativeTime.js'
import { createUrl } from '../../config/api.js'
import FormData from 'form-data'

dayjs.locale('pt-br')
dayjs.extend(relativeTime)

//
// ================================ Main Functions =================================
//
/**
 * return qr code image
 * @param {wwebjs.Message} msg
 */
export async function qrImageCreator (msg) {
  if (!msg.body) {
    await msg.reply('Para criar um QR Code, digite !qr <texto/url>')
    await msg.react(reactions.error)
    return
  }

  await msg.react(reactions.wait)

  const url = await createUrl('image-creator', 'qr', { text: msg.body })
  console.log(url)

  try {
    const media = await wwebjs.MessageMedia.fromUrl(url, { unsafeMime: true })
    await msg.reply(media)
    await msg.react(reactions.success)
  } catch (error) {
    console.log(error)
    await msg.reply('Erro ao criar QR Code')
    await msg.react(reactions.error)
  }
}

/**
 * return qr code text
 * @param {wwebjs.Message} msg
 */
export async function qrTextCreator (msg) {
  if (!msg.body) {
    await msg.reply('Para criar um QR Code, digite !qr <texto/url>')
    await msg.react(reactions.error)
    return
  }

  await msg.react(reactions.wait)

  const url = await createUrl('text-creator', 'qr', { text: msg.body, margin: 0 })
  console.log(url)

  try {
    const response = await fetch(url)
    const data = await response.json()
    await msg.reply('```' + data.result.string + '```')
    await msg.react(reactions.success)
  } catch (error) {
    console.log(error)
    await msg.reply('Erro ao criar QR Code')
    await msg.react(reactions.error)
  }
}

/**
 * return the qr code text from image
 * @param {wwebjs.Message} msg
 */
export async function qrReader (msg) {
  // if is not replying to a image
  if (!msg.hasMedia && (msg.hasQuotedMsg && !msg.aux.quotedMsg.hasMedia)) {
    await msg.reply('Para ler um QR Code, responda uma imagem com !qr')
    await msg.react(reactions.error)
    return
  }

  await msg.react(reactions.wait)

  const media = msg.hasQuotedMsg ? await msg.aux.quotedMsg.downloadMedia() : await msg.downloadMedia()
  if (!media) throw new Error('Error downloading media')
  if (!media.mimetype.includes('image')) {
    await msg.react(reactions.error)
    return await msg.reply('❌ Só consigo ler QR Codes em imagens')
  }

  const buffer = Buffer.from(media.data, 'base64')

  // POST multipart/form-data file
  // https://v1.deadbyte.com.br/uploader/imgtourl
  const url = 'https://v1.deadbyte.com.br/uploader/imgtourl'
  const form = new FormData()
  form.append('file', buffer, `${msg.id}.jpg`)
  const response = await fetch(url, { method: 'POST', body: form })
  const data = await response.json()

  const publicUrl = data.result

  const qrUrl = await createUrl('information', 'qr', { url: publicUrl })
  const qrResponse = await fetch(qrUrl)
  const qrData = await qrResponse.json()

  await msg.reply(qrData.result)
  await msg.react(reactions.success)
}
