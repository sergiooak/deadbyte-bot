/**
 * Sticker creation, modification etc
 * @param {import('whatsapp-web.js').Message} msg
 * @param {object} aux
 * @returns {Object}
 */
export default (msg, aux) => {
  return {
    sticker: /^(s|sticker|f|fig)$/.test(aux.function),
    removeBg: /^(bg|fundo|nobg)$/.test(aux.function),
    stickerText: /^(ttp|ttp1|s|sticker|f|fig)$/.test(aux.function) && msg.type === 'chat',
    stealSticker: /^(steal|roubar)$/.test(aux.function),
    stickerly: /^(stickerly|ly|lu)$/.test(aux.function)
  }
}
