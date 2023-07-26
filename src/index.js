import 'dotenv/config'
import wwebjs from 'whatsapp-web.js'
import fs from 'fs/promises'
import logger from './logger.js'
/**
 * Whatsapp Web Client
 * @type {wwebjs.Client}
 */
const client = new wwebjs.Client({
  authStrategy: new wwebjs.LocalAuth({
    clientId: 'DeadByte'
  }),

  puppeteer: {
    // headless: false,
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe'
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
