import logger from '../../logger.js'

/**
 * Emitted when the connection state changes
 * @param {import('whatsapp-web.js').WAState} state
 * https://docs.wwebjs.dev/Client.html#event:change_state
 */

export default async (state) => {
  logger.info(`Connection state changed: ${state}`)
}
