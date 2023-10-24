/**
 * Tools commands
 * @param {import('whatsapp-web.js').Message} msg
 * @param {object} aux
 * @returns {Object}
 */
export default (msg, aux) => {
  return {
    'qr-reader': /^(qrl|lerqr|readqr)$/.test(aux.function) || (/^(qr)$/.test(aux.function) && (msg.hasMedia || msg.aux.quotedMsg?.hasMedia)),
    'qr-image-creator': /^(qr|qrimg|createqr)$/.test(aux.function),
    'qr-text-creator': /^(qrt|qrtexto|textqr)$/.test(aux.function)
  }
}
