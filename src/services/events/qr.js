import logger from '../../logger.js'
import qrcode from 'qrcode-terminal'

/**
 * Emitted when a QR code is received
 * @param String qr -> QR code
 * https://docs.wwebjs.dev/Client.html#event:qr
 */
export default async (qr) => {
  logger.info(`QR code received! ${generateQRCodeUrl(qr)}`)
  qrcode.generate(qr, { small: true }, (qrcode) => {
    logger.info(`QR code generated:\n\n${qrcode}`)
  })
}

//
// ================================== Helper functions ==================================
//
function generateQRCodeUrl (text) {
  return `https://api.qrserver.com/v1/create-qr-code/?data=${text}&size=512x512`
}
