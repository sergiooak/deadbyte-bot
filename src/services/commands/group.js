/**
 * Group commands like ban, unban, etc
 * @param {import('whatsapp-web.js').Message} msg
 * @param {object} aux
 * @returns {Object}
 */
export default (msg, aux) => {
  return {
    ban: aux.chat.isGroup && /^(ban)$/.test(aux.function),
    promote: aux.chat.isGroup && /^(promote|promove)$/.test(aux.function),
    demote: aux.chat.isGroup && /^(demote|rebaixa)$/.test(aux.function),
    giveaway: aux.chat.isGroup && /^(sorteio|sortear)$/.test(aux.function),
    giveawayAdminsOnly: aux.chat.isGroup && /^(sorteioadm|sortearadm)$/.test(aux.function),
    markAllMembers: aux.chat.isGroup && /^(todos|all|hiddenmention)$/.test(aux.function),
    callAdmins: aux.chat.isGroup && /^(adm|adms|admins)$/.test(aux.function),
    closeGroup: aux.chat.isGroup && /^(close|fechar)$/.test(aux.function),
    openGroup: aux.chat.isGroup && /^(open|abrir)$/.test(aux.function)
  }
}
