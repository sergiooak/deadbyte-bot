import { getSocket } from '../index.js'
//
// ================================ Variables =================================
//
let sock = null
//
// ================================ Main Functions =================================
//
/**
 * Inject functions into the message object to be drop in replacement for wwebjs
 * @param {import('@whiskeysockets/baileys').proto.IWebMessageInfo} msg
 */
export default (msg) => {
  sock = getSocket()
  msg.react = react
  return msg
}

//
// ================================== Helper Functions ==================================
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
      text: reaction,
      key: msg.key
    }
  })
}
