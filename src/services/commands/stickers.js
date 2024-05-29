/**
 * Sticker creation, modification etc
 * @param {import('../../types.d.ts').WWebJSMessage} msg
 * @returns {Object}
 */
export default (msg) => {
  return {
    'sticker-creator': /^(s|sticker|f|fig)$/.test(msg.aux.function),
    'remove-bg': /^(bg|fundo|nobg|semfundo|nobg|sfundo|png)$/.test(msg.aux.function),
    'text-sticker': /^(ttp|ttp1|s|sticker|f|fig)$/.test(msg.aux.function) && msg.type === 'chat',
    'text-sticker2': /^(ttp2)$/.test(msg.aux.function) && msg.type === 'chat',
    'text-sticker3': /^(ttp3)$/.test(msg.aux.function) && msg.type === 'chat',
    'steal-sticker': /^(steal|roubar|rename|renomear)$/.test(msg.aux.function),
    'sticker-ly-search': /^(stickerly|ly|lu)\d*$/.test(msg.aux.function),
    'sticker-ly-pack': /^(stickerlypack|lypack|packly|ply|lyp|pack)\d*$/.test(msg.aux.function),
    'sticker-ly-trending': /^(stickerlytrending|lytrending|trendingly|trend|lyt|trendly)\d*$/.test(msg.aux.function)
  }
}
