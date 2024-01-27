import { getSocket } from '../../index.js'
// import logger from '../../logger.js'

/**
 * Add/update the given messages. If they were received while the connection was online, the update will have type: "notify"
 * @param {import('@whiskeysockets/baileys').BaileysEventMap['messages.upsert']} upsert
 */
export default async (upsert) => {
  const sock = getSocket()
  const msg = upsert.messages[0]
  console.log('upsert', upsert)
  // if (!msg.key.fromMe) {
  //   const sender = msg.key.remoteJid
  //   console.log('replying to', sender)
  //   await sock.sendMessage(sender, {
  //     text: msg.message?.conversation || 'Hello there!'
  //   })
  // }
}
