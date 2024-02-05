import logger from '../../logger.js'
import { DisconnectReason } from '@whiskeysockets/baileys'
import { connectToWhatsApp } from '../../index.js'

/**
 * Connection state has been updated -- WS closed, opened, connecting etc.
 * @param {import('@whiskeysockets/baileys').BaileysEventMap['connection.update']} update
 */
export default async (update) => {
  logger.trace('Connection updated\n' + JSON.stringify(update))
  if (global.qr !== update.qr) {
    global.qr = update.qr
  }
  const { connection, lastDisconnect } = update
  if (connection === 'close') {
    lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut
      ? connectToWhatsApp()
      : logger.fatal('connection logged out...')
  }
}
