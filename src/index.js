import 'dotenv/config'
import wwebjs from 'whatsapp-web.js'
import fs from 'fs/promises'
import logger from './logger.js'
import { apiKey } from './config/api.js'
import bot from './config/bot.js'

/**
 * Whatsapp Web Client
 * @type {wwebjs.Client}
 */
const client = new wwebjs.Client({
  authStrategy: new wwebjs.LocalAuth({
    clientId: bot.name
  }),

  puppeteer: {
    // headless: false,
    executablePath: bot.chromePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
})

/**
 * Grabs Whatsapp Web Client
 * @returns {wwebjs.Client}
 */
export function getClient () {
  return client
}

// Auto load events
(async () => {
  const events = await fs.readdir('./src/services/events')
  events.forEach(async event => {
    const eventModule = await import(`./services/events/${event}`)
    client.on(event.split('.')[0], eventModule.default)
  })
  client.initialize()
  logger.info('Client initialized!')

  // if no API KEY, kill the process
  if (!apiKey) {
    logger.fatal('API_KEY not found! Grab one at https://api.deadbyte.com.br')
    process.exit(1)
  }
})()

// clear terminal
process.stdout.write('\x1B[2J\x1B[0f')

// catch unhandled rejections and errors to avoid crashing
process.on('unhandledRejection', (err) => {
  logger.fatal(err)
})
process.on('uncaughtException', (err) => {
  logger.fatal(err)
})
