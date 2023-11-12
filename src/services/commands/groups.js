/**
 * Group commands like ban, unban, etc
 * @param {import('../../types.d.ts').WWebJSMessage} msg
 * @returns {Object}
 */
export default (msg) => {
  return {
    ban: msg.aux.chat.isGroup && /^(ban)$/.test(msg.aux.function),
    promote: msg.aux.chat.isGroup && /^(promote|promove|promover)$/.test(msg.aux.function),
    demote: msg.aux.chat.isGroup && /^(demote|rebaixa|rebaixar)$/.test(msg.aux.function),
    giveaway: msg.aux.chat.isGroup && /^(sorteio|sortear)$/.test(msg.aux.function),
    'giveaway-admins-only': msg.aux.chat.isGroup && /^(sorteioadm|sortearadm)$/.test(msg.aux.function),
    'mark-all-members': msg.aux.chat.isGroup && /^(todos|all|hiddenmention)$/.test(msg.aux.function),
    'call-admins': msg.aux.chat.isGroup && /^(adm|adms|admins)$/.test(msg.aux.function),
    'close-group': msg.aux.chat.isGroup && /^(close|fechar)$/.test(msg.aux.function),
    'open-group': msg.aux.chat.isGroup && /^(open|abrir)$/.test(msg.aux.function)
  }
}
