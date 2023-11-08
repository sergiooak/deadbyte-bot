/**
 * Miscelanius Bot Commands
 * @param {import('whatsapp-web.js').Message} msg
 * @param {object} aux
 * @returns {Object}
 */
export default (msg, aux) => {
  return {
    uptime: /^(uptime|online|up|tempo)$/.test(aux.function),
    react: /^(react|reacao)$/.test(aux.function) || aux.function === '',
    dice: /^d\d+$/.test(aux.function),
    debug: /^(debug)$/.test(aux.function),
    toFile: /^(tofile|file|arquivo)$/.test(aux.function),
    toUrl: /^(tourl|url)$/.test(aux.function),
    ping: /^(ping|pong)$/.test(aux.function)
  }
}
