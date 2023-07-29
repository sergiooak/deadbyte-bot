/**
 * Sticker creation, modification etc
 * @param {import('whatsapp-web.js').Message} msg
 * @param {object} aux
 * @returns {Object}
 */
export default (msg, aux) => {
  return {
    sticker: /^(s|sticker|f|fig)$/.test(aux.function) && isMediaStickerCompatible(msg),
    removeBg: /^(bg|fundo|nobg)$/.test(aux.function),
    stickerText: /^(ttp|ttp1|s|sticker|f|fig)$/.test(aux.function) && msg.type === 'chat',
  }
}

//
// ================================ Aux Functions =============================
//
function isMediaStickerCompatible (msg) {
  return msg.type === 'image' || msg.type === 'video' || msg.type === 'sticker'
}
