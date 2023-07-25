import 'dotenv/config'
import wwebjs from 'whatsapp-web.js'
import fs from 'fs/promises'
/**
 * Whatsapp Web Client
 * @type {wwebjs.Client}
 */
const client = new wwebjs.Client({
  authStrategy: new wwebjs.LocalAuth({
    clientId: 'DeadByte'
  }),

  puppeteer: {
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe'
    // headless: false,
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
