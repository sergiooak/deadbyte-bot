import importFresh from '../utils/importFresh.js'
import logger from '../logger.js'
import { getClient } from '../index.js'
import { camelCase } from 'change-case'

//
// ===================================== Variables ======================================
//

const client = getClient()
const queue = []
const waitTimeMax = 0
const waitTimeMin = 0
const waitTimeMultiplier = 0
let waitTime = waitTimeMax // initial wait time

//
// ==================================== Main Function ====================================
//
/**
 * Add a message to queue and return an array with the queue length and user queue length
 * @param {import('whatsapp-web.js').ClientInfo} userId
 * @param {string} moduleName - Name of the module to be imported e.g. 'sticker'
 * @param {string} functionName - Name of the function to be called e.g. 'stickerText'
 * @param {import('../types.d.ts').WWebJSMessage} msg - Message object
 * @returns {Array<number>} [queueLength, userQueueLength]
 *
 */
function addToQueue (userId, moduleName, functionName, msg) {
  // if is a group, bypass the queue
  if (msg.aux.chat.isGroup) {
    bypassQueue(moduleName, functionName, msg)
    return [0, 0]
  }
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

async function bypassQueue (moduleName, functionName, msg) {
  const module = await importFresh(`services/functions/${moduleName}.js`)
  const camelCaseFunctionName = camelCase(functionName)
  module[camelCaseFunctionName](msg)
}

async function processQueue () {
  // set the wait time for the next round based on the queue length
  // const newWaitTime = Math.max(waitTimeMax - (queue.length * waitTimeMultiplier), waitTimeMin)
  // noise between -150ms and 150ms to make the wait time more human-like
  // const noise = Math.floor(Math.random() * 300) - 150
  setWaitTime(100)

  if (queue.length === 0) return setTimeout(processQueue, waitTime) // if the queue is empty, wait and try again

  const user = queue.shift() // get the first user on the queue

  const currentMessage = user.messagesQueue.shift() // get the first message of that user

  /** @type {{moduleName: string, functionName: string, message: import('whatsapp-web.js').Message}} */
  const { moduleName, functionName, message: msg } = currentMessage

  const number = await client.getFormattedNumber(msg.from)
  const camelCaseFunctionName = camelCase(functionName)
  logger.info(`${msg.lag} - ${number} - ${moduleName}.${camelCaseFunctionName}()`)

  try {
    const module = await importFresh(`services/functions/${moduleName}.js`) // import the module
    logger.debug(module)
    const fnPromisse = module[camelCaseFunctionName](msg)
    fnPromisse.then((_result) => {
      if (user.messagesQueue.length > 0) {
        queue.push(user) // if there are more messages on the user queue, push it back to the queue
      } else {
        msg.aux.chat.delete()
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
  // make sure the wait time is not lower than 1ms
  const safeTime = Math.max(time, 1)
  waitTime = safeTime
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
