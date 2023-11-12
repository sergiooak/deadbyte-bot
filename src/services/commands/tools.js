/**
 * Tools commands
 * @param {import('../../types.d.ts').WWebJSMessage} msg
 * @returns {Object}
 */
export default (msg) => {
  return {
    'qr-reader': /^(qrl|lerqr|readqr)$/.test(msg.aux.function) || (/^(qr)$/.test(msg.aux.function) && (msg.hasMedia || msg.aux.quotedMsg?.hasMedia)),
    'qr-image-creator': /^(qr|qrimg|createqr)$/.test(msg.aux.function),
    'qr-text-creator': /^(qrt|qrtexto|textqr)$/.test(msg.aux.function)
  }
}
