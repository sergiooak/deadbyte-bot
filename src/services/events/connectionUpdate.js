import logger from '../../logger.js'
import { DisconnectReason } from '@whiskeysockets/baileys'
import { connectToWhatsApp } from '../../index.js'

/**
 * Connection state has been updated -- WS closed, opened, connecting etc.
 * @param {import('@whiskeysockets/baileys').BaileysEventMap['connection.update']} update
 */
export default async (update) => {
  logger.info('Connection updated', update)
  const { connection, lastDisconnect } = update
  if (connection === 'close') {
    const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut
    logger.warn('connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect)
    // reconnect if not logged out
    if (shouldReconnect) {
      connectToWhatsApp()
    }
  } else if (connection === 'open') {
    logger.warn('opened connection')
  }
}
