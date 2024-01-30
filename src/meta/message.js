import { downloadContentFromMessage } from '@whiskeysockets/baileys'
import messageTypeValidator from '../validators/messageType.js'
import relativeTime from 'dayjs/plugin/relativeTime.js'
import { MessageMedia } from './messageMedia.js'
import spintax from '../utils/spintax.js'
import { getSocket } from '../index.js'
import logger from '../logger.js'
import fetch from 'node-fetch'
import 'dayjs/locale/pt-br.js'
import fs from 'fs/promises'
import dayjs from 'dayjs'

//
// ================================ Variables =================================
//
dayjs.locale('pt-br')
dayjs.extend(relativeTime)

const socket = getSocket()
//
// ================================ Main Functions =================================
//
/**
 * Inject functions into the message object to be drop in replacement for wwebjs
 * @param {import('@whiskeysockets/baileys').proto.IWebMessageInfo} msg
 */
const serializeMessage = (msg) => {
  msg.raw = structuredClone(msg)
  const newMsgObject = {}
  const { type } = messageTypeValidator(msg)

  newMsgObject.type = type
  try {
    const berak = Object.keys(msg.message)[0]
    newMsgObject.originalType = berak
  } catch {
    newMsgObject.originalType = null
  }

  const firstItem = msg.message[newMsgObject.originalType]
  newMsgObject.body = typeof firstItem === 'string'
    ? firstItem
    : firstItem.caption || firstItem.text || ''

  newMsgObject.hasQuotedMsg = false
  newMsgObject.quotedMsg = firstItem.contextInfo?.quotedMessage?.ephemeralMessage
    ? firstItem.contextInfo.quotedMessage.ephemeralMessage.message
    : firstItem.contextInfo?.quotedMessage

  if (newMsgObject.quotedMsg) {
    newMsgObject.hasQuotedMsg = true
    newMsgObject.quotedMsg.type = Object.keys(newMsgObject.quotedMsg)[0]
    const firstItem = newMsgObject.quotedMsg[newMsgObject.quotedMsg.type]
    newMsgObject.quotedMsg.body = typeof firstItem === 'string'
      ? firstItem
      : firstItem.caption || firstItem.text || ''
    newMsgObject.quotedMsg.sender = msg.message[msg.originalType].contextInfo.participant
    newMsgObject.quotedMsg.fromMe = msg.quotedMsg.sender === socket.user.id.split(':')[0] + '@s.whatsapp.net'
    const ane = msg.quotedMsg
    newMsgObject.quotedMsg.chats = (ane.type === 'conversation' && ane.conversation) ? ane.conversation : (ane.type === 'imageMessage') && ane.imageMessage.caption ? ane.imageMessage.caption : (ane.type === 'documentMessage') && ane.documentMessage.caption ? ane.documentMessage.caption : (ane.type === 'videoMessage') && ane.videoMessage.caption ? ane.videoMessage.caption : (ane.type === 'extendedTextMessage') && ane.extendedTextMessage.text ? ane.extendedTextMessage.text : (ane.type === 'buttonsMessage') && ane.buttonsMessage.contentText ? ane.buttonsMessage.contentText : ''
    msg.quotedMsg.id = msg.message[msg.originalType].contextInfo.stanzaId
  }

  try {
    const mention = msg.message[msg.originalType].contextInfo.mentionedJid
    newMsgObject.mentioned = mention
  } catch {
    newMsgObject.mentioned = []
  }

  newMsgObject.isGroup = msg.key.remoteJid.endsWith('@g.us')
  if (newMsgObject.isGroup) {
    newMsgObject.sender = msg.participant
  } else {
    newMsgObject.sender = msg.key.remoteJid
  }
  if (msg.key.fromMe) {
    newMsgObject.sender = socket.user.id.split(':')[0] + '@s.whatsapp.net'
  }

  newMsgObject.isBaileys = msg.key.id.startsWith('BAE5') || msg.key.id.startsWith('3EB0')

  const properties = {
    id: msg.key.id,
    pushname: msg.pushName,
    contact: {
      id: newMsgObject.sender || msg.key.participant,
      pushname: msg.pushName
    },
    author: newMsgObject.isGroup ? msg.key.participant : undefined,
    duration: firstItem.seconds,
    from: msg.key.remoteJid,
    fromMe: msg.key.fromMe,
    // ack: undefined,
    broadcast: msg.broadcast,
    bot: socket.user,
    // deviceType: undefined,
    fowardScore: firstItem.contextInfo?.forwardingScore,
    isForwarded: firstItem.contextInfo?.isForwarded,
    hasMedia: !!firstItem.mediaKey,
    mediaKey: firstItem.mediaKey,
    // hasReaction: undefined,
    inviteV4: type === 'groups_v4_invite' ? firstItem : undefined,
    isEphemeral: !!firstItem.contextInfo?.expiration,
    isGif: !!firstItem.gifPlayback,
    // isStarred: undefined,
    // isStatus: undefined,
    links: extractLinks(newMsgObject.body),
    location: ['location', 'live_location'].includes(type)
      ? firstItem
      : undefined,
    mentionedIds: firstItem.contextInfo?.mentionedJid,
    mentionedGroups: firstItem.contextInfo?.groupMentions,
    // orderId: undefined,
    startedAt: Date.now(),
    timestamp: typeof msg.messageTimestamp === 'number'
      ? msg.messageTimestamp
      : msg.messageTimestamp.toInt(),
    timestampIso: dayjs(msg.messageTimestamp * 1000).toISOString(),
    // lag is the difference between local time and the time of the sender in ms
    // using dayjs to convert
    lag: dayjs().diff(dayjs(msg.messageTimestamp * 1000), 'second'),
    // to: msg.key.fromMe ? msg.key.remoteJid : botId,
    vCards: type === 'multi_vcard' ? firstItem.contacts : type === 'vcard' ? [firstItem] : undefined
  }

  for (const property in properties) {
    newMsgObject[property] = properties[property]
  }

  const methods = {
    react,
    reply,
    sendSeen,
    downloadMedia
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

export default serializeMessage

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
  await socket.sendMessage(msg.key.remoteJid, {
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
  const mode = typeof content === 'string' ? 'text' : 'media'
  let messageObject = {}
  let tempPath = ''
  if (mode === 'text') messageObject.text = spintax(content)
  if (mode === 'media') {
    messageObject = content

    if (messageObject.caption) {
      messageObject.caption = spintax(messageObject.caption)
    }

    if (messageObject.media) {
      const media = messageObject.media
      delete messageObject.media

      tempPath = `./src/temp/${media.filename}`
      await fs.writeFile(tempPath, media.data, 'base64')

      let type = 'document'
      if (media.mimetype.split('/')[0] === 'image') type = 'image'
      if (media.mimetype.split('/')[0] === 'video') type = 'video'
      if (media.mimetype.split('/')[0] === 'audio') type = 'audio'

      if (type === 'image' && media.mimetype === 'image/webp') {
        // if is a webp iamge send as documment
        type = 'document'
      }

      messageObject[type] = { url: tempPath }
      messageObject.mimetype = media.mimetype
      messageObject.fileName = media.filename
    }
  }
  /**
   * Message object itself
   * @type {import('@whiskeysockets/baileys').proto.WebMessageInfo}
   */
  const msg = this

  const firstKey = Object.keys(msg.message)[0]
  const firstItem = msg.message[firstKey]
  const isEphemeral = !!firstItem.contextInfo?.expiration

  await socket.sendMessage(chatId || msg.key.remoteJid, messageObject, {
    quoted: msg,
    ephemeralExpiration: isEphemeral ? firstItem.contextInfo?.expiration : undefined
  })
  if (tempPath) await fs.unlink(tempPath)
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
  await socket.readMessages([msg.key])
}

/**
 * Downloads the media of this message
 * @returns {Promise<void>}
 */
async function downloadMedia (quoted = false) {
  /**
   * Message object itself
   * @type {import('@whiskeysockets/baileys').proto.WebMessageInfo}
   */
  const msg = this
  const firstKey = Object.keys(msg.message)[0]
  const firstItem = msg.message[firstKey]
  const firstKeyFromQuoted = quoted ? Object.keys(firstItem.contextInfo.quotedMessage)[0] : undefined
  const firstItemFromQuoted = quoted ? firstItem.contextInfo.quotedMessage[firstKeyFromQuoted] : undefined
  const downloadType = quoted
    ? firstKeyFromQuoted.replace('Message', '')
    : firstKey.replace('Message', '')

  try {
    const stream = await downloadContentFromMessage(!quoted ? firstItem : firstItemFromQuoted, downloadType)
    let buffer = Buffer.from([])
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk])
    }

    // const buffer = await downloadMediaMessage(msg, 'buffer', {}, {
    //   logger,
    //   reuploadRequest: sock.updateMediaMessage
    // })
    const media = await MessageMedia.fromBuffer(buffer)
    const metadataSource = quoted ? firstItemFromQuoted : firstItem
    media.metadata = {
      width: metadataSource.width,
      height: metadataSource.height,
      ratio: metadataSource.width / metadataSource.height,
      duration: metadataSource.seconds
    }
    return media
  } catch (error) {
    logger.error('downloadMedia ERROR', { error })
    throw error
  }
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
