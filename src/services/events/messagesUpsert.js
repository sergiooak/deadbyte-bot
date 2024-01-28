import importFresh from '../../utils/importFresh.js'
import logger from '../../logger.js'
import { getSocket } from '../../index.js'
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
  const msg = meta.default(upsert.messages[0])
  if (!msg) return
  if (msg.fromMe) return // ignore self messages

  if (!okTypes.includes(msg.type)) return
  await msg.sendSeen()

  if (msg.type === 'revoked') {
    // TODO: send random "Deus viu o que você apagou" sticker
    return await msg.reply('👀 - Eu vi o que você apagou')
  }
  if (msg.type === 'edited') {
    await msg.react('👀')
    return await msg.reply('👀 - {Haha eu|Kkkk eu|Eu} {vi|sei} {oq|o que} {tava antes|tu tinha escrito}{ ein| kk|!|!!!}')
  }
  await msg.reply(msg.type)

  const sock = getSocket()
  await sock.sendPresenceUpdate('available')
}
