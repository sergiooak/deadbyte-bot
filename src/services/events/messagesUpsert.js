import importFresh from '../../utils/importFresh.js'
import { saveActionToDB } from '../../db.js'
import { getSocket } from '../../index.js'
import { camelCase } from 'change-case'
import logger from '../../logger.js'
//
// ================================ Variables =================================
//

//
// ================================ Main Function =============================
//
/**
 * Add/update the given messages. If they were received while the connection was online, the update will have type: "notify"
 * @param {import('@whiskeysockets/baileys').BaileysEventMap['messages.upsert']} upsert
 */
export default async (upsert) => {
  logger.trace('messages.upsert', upsert)
  if (!upsert.messages) return // ignore if there are no messages
  let msg = upsert.messages[0]
  if (msg.key.fromMe) return // ignore self messages
  const meta = await importFresh('meta/message.js')
  msg = meta.default(msg)

  if (msg.type === 'revoked') {
    // TODO: send random "Deus viu o que você apagou" sticker
    await msg.sendSeen()
    return await msg.reply('👀 - Eu vi o que você apagou')
  }
  if (msg.type === 'edited') {
    await msg.sendSeen()
    await msg.react('👀')
    return await msg.reply('👀 - {Haha eu|Kkkk eu|Eu} {vi|sei} {oq|o que} {tava antes|tu tinha escrito}{ ein| kk|!|!!!}')
  }

  const socket = getSocket()
  await socket.sendPresenceUpdate('available')
  const messageParser = await importFresh('validators/message.js')
  const handlerModule = await messageParser.default(msg)
  logger.trace('handlerModule: ', handlerModule)

  if (!handlerModule) return logger.debug('handlerModule is undefined')

  await msg.sendSeen()
  msg.aux.db = await saveActionToDB(
    handlerModule.type,
    handlerModule.command,
    msg
  )

  const checkDisabled = await importFresh('validators/checkDisabled.js')
  const isEnabled = await checkDisabled.default(msg)
  if (!isEnabled) return logger.info(`⛔ - ${msg.from} - ${handlerModule.command} - Disabled`)

  const checkOwnerOnly = await importFresh('validators/checkOwnerOnly.js')
  const isOwnerOnly = await checkOwnerOnly.default(msg)
  if (isOwnerOnly) return logger.info(`🛂 - ${msg.from} - ${handlerModule.command} - Restricted to admins`)

  // TODO: implement queue system
  const moduleName = handlerModule.type
  const functionName = handlerModule.command
  const module = await importFresh(`services/functions/${moduleName}.js`)
  const camelCaseFunctionName = camelCase(functionName)
  try {
    await module[camelCaseFunctionName](msg)
  } catch (error) {
    logger.error(`Error with command ${camelCaseFunctionName}`, error)
    const readMore = '​'.repeat(783)
    const prefix = msg.aux.prefix ?? '!'
    msg.react('❌')
    let message = `❌ - Ocorreu um erro inesperado com o comando *${prefix}${msg.aux.function}*\n\n`
    message += 'Se for possível, tira um print e manda para meu administrador nesse grupo aqui: '
    message += 'https://chat.whatsapp.com/CBlkOiMj4fM3tJoFeu2WpR\n\n'
    message += `${readMore}\n${error}`
    msg.reply(message)
  }
}
