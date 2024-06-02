import importFresh from '../../utils/importFresh.js'
import { addLag } from '../../utils/lagMemory.js'
import { saveActionToDB } from '../../db.js'
import spintax from '../../utils/spintax.js'
import { getClient } from '../../index.js'
import { addToQueue } from '../queue.js'
import logger from '../../logger.js'

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
  const nowInUnix = Math.ceil(Date.now() / 1000)
  msg.lag = Math.max(nowInUnix - msg.timestamp, 0)
  addLag(msg.lag)

  /**
   * Parse message and check if it is to respond, module is imported fresh to force it to be reloaded from disk.
   * @type {import('../../validators/message.js')}
   */
  const messageParser = await importFresh('validators/message.js')
  const handlerModule = await messageParser.default(msg)
  logger.trace('handlerModule: ', handlerModule)

  // Just for funziez, let's correct the people who call it "boot" instead of "bot"
  await correctBootToBotSpelling(msg)

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

//
// ================================== Helper Functions ==================================
//

/**
 * Checks if a message contains a specific word
 * @param {string} messageBody - The body of the message
 * @param {string} word - The word to check for
 * @returns {boolean} - Returns true if the word is in the message, false otherwise
 */
function messageContainsWord (messageBody, word) {
  // Check if the message body is empty or undefined
  if (!messageBody) {
    return false
  }

  // Split the message body into individual words
  const wordsInMessage = messageBody.split(' ')

  // Check if the word is in the message
  const wordIsInMessage = wordsInMessage.some((msgWord) => msgWord.toLowerCase().replace(/[^a-zA-Z]/g, '') === word)

  // Return the result
  return wordIsInMessage
}

/**
 * This function corrects the spelling of "boot" to "bot" in messages.
 * If the message contains the word "boot", it replies with a correction message.
 * @param {import('whatsapp-web.js').Message} msg - The message to check and correct.
 * @returns {Promise<void>} - A Promise that resolves when the reply has been sent.
 */
async function correctBootToBotSpelling (msg) {
  // Check if the message contains the word 'boot'
  if (messageContainsWord(msg.body, 'boot')) {
    // Define the emoji prefix for the correction message
    const correctionEmojiPrefix = '{🤓|📚|👓|🧠|🔍|💡|🖥️|📘}'

    // Define the possible responses for the correction
    const correctionResponses = [
      '{O|Opa! O|Oops! O} {certo|correto} é *bot*{*| {!|!!|!!!}}',
      '{Na verdade|A propósito}, {é|se escreve} *bot*{*| {!|!!|!!!}}',
      '{Só para corrigir|Para sua informação}, {o correto|o certo} é *bot*{*| {!|!!|!!!}}',
      '{Você quis dizer|Você queria dizer} *bot*{*| {?|??|???}}',
      '{Acho que você quis dizer|Talvez você tenha querido dizer}: *bot*{*| {?|??|???}}',
      '*{Bot|Bot*}* é {a forma correta|como se escreve corretamente} {!|!!|!!!}'
    ]

    // Wikipedia url
    const url = '\nhttps://pt.wikipedia.org/wiki/Bot'
    const corretionFooter = `{|\n\nPara mais informações, veja: ${url}|\n\nLeia mais sobre isso em: ${url}|\n\nPara saber mais, acesse: ${url}}`

    // Select a random response
    const randomResponse = correctionResponses[Math.floor(Math.random() * correctionResponses.length)]

    // Generate the correction message
    const correctionMessage = spintax(`${correctionEmojiPrefix} - ${randomResponse}${corretionFooter}`)

    // Reply with the correction message
    await msg.reply(correctionMessage, undefined, { linkPreview: false })
  }
}
