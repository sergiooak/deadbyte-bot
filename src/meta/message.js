import messageTypeValidator from '../validators/messageType.js'
import spintax from '../utils/spintax.js'
import { getSocket } from '../index.js'
import fetch from 'node-fetch'
import logger from '../logger.js'
import relativeTime from 'dayjs/plugin/relativeTime.js'
import 'dayjs/locale/pt-br.js'
import dayjs from 'dayjs'

//
// ================================ Variables =================================
//
dayjs.locale('pt-br')
dayjs.extend(relativeTime)
/**
 * Socket instance
 * @type {import('@whiskeysockets/baileys').Baileys}
 */
let sock = null
//
// ================================ Main Functions =================================
//
/**
 * Inject functions into the message object to be drop in replacement for wwebjs
 * @param {import('@whiskeysockets/baileys').proto.IWebMessageInfo} msg
 */
const processMessage = (msg) => {
  if (!msg?.message) return false
  const { type, updatedMsg } = messageTypeValidator(msg)
  msg = updatedMsg

  sock = getSocket()

  const newMsgObject = {}

  const firstKey = Object.keys(msg.message)[0]
  const firstItem = msg.message[firstKey]

  const quotedDeep = structuredClone(msg)
  quotedDeep.message = firstItem.contextInfo?.quotedMessage

  const body = typeof firstItem === 'string'
    ? firstItem
    : firstItem.caption || firstItem.text || ''

  const properties = {
    id: msg.key.id,
    type,
    duration: firstItem.seconds,
    from: msg.key.remoteJid,
    fromMe: msg.key.fromMe,
    body,
    // ack: undefined,
    author: undefined,
    broadcast: msg.broadcast,
    // deviceType: undefined,
    fowardScore: firstItem.contextInfo?.forwardingScore,
    isForwarded: firstItem.contextInfo?.isForwarded,
    hasMedia: !!firstItem.mediaKey,
    mediaKey: firstItem.mediaKey,
    hasQuotedMsg: !!firstItem.contextInfo?.quotedMessage,
    quotedMsg: firstItem.contextInfo?.quotedMessage, // TODO: Fix this
    // hasReaction: undefined,
    inviteV4: type === 'groups_v4_invite' ? firstItem : undefined,
    isEphemeral: !!firstItem.contextInfo?.expiration,
    isGif: !!firstItem.gifPlayback,
    // isStarred: undefined,
    // isStatus: undefined,
    links: extractLinks(body),
    location: ['location', 'live_location'].includes(type)
      ? firstItem
      : undefined,
    mentionedIds: firstItem.contextInfo?.mentionedJid,
    mentionedGroups: firstItem.contextInfo?.groupMentions,
    // orderId: undefined,
    // timestamp: msg.messageTimestamp,
    timestamp: typeof msg.messageTimestamp === 'number'
      ? msg.messageTimestamp
      : msg.messageTimestamp.toInt(),
    timestampIso: dayjs(msg.messageTimestamp * 1000).toISOString(),
    // lag is the difference between local time and the time of the sender in ms
    // using dayjs to convert
    lag: dayjs().diff(dayjs(msg.messageTimestamp * 1000), 'ms'),
    // to: msg.key.fromMe ? msg.key.remoteJid : botId,
    vCards: type === 'multi_vcard' ? firstItem.contacts : type === 'vcard' ? [firstItem] : undefined,
    raw: structuredClone(msg),
    client: sock
  }

  for (const property in properties) {
    newMsgObject[property] = properties[property]
  }

  const methods = {
    react,
    reply,
    sendSeen
  }

  for (const method in methods) {
    newMsgObject[method] = methods[method].bind(msg)
  }

  // remove undefined properties
  for (const property in newMsgObject) {
    if (newMsgObject[property] === undefined) delete newMsgObject[property]
  }

  logger.trace('newMsgObject', newMsgObject)
  return newMsgObject
}

export default processMessage

//
// ================================== Methods ==================================
//
/**
 * React to this message with an emoji
 * @param {string} reaction Emoji to react with. Send an empty string to remove the reaction.
 * @returns {Promise<void>}
 */
async function react (reaction) {
  /**
   * Message object itself
   * @type {import('@whiskeysockets/baileys').proto.WebMessageInfo}
   */
  const msg = this
  await sock.sendMessage(msg.key.remoteJid, {
    react: {
      text: spintax(reaction),
      key: msg.key
    }
  })
}

/**
 * Sends a message as a reply to this message. If chatId is specified, it will be sent through the specified Chat. If not, it will send the message in the same Chat as the original message was sent.
 * @param {string} content The message to send
 * @param {string} [chatId] The chat to send the message in
 * @param {import('@whiskeysockets/baileys').proto.IMessageOptions} [options] Additional options
 * @returns {Promise<void>}
 */
async function reply (content, chatId, options) {
  // TODO: Add better support for media messages
  /**
   * Message object itself
   * @type {import('@whiskeysockets/baileys').proto.WebMessageInfo}
   */
  const msg = this
  await sock.sendMessage(chatId || msg.key.remoteJid, {
    text: spintax(content)
  }, {
    quoted: msg
  })
}

/**
 * Marks this message as seen
 * @returns {Promise<void>}
 */
async function sendSeen () {
  /**
   * Message object itself
   * @type {import('@whiskeysockets/baileys').proto.WebMessageInfo}
   */
  const msg = this
  await sock.readMessages([msg.key])
}
//
// ================================== Helper Functions ==================================
//
/**
 * Extracts valid links from a string
 * @param {string} string String to extract links from
 * @returns {{link: string, isSuspicious: boolean, isValid: Promise<boolean>}[]}
 */
function extractLinks (string) {
  const regex = /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g

  const links = string.match(regex)

  const responseArray = []

  if (links) {
    for (const link of links) {
      if (link.includes('@')) continue
      // regex with suspicious characters for a url
      const suspiciousCharacters = /[<>{}|\\^~\[\]`]/g
      const isSuspicious = suspiciousCharacters.test(link)

      const isValid = new Promise((resolve, reject) => {
        setTimeout(() => {
          fetch('https://' + link, {
            method: 'HEAD'
          })
            .then(res => resolve(res.ok))
            .catch(error => {
              logger.trace('extractLinks ERROR', { error })
              resolve(false)
            })
        }, 2000)
      })

      responseArray.push({
        link,
        isSuspicious,
        isValid
      })
    }
  }

  if (!responseArray.length) return undefined
  return responseArray
}
