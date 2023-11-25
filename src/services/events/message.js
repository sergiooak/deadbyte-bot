import { addToQueue } from '../queue.js'
import importFresh from '../../utils/importFresh.js'
import logger from '../../logger.js'
import { getClient } from '../../index.js'
import { saveActionToDB } from '../../db.js'

const client = getClient()

//
// ================================ Main Function =============================
//
/**
 * Emitted when a new message is received.
 * @param {import('whatsapp-web.js').Message} msg
 * @see https://docs.wwebjs.dev/Client.html#event:message
 */
export default async (msg) => {
  logger.trace(msg)
  msg.startedAt = Date.now()
  const nowInUnix = Math.floor(Date.now() / 1000)
  msg.lag = Math.floor(nowInUnix - msg.timestamp) // time in seconds since message was sent
  /**
   * Parse message and check if it is to respond, module is imported fresh to force it to be reloaded from disk.
   * @type {import('../../validators/message.js')}
   */
  const messageParser = await importFresh('validators/message.js')
  const handlerModule = await messageParser.default(msg)
  logger.trace('handlerModule: ', handlerModule)

  if (!handlerModule) return logger.debug('handlerModule is undefined')

  msg.aux.db = await saveActionToDB(handlerModule.type, handlerModule.command, msg)

  const checkDisabled = await importFresh('validators/checkDisabled.js')
  const isEnabled = await checkDisabled.default(msg)
  if (!isEnabled) return logger.info(`⛔ - ${msg.from} - ${handlerModule.command} - Disabled`)

  const checkOwnerOnly = await importFresh('validators/checkOwnerOnly.js')
  const isOwnerOnly = await checkOwnerOnly.default(msg)
  if (isOwnerOnly) return logger.info(`🛂 - ${msg.from} - ${handlerModule.command} - Restricted to admins`)

  const [queueLength, userQueueLength] = addToQueue(msg.from, handlerModule.type, handlerModule.command, msg)
  const number = await client.getFormattedNumber(msg.from)
  if (queueLength === 1) return
  logger.info(`🛬 - ${number} - Added to queue ${userQueueLength}/${queueLength}`)
}
