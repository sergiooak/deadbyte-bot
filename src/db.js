import fetch from 'node-fetch'
import logger from './logger.js'
import { kebabCase } from 'change-case'
import qs from 'qs'
//
// ===================================== Variables ======================================
//

let isApiOnline = false
let token = null
const dbUrl = process.env.DB_URL
const dbUsername = process.env.DB_USERNAME
const dbPassword = process.env.DB_PASSWORD
let commands = []
//
// ==================================== Main Function ====================================
//
/**
 * Async self-calling function that login on server and return a token
 *
 */
async function doLogin () {
  try {
    const response = await fetch(`${dbUrl}/auth/local`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ identifier: dbUsername, password: dbPassword })
    })
    const data = await response.json()
    token = data.jwt
    logger.info('Logged in to database')
    isApiOnline = true

    loadCommands()
  } catch (error) {
    logger.fatal('Error connecting to database')
    logger.error(error)
    isApiOnline = false
  }
}
doLogin()

//
// ================================== Helper Functions ==================================
//
/**
 * Check if the API is online
 *
 * @returns {boolean} true if the API is online
 */
export function isOnline () {
  return isApiOnline
}

/**
 * Get the token
 *
 * @returns {string} token
 */
export function getToken () {
  return token
}

/**
 * Load the commands from the database
 *
 * @returns {object} commands
 */
export async function loadCommands () {
  const groupsQuery = qs.stringify(
    {
      populate: ['name', 'description', 'commands', 'commands.name', 'commands.description', 'commands.alternatives']
    },
    {
      encodeValuesOnly: true // prettify URL
    }
  )
  const responseGroups = await fetch(`${dbUrl}/command-groups?${groupsQuery}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  })
  const groups = await responseGroups.json()

  // Convert translation arrays to objects
  groups.data.forEach(group => {
    const name = {}
    group.name.forEach(nameObj => {
      name[nameObj.lang] = nameObj.value
    })
    group.name = name

    const description = {}
    group.description.forEach(descriptionObj => {
      description[descriptionObj.lang] = descriptionObj.value
    })
    group.description = description

    group.commands.forEach(command => {
      const name = {}
      command.name.forEach(nameObj => {
        name[nameObj.lang] = nameObj.value
      })
      command.name = name

      const description = {}
      command.description.forEach(descriptionObj => {
        description[descriptionObj.lang] = descriptionObj.value
      })
      command.description = description

      command.alternatives = command.alternatives.map(a => a.name)
    })
  })
  commands = groups.data
}

/**
 * Get the commands
 *
 * @returns {object} commands
 */
export function getCommands () {
  return commands
}

/**
 * Find or create a contact on the database
 *
 * @param {import('whatsapp-web.js').Contact} contact
 */
export async function findOrCreateContact (contact) {
  const response = await fetch(`${dbUrl}/contacts/${contact.id._serialized}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      data: {
        name: contact.name,
        number: contact.id.user,
        pushname: contact.pushname,
        isMyContact: contact.isMyContact,
        wid: contact.id._serialized
      }
    })
  })
  const data = await response.json()

  return data
}

/**
 * Find or create a chat on the database
 *
 * @param {import('whatsapp-web.js').Chat} chat
 */
export async function findOrCreateChat (chat) {
  const response = await fetch(`${dbUrl}/chats/${chat.id._serialized}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      data: {
        name: chat.name,
        isGroup: chat.isGroup,
        wid: chat.id._serialized
      }
    })
  })
  const data = await response.json()

  return data
}

/**
 * Create a new action on the database
 * @param Number commandGroupId
 * @param Number commandId
 * @param Number chatId
 * @param Number contactId
 */
export async function createAction (commandGroupId, commandId, chatId, contactId) {
  const response = await fetch(`${dbUrl}/actions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      data: {
        commandGroup: commandGroupId,
        command: commandId,
        chat: chatId,
        contact: contactId
      }
    })
  })
  const data = await response.json()
  return data.data
}

/**
 * Saves an action to the database.
 * @async
 * @function saveActionToDB
 * @param {string} moduleName - The name of the module the function belongs to.
 * @param {string} functionName - The name of the function being executed.
 * @param {object} msg - The message object containing information about the sender and chat.
 * @returns {object} - An object containing information about the saved action.
 */
export async function saveActionToDB (moduleName, functionName, msg) {
  const actions = getCommands()
  const commandGroup = actions.find((group) => group.slug === kebabCase(moduleName))
  if (!commandGroup) return { error: 'Command group not found' }
  const commandGroupID = commandGroup.id
  const command = commandGroup.commands.find((command) => command.slug === kebabCase(functionName))
  if (!command) return { error: 'Command not found' }
  const commandID = command.id
  const contact = await findOrCreateContact(msg.aux.sender)
  const contactID = contact.id
  const chat = await findOrCreateChat(msg.aux.chat)
  const chatID = chat.id

  const action = await createAction(commandGroupID, commandID, chatID, contactID)
  const actionID = action.id

  return { action, actionID, commandGroup, commandGroupID, command, commandID, contact, contactID, chat, chatID }
}
