/**
 * Miscelanius Bot Commands
 * @param {import('whatsapp-web.js').Message} msg
 * @param {object} aux
 * @returns {Object}
 */
export default (msg, aux) => {
  return {
    menu: /^(menu|commands)$/.test(aux.function)
  }
}
