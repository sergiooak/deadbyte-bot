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
  /**
   * Parse message and check if it is to respond, module is imported fresh to force it to be reloaded from disk.
   * @type {import('../../validators/message.js')}
   */
  const messageParser = await importFresh('validators/message.js')
  const handlerModule = await messageParser.default(msg)
  logger.trace('handlerModule: ', handlerModule)

  if (!handlerModule) return logger.debug('handlerModule is undefined')

  msg.aux.db = await saveActionToDB(handlerModule.type, handlerModule.command, msg)
  const [queueLength, userQueueLength] = addToQueue(msg.from, handlerModule.type, handlerModule.command, msg)
  const number = await client.getFormattedNumber(msg.from)
  if (queueLength === 1) return
  logger.info(`🛬 - ${number} - Added to queue ${userQueueLength}/${queueLength}`)
}
