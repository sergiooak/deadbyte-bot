import path from 'path'
import Crypto from 'crypto'
import { tmpdir } from 'os'
import ffmpeg from 'fluent-ffmpeg'
import webp from 'node-webpmux'
import { promises as fs } from 'fs'
import sharp from 'sharp'
import { Readable } from 'stream'
const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k)

/**
 * Modified Utility methods from WWebJS
 */
class Util {
  constructor () {
    throw new Error(`The ${this.constructor.name} class may not be instantiated.`)
  }

  static generateHash (length) {
    let result = ''
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const charactersLength = characters.length
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength))
    }
    return result
  }

  /**
     * Sets default properties on an object that aren't already specified.
     * @param {Object} def Default properties
     * @param {Object} given Object to assign defaults to
     * @returns {Object}
     * @private
     */
  static mergeDefault (def, given) {
    if (!given) return def
    for (const key in def) {
      if (!has(given, key) || given[key] === undefined) {
        given[key] = def[key]
      } else if (given[key] === Object(given[key])) {
        given[key] = Util.mergeDefault(def[key], given[key])
      }
    }

    return given
  }

  /**
     * Formats a image to webp
     * @param {MessageMedia} media
     * @param {boolean} crop
     *
     * @returns {Promise<MessageMedia>} media in webp format
     */
  static async formatImageToWebpSticker (media, crop) {
    if (!media.mimetype.includes('image')) { throw new Error('media is not a image') }

    let buffer = Buffer.from(
      media.data.replace(`data:${media.mimetype};base64,`, ''),
      'base64'
    )

    if (crop) {
      buffer = await sharp(buffer).resize(512, 512).toBuffer()
    }

    const resizeObj = {
      width: 512,
      height: 512
    }
    if (!crop) {
      resizeObj.fit = 'contain'
      resizeObj.background = { r: 0, g: 0, b: 0, alpha: 0 }
    }

    if (media.mimetype.includes('webp')) {
      return media
    }

    const finalBuffer = await sharp(buffer).resize(resizeObj).webp().toBuffer()
    const finalBase64 = finalBuffer.toString('base64')

    return {
      mimetype: 'image/webp',
      data: finalBase64,
      filename: `${new Date().getTime()}.webp`,
      filesize: finalBuffer.byteLength
    }
  }

  /**
     * Formats a video to webp
     * @param {MessageMedia} media
     * @param {boolean} crop
     *
     * @returns {Promise<MessageMedia>} media in webp format
     */
  static async formatVideoToWebpSticker (media, crop) {
    if (!media.mimetype.includes('video')) { throw new Error('media is not a video') }

    const videoType = media.mimetype.split('/')[1]

    const tempFile = path.join(
      tmpdir(),
            `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`
    )

    const stream = new Readable()
    const buffer = Buffer.from(
      media.data.replace(`data:${media.mimetype};base64,`, ''),
      'base64'
    )
    stream.push(buffer)
    stream.push(null)

    let ffmpegConfig = null
    if (crop) {
      ffmpegConfig = 'crop=w=\'min(iw,ih)\':h=\'min(iw,ih)\',scale=170:170,setsar=1,fps=10'
    } else {
      ffmpegConfig = 'scale=\'iw*min(170/iw,170/ih)\':\'ih*min(170/iw,170/ih)\',format=rgba,pad=170:170:\'(170-iw)/2\':\'(170-ih)/2\':\'#00000000\',setsar=1,fps=10'
    }

    await new Promise((resolve, reject) => {
      ffmpeg(stream)
        .inputFormat(videoType)
        .on('error', reject)
        .on('end', () => resolve(true))
        .addOutputOptions([
          '-vcodec',
          'libwebp',
          '-vf',
          ffmpegConfig,
          '-loop',
          '0',
          '-ss',
          '00:00:00.0',
          '-t',
          '00:00:07.0',
          '-preset',
          'default',
          '-an',
          '-vsync',
          'vfr',
          '-qscale',
          '31',
          '-compression_level',
          '6',
          '-s',
          '512:512'
        ])
        .toFormat('webp')
        .save(tempFile)
    })

    const data = await fs.readFile(tempFile, 'base64')
    await fs.unlink(tempFile)

    return {
      mimetype: 'image/webp',
      data,
      filename: media.filename
    }
  }

  /**
     * Sticker metadata.
     * @typedef {Object} StickerMetadata
     * @property {string} [name]
     * @property {string} [author]
     * @property {string[]} [categories]
     */

  /**
     * Formats a media to webp
     * @param {MessageMedia} media
     * @param {StickerMetadata} metadata
     * @param {boolean} [crop=false] - If it should crop the image to a square
     *
     * @returns {Promise<MessageMedia>} media in webp format
     */
  static async formatToWebpSticker (media, metadata, crop = false) {
    let webpMedia

    if (media.mimetype.includes('image')) {
      webpMedia = await this.formatImageToWebpSticker(media, crop)
    } else if (media.mimetype.includes('video')) {
      webpMedia = await this.formatVideoToWebpSticker(media, crop)
    } else {
      throw new Error('Invalid media format')
    }

    const img = new webp.Image()
    const hash = this.generateHash(32)
    const stickerPackId = hash
    const packname = metadata.author // Yes, I know it is twisted
    const author = metadata.pack // ¯\_(ツ)_/¯
    const categories = metadata.categories || ['']
    const json = { 'sticker-pack-id': stickerPackId, 'sticker-pack-name': packname, 'sticker-pack-publisher': author, emojis: categories }
    const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00])
    const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8')
    const exif = Buffer.concat([exifAttr, jsonBuffer])
    exif.writeUIntLE(jsonBuffer.length, 14, 4)
    await img.load(Buffer.from(webpMedia.data, 'base64'))
    img.exif = exif
    webpMedia.data = (await img.save(null)).toString('base64')

    return webpMedia
  }

  /**
     * Configure ffmpeg path
     * @param {string} path
     */
  static setFfmpegPath (path) {
    ffmpeg.setFfmpegPath(path)
  }
}

export default Util
