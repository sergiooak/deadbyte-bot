import importFresh from '../utils/importFresh.js'
import logger from '../logger.js'
import { getSocket } from '../index.js'
import { camelCase } from 'change-case'

//
// ===================================== Variables ======================================
//
/**
 * @typedef {Object} Message
 * @property {any} message - The message content.
 */

/**
 * @typedef {Object} QueueItem
 * @property {number} waitUntil - The timestamp to wait until.
 * @property {string} moduleName - The name of the module.
 * @property {string} functionName - The name of the function.
 * @property {Message} message - The message object.
 */

/**
 * @typedef {Object} Chat
 * @property {boolean} isBusy - Indicates if the chat is busy.
 * @property {number} lastEvent - The timestamp of the last event.
 * @property {Array<QueueItem>} queue - The queue of items.
 * @property {number} spamWarning - The number of spam warnings.
 * @property {number} lastSpamWarning - The timestamp of the last spam warning.
 */

/**
 * @typedef {Object.<string, Chat>} Queue
 */

/**
 * The queue of messages.
 * @type {Queue}
 */
const queue = {}
const socket = getSocket()
//
// ==================================== Main Function ====================================
//
async function processQueue () {
  if (Object.keys(queue).length > 0) {
    // pick the first key from the queue, pick the first item from the queue
    // reconstruct the message object with the current key at the end
    const firstChatInQueueKey = Object.keys(queue)[0]
    const firstChatInQueue = queue[firstChatInQueueKey]
    delete queue[firstChatInQueueKey]
    queue[firstChatInQueueKey] = firstChatInQueue // add it back to the queue
    if (firstChatInQueue.queue.length === 0) {
      return waitAndProcessQueue() // instantly process the next message
    }
    if (firstChatInQueue.isBusy) {
      return waitAndProcessQueue(0, 0) // instantly process the next message
    }
    const firstMessageInQueue = firstChatInQueue.queue[0]
    firstChatInQueue.queue = firstChatInQueue.queue.slice(1)
    if (Date.now() < firstMessageInQueue.waitUntil) {
      firstChatInQueue.queue.unshift(firstMessageInQueue)
      return waitAndProcessQueue(0, 0) // instantly process the next message
    }
    firstChatInQueue.isBusy = true
    // do not await this, so that we can process the next message in the queue
    executeQueueItem(firstMessageInQueue.moduleName, firstMessageInQueue.functionName, firstMessageInQueue.message).then(() => {
      queue[firstChatInQueueKey].isBusy = false
      queue[firstChatInQueueKey].lastEvent = Date.now()
    })
  }

  // // await random time between 0,5 and 1,5 seconds
  return await waitAndProcessQueue()
}
processQueue() // start the queue processing
//
// ================================== Helper Functions ==================================
//
/**
 * Add the message to the queue
 * @param {string} moduleName
 * @param {string} functionName
 * @param {Message} msg
 * @returns {Promise<{waitUntil: number, messagesOnQueue: number, isSpam: boolean}>}
 */
export async function addToQueue (moduleName, functionName, msg) {
  const id = msg.from
  if (!queue[id]) {
    initializeQueueForUser(id)
  }

  const messagesOnQueue = queue[id].queue.length
  const waitUntil = Date.now() + (messagesOnQueue * 3000)
  const spamThreshold = 6

  if (messagesOnQueue >= spamThreshold) {
    const spamWarningResult = await handleSpamWarning(id, spamThreshold, msg)
    if (spamWarningResult.isSpam) {
      return spamWarningResult
    }
  }

  return addMessageToQueue(id, waitUntil, moduleName, functionName, msg)
}

/**
 * Initialize the queue for the user
 * @param {string} id
 * @returns {void}
 */
function initializeQueueForUser (id) {
  queue[id] = {
    isBusy: false,
    lastEvent: Date.now(),
    queue: [],
    spamWarning: 0,
    lastSpamWarning: 0
  }
}

/**
 * Handle the spam warning
 * @param {string} id
 * @param {number} spamThreshold
 * @param {Message} msg
 * @returns {Promise<{isSpam: boolean, messagesOnQueue: number}>}
 */
async function handleSpamWarning (id, spamThreshold, msg) {
  if (Date.now() - queue[id].lastSpamWarning > 30_000) {
    queue[id].spamWarning++
    queue[id].lastSpamWarning = Date.now()

    const { emoji, message } = getSpamWarningMessage(queue[id].spamWarning, spamThreshold)

    await wait(15_000)
    await msg.react(emoji)
    await msg.reply(message)

    if (queue[id].spamWarning >= 4) {
      await wait(5_000)
      await socket.updateBlockStatus(id, 'block')
    }
    return { isSpam: true, messagesOnQueue: queue[id].queue.length }
  }
  return { isSpam: false }
}

/**
 * Get the spam warning message
 * @param {number} spamWarning
 * @param {number} spamThreshold
 * @returns {{emoji: string, message: string}}
 */
function getSpamWarningMessage (spamWarning, spamThreshold) {
  let emoji = '⚠️'
  let message = ''
  switch (spamWarning) {
    case 4:
      emoji = '🚫'
      message = '🚫 - Você foi bloqueado por _spamming_ o bot! 😡'
      break
    case 3:
      emoji = '🚨'
      message = '🚨 - *ÚLTIMO AVISO!!!*\n\nNa próxima vez que você _spammar_ o bot te darei block!'
      break
    case 2:
      message = `⚠️ - *ATENÇÃO!!!*\n\nJá avisei uma vez 😡, não _spamme_ o bot, máximo de ${spamThreshold} mensagens por minuto.\n\nSe continuar, você será bloqueado!`
      break
    default:
      message = `⚠️ - *ATENÇÃO!!!*\n\nNão _spamme_ o bot, máximo de ${spamThreshold} mensagens por minuto.\n\nSe continuar, você será bloqueado!`
  }
  return { emoji, message }
}

/**
 * Add the message to the queue
 * @param {string} id
 * @param {number} waitUntil
 * @param {string} moduleName
 * @param {string} functionName
 * @param {Message} msg
 * @returns {{waitUntil: number, messagesOnQueue: number}}
 */
function addMessageToQueue (id, waitUntil, moduleName, functionName, msg) {
  queue[id].queue.push({
    waitUntil,
    moduleName,
    functionName,
    message: msg
  })

  return { waitUntil, messagesOnQueue: queue[id].queue.length }
}

/**
 * Wait for the given amount of time
 * @param {number} ms
 * @returns {Promise<void>}
 */
async function wait (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function waitAndProcessQueue (min = 1000, max = 3000) {
  const waitTime = Math.floor(Math.random() * (max - min + 1)) + min
  await wait(waitTime)
  processQueue()
}

export async function executeQueueItem (moduleName, functionName, msg) {
  // console.log('Executing queue item', moduleName, functionName, msg)
  await msg.sendSeen()
  const checkDisabled = await importFresh('validators/checkDisabled.js')
  const isEnabled = await checkDisabled.default(msg)
  if (!isEnabled) return logger.info(`⛔ - ${msg.from} - ${functionName} - Disabled`)

  const checkOwnerOnly = await importFresh('validators/checkOwnerOnly.js')
  const isOwnerOnly = await checkOwnerOnly.default(msg)
  if (isOwnerOnly) return logger.info(`🛂 - ${msg.from} - ${functionName} - Restricted to admins`)

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
