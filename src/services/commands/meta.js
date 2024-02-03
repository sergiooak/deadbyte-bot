/**
 * Miscelanius Bot Commands
 * @param {import('../../types.d.ts').WWebJSMessage} msg
 * @returns {Object}
 */
export default (msg) => {
  return {
    set: /^(set|definir|defina)$/.test(msg.aux.function)
  }
}
