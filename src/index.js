import 'dotenv/config'

import importFresh from './utils/importFresh.js'
import * as baileys from '@whiskeysockets/baileys'
import { defineCommand, runMain } from 'citty'
import { apiKey } from './config/api.js'
import { dotCase } from 'change-case'
import NodeCache from 'node-cache'
import bot from './config/bot.js'
import logger from './logger.js'
import * as db from './db.js'
import fs from 'fs/promises'
import pino from 'pino'
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
    sticker: {
      type: 'boolean',
      description: 'Deactivate all commands and only listen to stickers'
    },
    'no-store': {
      type: 'boolean',
      description: 'Do not store session data'
    },
    'no-reply': {
      type: 'boolean',
      description: 'Do not reply to messages'
    },
    'use-pairing-code': {
      type: 'boolean',
      description: 'Use pairing code instead of QR code'
    },
    mobile: {
      type: 'boolean',
      description: 'Use mobile user agent'
    }
  },
  run ({ args }) {
    globalArgs = args
    bot.name = args.name
    logger.info(`Starting bot "${args.name}"`)
    bot.useStore = !args['no-store']
    logger.info(`Store mode: ${bot.useStore ? 'on' : 'off'}`)
    bot.doReplies = !args['no-reply']
    logger.info(`Reply messages: ${bot.doReplies ? 'on' : 'off'}`)

    bot.usePairingCode = args['use-pairing-code']
    bot.useMobile = args.mobile
    bot.mode = 'qr'
    if (bot.usePairingCode) bot.mode = 'pairing'
    if (bot.useMobile) bot.mode = 'mobile'
    logger.info(`Mode: ${bot.mode}`)

    bot.stickerOnly = args.stickerOnly
    logger.info(`Sticker only mode: ${bot.stickerOnly ? 'on' : 'off'}`)

    const store = bot.useStore
      ? baileys.makeInMemoryStore({ logger: pino().child({ level: 'fatal', stream: 'store' }) })
      : undefined

    const storePath = `./src/temp/${bot.name}.json`
    store.readFromFile(storePath)
    // save every 10s
    setInterval(() => {
      store.writeToFile(storePath)
    }, 10_000)

    connectToWhatsApp()
  }
})

export const store = undefined
runMain(main)

/**
 * Grabs CLI args
 * @returns {object}
 */
export function getArgs () {
  return globalArgs
}

/**
 * Grabs the socket
 * @returns {import('./types').WSocket}
*/
export function getSocket () {
  return socket
}
let socket = null

// external map to store retry counts of messages when decryption/encryption fails
// keep this out of the socket itself, so as to prevent a message decryption/encryption loop across socket restarts
const msgRetryCounterCache = new NodeCache()

export async function connectToWhatsApp () {
  // if no API KEY, kill the process
  if (!apiKey) {
    logger.fatal('API_KEY not found! Grab one at https://api.deadbyte.com.br')
    process.exit(1)
  }

  logger.info('Connecting to WhatsApp...')

  const { state, saveCreds } = await baileys.useMultiFileAuthState(`./src/temp/${bot.name}`)
  const { version, isLatest } = await baileys.fetchLatestBaileysVersion()
  logger.info(`Baileys version: v${version.join('.')} (latest: ${isLatest})`)

  socket = baileys.makeWASocket({
    version,
    logger: pino({ level: 'fatal' }),
    printQRInTerminal: true,
    auth: {
      creds: state.creds,
      keys: baileys.makeCacheableSignalKeyStore(state.keys, logger)
    },
    msgRetryCounterCache,
    markOnlineOnConnect: true,
    browser: ['DeadByte', 'Safari', '3.0'],
    generateHighQualityLinkPreview: true,
    shouldIgnoreJid: jid => baileys.isJidBroadcast(jid), // TODO: make a stories downloader,
    getMessage
  })

  store?.bind(socket.ev)

  logger.info('Loading events...', bot)

  const events = await fs.readdir('./src/services/events')
  events.forEach(async event => {
    if (!bot.doReplies) {
      const ignoreEvents = ['call.js', 'messagesUpsert.js']
      if (ignoreEvents.includes(event)) return
    }
    const eventPath = `services/events/${event}`
    const eventName = dotCase(event.split('.')[0])
    logger.trace(`Loading event ${eventName} from file ${event}`)
    socket.ev.on(eventName, async (event) => {
      const module = await importFresh(eventPath)
      module.default(event)
    })
  })
  socket.ev.on('creds.update', saveCreds)
  socket.ev.on('messaging-history.set', async (history) => {
    const { chats, contacts, messages, isLatest } = history
    logger.info(`Loaded ${chats.length} chats, ${contacts.length} contacts and ${messages.length} messages (latest: ${isLatest})`)
  })

  logger.info('Client initialized!')
  await db.findCurrentBot(socket) // find the current bot on the database
  return socket
}

/**
 * Retrieves a message from the store based on the provided key.
 * @param {import('@whiskeysockets/baileys').WAMessageKey} key - The key of the message to retrieve.
 * @returns {Promise<import('@whiskeysockets/baileys').WAMessageContent | undefined>} The retrieved message content, or undefined if not found.
 */
export async function getMessage (key) {
  if (store) {
    const msg = await store.loadMessage(key.remoteJid, key.id)
    return msg?.message || undefined
  }

  // only if store is present
  return baileys.proto.Message.fromObject({})
}

// clear terminal
process.stdout.write('\x1B[2J\x1B[0f')

// catch unhandled rejections and errors to avoid crashing
process.on('unhandledRejection', (err) => {
  // Connection Closed try connectToWhatsApp
  if (err.message.includes('Connection Closed')) {
    logger.fatal('Connection Closed AAAAAAAAAAA')
    console.error(err)
    process.exit(0) // kill the process and pm2 will restart it
  } else {
    logger.fatal(err)
  }
})
