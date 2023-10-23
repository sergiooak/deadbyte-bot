/**
 * Group commands like ban, unban, etc
 * @param {import('whatsapp-web.js').Message} msg
 * @param {object} aux
 * @returns {Object}
 */
export default (msg, aux) => {
  return {
    ban: aux.chat.isGroup && /^(ban)$/.test(aux.function),
    promote: aux.chat.isGroup && /^(promote|promove|promover)$/.test(aux.function),
    demote: aux.chat.isGroup && /^(demote|rebaixa|rebaixar)$/.test(aux.function),
    giveaway: aux.chat.isGroup && /^(sorteio|sortear)$/.test(aux.function),
    'giveaway-admins-only': aux.chat.isGroup && /^(sorteioadm|sortearadm)$/.test(aux.function),
    'mark-all-members': aux.chat.isGroup && /^(todos|all|hiddenmention)$/.test(aux.function),
    'call-admins': aux.chat.isGroup && /^(adm|adms|admins)$/.test(aux.function),
    'close-group': aux.chat.isGroup && /^(close|fechar)$/.test(aux.function),
    'open-group': aux.chat.isGroup && /^(open|abrir)$/.test(aux.function)
  }
}