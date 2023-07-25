/**
 * Sticker creation, modification etc
 * @param {import('whatsapp-web.js').Message} msg
 * @param {import('whatsapp-web.js').Chat} chat
 * @param {import('whatsapp-web.js').Client} client
 * @returns {Object}
 */
export default (msg, chat, client) => {
  return {
    sticker: msg.hasMedia && isMediaStickerCompatible(msg),
    stickerText: msg.body && msg.type === 'chat'
  }
}

//
// ================================ Aux Functions =============================
//
function isMediaStickerCompatible (msg) {
  return msg.type === 'image' || msg.type === 'video' || msg.type === 'sticker'
}
