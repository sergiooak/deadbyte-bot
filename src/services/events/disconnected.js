import logger from '../../logger.js'

/**
 * Emitted when the client has been disconnected
 * @param {import('whatsapp-web.js').WAState | string} reason WAState or "NAVIGATION"
 * https://docs.wwebjs.dev/Client.html#event:disconnected
 */

export default async (reason) => {
  logger.info(`Disconnected: ${reason}`)
}
