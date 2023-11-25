/**
 * Miscelanius Bot Commands
 * @param {import('../../types').WWebJSMessage} msg
 * @returns {Object}
 */
export default (msg) => {
  return {
    debug: /^(debug)$/.test(msg.aux.function)
  }
}
