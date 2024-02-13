import importFresh from '../../utils/importFresh.js'
import { saveActionToDB } from '../../db.js'
import { getSocket } from '../../index.js'
import { addToQueue } from '../queue.js'
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
  // console.log('messages.upsert\n' + JSON.stringify(upsert, null, 2))
  logger.trace('messages.upsert\n' + JSON.stringify(upsert, null, 2))
  if (upsert.type === 'append') return // TODO: handle unread messages

  for (let msg of upsert.messages) {
    if (msg.key.fromMe) return // ignore self messages

    const meta = await importFresh('meta/message.js')
    msg = meta.default(msg)

    if (msg.type === 'revoked') {
      // TODO: send random "Deus viu o que você apagou" sticker
      return
    }
    if (msg.type === 'edited') {
      await msg.sendSeen()
      return await msg.react('✏️')
    }

    const socket = getSocket()
    await socket.sendPresenceUpdate('available')
    const messageParser = await importFresh('validators/message.js')
    const handlerModule = await messageParser.default(msg)
    logger.trace('handlerModule: ', handlerModule)

    if (!handlerModule) return logger.debug('handlerModule is undefined')

    try {
      msg.aux.db = await saveActionToDB(handlerModule.type, handlerModule.command, msg)
    } catch (error) {
      logger.trace('Error saving action to DB', error)
    }

    // TODO: improve bot vip system
    // const vipBots = ['DeadByte - 5852', 'DeadByte - 7041', 'DeadByte - VIP']
    // if (!msg.isGroup && vipBots.includes(msg.bot.name) && msg.aux.db) {
    if (!msg.isGroup && msg.aux.db) {
      const sender = msg.aux.db.contact.attributes
      if (!sender.queue?.data && msg.aux.db.command.slug !== 'activate') {
        console.warn(`⛔ - ${msg.from} - ${handlerModule.command} - Not queued`)
        return // user not passed through the queue
      }
      // const hasDonated = sender?.hasDonated === true
      // if (!hasDonated) {
      //   // await msg.react('💎')
      //   // let message = '❌ - Você não é um VIP! 😢\n\n'
      //   // message += 'Desculpe, não localizei nenhuma doação em seu nome.\n\n'
      //   // message += '*Se isso for um erro ou se você deseja se tornar um VIP, entre em contato no grupo de suporte:*\n'
      //   // message += 'https://chat.whatsapp.com/CBlkOiMj4fM3tJoFeu2WpR'
      //   // await msg.reply(message)

      //   // // wait 3 seconds and block the user
      //   // setTimeout(async () => {
      //   //   await socket.updateBlockStatus(msg.from, 'block')
      //   // }, 5000)

      //   return
      // }
    }

    const checkDisabled = await importFresh('validators/checkDisabled.js')
    const isEnabled = await checkDisabled.default(msg)
    if (!isEnabled) return logger.info(`⛔ - ${msg.from} - ${handlerModule.command} - Disabled`)

    const checkOwnerOnly = await importFresh('validators/checkOwnerOnly.js')
    const isOwnerOnly = await checkOwnerOnly.default(msg)
    if (isOwnerOnly) return logger.info(`🛂 - ${msg.from} - ${handlerModule.command} - Restricted to admins`)

    // TODO: implement queue system
    const moduleName = handlerModule.type
    const functionName = handlerModule.command
    await addToQueue(moduleName, functionName, msg)
    // const { isSpam, messagesOnQueue } = await addToQueue(moduleName, functionName, msg)
    // if (isSpam) return logger.warn(`${msg.from} - ${handlerModule.command} - Spam detected`)
    // if (messagesOnQueue > 1) return logger.info(`${msg.from} - ${handlerModule.command} - Queued`)
    // logger.info(`${msg.from} - ${handlerModule.command} - Processing`)
  }
}
