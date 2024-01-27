import importFresh from '../../utils/importFresh.js'
import spintax from '../../utils/spintax.js'
import { getSocket } from '../../index.js'
import logger from '../../logger.js'
//
// ================================ Variables =================================
//
const okTypes = [
  'chat',
  'audio',
  'ptt',
  'image',
  'video',
  'document',
  'sticker',
  'revoked',
  'groups_v4_invite',
  'reaction',
  'edited'
]

//
// ================================ Main Function =============================
//
/**
 * Add/update the given messages. If they were received while the connection was online, the update will have type: "notify"
 * @param {import('@whiskeysockets/baileys').BaileysEventMap['messages.upsert']} upsert
 */
export default async (upsert) => {
  logger.trace('messages.upsert', upsert)
  const meta = await importFresh('meta/message.js')
  let msg = meta.default(upsert.messages[0])
  if (msg.key.fromMe) return // ignore self messages
  const messageType = await importFresh('validators/messageType.js')
  const { type, updatedMsg } = messageType.default(msg)
  msg = updatedMsg
  if (!msg.key.fromMe) {
    if (!okTypes.includes(type)) return

    const sender = msg.key.remoteJid
    const sock = getSocket()
    if (type === 'revoked') {
      // TODO: send random "Deus viu o que você apagou" sticker
      await sock.sendMessage(sender, {
        react: {
          text: '👀',
          key: msg.key
        }
      })
      return await sock.sendMessage(sender, {
        text: '👀'
      })
    }
    if (type === 'edited') {
      // TODO: send random "Mensagem editada" sticker
      await sock.sendMessage(sender, {
        react: {
          text: '👀',
          key: msg.key
        }
      })
      return await sock.sendMessage(sender, {
        text: spintax(
          '👀 - {Haha eu|Kkkk eu|Eu} {vi|sei} {oq|o que} {tava antes|tu tinha escrito}{ ein| kk|!|!!!}'
        )
      }, {
        quoted: msg
      })
    }
    await sock.sendMessage(sender, {
      text: type
    }, {
      quoted: msg
    })
  }
}
