/**
 * Command using AI
 * @param {import('whatsapp-web.js').Message} msg
 * @param {object} aux
 * @returns {Object}
 */
export default (msg, aux) => {
  return {
    gpt: /^(gpt|got)$/.test(aux.function),
    emojify: /^(emojify)$/.test(aux.function),
    translate: /^(translate|traduzir|traduz)$/.test(aux.function),
    calculate: /^(calculate|calcular|calc)$/.test(aux.function)
  }
}
