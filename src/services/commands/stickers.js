/**
 * Sticker creation, modification etc
 * @param {import('whatsapp-web.js').Message} msg
 * @param {object} aux
 * @returns {Object}
 */
export default (msg, aux) => {
  return {
    'sticker-creator': /^(s|sticker|f|fig)$/.test(aux.function),
    'remove-bg': /^(bg|fundo|nobg)$/.test(aux.function),
    'text-sticker': /^(ttp|ttp1|s|sticker|f|fig)$/.test(aux.function) && msg.type === 'chat',
    'text-sticker-2': /^(ttp2)$/.test(aux.function) && msg.type === 'chat',
    'steal-sticker': /^(steal|roubar)$/.test(aux.function),
    'sticker-ly-search': /^(stickerly|ly|lu)\d*$/.test(aux.function)
  }
}
