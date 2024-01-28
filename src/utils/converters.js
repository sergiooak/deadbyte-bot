import FormData from 'form-data'
import fetch from 'node-fetch'
import { load } from 'cheerio'
import fs from 'fs/promises'

/**
 * Convert Webp to Mp4
 * @param {String} path
 * @returns {Promise<{status: Boolean, message: String, result: String}>}
 */
async function webpToMp4 (url) {
  const ezGifUrl = `https://ezgif.com/webp-to-mp4?url=${url}`

  const response = await fetch(ezGifUrl)

  const data = await response.text()
  const $ = load(data)

  const action = $('form.ajax-form').attr('action')
  const file = $('form.ajax-form > input[type=hidden]').attr('value')

  const bodyFormThen = new FormData()
  bodyFormThen.append('file', file)

  const responseThen = await fetch(action + '?ajax=true', {
    method: 'POST',
    body: bodyFormThen,
    headers: bodyFormThen.getHeaders()
  })

  const dataThen = await responseThen.text()
  await fs.writeFile('./src/temp/ezgif-then.html', dataThen)
  const $Then = load(dataThen)

  const result = $Then('video > source').attr('src')
  return 'https:' + result
}

export { webpToMp4 }
