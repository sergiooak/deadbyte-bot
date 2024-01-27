import logger from '../logger.js'
//
// ================================ Variables =================================
//
const types = {
  conversation: 'chat',
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
  const keysToIgnore = ['messageContextInfo']
  const keys = Object.keys(msg.message)
    .filter(key => !keysToIgnore.includes(key))
  if (keys.length === 0) return types.UNKNOWN
  if (keys.length > 1) {
    logger.warn('Message has more than one key', msg)
  }
  const firstKey = keys[0]
  let incomingType = firstKey

  /**
   * Handle editMessage
   */
  if (incomingType === 'editedMessage') {
    console.log('editedMessage')
  }

  /**
   * Handle viewOnceMessage
   */
  if (incomingType.startsWith('viewOnce')) {
    const keys = Object.keys(msg.message[firstKey].message).filter(key => !keysToIgnore.includes(key))
    if (keys.length) {
      incomingType = keys[0]
      msg.message = msg.message[firstKey].message
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
  const audioType = msg.message.audioMessage.ptt ? 'pttMessage' : 'audioMessage'
  if (audioType === 'pttMessage') return audioType

  // if it is audio, and still can be a forwarded ppt
  if (msg.message.audioMessage.contextInfo?.isForwarded) {
    const hasWaveform = !!msg.message.audioMessage.waveform
    if (hasWaveform) return 'pttMessage'

    const mimetype = msg.message.audioMessage.mimetype
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
