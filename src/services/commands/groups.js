/**
 * Group commands like ban, unban, etc
 * @param {import('../../types.d.ts').WWebJSMessage} msg
 * @returns {Object}
 */
export default (msg) => {
  return {
    ban: msg.isGroup && /^(ban)$/.test(msg.aux.function),
    unban: msg.isGroup && /^(unban)$/.test(msg.aux.function),
    promote: msg.isGroup && /^(promote|promove|promover)$/.test(msg.aux.function),
    demote: msg.isGroup && /^(demote|rebaixa|rebaixar)$/.test(msg.aux.function),
    giveaway: msg.isGroup && /^(sorteio|sortear)$/.test(msg.aux.function),
    'giveaway-admins-only': msg.isGroup && /^(sorteioadm|sortearadm)$/.test(msg.aux.function),
    'mark-all-members': msg.isGroup && /^(todos|all|hiddenmention)$/.test(msg.aux.function),
    'call-admins': msg.isGroup && /^(adm|adms|admins)$/.test(msg.aux.function),
    'close-group': msg.isGroup && /^(close|fechar)$/.test(msg.aux.function),
    'open-group': msg.isGroup && /^(open|abrir)$/.test(msg.aux.function)
  }
}
