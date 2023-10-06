/**
 * Command using AI
 * @param {import('whatsapp-web.js').Message} msg
 * @param {object} aux
 * @returns {Object}
 */
export default (msg, aux) => {
  return {
    gpt: /^(gpt|got)$/.test(aux.function) ||
    (!aux.isFunction && aux.hasOriginalFunction && /^(gpt|got)$/.test(aux.originalFunction)),

    bot: /^(bot|dead)$/.test(aux.function) ||
    (!aux.isFunction && aux.hasOriginalFunction && /^(bot|dead)$/.test(aux.originalFunction)),

    emojify: /^(emojify)$/.test(aux.function) ||
    (!aux.isFunction && aux.hasOriginalFunction && /^(emojify)$/.test(aux.originalFunction)),

    translate: /^(translate|traduzir|traduz)$/.test(aux.function) ||
    (!aux.isFunction && aux.hasOriginalFunction && /^(translate|traduzir|traduz)$/.test(aux.originalFunction)),

    calculate: /^(calculate|calcular|calc)$/.test(aux.function) ||
    (!aux.isFunction && aux.hasOriginalFunction && /^(calculate|calcular|calc)$/.test(aux.originalFunction))
  }
}
