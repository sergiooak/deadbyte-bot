import 'dotenv/config'

import { defineCommand, runMain } from 'citty'
import { apiKey } from './config/api.js'
import { snakeCase } from 'change-case'
import wwebjs from 'whatsapp-web.js'
import bot from './config/bot.js'
import logger from './logger.js'
import fs from 'fs/promises'
import './db.js'

let globalArgs = {}

const main = defineCommand({
  meta: {
    name: 'deadbyte',
    version: '3.0.0',
    description: 'DeadByte - Bot de Figurinhas para Whatsapp'
  },
  args: {
    name: {
      type: 'positional',
      description: 'Bot name unique per session'
    },
    stickerOnly: {
      type: 'boolean',
      description: 'Deactivate all commands and only listen to stickers'
    },
    showBrowser: {
      type: 'boolean',
      description: 'Deactivate headless mode and show the browser'
    },
    dummy: {
      type: 'boolean',
      description: 'Do not reply to messages'
    }
  },
  run ({ args }) {
    globalArgs = args
    bot.name = args.name
    logger.info(`Starting bot "${args.name}"`)
    bot.headless = !args.showBrowser ? 'new' : false
    logger.info(`Headless mode: ${bot.headless ? 'on' : 'off'}`)
    bot.stickerOnly = args.stickerOnly
    logger.info(`Sticker only mode: ${bot.stickerOnly ? 'on' : 'off'}`)
    bot.dummy = args.dummy
    logger.info(`Dummy mode: ${bot.dummy ? 'on' : 'off'}`)

    loadEvents()
  }
})

runMain(main)

/**
 * Grabs CLI args
 * @returns {object}
 */
export function getArgs () {
  return globalArgs
}

/**
 * Whatsapp Web Client
 * @type {wwebjs.Client}
 */
let client = null

/**
 * Grabs Whatsapp Web Client
 * @returns {wwebjs.Client}
 */
export function getClient () {
  return client
}

async function loadEvents () {
  logger.info('Loading events...', bot)
  client = new wwebjs.Client({
    authStrategy: new wwebjs.LocalAuth({
      clientId: bot.name
    }),

    puppeteer: {
      headless: bot.headless,
      executablePath: bot.chromePath,
      args: [
        '--lang=pt-BR,pt',
        '--autoplay-policy=user-gesture-required',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-breakpad',
        '--disable-client-side-phishing-detection',
        '--disable-component-update',
        '--disable-default-apps',
        '--disable-dev-shm-usage',
        '--disable-domain-reliability',
        '--disable-extensions',
        '--disable-features=AudioServiceOutOfProcess',
        '--disable-hang-monitor',
        '--disable-ipc-flooding-protection',
        '--disable-notifications',
        '--disable-offer-store-unmasked-wallet-cards',
        '--disable-popup-blocking',
        '--disable-print-preview',
        '--disable-prompt-on-repost',
        '--disable-renderer-backgrounding',
        '--disable-setuid-sandbox',
        '--disable-speech-api',
        '--disable-sync',
        '--hide-scrollbars',
        '--ignore-gpu-blacklist',
        '--metrics-recording-only',
        '--no-default-browser-check',
        '--no-first-run',
        '--no-pings',
        '--no-sandbox',
        '--no-zygote',
        '--password-store=basic',
        '--use-gl=swiftshader',
        '--use-mock-keychain',
        '--disable-web-security',
        '--disable-accelerated-2d-canvas',
        '--disable-accelerated-jpeg-decoding',
        '--disable-features=Translate',
        '--disable-features=site-per-process',
        '--disable-features=IsolateOrigins',
        '--disable-site-isolation-trials',
        '--disable-software-rasterizer'
      ]
    }
  })
  const events = await fs.readdir('./src/services/events')
  // if not in dummy mode, load all events
  if (!bot.dummy) {
    events.forEach(async event => {
      const eventModule = await import(`./services/events/${event}`)
      const eventName = snakeCase(event.split('.')[0])
      logger.info(`Loading event ${eventName} from file ${event}`)
      client.on(eventName, eventModule.default)
    })
  }
  client.initialize()
  logger.info('Client initialized!')

  // if no API KEY, kill the process
  if (!apiKey) {
    logger.fatal('API_KEY not found! Grab one at https://api.deadbyte.com.br')
    process.exit(1)
  }
}

// clear terminal
process.stdout.write('\x1B[2J\x1B[0f')

// catch unhandled rejections and errors to avoid crashing
process.on('unhandledRejection', (err) => {
  logger.fatal(err)
})
process.on('uncaughtException', (err) => {
  logger.fatal(err)
})
