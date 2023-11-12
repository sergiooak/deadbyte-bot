/**
 * Miscelanius Bot Commands
 * @param {import('../../types.d.ts').WWebJSMessage} msg
 * @returns {Object}
 */
export default (msg) => {
  return {
    menu: /^(menu|commands)$/.test(msg.aux.function)
  }
}
