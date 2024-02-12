/**
 * Miscelanius Bot Commands
 * @param {import('../../types.d.ts').WWebJSMessage} msg
 * @returns {Object}
 */
export default (msg) => {
  return {
    activate: /^(ativa|ativar|active|activate)$/.test(msg.aux.function),
    set: /^(set|definir|defina)$/.test(msg.aux.function)
  }
}
