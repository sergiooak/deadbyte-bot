//
// ================================ Variables =================================
//
const commandless = (msg, chat, client) => {
  return {
    sticker: msg.hasMedia && isMediaStickerCompatible(msg),
    stickerText: msg.body && msg.type === 'chat'
  }
}

//
// ================================ Main Functions =================================
//
/**
 * Parse message and check if it is to respond
 * @param {import('whatsapp-web.js').Message} msg
 * @returns {commandObject} commandObject
 *
 * @typedef {Object} commandObject
 * @property {String} type - The type of the command
 * @property {String} command - The command name
 */
const isToRepond = async (msg) => {
//   const client = (await import('../index.js')).getClient()
//   const chat = await msg.getChat()
//   const sender = await msg.getContact()
//   const senderIsMe = sender.isMe
//   const originalBody = msg.body

  // Check if the message is a command
  const prefixes = await import('../config/bot.js').then(config => config.prefixes)
  const functionRegex = new RegExp(`^(${prefixes.join('|')}) ?`, 'g')
  console.log('functionRegex: ', functionRegex)
  const isFunction = msg.body.match(functionRegex)
  console.log('isFunction: ', isFunction)

  if (isOneOf(commandless(msg))) {
    return {
      type: 'commandless',
      command: getFirstMatch(commandless(msg))
    }
  }
}

export { isToRepond }
//
// ================================ Aux Functions =================================
//
/**
 * Check if the object has only one true value
 * @param {Object} object
 * @returns {Boolean|String} false if none, the key of the first true value if one
 */
function isOneOf (object) {
  return Object.keys(object).some(key => object[key] === true)
}

/**
 * Returns the key of the first true value
 * @param {Object} object
 * @returns {String} the key of the first true value
 * @throws {Error} if none
 * @see isOneOf
 */
function getFirstMatch (object) {
  const key = Object.keys(object).find(key => object[key] === true)
  if (!key) throw new Error('None of the values are true')
  return key
}

/**
 * Check if the message is compatible with a sticker creation
 * @param {wwebjs.Message} msg
 * @returns {Boolean}
 */
function isMediaStickerCompatible (msg) {
  return msg.type === 'image' || msg.type === 'video' || msg.type === 'sticker'
}
