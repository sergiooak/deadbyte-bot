import logger from '../../logger.js'
import qrcode from 'qrcode-terminal'

/**
 * Emitted when a QR code is received
 * @param String qr -> QR code
 * https://docs.wwebjs.dev/Client.html#event:qr
 */

export default async (qr) => {
  logger.info('QR code received!')
  qrcode.generate(qr, { small: true })
}
