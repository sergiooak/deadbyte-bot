/**
 * Command using AI
 * @param {import('../../types.d.ts').WWebJSMessage} msg
 * @returns {Object}
 */
export default (msg) => {
  return {
    gpt: /^(gpt|got)$/.test(msg.aux.function) ||
    (!msg.aux.isFunction && msg.aux.hasOriginalFunction && /^(gpt|got)$/.test(msg.aux.originalFunction)),

    bot: /^(bot|dead)$/.test(msg.aux.function) ||
    (!msg.aux.isFunction && msg.aux.hasOriginalFunction && /^(bot|dead)$/.test(msg.aux.originalFunction)),

    emojify: /^(emojify)$/.test(msg.aux.function) ||
    (!msg.aux.isFunction && msg.aux.hasOriginalFunction && /^(emojify)$/.test(msg.aux.originalFunction)),

    translate: /^(translate|traduzir|traduz)$/.test(msg.aux.function) ||
    (!msg.aux.isFunction && msg.aux.hasOriginalFunction && /^(translate|traduzir|traduz)$/.test(msg.aux.originalFunction)),

    calculate: /^(calculate|calcular|calc)$/.test(msg.aux.function) ||
    (!msg.aux.isFunction && msg.aux.hasOriginalFunction && /^(calculate|calcular|calc)$/.test(msg.aux.originalFunction)),

    simsimi: /^(simsimi|simi)$/.test(msg.aux.function) ||
    (!msg.aux.isFunction && msg.aux.hasOriginalFunction && /^(simsimi|simi)$/.test(msg.aux.originalFunction))
  }
}
