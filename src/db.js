import { kebabCase } from 'change-case'
import logger from './logger.js'
import fetch from 'node-fetch'
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
 * @returns {boolean} true if the API is online
 */
export function isOnline () {
  return isApiOnline
}

/**
 * Get the token
 * @returns {string} token
 */
export function getToken () {
  return token
}

/**
 * Get the Database URL
 * @returns {string} dbUrl
 */
export function getDBUrl () {
  return dbUrl
}

/**
 * Load the commands from the database
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
  const id = contact.id.replace('@s.whatsapp.net', '@c.us')

  // 1 - Check if contact is on the cache
  if (contactsCache[id]) {
    contactsCache[id].lastSeen = new Date()
    return contactsCache[id]
  }

  // 2 - If not, fetch from the database
  const response = await fetch(`${dbUrl}/contacts/${id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      data: {
        number: id.split('@')[0],
        pushname: contact.pushname,
        wid: id
      }
    })
  })
  const data = await response.json()

  // 3 - Save on the cache
  contactsCache[id] = data
  contactsCache[id].lastSeen = new Date()
  return contactsCache[id]
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
 */
export async function findOrCreateChat (msg) {
  // 1 - Check if chat.id._serialized is on the cache
  const id = msg.isGroup
    ? msg.aux.group.id
    : msg.contact.id.replace('@s.whatsapp.net', '@c.us')

  if (chatsCache[id]) {
    chatsCache[id].lastSeen = new Date()
    return chatsCache[id]
  }

  // 2 - If not, fetch from the database
  const response = await fetch(`${dbUrl}/chats/${id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      data: {
        name: msg.isGroup ? msg.aux.group.subject : msg.pushname,
        isGroup: msg.isGroup,
        wid: id
      }
    })
  })
  const data = await response.json()

  // 3 - Save on the cache
  chatsCache[id] = data
  chatsCache[id].lastSeen = new Date()

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
  const commandGroupID = commandGroup?.id
  const command = commandGroup.commands.find((command) => command.slug === kebabCase(functionName))
  const commandID = command?.id
  const contact = await findOrCreateContact(msg.contact)
  const contactID = contact.id
  const chat = await findOrCreateChat(msg)
  const chatID = chat.id
  const action = createAction(commandGroupID, commandID, chatID, contactID)
  try {
    return { action, commandGroup, commandGroupID, command, commandID, contact, contactID, chat, chatID }
  } catch (error) {
    logger.error('Error saving action to database', error)
    logger.error('Action:', action)
  }
}

export async function findCurrentBot (socket) {
  if (!socket.user) { // TODO: auto-restart
    logger.warn('Bot never connected before')
    logger.warn('Remember to restart after reading the QR code')
    return
  }
  const id = socket.user.id.split(':')[0] + '@c.us'
  // 1 - Check if bot already exists on db
  const findQuery = qs.stringify(
    {
      filters: {
        wid: {
          $eq: id
        }
      }
    },
    {
      encodeValuesOnly: true // prettify URL
    }
  )
  while (!token) { // wait token to be populated
    await new Promise(resolve => setTimeout(resolve, 100))
  }
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
        wid: id,
        pushname: socket.user.name
      }
    })
  })

  const { data: createData } = await create.json()
  bot = createData.id
}
