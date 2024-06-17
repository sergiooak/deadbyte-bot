import logger from '../../logger.js'

/**
 * Emitted when authentication is successful
 * https://docs.wwebjs.dev/Client.html#event:authenticated
 */

export default async () => {
  logger.info('Authenticated!')
}
