import importFresh from '../../utils/importFresh.js'
// import { saveActionToDB } from '../../db.js'
import { getSocket } from '../../index.js'
import { camelCase } from 'change-case'
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
  if (upsert.messages[0].key.fromMe) return // ignore self messages
  const meta = await importFresh('meta/message.js')
  const msg = meta.default(upsert.messages[0])
  if (!msg) return

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

  const sock = getSocket()
  await sock.sendPresenceUpdate('available')
  const messageParser = await importFresh('validators/message.js')
  const handlerModule = await messageParser.default(msg)
  logger.trace('handlerModule: ', handlerModule)
  console.log('handlerModule: ', handlerModule)

  if (!handlerModule) return logger.debug('handlerModule is undefined')

  // TODO: make legacy db works
  // msg.aux.db = await saveActionToDB(handlerModule.type, handlerModule.command, msg)

  // only works with db
  // const checkDisabled = await importFresh('validators/checkDisabled.js')
  // const isEnabled = await checkDisabled.default(msg)
  // if (!isEnabled) return logger.info(`⛔ - ${msg.from} - ${handlerModule.command} - Disabled`)

  // const checkOwnerOnly = await importFresh('validators/checkOwnerOnly.js')
  // const isOwnerOnly = await checkOwnerOnly.default(msg)
  // if (isOwnerOnly) return logger.info(`🛂 - ${msg.from} - ${handlerModule.command} - Restricted to admins`)

  // TODO: implement queue system
  const moduleName = handlerModule.type
  const functionName = handlerModule.command
  const module = await importFresh(`services/functions/${moduleName}.js`)
  const camelCaseFunctionName = camelCase(functionName)
  module[camelCaseFunctionName](msg)
}
