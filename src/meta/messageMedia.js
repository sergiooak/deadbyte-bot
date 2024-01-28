import { fileTypeFromBuffer } from 'file-type'
import fetch from 'node-fetch'

/**
 * @class MessageMedia
 * @property {string} mimetype - MIME type of the attachment
 * @property {string} data - Base64-encoded data of the file
 * @property {string|null} [filename] - Document file name. Value can be null
 * @property {number|null} [filesize] - Document file size in bytes. Value can be null.
 */
export class MessageMedia {
  constructor (mimetype, data, filename, filesize) {
    this.mimetype = mimetype
    this.data = data
    this.filename = filename
    this.filesize = filesize
  }

  /**
   * Creates a MessageMedia instance from a local file path
   * @param {string} filePath - The path of the file
   * @returns {MessageMedia} - The created MessageMedia instance
   */
  static fromFilePath (filePath) {
    // implementation here
  }

  /**
   * Creates a MessageMedia instance from a URL
   * @param {string} url - The URL of the media
   * @param {MediaFromURLOptions} [options] - The options for the media from URL
   * @param {number} [maxRetries=3] - The max number of retries
   * @returns {Promise<MessageMedia>} - The Promise which resolves to a MessageMedia instance
   */
  static async fromUrl (url, options, maxRetries = 3) {
    let retries = 0
    while (retries < maxRetries) {
      try {
        const buffer = await fetch(url).then((res) => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
          return res.buffer()
        })
        return MessageMedia.fromBuffer(buffer)
      } catch (error) {
        if (retries === maxRetries - 1) throw new Error(`Failed to fetch from URL after ${maxRetries} attempts.`)
        retries++
      }
    }
  }

  /**
   * Creates a MessageMedia instance from a raw buffer
   * @param {Buffer} buffer - The raw buffer
   * @returns {Promise<MessageMedia>} - The Promise which resolves to a MessageMedia instance
   */
  static async fromBuffer (buffer) {
    const type = await fileTypeFromBuffer(buffer)

    if (!type) {
      throw new Error('Unsupported buffer')
    }

    return new MessageMedia(
      type.mime,
      buffer.toString('base64'),
      `DeadByte-${Math.random().toString(36).substring(7)}.${type.ext}`,
      buffer.byteLength
    )
  }
}
