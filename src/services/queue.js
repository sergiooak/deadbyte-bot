import importFresh from '../utils/importFresh.js'
import logger from '../logger.js'
import { getClient } from '../index.js'
import { camelCase } from 'change-case'

//
// ===================================== Variables ======================================
//

const client = getClient()
const queue = []
let waitTime = 5000 // 2.5 seconds

//
// ==================================== Main Function ====================================
//
/**
 * Add a message to queue and return an array with the queue length and user queue length
 * @param {import('whatsapp-web.js').ClientInfo} userId
 * @param {string} moduleName - Name of the module to be imported e.g. 'sticker'
 * @param {string} functionName - Name of the function to be called e.g. 'stickerText'
 * @param {import('whatsapp-web.js').Message} msg - Message object
 * @returns {Array<number>} [queueLength, userQueueLength]
 *
 */
function addToQueue (userId, moduleName, functionName, msg) {
  const userIndex = queue.findIndex((user) => user.wid === userId)
  if (userIndex !== -1) {
    queue[userIndex].messagesQueue.push({ moduleName, functionName, message: msg })
    return [getQueueLength(), queue[userIndex].messagesQueue.length]
  }

  queue.push({
    wid: userId,
    messagesQueue: [{ moduleName, functionName, message: msg }]
  })
  return [getQueueLength(), 1]
}
async function processQueue () {
  // set the wait time for the next round based on the queue length
  setWaitTime(Math.min(2500 - (queue.length * 100)), 1000)
  // with more items on the queue, the wait time will be smaller, but never less than 500ms

  if (queue.length === 0) return setTimeout(processQueue, waitTime) // if the queue is empty, wait and try again

  const user = queue.shift() // get the first user on the queue

  const currentMessage = user.messagesQueue.shift() // get the first message of that user

  /** @type {{moduleName: string, functionName: string, message: import('whatsapp-web.js').Message}} */
  const { moduleName, functionName, message: msg } = currentMessage

  const number = await client.getFormattedNumber(msg.from)
  const camelCaseFunctionName = camelCase(functionName)
  logger.info(`🛫 - ${number} - ${moduleName}.${camelCaseFunctionName}()`)

  try {
    const module = await importFresh(`../services/functions/${moduleName}.js`) // import the module
    logger.debug(module)

    const fnPromisse = module[camelCaseFunctionName](msg)
    fnPromisse.then((_result) => {
      if (user.messagesQueue.length > 0) {
        queue.push(user) // if there are more messages on the user queue, push it back to the queue
      }
    }).catch((err) => {
      logger.error(err)
      msg.react('❌')
    })
  } catch (err) {
    logger.fatal('Error executing module', moduleName, camelCaseFunctionName)
    logger.error(err)
  }

  setTimeout(processQueue, waitTime) // wait and process the next item on the queue
}

processQueue()

//
// ================================== Helper Functions ==================================
//
export function setWaitTime (time) {
  waitTime = time
}

export function getWaitTime () {
  return waitTime
}

/**
 * Get the number of messages on the queue, by user or total messages
 * @returns {number}
 * @param {string} by - 'user' or 'messages'
 * @throws {Error} Invalid parameter
 */
export function getQueueLength (by = 'messages') {
  if (by === 'user') return queue.length
  if (by === 'messages') return queue.reduce((acc, user) => acc + user.messagesQueue.length, 0)

  throw new Error('Invalid parameter')
}

export { addToQueue, processQueue }
