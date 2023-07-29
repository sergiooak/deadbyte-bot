import importFresh from '../utils/importFresh.js'
import fs from 'fs/promises'
import logger from '../logger.js'
import reactions from '../config/reactions.js'
//
// ================================ Variables =================================
//
const commandless = (msg, aux) => {
  return {
    stickerFNsticker: (!aux.chat.isGroup || (!aux.isFunction && aux.mentionedMe)) && msg.hasMedia && isMediaStickerCompatible(msg),
    stickerFNstickerText: (!aux.chat.isGroup || (!aux.isFunction && aux.mentionedMe)) && msg.body && msg.type === 'chat'
  }
}

//
// ================================ Main Functions =================================
//
/**
 * Parse message and check if it is to respond
 * @param {import('whatsapp-web.js').Message} msg
 * @returns {promise<commandObject|boolean>} commandObject if it is to respond, false if not
 *
 * @typedef {Object} commandObject
 * @property {String} type - The type of the command
 * @property {String} command - The command name
 */
export default async (msg) => {
  const aux = {} // auxiliar variables
  aux.client = (await import('../index.js')).getClient()
  aux.chat = await msg.getChat()
  aux.sender = await msg.getContact()
  aux.senderIsMe = aux.sender.isMe

  // Check if the message is a command
  const prefixes = await importFresh('../config/bot.js').then(config => config.prefixes)
  const functionRegex = new RegExp(`^${prefixes.join(' ?|^')} ?`)
  aux.isFunction = functionRegex.test(msg.body)
  aux.prefix = msg.body.match(functionRegex)?.[0]
  aux.function = msg.body.replace(functionRegex, '').trim().match(/^\S*/)[0]

  aux.originalBody = msg.body
  msg.body = msg.body.replace(/^\S*/, '').trim()
  console.log(msg.body)

  try {
    msg.aux = aux

    if (aux.isFunction) { // if it is a function, search in all of the command blocks
      const allCommandFiles = await fs.readdir('./src/services/commands')
      const commandFiles = allCommandFiles.filter(file => !file.startsWith('_') && file.endsWith('.js'))
      const commandModules = await Promise.all(commandFiles.map(async command => {
        const commandModule = await importFresh(`../services/commands/${command}`)
        return {
          name: command.split('.')[0],
          module: commandModule.default
        }
      }))

      const commandObjects = await Promise.all(commandModules.map(async _command => {
        // loop through all commands
        for (const command of commandModules) {
          // check if the message is compatible with the command
          const commandObject = await command.module(msg, aux)
          if (isOneOf(commandObject)) {
            // remove first word from body
            return {
              type: command.name,
              command: getFirstMatch(commandObject)
            }
          }
        }
        const prefixesWithFallback = await importFresh('../config/bot.js').then(config => config.prefixesWithFallback)
        if (prefixesWithFallback.includes(aux.prefix) === false) {
          await msg.react(reactions.confused)
          return false
        } else {
          aux.isFunction = false
        }
      }))

      if (commandObjects.filter(command => command !== undefined).length > 0) {
        return commandObjects.find(command => command !== false)
      }
    }

    msg.body = aux.originalBody
    if (isOneOf(commandless(msg))) {
      const command = getFirstMatch(commandless(msg))
      return {
        type: command.split('FN')[0],
        command: command.split('FN')[1]
      }
    }

    return false
  } catch (error) {
    logger.fatal('Error parsing message')
    logger.error(error)
  }
}
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
