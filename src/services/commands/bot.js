/**
 * Sticker creation, modification etc
 * @param {import('whatsapp-web.js').Message} msg
 * @param {object} aux
 * @returns {Object}
 */
export default (msg, aux) => {
  return {
    uptime: /^(uptime|online|up|tempo)$/.test(aux.function),
    react: /^(react|reacao)$/.test(aux.function) || aux.function === ''
  }
}
