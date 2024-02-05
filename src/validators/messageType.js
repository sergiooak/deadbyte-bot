import logger from '../logger.js'
//
// ================================ Variables =================================
//
const types = {
  conversation: 'chat',
  extendedTextMessage: 'chat',
  audioMessage: 'audio',
  pttMessage: 'ptt',
  imageMessage: 'image',
  videoMessage: 'video',
  documentMessage: 'document',
  stickerMessage: 'sticker',
  locationMessage: 'location',
  liveLocationMessage: 'live_location',
  contactMessage: 'vcard',
  contactsArrayMessage: 'multi_vcard',
  orderMessage: 'order',
  REVOKE: 'revoked',
  productMessage: 'product',
  UNKNOWN: 'unknown',
  groupInviteMessage: 'groups_v4_invite',
  listMessage: 'list',
  listResponseMessage: 'list_response',
  buttonsMessage: 'buttons',
  buttonsResponseMessage: 'buttons_response',
  sendPaymentMessage: 'payment',
  requestPaymentMessage: 'payment',
  declinePaymentRequestMessage: 'payment',
  cancelPaymentRequestMessage: 'payment',
  interactiveMessage: 'interactive',
  interactiveResponseMessage: 'interactive_response',
  protocolMessage: 'protocol',
  reactionMessage: 'reaction',
  templateButtonReplyMessage: 'template_button_reply',
  pollCreationMessage: 'poll_creation',
  pollUpdateMessage: 'poll_update',
  editedMessage: 'edited'
}
//
// ================================ Main Functions =================================
//
/**
 * Detect message type using the same pattern as WWebJS
 * @param {import('@whiskeysockets/baileys').proto.IWebMessageInfo} msg
 */
export default (msg) => {
  if (!msg.message) {
    logger.warn('Message has no message', msg)
    return types.UNKNOWN
  }
  const keysToIgnore = ['messageContextInfo']
  const hasKeys = Object.keys(msg).length > 1
  let firstKey = Object.keys(msg)[0]
  let incomingType = firstKey
  if (hasKeys) {
    const keys = Object.keys(msg.message)
      .filter(key => !keysToIgnore.includes(key))
    if (keys.length === 0) return types.UNKNOWN

    firstKey = keys[0]
    incomingType = firstKey

    if (keys.length > 1) {
      // senderKeyDistributionMessage
      if (keys.includes('senderKeyDistributionMessage')) {
        // delete this key and continue from msg.message
        delete msg.message.senderKeyDistributionMessage
        // and make sure that the other key is the FIRST key of msg.message
        const newMessage = {}
        const leftOverKeys = Object.keys(msg.message)
        const keyName = keys[1]
        incomingType = keyName
        newMessage[keyName] = msg.message[keyName]
        leftOverKeys.forEach(key => {
          if (key !== keyName) newMessage[key] = msg.message[key]
        })
        msg.message = newMessage
      } else {
        logger.warn('Message has more than one key', msg)
      }
    }
  }

  while (incomingType === 'ephemeralMessage') {
    msg.message = msg.message[firstKey].message
    firstKey = Object.keys(msg.message)[0]
    if (!firstKey) throw new Error('firstKey is undefined')
    incomingType = firstKey
  }
  // while (incomingType === 'ephemeralMessage') {
  //   const firstInside = msg[]
  // }
  // nometime msg.message comes with layers of "ephemeralMessage"
  // loop digging until it finds something that is not ephemeralMessage
  // if (incomingType === 'ephemeralMessage') {
  //   msg = msg[firstKey].message
  //   console.log(incomingType, msg)
  //   // firstKey = Object.keys(msg)[0]
  //   // incomingType = firstKey
  // }

  /**
   * Handle viewOnceMessage && groupMentionedMessage
   */
  if (
    incomingType.startsWith('viewOnce') ||
    incomingType === 'groupMentionedMessage'
  ) {
    const keys = Object.keys((msg.message ? msg.message : msg)[firstKey].message).filter(key => !keysToIgnore.includes(key))
    if (keys.length) {
      incomingType = keys[0]
      if (msg.message) msg.message = msg.message[firstKey].message
      else msg = msg[firstKey].message
    }
  }

  /**
   * Check if audioMessage is ptt
   */
  if (incomingType === 'audioMessage') {
    incomingType = parseAudioTypes(msg)
  }

  /**
   * Parse protocolMessage
   */
  if (incomingType === 'protocolMessage') {
    incomingType = parseProtocolTypes(msg.message.protocolMessage.type)
  }

  const typeName = types[incomingType] || types.UNKNOWN
  logger.trace('messageType', { incomingType, typeName })
  return { type: typeName, updatedMsg: msg }
}

//
// ================================== Helper Functions ==================================
//
/**
 * Parse audio types
 * @param {import('@whiskeysockets/baileys').proto.IWebMessageInfo} msg
 */
function parseAudioTypes (msg) {
  const audioType = (msg.message ? msg.message : msg).audioMessage.ptt ? 'pttMessage' : 'audioMessage'
  if (audioType === 'pttMessage') return audioType

  // if it is audio, and still can be a forwarded ppt
  if ((msg.message ? msg.message : msg).audioMessage.contextInfo?.isForwarded) {
    const hasWaveform = !!(msg.message ? msg.message : msg).audioMessage.waveform
    if (hasWaveform) return 'pttMessage'

    const mimetype = (msg.message ? msg.message : msg).audioMessage.mimetype
    const isOpus = mimetype === 'audio/ogg; codecs=opus'
    if (isOpus) return 'pttMessage'
  }

  return audioType
}

/**
 * Parse protocol types
 * @param {number} type
 */
function parseProtocolTypes (type) {
  const types = {
    0: 'REVOKE',
    3: 'EPHEMERAL_SETTING',
    4: 'EPHEMERAL_SYNC_RESPONSE',
    5: 'HISTORY_SYNC_NOTIFICATION',
    6: 'APP_STATE_SYNC_KEY_SHARE',
    7: 'APP_STATE_SYNC_KEY_REQUEST',
    8: 'MSG_FANOUT_BACKFILL_REQUEST',
    9: 'INITIAL_SECURITY_NOTIFICATION_SETTING_SYNC',
    10: 'APP_STATE_FATAL_EXCEPTION_NOTIFICATION',
    11: 'SHARE_PHONE_NUMBER',
    14: 'MESSAGE_EDIT',
    16: 'PEER_DATA_OPERATION_REQUEST_MESSAGE',
    17: 'PEER_DATA_OPERATION_REQUEST_RESPONSE_MESSAGE',
    18: 'REQUEST_WELCOME_MESSAGE',
    19: 'BOT_FEEDBACK_MESSAGE',
    20: 'MEDIA_NOTIFY_MESSAGE'
  }
  return types[type] || 'protocolMessage'
}
