import fetch from 'node-fetch'
import logger from './logger.js'
import { kebabCase } from 'change-case'
import qs from 'qs'
//
// ===================================== Variables ======================================
//

let isApiOnline = false
let token = null
let bot = null
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
    group.commands.forEach(command => {
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
  loadCommands() // reload commands but don't wait for it
  // the return is the already loaded commands
  return commands
}

/**
 * Get the database url
 * @returns {string} dbUrl
 */
export function getDBUrl () {
  return dbUrl
}

/**
 * Get the bot id
 * @returns {string} bot
 */
export function getBot () {
  return bot
}

/**
 * Find or create a contact on the database
 *
 * @param {import('whatsapp-web.js').Contact} contact
 */
export async function findOrCreateContact (contact) {
  // 1 - Check if contact.id._serialized is on the cache
  if (contactsCache[contact.id._serialized]) {
    contactsCache[contact.id._serialized].lastSeen = new Date()
    return contactsCache[contact.id._serialized]
  }

  // 2 - If not, fetch from the database
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

  // 3 - Save on the cache
  contactsCache[contact.id._serialized] = data
  contactsCache[contact.id._serialized].lastSeen = new Date()
  return contactsCache[contact.id._serialized]
}

// mini cache system for contacts, every minute filter out the contacts that haven't been seen in the last 5 minutes
const contactsCache = {}
setInterval(() => {
  const now = new Date()
  Object.keys(contactsCache).forEach(key => {
    if (now - contactsCache[key].lastSeen > 300000) {
      delete contactsCache[key]
    }
  })
}, 60_000)

/**
 * Find or create a chat on the database
 *
 * @param {import('whatsapp-web.js').Chat} chat
 */
export async function findOrCreateChat (chat) {
  // 1 - Check if chat.id._serialized is on the cache
  if (chatsCache[chat.id._serialized]) {
    chatsCache[chat.id._serialized].lastSeen = new Date()
    return chatsCache[chat.id._serialized]
  }

  // 2 - If not, fetch from the database
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

  // 3 - Save on the cache
  chatsCache[chat.id._serialized] = data
  chatsCache[chat.id._serialized].lastSeen = new Date()

  return data
}

// mini cache system for chats, every minute filter out the chats that haven't been seen in the last 5 minutes
const chatsCache = {}
setInterval(() => {
  const now = new Date()
  Object.keys(chatsCache).forEach(key => {
    if (now - chatsCache[key].lastSeen > 300000) {
      delete chatsCache[key]
    }
  })
}, 60_000)

/**
 * Create a new action on the database
 * @param Number commandGroupId
 * @param Number commandId
 * @param Number chatId
 * @param Number contactId
 */
export async function createAction (commandGroupId, commandId, chatId, contactId) {
  // eslint-disable-next-line no-unmodified-loop-condition
  while (!bot) { // wait bot to be populated
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  const query = qs.stringify(
    {
      populate: '*'
    },
    {
      encodeValuesOnly: true
    }
  )
  const response = await fetch(`${dbUrl}/actions?${query}`, {
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
        contact: contactId,
        bot: bot || undefined
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

  try {
    const actionID = action.id
    return { action, actionID, commandGroup, commandGroupID, command, commandID, contact, contactID, chat, chatID }
  } catch (error) {
    console.log(error)
    console.log(action)
  }
}

export async function findCurrentBot (client) {
  // 1 - Check if bot already exists on db

  const findQuery = qs.stringify(
    {
      filters: {
        wid: {
          $eq: client.info.wid._serialized
        }
      }
    },
    {
      encodeValuesOnly: true // prettify URL
    }
  )
  const find = await fetch(`${dbUrl}/bots?${findQuery}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  })

  const { data: findData } = await find.json()

  if (findData.length) {
    bot = findData[0].id
    return
  }

  // 2 - If not, create it

  const create = await fetch(`${dbUrl}/bots`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      data: {
        wid: client.info.wid._serialized,
        pushname: client.info.pushname,
        platform: client.info.platform
      }
    })
  })
  const { data: createData } = await create.json()
  bot = createData.id
}
