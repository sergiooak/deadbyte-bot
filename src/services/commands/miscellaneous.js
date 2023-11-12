/**
 * Miscelanius Bot Commands
 * @param {import('../../types.d.ts').WWebJSMessage} msg
 * @returns {Object}
 */
export default (msg) => {
  return {
    uptime: /^(uptime|online|up|tempo)$/.test(msg.aux.function),
    react: /^(react|reacao)$/.test(msg.aux.function) || msg.aux.function === '',
    dice: /^d\d+$/.test(msg.aux.function),
    debug: /^(debug)$/.test(msg.aux.function),
    toFile: /^(tofile|file|arquivo|imagem|img|togif|image)$/.test(msg.aux.function),
    toUrl: /^(tourl|url)$/.test(msg.aux.function),
    ping: /^(ping|pong)$/.test(msg.aux.function)
  }
}
