import logger from '../../logger.js'
import { useMultiFileAuthState } from '@whiskeysockets/baileys'

/**
 * Credentials update event
 * @param {import('@whiskeysockets/baileys').BaileysEventMap['creds.update']} event
 */
export default async (event) => {
  logger.trace('Credentials updated', event)
  const { saveCreds } = await useMultiFileAuthState('auth_info_baileys')
  saveCreds(event)
}
