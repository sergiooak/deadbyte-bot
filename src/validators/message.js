import importFresh from '../utils/importFresh.js'
import fs from 'fs/promises'
import logger from '../logger.js'
import reactions from '../config/reactions.js'
//
// ================================ Variables =================================
//
const commandless = (msg, aux) => {
  return {
    stickerFNstickerCreator: (msg.hasMedia || (msg.hasQuotedMsg && aux.quotedMsg.hasMedia)) &&
      ((aux.isStickerGroup && ['video', 'image', 'document'].includes(msg.type)) || !aux.isStickerGroup),
    stickerFNtextSticker: msg.body && msg.type === 'chat' && !aux.isStickerGroup
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
  aux.mentionedMe = msg.mentionedIds.includes(aux.client.info.wid._serialized)
  if (aux.mentionedMe) {
    msg.body = msg.body.replace(new RegExp(`@${aux.client.info.wid.user}`, 'g'), '').trim()
  }

  if (msg.hasQuotedMsg) {
    aux.quotedMsg = await msg.getQuotedMessage()
  }

  let msgCurrent = msg
  const msgPrevious = []
  while (msgCurrent.hasQuotedMsg) {
    msgPrevious.push(msgCurrent)
    msgCurrent = await msgCurrent.getQuotedMessage()
  }
  aux.originalMsg = msgCurrent
  msgPrevious.push(aux.originalMsg)
  aux.history = msgPrevious.reverse()

  // Check if the message is a command
  const prefixes = await importFresh('../config/bot.js').then(config => config.prefixes)
  const functionRegex = new RegExp(`^${prefixes.join(' ?|^')} ?`)
  aux.isFunction = functionRegex.test(msg.body)
  aux.originalBody = msg.body
  if (aux.isFunction) {
    aux.prefix = msg.body.match(functionRegex)?.[0]
    aux.function = msg.body.replace(functionRegex, '').trim().match(/^\S*/)[0]
    msg.body = msg.body.replace(aux.prefix, '').replace(aux.function, '').trim()
    aux.function = aux.function.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() // FüÑçTíõÑ => function
  }
  if (aux.history.length > 1) { // handle original message
    aux.hasOriginalFunction = functionRegex.test(aux.history.at(0).body)
    if (aux.hasOriginalFunction) {
      aux.prefix = aux.history.at(0).body.match(functionRegex)?.[0]
      aux.originalFunction = aux.history.at(0).body.replace(functionRegex, '').trim().match(/^\S*/)[0]
      aux.history.at(0).body = aux.history.at(0).body.replace(aux.prefix, '').replace(aux.originalFunction, '').trim()
      aux.originalFunction = aux.originalFunction.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() // FüÑçTíõÑ => funcion
    }
  }

  aux.me = aux.client.info.wid._serialized ? aux.client.info.wid._serialized : aux.client.info.wid
  aux.mentions = msg.mentionedIds
  if (typeof aux.mentions[0] !== 'string') {
    // sometimes is an array of objects, sometimes is an array of strings
    aux.mentions = aux.mentions.map((mention) => mention._serialized) // convert to array of strings
  }

  aux.amIMentioned = aux.mentions.includes(aux.me)
  aux.participants = aux.chat.isGroup ? aux.chat.participants : []
  aux.admins = aux.chat.isGroup ? aux.participants.filter((p) => p.isAdmin || p.isSuperAdmin).map((p) => p.id._serialized) : []
  aux.isSenderAdmin = aux.admins.includes(msg.author)
  aux.isBotAdmin = aux.admins.includes(aux.me)

  const stickerGroup = '120363187692992289@g.us'
  aux.isStickerGroup = aux.chat.isGroup ? aux.chat.id._serialized === stickerGroup : false

  try {
    msg.aux = aux

    if (aux.isFunction || aux.hasOriginalFunction) { // if it is a function, search in all of the command blocks
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
    if (((aux.chat.isGroup && !aux.isStickerGroup) && !aux.mentionedMe) || aux.isFunction) return false

    if (isOneOf(commandless(msg, aux))) {
      const command = getFirstMatch(commandless(msg, aux))
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
