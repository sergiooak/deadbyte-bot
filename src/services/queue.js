import importFresh from '../utils/importFresh.js'
import logger from '../logger.js'
//
// ===================================== Variables ======================================
//
const queue = []
let waitTime = 2500 // 2.5 seconds

//
// ==================================== Main Function ====================================
//
function addToQueue (userId, moduleName, functionName, msg) {
  const userIndex = queue.findIndex((user) => user.wid === userId)
  if (userIndex !== -1) {
    queue[userIndex].messagesQueue.push({ moduleName, functionName, message: msg })
  } else {
    queue.push({
      wid: userId,
      messagesQueue: [{ moduleName, functionName, message: msg }]
    })
  }
}
async function processQueue () {
  // set the wait time for the next round based on the queue length
  setWaitTime(Math.min(2500 - (queue.length * 100)), 500)
  // with more items on the queue, the wait time will be smaller, but never less than 500ms

  if (queue.length === 0) return setTimeout(processQueue, waitTime) // if the queue is empty, wait and try again

  const user = queue.shift() // get the first user on the queue
  const message = user.messagesQueue.shift() // get the first message of that user
  const { moduleName, functionName, message: messageContent } = message
  logger.info(`🛠️ - [${user.wid.split('@')[0]}] - ${'1/X'.replace('X', user.messagesQueue.length + 1)} | ${moduleName}.${functionName}()`)

  try {
    const module = await importFresh(`../services/functions/${moduleName}.js`) // import the module
    logger.debug(module)

    const fnPromisse = module[functionName](messageContent)
    fnPromisse.then((_result) => {
      if (user.messagesQueue.length > 0) {
        queue.push(user) // if there are more messages on the user queue, push it back to the queue
      }
    }).catch((err) => {
      logger.error(err)
    })
  } catch (err) {
    console.log(err)
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

export { addToQueue, processQueue }
