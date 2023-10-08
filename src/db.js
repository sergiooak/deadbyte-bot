import fetch from 'node-fetch'
import logger from './logger.js'
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
