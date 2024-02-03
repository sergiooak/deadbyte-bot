import FormData from 'form-data'
import fetch from 'node-fetch'
import { load } from 'cheerio'

//
// ===================================== Variables ======================================
//

const EZ_GIF_URL = 'https://ezgif.com/webp-to-mp4?url='

//
// ==================================== Main Function ====================================
//
/**
 * Convert Webp to Mp4
 * @param {String} path
 * @returns {Promise<{status: Boolean, message: String, result: String}>}
 */
async function webpToMp4 (url) {
  const response = await fetchWithRetry(EZ_GIF_URL + url)
  const { action, file } = await parseHtml(response)

  const formData = new FormData()
  formData.append('file', file)

  const responseThen = await fetchWithRetry(action + '?ajax=true', {
    method: 'POST',
    body: formData,
    headers: formData.getHeaders()
  })

  const $then = load(responseThen)
  const resultFile = $then('video > source').attr('src')

  return resultFile.startsWith('//') ? 'https:' + resultFile : resultFile
}

export { webpToMp4 }

//
// ================================== Helper Functions ==================================
//

/**
 * Fetch with retry
 * @param {String} url
 * @param {Object} options
 * @param {Number} retries
 * @returns {Promise<Response>}
 */
async function fetchWithRetry (url, options = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      return response
    } catch (error) {
      if (i < retries - 1) continue
      throw error
    }
  }
}

/**
 * Parse HTML
 * @param {Response} response
 * @returns {Promise<{action: String, file: String}>}
 */
async function parseHtml (response) {
  const data = await response.text()
  const $ = load(data)
  const action = $('form.ajax-form').attr('action')
  const file = $('form.ajax-form > input[type=hidden]').attr('value')
  return { action, file }
}
